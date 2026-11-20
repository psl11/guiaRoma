import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * GUARDIÁN DE ACOPLAMIENTO A ROMA (Fase 9, D-04 / D-08; amenaza T-09-09).
 *
 * La paridad de Roma no detecta que un controller vuelva a leer `useTrip('roma')`, que una clave de
 * `localStorage` vuelva a ser `'roma-…'` literal o que un `useState` vuelva a ser global: Roma se
 * seguiría viendo igual. Este test estático, dentro de `test:unit` (y por tanto de `pnpm verify`),
 * lee el código de `app/composables/*.ts`, `app/components/*.vue` y `app/utils/*.ts` SIN
 * comentarios (los ficheros explican el pasado con `'roma'` y `roma-note-` en prosa) y falla si
 * reaparece cualquiera de estos patrones:
 *
 *   · viaje fijo: `useTrip('…')` con un slug literal;
 *   · clave literal que empieza por `roma-` (comillas simples, dobles o backticks);
 *   · `useState(…)` cuyo primer argumento no es `tripStateKey(…)` (estado global entre viajes);
 *   · `shallowRef<MiniSearch…>`: un índice MiniSearch único de módulo (en vez del Map por slug);
 *   · `getItem` / `setItem` con la clave como literal entre comillas;
 *   · enumeración o borrado de `localStorage` (`for … in localStorage`, `Object.keys(localStorage)`,
 *     `localStorage.key(` / `clear(` / `removeItem(`), que tocaría claves de otros viajes.
 *
 * EXCEPCIONES documentadas (NO se escanean):
 *   · `app/pages/index.vue`: `<TripView slug="roma" />` es el hogar de «/» hasta la Fase 11.
 *   · `nuxt.config.ts`: `storageKey: 'roma-theme'` de @nuxtjs/color-mode (D-07, tema global).
 *
 * Además fija la forma del cableado por viaje: TripView publica el slug antes de su primer `await`
 * y se lo pasa al controller de navegación; los controllers async de búsqueda y modos leen el slug
 * inyectado antes de esperar nada.
 *
 * Los «dientes» del guardián se prueban con cadenas sintéticas en memoria: nunca se mutan ficheros
 * reales. Vitest plano, Node puro (sin runtime Nuxt).
 */

const ROOT = process.cwd()
const SCANNED_DIRS: Array<[dir: string, ext: string]> = [
  ['app/composables', '.ts'],
  ['app/components', '.vue'],
  ['app/utils', '.ts'],
]

/**
 * Elimina comentarios de bloque `/* … *\/` y comentarios de línea `//` que empiezan la línea o van
 * precedidos de espacio. No toca `https://` dentro de strings (va precedido de `:`).
 */
export function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[ \t])\/\/.*$/gm, '$1')
}

/** En `.vue`, el contenido concatenado de los bloques `<script …>`; en `.ts`, el texto entero. */
export function scriptOf(file: string, text: string): string {
  if (!file.endsWith('.vue')) return text
  const blocks = [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
  return blocks.map(m => m[1]).join('\n')
}

/** Primer argumento de cada llamada a `useState`, saltando un genérico `<…>` balanceado. */
function useStateFirstArgs(code: string): string[] {
  const args: string[] = []
  const re = /\buseState\b/g
  let m: RegExpExecArray | null
  while ((m = re.exec(code))) {
    let i = m.index + m[0].length
    while (/\s/.test(code[i] ?? '')) i++
    if (code[i] === '<') {
      let depth = 0
      for (; i < code.length; i++) {
        const c = code[i]
        if (c === '<') depth++
        else if (c === '>' && code[i - 1] !== '=') {
          depth--
          if (depth === 0) {
            i++
            break
          }
        }
      }
      while (/\s/.test(code[i] ?? '')) i++
    }
    if (code[i] !== '(') continue // mención o import, no una llamada
    i++
    while (/\s/.test(code[i] ?? '')) i++
    args.push(code.slice(i, i + 40))
  }
  return args
}

/** Una etiqueta legible por cada patrón de acoplamiento encontrado en `code` (ya sin comentarios). */
export function scanSource(code: string): string[] {
  const found: string[] = []
  if (/\buseTrip\s*\(\s*['"`]/.test(code)) {
    found.push('viaje fijo: useTrip con slug literal')
  }
  if (/['"`]roma-/.test(code)) {
    found.push('clave literal roma-…')
  }
  for (const arg of useStateFirstArgs(code)) {
    if (!arg.startsWith('tripStateKey(')) {
      found.push(`useState sin tripStateKey: useState(${arg.split('\n')[0]}…`)
    }
  }
  if (/\bshallowRef\s*<\s*MiniSearch\b/.test(code)) {
    found.push('índice MiniSearch único de módulo (shallowRef<MiniSearch>)')
  }
  if (/\b(?:getItem|setItem)\s*\(\s*['"`]/.test(code)) {
    found.push('getItem/setItem con clave literal')
  }
  if (
    /\bfor\s*\(\s*(?:const|let|var)\s+\w+\s+in\s+(?:window\.)?localStorage\b/.test(code)
    || /\bObject\.(?:keys|values|entries)\s*\(\s*(?:window\.)?localStorage\b/.test(code)
    || /\blocalStorage\s*\.\s*(?:key|clear|removeItem)\s*\(/.test(code)
  ) {
    found.push('enumeración o borrado de localStorage')
  }
  return found
}

const FILES: string[] = SCANNED_DIRS.flatMap(([dir, ext]) =>
  readdirSync(join(ROOT, dir))
    .filter(f => f.endsWith(ext))
    .sort()
    .map(f => `${dir}/${f}`),
)

const code = (file: string) => stripComments(scriptOf(file, readFileSync(join(ROOT, file), 'utf8')))

describe('guardián de acoplamiento: código de app/ sin viaje fijo ni estado global (D-04, D-08)', () => {
  it('escanea composables, componentes y utils, y deja fuera las excepciones documentadas', () => {
    expect(FILES).toContain('app/composables/useSearch.ts')
    expect(FILES).toContain('app/components/TripView.vue')
    expect(FILES).toContain('app/utils/tripStorage.ts')
    expect(FILES).not.toContain('app/pages/index.vue')
    expect(FILES).not.toContain('nuxt.config.ts')
  })

  it.each(FILES)('%s no reintroduce acoplamiento', (f) => {
    expect(scanSource(code(f)), f).toEqual([])
  })
})

describe('cableado por viaje (forma estructural)', () => {
  it('TripView publica el slug antes del primer await y se lo pasa al controller de navegación', () => {
    const src = code('app/components/TripView.vue')
    const provide = src.indexOf('provideTripSlug(props.slug)')
    const firstAwait = src.indexOf('await ')
    expect(provide, 'provideTripSlug(props.slug) debe existir').toBeGreaterThanOrEqual(0)
    expect(firstAwait, 'TripView espera sus datos').toBeGreaterThanOrEqual(0)
    expect(provide, 'el slug se publica ANTES del primer await').toBeLessThan(firstAwait)
    expect(src).toContain('useCardNavigationController(props.slug)')
  })

  it('useCardNavigationController recibe el slug y lo pasa al accesor', () => {
    const src = code('app/composables/useCardNavigation.ts')
    expect(src).toContain('useCardNavigationController(slug: string)')
    expect(src).toContain('useCardNavigation(slug)')
  })

  it('useSearchController lee useTripSlug() antes de su primer await y guarda un índice por slug', () => {
    const src = code('app/composables/useSearch.ts')
    const start = src.indexOf('export async function useSearchController')
    expect(start, 'useSearchController debe existir').toBeGreaterThanOrEqual(0)
    const body = src.slice(start)
    const slugRead = body.indexOf('useTripSlug()')
    const firstAwait = body.indexOf('await ')
    expect(slugRead, 'useSearchController lee el slug inyectado').toBeGreaterThanOrEqual(0)
    expect(firstAwait, 'useSearchController espera sus datos').toBeGreaterThanOrEqual(0)
    expect(slugRead, 'el slug se lee ANTES del primer await').toBeLessThan(firstAwait)
    expect(src).toContain('new Map<string, MiniSearch>')
  })

  it('useTripModesController lee el slug inyectado y lo pasa a useTripModes', () => {
    const src = code('app/composables/useTripModes.ts')
    const start = src.indexOf('export function useTripModesController')
    expect(start, 'useTripModesController debe existir').toBeGreaterThanOrEqual(0)
    const body = src.slice(start)
    expect(body).toContain('useTripSlug()')
    expect(body).toContain('useTripModes(slug)')
  })
})

describe('dientes del guardián', () => {
  it('detecta un viaje fijo en useTrip', () => {
    expect(scanSource(`const { monById } = await useTrip('roma')`)).toContain('viaje fijo: useTrip con slug literal')
  })

  it('detecta una clave roma- literal y un getItem con clave literal', () => {
    const found = scanSource(`localStorage.getItem('roma-pace')`)
    expect(found).toContain('clave literal roma-…')
    expect(found).toContain('getItem/setItem con clave literal')
  })

  it('detecta la clave roma- también entre comillas dobles y backticks', () => {
    expect(scanSource('const k = "roma-light"')).toContain('clave literal roma-…')
    expect(scanSource('const k = `roma-note-${slug}`')).toContain('clave literal roma-…')
  })

  it('detecta un useState sin tripStateKey', () => {
    expect(scanSource(`useState('pace', () => 'optimistic')`).some(f => f.startsWith('useState sin tripStateKey'))).toBe(true)
    expect(scanSource(`useState<'a' | 'b'>('pace', () => 'a')`).some(f => f.startsWith('useState sin tripStateKey'))).toBe(true)
  })

  it('detecta un índice MiniSearch único de módulo', () => {
    expect(scanSource('const indexRef = shallowRef<MiniSearch | null>(null)')).toContain('índice MiniSearch único de módulo (shallowRef<MiniSearch>)')
  })

  it('detecta la enumeración o el borrado de localStorage', () => {
    const label = 'enumeración o borrado de localStorage'
    expect(scanSource('for (const k in localStorage) {}')).toContain(label)
    expect(scanSource('Object.keys(localStorage).forEach(k => k)')).toContain(label)
    expect(scanSource('localStorage.removeItem(key)')).toContain(label)
    expect(scanSource('localStorage.clear()')).toContain(label)
  })

  it('no da falso positivo con comentarios ni con la forma correcta', () => {
    expect(scanSource(stripComments(`// useTrip('roma')`))).toEqual([])
    expect(scanSource(stripComments(`/* localStorage.getItem('roma-pace') */`))).toEqual([])
    expect(scanSource(`useState<number[]>(tripStateKey(slug, 'cardNav:stack'), () => [])`)).toEqual([])
    expect(scanSource(`localStorage.getItem(NOTE_KEY) ?? ''`)).toEqual([])
    expect(scanSource('const indexes = new Map<string, MiniSearch>()')).toEqual([])
  })

  it('stripComments no corta URLs dentro de strings', () => {
    expect(stripComments(`const u = 'https://example.invalid/x' // fin`)).toBe(`const u = 'https://example.invalid/x' `)
  })

  it('scriptOf toma solo el script de un .vue', () => {
    const vue = `<script setup lang="ts">\nconst a = 1\n</script>\n<template><TripView slug="roma" /></template>`
    expect(scriptOf('X.vue', vue).trim()).toBe('const a = 1')
    expect(scriptOf('x.ts', 'const b = 2')).toBe('const b = 2')
  })
})
