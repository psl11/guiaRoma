import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * GUARDIÁN DEL ERROR DE LA PORTADA (WR-03 de 11-REVIEW, G-11-3; amenaza T-11-22).
 *
 * Si la consulta de la portada (`useAsyncData('trips-index', …)` en app/components/TripIndex.vue)
 * falla durante el prerender, la build tiene que fallar en vez de publicar una portada vacía con
 * 200: `nitro.prerender.failOnError` solo ve el código de estado, y un `<main>` en blanco con 200
 * pasaría sin aviso. Por eso el componente desestructura `error` y lo convierte en un
 * `createError({ statusCode: 500, fatal: true, … })`.
 *
 * Es ESTÁTICO porque `test:unit` es Vitest plano, sin @nuxt/test-utils ni runtime de Nuxt. Lo
 * dinámico lo probó el fallo forzado diferencial de 11-08 (una columna inexistente en `.select`:
 * el componente de antes publica en blanco con exit 0; el de ahora sale con exit ≠ 0 y [500]), y
 * la puerta de paridad vigila el caso normal.
 *
 * Como tests/unit/tripCoupling.spec.ts, quita los comentarios antes de escanear (los comentarios
 * del componente citan `createError` en prosa). Los dientes se prueban con fuentes sintéticas en
 * memoria: nunca se mutan ficheros reales.
 */

const ROOT = process.cwd()

/** Mismas dos regex de comentarios que tests/unit/tripCoupling.spec.ts (no se importa: duplicaría sus tests). */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[ \t])\/\/.*$/gm, '$1')
}

/** En `.vue`, el contenido concatenado de los bloques `<script …>`; en `.ts`, el texto entero. */
function scriptOf(file: string, text: string): string {
  if (!file.endsWith('.vue')) return text
  const blocks = [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
  return blocks.map(m => m[1]).join('\n')
}

const NO_ERROR = 'useAsyncData(\'trips-index\') no desestructura error'
const NO_GUARD = 'falta if (error.value) throw createError({ statusCode: 500, fatal: true, … })'

const DESTRUCTURES_ERROR = /const\s*\{[^}]*\berror\b[^}]*\}\s*=\s*await\s+useAsyncData\(\s*'trips-index'/
const FATAL_GUARD = /if\s*\(\s*error\.value\s*\)\s*\{?\s*throw\s+createError\(\s*\{(?=[^}]*\bstatusCode:\s*500\b)(?=[^}]*\bfatal:\s*true\b)[^}]*\}\s*\)/

/** Problemas del cableado del error de la portada en un `<script>` (sin comentarios), en orden. */
function fatalGuardProblems(script: string): string[] {
  const code = stripComments(script)
  const problems: string[] = []
  if (!DESTRUCTURES_ERROR.test(code)) problems.push(NO_ERROR)
  if (!FATAL_GUARD.test(code)) problems.push(NO_GUARD)
  return problems
}

describe('G-11-3/WR-03: la portada no se publica vacía si su consulta falla', () => {
  it('G-11-3/WR-03 TripIndex.vue convierte el error de useAsyncData(\'trips-index\') en createError({ statusCode: 500, fatal: true })', () => {
    const file = 'app/components/TripIndex.vue'
    const script = scriptOf(file, readFileSync(join(ROOT, file), 'utf8'))
    expect(fatalGuardProblems(script)).toEqual([])
  })

  const CALL = 'const { data, error } = await useAsyncData(\'trips-index\', () => q())\n'
  const GUARD = 'if (error.value) throw createError({ statusCode: 500, statusMessage: \'x\', fatal: true, cause: error.value })\n'

  it.each<[string, string, string[]]>([
    [
      'el componente de antes (solo data, sin guarda)',
      'const { data } = await useAsyncData(\'trips-index\', () => q())\nconst cards = computed(() => listedTrips(data.value))\n',
      [NO_ERROR, NO_GUARD],
    ],
    ['guarda solo en un comentario de línea', `${CALL}// ${GUARD}`, [NO_GUARD]],
    ['guarda solo en un comentario de bloque', `${CALL}/* ${GUARD} */\n`, [NO_GUARD]],
    [
      'guarda sin fatal: true',
      `${CALL}if (error.value) { throw createError({ statusCode: 500, statusMessage: 'x' }) }\n`,
      [NO_GUARD],
    ],
    [
      'guarda con statusCode 404',
      `${CALL}if (error.value) { throw createError({ statusCode: 404, fatal: true }) }\n`,
      [NO_GUARD],
    ],
    ['control: guarda completa en una línea', `${CALL}${GUARD}`, []],
  ])('G-11-3/WR-03 dientes del guardián: %s', (_name, src, expected) => {
    expect(fatalGuardProblems(src)).toEqual(expected)
  })
})
