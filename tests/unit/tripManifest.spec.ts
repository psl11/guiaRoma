import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import {
  TRIP_FOLDER_RE,
  draftExcludes,
  prerenderRoutes,
  readTripManifest,
} from '../../scripts/tripManifest.mjs'
import { TRIP_SLUG_RE } from '../../shared/schemas'

/**
 * MANIFIESTO DE VIAJES (Fase 11): scripts/tripManifest.mjs, leído en tiempo de config.
 *
 *  - D-16: `draft: true` en un trip.yml saca el viaje de Nuxt Content en producción;
 *    `draftExcludes` da los globs `trips/<slug>/**` (o `[]` en `nuxi dev`, `keepDrafts`).
 *  - D-13: las rutas de prerender salen de los datos: `prerenderRoutes` = `['/', …'/trips/<slug>/']`
 *    de cada viaje NO borrador, en orden de slug y siempre con barra final.
 *  - D-23: el manifiesto es `.mjs` + `.d.mts` (sin @types/node); este spec lo importa tal cual.
 *  - Edge ROUTE-02 empty: con 0 viajes, o solo con borradores, las rutas son exactamente `['/']`;
 *    con un único viaje publicado (Roma hoy), `['/', '/trips/roma/']`.
 *  - Edge ROUTE-02 encoding: el segmento de URL es el slug tal cual. La carpeta debe cumplir
 *    `TRIP_FOLDER_RE` (= `TRIP_SLUG_RE` de shared/schemas.ts) o el manifiesto lanza nombrando la
 *    carpeta: nunca hace falta percent-encoding ni normalización Unicode.
 *  - Fail-closed: un `draft` no booleano lanza nombrando el trip.yml (nunca se publica por defecto).
 *
 * Los casos límite usan fixtures en un directorio temporal del sistema (`mkdtempSync`, borrado en
 * afterAll); nunca se escribe bajo content/. Vitest plano, Node puro (sin runtime Nuxt).
 */

const TMP = mkdtempSync(join(tmpdir(), 'trip-manifest-'))
let n = 0

/** Crea un `content/trips` de mentira con `{ carpeta: contenido de trip.yml | null (sin trip.yml) }`. */
function fixture(trips: Record<string, string | null>): string {
  const root = join(TMP, `case-${n++}`)
  mkdirSync(root)
  for (const [folder, yml] of Object.entries(trips)) {
    mkdirSync(join(root, folder))
    if (yml !== null) writeFileSync(join(root, folder, 'trip.yml'), yml)
  }
  return root
}

afterAll(() => {
  rmSync(TMP, { recursive: true, force: true })
})

describe('manifiesto real (content/trips)', () => {
  it('forma y prueba son borradores y roma no, en orden de slug (D-16)', () => {
    expect(readTripManifest()).toEqual([
      { slug: 'forma', draft: true },
      { slug: 'prueba', draft: true },
      { slug: 'roma', draft: false },
    ])
  })

  it('prerenderRoutes del manifiesto real = [\'/\', \'/trips/roma/\'] (D-13)', () => {
    expect(prerenderRoutes(readTripManifest())).toEqual(['/', '/trips/roma/'])
  })

  it('draftExcludes del manifiesto real: los dos borradores fuera de producción, nada en dev', () => {
    expect(draftExcludes(readTripManifest(), false)).toEqual(['trips/forma/**', 'trips/prueba/**'])
    expect(draftExcludes(readTripManifest(), true)).toEqual([])
  })
})

describe('prerenderRoutes (D-13, edges ROUTE-02)', () => {
  it('sin viajes → [\'/\'] (edge empty)', () => {
    expect(prerenderRoutes([])).toEqual(['/'])
  })

  it('solo borradores → [\'/\'] (edge empty)', () => {
    expect(prerenderRoutes([{ slug: 'forma', draft: true }, { slug: 'prueba', draft: true }])).toEqual(['/'])
  })

  it('un único viaje publicado → [\'/\', \'/trips/roma/\']', () => {
    expect(prerenderRoutes([{ slug: 'roma', draft: false }])).toEqual(['/', '/trips/roma/'])
  })

  it('dos publicados → ambas rutas en orden de slug; los borradores nunca', () => {
    const routes = prerenderRoutes([
      { slug: 'roma', draft: false },
      { slug: 'prueba', draft: true },
      { slug: 'napoli', draft: false },
    ])
    expect(routes).toEqual(['/', '/trips/napoli/', '/trips/roma/'])
  })

  it('toda ruta de guía empieza por /trips/ y termina en / (edge encoding)', () => {
    const routes = prerenderRoutes([{ slug: 'roma', draft: false }, { slug: 'napoli2027', draft: false }])
    for (const r of routes.filter(r => r !== '/')) {
      expect(r).toMatch(/^\/trips\/[a-z0-9]+\/$/)
    }
  })
})

describe('draftExcludes (D-16)', () => {
  const entries = [
    { slug: 'forma', draft: true },
    { slug: 'roma', draft: false },
  ]

  it('keepDrafts (nuxi dev) → [] aunque haya borradores', () => {
    expect(draftExcludes(entries, true)).toEqual([])
  })

  it('sin keepDrafts → solo trips/<slug>/** de los borradores', () => {
    expect(draftExcludes(entries, false)).toEqual(['trips/forma/**'])
  })
})

describe('readTripManifest con fixtures temporales (fail-closed)', () => {
  it('directorio vacío → []', () => {
    expect(readTripManifest(fixture({}))).toEqual([])
  })

  it('ignora carpetas sin trip.yml y carpetas ocultas', () => {
    const root = fixture({ 'roma': 'slug: roma\n', 'vacia': null, '.x': 'slug: x\n' })
    expect(readTripManifest(root)).toEqual([{ slug: 'roma', draft: false }])
  })

  it('draft ausente o null → false; draft: true → true', () => {
    const root = fixture({ a: 'slug: a\n', b: 'slug: b\ndraft: null\n', c: 'slug: c\ndraft: true\n' })
    expect(readTripManifest(root)).toEqual([
      { slug: 'a', draft: false },
      { slug: 'b', draft: false },
      { slug: 'c', draft: true },
    ])
  })

  it('draft no booleano ("yes") → lanza un error que nombra el trip.yml y la clave draft', () => {
    const root = fixture({ roma: 'slug: roma\ndraft: "yes"\n' })
    expect(() => readTripManifest(root)).toThrow(/trip\.yml/)
    expect(() => readTripManifest(root)).toThrow(/draft/)
  })

  it('carpeta con slug inválido (campania-2027) → lanza un error que nombra la carpeta (edge encoding)', () => {
    const root = fixture({ 'campania-2027': 'slug: campania\n' })
    expect(() => readTripManifest(root)).toThrow(/campania-2027/)
  })

  it('TRIP_FOLDER_RE es el mismo patrón que TRIP_SLUG_RE de shared/schemas.ts', () => {
    expect(TRIP_FOLDER_RE.source).toBe(TRIP_SLUG_RE.source)
    expect(TRIP_FOLDER_RE.flags).toBe(TRIP_SLUG_RE.flags)
  })
})
