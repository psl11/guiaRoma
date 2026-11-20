// Puerta de datos POR VIAJE (PLAT-04 / SC4, Fase 9) — loader + invariantes PUROS.
//
// Node puro (node:fs + yaml + los esquemas zod de shared/schemas.ts), sin runtime Nuxt ni
// SQLite. Content v3 NO valida las colecciones `type:'data'` contra zod en build (#3351) y
// además IGNORA EN SILENCIO lo que no casa con sus globs; esta capa es la puerta real.
//
// Contrato (RESEARCH §Pattern 5, D-05/D-09/D-10/D-11):
//  - `loadTrip(dir)` lee TODOS los ficheros de content/trips/<dir>/ (sin fail-open): un YAML
//    que no parsea, que no es un objeto o que no pertenece a ninguna colección es una
//    violación con su fichero, nunca se omite.
//  - `checkTrip(t)` devuelve `Violation[]` ({ file, rule, message }) con `file` = ruta del
//    repo con `/` (p. ej. content/trips/prueba/monuments/x.yml): el mensaje del expect de
//    Vitest nombra fichero + regla + detalle (D-10).
//  - Un viaje incompleto (solo trip.yml) no es error (D-09); uno roto sí.
//  - Igualdad de slugs/anclas = comparación EXACTA de strings (sin minúsculas ni
//    normalización Unicode): `[x](#Galeria)` no resuelve a `galeria`.
//
// Fase 10 (forma desde datos):
//  - D-03: etiquetas de pastilla de día únicas por viaje (`day-pill`), calculadas con la MISMA
//    `dayPillLabel` de app/utils/tripLayout.ts y comparadas tras NFC + trim + minúsculas.
//  - D-04: `order` de los días único y contiguo 1..N (`day-order`), sin límite de días.
//  - D-05: los slugs de día son anclas reservadas (`dup-id`/`fixed-anchor` ya los incluyen) y
//    los enlaces de la prosa van en lista blanca (`cross-trip-link`: solo `#id` o http(s)://).
//  - D-08: `anchor` solo resuelve a las secciones que `buildTripLayout` emite para la presencia
//    leída del YAML del viaje (cierra WR-01/WR-02 de la revisión de la Fase 9).
//
// Fase 11 (portada, datos de la tarjeta del viaje):
//  - D-08: `trip-dates` — en trip.yml, `endDate` no puede ser anterior a `startDate` (strings ISO
//    `YYYY-MM-DD` validados por el esquema, así que la comparación de strings es la de fechas).
//  - D-07: `trip-summary-link` — el `summary` de trip.yml no lleva enlaces (Markdown `[t](x)`,
//    autoenlace `<scheme:…>` ni URL suelta `http(s)://`/`www.`): la tarjeta entera de la portada ya
//    es un `<a>`, y un enlace dentro daría `<a>` anidado (HTML inválido, hidratación rota).
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join, relative, sep } from 'node:path'
import { parse as parseYaml } from 'yaml'
// Import RELATIVO (Vitest plano, sin alias): la puerta usa la MISMA función que la UI (Pitfall 5).
import { STRUCTURAL_SECTION_IDS, buildTripLayout, dayPillLabel } from '../../app/utils/tripLayout'
import {
  ArtistRowSchema,
  ArtistSchema,
  DaySchema,
  FoodSchema,
  MonumentSchema,
  ReferenceRowSchema,
  ReferenceSchema,
  TRIP_SLUG_RE,
  TripSchema,
} from '../../shared/schemas'

export const TRIPS_ROOT = join(process.cwd(), 'content', 'trips')

/**
 * Las 6 colecciones de content.config.ts. `match` es el espejo de su `source` glob sobre la
 * ruta POSIX relativa a la carpeta del viaje. `strict` = esquema de validación (uniones
 * incluidas); `row` = esquema `z.object` del que salen las claves conocidas (`row.shape`).
 */
export const COLLECTIONS = [
  { name: 'trip', match: /^trip\.yml$/, strict: TripSchema, row: TripSchema },
  { name: 'day', match: /^days\/[^/]+\.yml$/, strict: DaySchema, row: DaySchema },
  { name: 'monument', match: /^monuments\/[^/]+\.yml$/, strict: MonumentSchema, row: MonumentSchema },
  { name: 'food', match: /^food\/[^/]+\.yml$/, strict: FoodSchema, row: FoodSchema },
  { name: 'artist', match: /^artists\/[^/]+\.yml$/, strict: ArtistSchema, row: ArtistRowSchema },
  { name: 'reference', match: /^reference\/[^/]+\.yml$/, strict: ReferenceSchema, row: ReferenceRowSchema },
] as const

export type CollectionName = typeof COLLECTIONS[number]['name']

/**
 * Ids de TODAS las secciones estructurales posibles (D-06: una sola lista). Es la misma
 * `STRUCTURAL_SECTION_IDS` con la que `buildTripLayout` monta `<main>` y las pastillas; se
 * re-exporta con este nombre para no romper consumidores. Qué secciones existen EN un viaje
 * concreto lo decide `buildTripLayout` con la presencia del YAML (regla `anchor`, D-08).
 */
export const SECTION_ANCHORS = STRUCTURAL_SECTION_IDS
/** ids de «chrome» que emiten los componentes (mapa, toggles, buscador, navegación). */
export const CHROME_IDS = ['leaflet-map', 'map-offline-banner', 'light-toggle', 'resumen-toggle', 'back-btn', 'search', 'search-results', 'nav-pills'] as const
/** ids fijos del DOM con los que no puede chocar el slug de una ficha (D-10). */
export const FIXED_DOM_IDS: ReadonlySet<string> = new Set<string>([...SECTION_ANCHORS, ...CHROME_IDS])
/** Columnas reservadas de Content (metaStandardSchema de @nuxt/content 3.14.0 + __hash__). */
export const RESERVED_KEYS: ReadonlySet<string> = new Set(['id', 'meta', 'stem', 'extension', '__hash__'])
/** Prefijo de los ids de nota que emite MonumentCard (`note-<slug>`). */
const NOTE_PREFIX = 'note-'

export const RULES = [
  'yaml-parse', 'yaml-object', 'trip-yml', 'trip-slug', 'trip-field', 'stray-file', 'reserved-key',
  'unknown-key', 'basename-slug', 'dup-id', 'fixed-anchor', 'ref', 'anchor', 'cross-trip-link',
  'day-order', 'day-pill', 'trip-dates', 'trip-summary-link',
] as const
export type Rule = typeof RULES[number]

export interface Doc {
  trip: string // carpeta del viaje
  collection: CollectionName
  file: string // ruta del repo con '/'
  rel: string // ruta relativa a la carpeta del viaje ('monuments/x.yml')
  slug: string
  kind?: string
  data: Record<string, unknown>
}
export interface LoadedTrip { dir: string, base: string, docs: Doc[], hasTripYml: boolean, loadViolations: Violation[] }
export interface Violation { file: string, rule: Rule, message: string }

const toPosix = (p: string) => p.split(sep).join('/')
const isYaml = (rel: string) => /\.ya?ml$/.test(rel)
const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const asArray = (v: unknown): Array<Record<string, unknown>> =>
  Array.isArray(v) ? v.filter(isPlainObject) : []

/** Carpetas de viaje (solo directorios, sin ocultos), ordenadas. */
export function listTripDirs(root: string = TRIPS_ROOT): string[] {
  return readdirSync(root, { withFileTypes: true })
    .filter(e => e.isDirectory() && !e.name.startsWith('.'))
    .map(e => e.name)
    .sort()
}

/**
 * Carga PURA de un viaje a partir de sus ficheros (`rel` POSIX → contenido). Los ficheros que
 * no son YAML se ignoran; todo YAML se clasifica, se parsea o produce una violación.
 */
export function loadTripFromFiles(dir: string, files: Record<string, string>, base = `content/trips/${dir}`): LoadedTrip {
  const docs: Doc[] = []
  const loadViolations: Violation[] = []
  for (const rel of Object.keys(files).sort()) {
    if (!isYaml(rel)) continue
    const file = `${base}/${rel}`
    const col = COLLECTIONS.find(c => c.match.test(rel))
    if (!col) {
      loadViolations.push({ file, rule: 'stray-file', message: 'fichero fuera de las colecciones (Content lo ignoraría)' })
      continue
    }
    let data: unknown
    try {
      data = parseYaml(files[rel]!)
    }
    catch (e) {
      const first = String((e as Error)?.message ?? e).split('\n')[0]
      loadViolations.push({ file, rule: 'yaml-parse', message: `YAML inválido: ${first}` })
      continue
    }
    if (!isPlainObject(data)) {
      loadViolations.push({ file, rule: 'yaml-object', message: 'el YAML no es un objeto (vacío, lista o escalar)' })
      continue
    }
    docs.push({
      trip: dir,
      collection: col.name,
      file,
      rel,
      slug: String(data.slug ?? ''),
      kind: typeof data.kind === 'string' ? data.kind : undefined,
      data,
    })
  }
  return { dir, base, docs, hasTripYml: 'trip.yml' in files, loadViolations }
}

/** Lee del disco TODOS los ficheros de `<root>/<dir>/` (recursivo) y delega en loadTripFromFiles. */
export function loadTrip(dir: string, root: string = TRIPS_ROOT): LoadedTrip {
  const abs = join(root, dir)
  const files: Record<string, string> = {}
  for (const entry of readdirSync(abs, { recursive: true, encoding: 'utf8' })) {
    const full = join(abs, entry)
    if (!statSync(full).isFile()) continue
    files[toPosix(entry)] = readFileSync(full, 'utf8')
  }
  return loadTripFromFiles(dir, files, toPosix(relative(process.cwd(), abs)))
}

/** Destinos de los enlaces Markdown-inline `[texto](destino)` de un string. */
function extractLinkTargets(md: string): string[] {
  const out: string[] = []
  const re = /\]\(([^)\s]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(md)) !== null) out.push(m[1]!)
  return out
}

/**
 * ¿Lleva enlace un texto Markdown-inline? Destino `[t](x)`, autoenlace `<scheme:…>` (lo que MDC
 * convierte en `<a>`) o URL suelta `http(s)://` / `www.` (autolink de GFM). Regla trip-summary-link.
 */
function hasLink(md: string): boolean {
  return extractLinkTargets(md).length > 0
    || /<[a-z][a-z0-9+.-]*:[^>\s]*>/i.test(md)
    || /\bhttps?:\/\/|\bwww\./i.test(md)
}

/**
 * Anclas `#id` de los enlaces internos `[texto](#id)`. Captura cualquier carácter salvo
 * espacio/paréntesis (no solo [a-z0-9-]) para que un ancla con mayúsculas o Unicode se
 * compare tal cual y falle, en vez de escaparse del escaneo.
 */
export function extractAnchors(md: string): string[] {
  return extractLinkTargets(md).filter(t => t.startsWith('#')).map(t => t.slice(1))
}

/** Recorre recursivamente un valor recogiendo todos los strings (para escanear prosa). */
export function collectStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === 'string') acc.push(value)
  else if (Array.isArray(value)) for (const v of value) collectStrings(v, acc)
  else if (value && typeof value === 'object') for (const v of Object.values(value)) collectStrings(v, acc)
  return acc
}

/**
 * Clave de comparación de etiquetas de pastilla (D-03): NFC + trim + minúsculas en español, para
 * que «Sáb 19», «sáb 19 » y «Sáb 19» escrito en NFD se consideren la misma pastilla.
 */
const pillKey = (label: string) => label.normalize('NFC').trim().toLocaleLowerCase('es')

const rowKeys = new Map<CollectionName, ReadonlySet<string>>(
  COLLECTIONS.map(c => [c.name, new Set(Object.keys(c.row.shape))]),
)

/** Aplica las 18 reglas de la puerta (`RULES`) a un viaje cargado. Lista vacía = viaje sano. */
export function checkTrip(t: LoadedTrip): Violation[] {
  const vs: Violation[] = [...t.loadViolations]
  const push = (file: string, rule: Rule, message: string) => vs.push({ file, rule, message })
  const by = (name: CollectionName) => t.docs.filter(d => d.collection === name)

  const tripDocs = by('trip')
  const days = by('day')
  const monuments = by('monument')
  const food = by('food')
  const artists = by('artist')
  const reference = by('reference')
  const entities = t.docs.filter(d => d.collection !== 'trip')

  // trip-yml / trip-slug (D-05) — trip.yml no tiene campo `trip` (Pitfall 4).
  if (!t.hasTripYml) push(`${t.base}/trip.yml`, 'trip-yml', 'falta trip.yml en la carpeta del viaje')
  for (const d of tripDocs) {
    if (!TRIP_SLUG_RE.test(d.slug)) push(d.file, 'trip-slug', `slug "${d.slug}" no cumple ^[a-z0-9]+$ (D-05)`)
    else if (d.slug !== t.dir) push(d.file, 'trip-slug', `slug "${d.slug}" ≠ carpeta "${t.dir}"`)
  }

  // trip-dates (D-08) / trip-summary-link (D-07) — datos de la tarjeta de la portada.
  for (const d of tripDocs) {
    const { startDate, endDate, summary } = d.data
    if (typeof startDate === 'string' && typeof endDate === 'string' && endDate < startDate) {
      push(d.file, 'trip-dates', `endDate (${endDate}) anterior a startDate (${startDate})`)
    }
    if (typeof summary === 'string' && hasLink(summary)) {
      push(d.file, 'trip-summary-link', 'summary con enlace: la tarjeta de la portada ya es un enlace; quita [texto](destino)')
    }
  }

  for (const d of t.docs) {
    // trip-field
    if (d.collection !== 'trip' && d.data.trip !== t.dir) {
      push(d.file, 'trip-field', `trip "${String(d.data.trip ?? '')}" ≠ carpeta "${t.dir}"`)
    }
    // reserved-key / unknown-key — SOLO claves de nivel superior (Pitfall 3: el `meta`
    // anidado de TransportMode es legítimo).
    const known = rowKeys.get(d.collection)!
    for (const key of Object.keys(d.data)) {
      if (RESERVED_KEYS.has(key)) push(d.file, 'reserved-key', `campo reservado de Content "${key}"`)
      else if (!known.has(key)) push(d.file, 'unknown-key', `campo desconocido "${key}"`)
    }
    // basename-slug (todo menos trip.yml)
    if (d.collection !== 'trip') {
      const name = basename(d.rel, '.yml')
      if (d.slug === '') push(d.file, 'basename-slug', 'fichero sin slug')
      else if (name !== d.slug) push(d.file, 'basename-slug', `basename "${name}" ≠ slug "${d.slug}"`)
    }
  }

  // dup-id: slugs únicos entre las entidades del viaje.
  const bySlug = new Map<string, Doc[]>()
  for (const d of entities) {
    if (d.slug === '') continue
    bySlug.set(d.slug, [...(bySlug.get(d.slug) ?? []), d])
  }
  for (const [slug, ds] of bySlug) {
    if (ds.length < 2) continue
    const list = ds.map(x => x.file).join(', ')
    for (const d of ds) push(d.file, 'dup-id', `id "${slug}" duplicado en ${list}`)
  }

  // fixed-anchor: reference exento (reservas/practica son el singleton de su sección).
  for (const d of [...days, ...monuments, ...food, ...artists]) {
    if (FIXED_DOM_IDS.has(d.slug)) push(d.file, 'fixed-anchor', `id "${d.slug}" choca con un ancla fija de TripView`)
    else if (d.slug.startsWith(NOTE_PREFIX)) push(d.file, 'fixed-anchor', `id "${d.slug}" choca con los ids "${NOTE_PREFIX}…" de las notas`)
  }

  // ref: las 6 referencias estructuradas, resueltas DENTRO del viaje.
  const monumentSlugs = new Set(monuments.map(d => d.slug))
  const foodSlugs = new Set(food.map(d => d.slug))
  const stopOrFood = new Set([...monumentSlugs, ...foodSlugs])
  const artistArt = new Set(artists.filter(d => d.kind === 'artist').map(d => d.slug))
  const artistArch = new Set(artists.filter(d => d.kind === 'arquitectura').map(d => d.slug))

  for (const d of days) {
    for (const ref of Array.isArray(d.data.cards) ? d.data.cards : []) {
      if (!monumentSlugs.has(String(ref))) push(d.file, 'ref', `cards "${String(ref)}" no existe en monuments`)
    }
    for (const row of asArray(d.data.timeline)) {
      if (row.kind === 'stop' && typeof row.ref === 'string' && !stopOrFood.has(row.ref)) {
        push(d.file, 'ref', `timeline stop ref "${row.ref}" no resuelve`)
      }
      if (row.kind === 'food') {
        for (const e of asArray(row.entries)) {
          if (typeof e.ref === 'string' && !stopOrFood.has(e.ref)) push(d.file, 'ref', `timeline food ref "${e.ref}" no resuelve`)
        }
      }
    }
  }
  for (const d of monuments) {
    for (const link of asArray(d.data.artists)) {
      if (!artistArt.has(String(link.ref))) push(d.file, 'ref', `artists ref "${String(link.ref)}" no es un artist`)
    }
    for (const link of asArray(d.data.arch)) {
      if (!artistArch.has(String(link.ref))) push(d.file, 'ref', `arch ref "${String(link.ref)}" no es arquitectura`)
    }
  }
  for (const d of artists) {
    for (const link of asArray(d.data.seenIn)) {
      if (!monumentSlugs.has(String(link.ref))) push(d.file, 'ref', `seenIn ref "${String(link.ref)}" no es un monument`)
    }
  }
  for (const d of reference.filter(x => x.slug === 'reservas')) {
    for (const row of asArray(d.data.table)) {
      if (typeof row.ref === 'string' && !stopOrFood.has(row.ref)) push(d.file, 'ref', `reservas.table ref "${row.ref}" no resuelve`)
    }
  }

  // day-order (D-04, Fase 10): `order` único y contiguo 1..N. Se ordena por `order` (desempate
  // por fichero) y cada día debe ocupar exactamente la posición `order`. Un `order` no numérico
  // también es violación (se ordena al final).
  const orderOf = (d: Doc) => {
    const n = d.data.order
    return typeof n === 'number' && Number.isFinite(n) ? n : Number.POSITIVE_INFINITY
  }
  const sortedDays = [...days].sort((a, b) => orderOf(a) - orderOf(b) || a.file.localeCompare(b.file))
  sortedDays.forEach((d, i) => {
    if (d.data.order !== i + 1) {
      push(d.file, 'day-order', `order ${String(d.data.order)} ≠ ${i + 1} (1..N contiguo, D-04)`)
    }
  })

  // day-pill (D-03, Fase 10): etiquetas de pastilla únicas en el viaje. La etiqueta sale de
  // `dayPillLabel` (la misma que pinta NavPills) y se compara con `pillKey`.
  const byPill = new Map<string, { label: string, docs: Doc[] }>()
  for (const d of days) {
    const label = dayPillLabel({
      slug: d.slug,
      eyebrow: String(d.data.eyebrow ?? ''),
      pill: typeof d.data.pill === 'string' ? d.data.pill : undefined,
    })
    const key = pillKey(label)
    const g = byPill.get(key) ?? { label, docs: [] }
    g.docs.push(d)
    byPill.set(key, g)
  }
  for (const { label, docs } of byPill.values()) {
    if (docs.length < 2) continue
    const list = docs.map(x => x.file).join(', ')
    for (const d of docs) push(d.file, 'day-pill', `pastilla «${label}» repetida (D-03) en ${list}`)
  }

  // anchor / cross-trip-link — en cualquier string de cualquier fichero (incl. trip.yml).
  // D-08: las anclas de sección válidas son SOLO las que `buildTripLayout` emite para la
  // presencia leída del YAML (mismas reglas que la plantilla): sin reference/reservas.yml no
  // hay `#reservas` (WR-01 de la Fase 9). D-05 (b): lista blanca de destinos — `#id` (se
  // valida como ancla) o `http(s)://`; todo lo demás (`/#x`, `/guiaRoma/#x`, `../roma#x`,
  // `/trips/…`, `javascript:`) es `cross-trip-link` (WR-02 de la Fase 9).
  const layout = buildTripLayout({
    days: sortedDays.map(d => ({
      slug: d.slug,
      eyebrow: String(d.data.eyebrow ?? ''),
      pill: typeof d.data.pill === 'string' ? d.data.pill : undefined,
    })),
    hasReservas: reference.some(d => d.slug === 'reservas'),
    hasPractica: reference.some(d => d.slug === 'practica'),
    foodCount: food.length,
    artistKinds: new Set(artists.map(d => d.kind).filter((k): k is string => k !== undefined)),
  })
  const anchorable = new Set<string>([...entities.map(d => d.slug), ...layout.map(e => e.id)])
  for (const d of t.docs) {
    for (const str of collectStrings(d.data)) {
      for (const target of extractLinkTargets(str)) {
        if (target.startsWith('#')) {
          if (!anchorable.has(target.slice(1))) push(d.file, 'anchor', `ancla ${target} no existe en el viaje "${t.dir}"`)
        }
        else if (!/^https?:\/\//i.test(target)) {
          push(d.file, 'cross-trip-link', `enlace no admitido (D-05): "${target}" — solo #id o http(s)://`)
        }
      }
    }
  }

  return vs.sort((a, b) => a.file.localeCompare(b.file) || a.rule.localeCompare(b.rule))
}

/** Una línea por violación: fichero, [regla] y mensaje (mensaje del expect de Vitest). */
export function formatViolations(vs: Violation[]): string {
  return vs.map(v => `${v.file}: [${v.rule}] ${v.message}`).join('\n')
}
