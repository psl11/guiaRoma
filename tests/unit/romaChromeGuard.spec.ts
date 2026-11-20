import { readdirSync, readFileSync } from 'node:fs'
import { join, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * GUARDIÁN DEL CHROME DE ROMA (Fase 10, D-17; amenaza T-10-04).
 *
 * En el plan 10-02 los textos de chrome de Roma (marca de cabecera, leyenda del mapa, pie y
 * título de la pestaña) salieron de la plantilla a `content/trips/roma/trip.yml`. Si uno de esos
 * literales volviera al código, Roma se seguiría viendo igual (la paridad no lo detecta), pero
 * TODOS los demás viajes mostrarían un texto de Roma. Este test estático, dentro de `test:unit`
 * (y por tanto de `pnpm verify`), falla si reaparece cualquiera de `ROMA_CHROME_LITERALS` en el
 * código de `app/`.
 *
 * Escanea el fichero ENTERO de cada `app/**\/*.{vue,ts}` (incluidos `app/app.vue` y `app/pages/`),
 * no solo los bloques `<script>`: los literales vivían en `<template>` (Topbar, TripView) y en el
 * `useHead` de `app/app.vue`, que además quedaba fuera de los directorios del guardián de
 * acoplamiento de la Fase 9 (Pitfall 8). Antes de buscar se quitan los comentarios HTML, de
 * bloque JS y de línea JS: los ficheros pueden explicar su historia en prosa. Sin excepciones.
 *
 * Los «dientes» se prueban con cadenas sintéticas en memoria: nunca se mutan ficheros reales.
 * Vitest plano, Node puro (sin runtime Nuxt). No importa nada de otro `.spec.ts` (importarlo
 * volvería a registrar sus suites).
 */

export const ROMA_CHROME_LITERALS = [
  'giugno MMXXVI',
  'concierto Einaudi',
  '19—23 giugno 2026',
  'dos colegas',
] as const

const ROOT = process.cwd()
const APP = join(ROOT, 'app')

/** Todos los `.vue` / `.ts` de `app/`, como rutas POSIX relativas al repo, ordenadas. */
const FILES: string[] = readdirSync(APP, { recursive: true, encoding: 'utf8' })
  .filter(f => f.endsWith('.vue') || f.endsWith('.ts'))
  .map(f => `app/${f.split(sep).join('/')}`)
  .sort()

/**
 * Quita comentarios HTML `<!-- … -->`, de bloque `/* … *\/` y de línea `//` (al inicio de línea o
 * tras espacio, la misma expresión que el guardián de acoplamiento: no rompe `https://`).
 */
function stripAllComments(src: string): string {
  return src
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[ \t])\/\/.*$/gm, '$1')
}

/** Literales de chrome de Roma presentes en `src` una vez quitados los comentarios. */
export function findRomaChrome(src: string): string[] {
  const code = stripAllComments(src)
  return ROMA_CHROME_LITERALS.filter(l => code.includes(l))
}

describe('guardián D-17: ningún literal de chrome de Roma en app/', () => {
  it('escanea los ficheros que tenían o pueden tener chrome (el guardián no es vacuo)', () => {
    for (const f of [
      'app/app.vue',
      'app/pages/index.vue',
      'app/components/Topbar.vue',
      'app/components/TripView.vue',
      'app/utils/tripLayout.ts',
    ]) {
      expect(FILES, `${f} no se escanea`).toContain(f)
    }
  })

  it.each(FILES)('%s no contiene literales de chrome de Roma', (file) => {
    const src = readFileSync(join(ROOT, file), 'utf8')
    expect(findRomaChrome(src), file).toEqual([])
  })
})

describe('dientes', () => {
  it('detecta la marca de Roma escrita a mano en un template', () => {
    const src = '<template><div class="brand">\n  Roma <span class="brand-dot">✦</span> giugno MMXXVI\n</div></template>'
    expect(findRomaChrome(src)).toEqual(['giugno MMXXVI'])
  })

  it('detecta el título de Roma en un useHead', () => {
    const src = '<script setup lang="ts">\nuseHead({ title: \'Roma · 19—23 giugno 2026\' })\n</script>'
    expect(findRomaChrome(src)).toEqual(['19—23 giugno 2026'])
  })

  it('detecta la leyenda del mapa de Roma', () => {
    const src = '<p class="map-legend">✦  Rojos · Dorados · Verde · concierto Einaudi ✦</p>'
    expect(findRomaChrome(src)).toEqual(['concierto Einaudi'])
  })

  it('detecta el pie de Roma', () => {
    const src = '<footer><p>Itinerario preparado para <em>Pay</em> y dos colegas</p></footer>'
    expect(findRomaChrome(src)).toEqual(['dos colegas'])
  })

  it('NO reporta el literal dentro de un comentario HTML', () => {
    expect(findRomaChrome('<template><!-- antes: Roma ✦ giugno MMXXVI --><div /></template>')).toEqual([])
  })

  it('NO reporta el literal dentro de un comentario de línea //', () => {
    expect(findRomaChrome('const a = 1 // el pie decía «dos colegas»\n')).toEqual([])
  })

  it('NO reporta el literal dentro de un comentario de bloque', () => {
    expect(findRomaChrome('/* la leyenda tenía «concierto Einaudi» */\nconst b = 2\n')).toEqual([])
  })
})
