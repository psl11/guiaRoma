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
//  - Cierre G-09-3 (IN-05): la extensión YAML se detecta sin distinguir mayúsculas; un
//    `.YML`/`.Yaml` no casa con ningún glob de colección (que solo casan con `.yml` en minúsculas)
//    y es `stray-file` con su fichero, nunca se omite en silencio.
//    `checkTripsRoot()` reporta como `stray-file` (con su ruta) toda entrada de la raíz
//    content/trips/ que no es una carpeta (salvo ficheros ocultos: .DS_Store, .gitkeep); con
//    `listTripDirs()` reparte todas las demás entradas.
//  - Cierre CR-01 (revisión de 09-06): Content globa sus colecciones con `dot: true`, así que una
//    CARPETA oculta (`content/trips/.x/`) SÍ se ingiere. Por eso `listTripDirs()` la trata como
//    carpeta de viaje y la puerta la valida (falla al menos con `trip-slug`/`trip-yml`, porque
//    `TRIP_SLUG_RE` no admite un `.` inicial); solo los FICHEROS ocultos de la raíz son inertes.
//  - Cierre WR-01 (revisión de 09-06): dentro de un viaje, todo fichero que no es YAML es
//    `stray-file` (un `galeria.json`, `galeria.yml~`, `galeria.ym`…: Content lo ignoraría), salvo
//    los ocultos (algún segmento de la ruta empieza por `.`: .DS_Store, .gitkeep).
//
// Fase 10 (forma desde datos):
//  - D-03: etiquetas de pastilla de día únicas por viaje (`day-pill`), calculadas con la MISMA
//    `dayPillLabel` de app/utils/tripLayout.ts y comparadas tras NFC + trim + minúsculas.
//  - D-04: `order` de los días único y contiguo 1..N (`day-order`), sin límite de días.
//  - D-05: los slugs de día son anclas reservadas (`dup-id`/`fixed-anchor` ya los incluyen) y
//    los enlaces de la prosa van en lista blanca (`cross-trip-link`: solo `#id` o http(s)://).
//  - D-08: `anchor` solo resuelve a las secciones que `buildTripLayout` emite para la presencia
//    leída del YAML del viaje (cierra WR-01/WR-02 de la revisión de la Fase 9).
//  - Cierre G-10-2 / WR-01 (10-REVIEW): la puerta ve toda forma de enlace que MDC pinta como `<a>`
//    (`scanProseLinks`: espacio o salto tras `(`, destino `<…>`, autoenlaces y emails) y la somete a
//    la lista blanca o al ancla; rechaza con `cross-trip-link` las definiciones `[r]: …`, todo HTML
//    crudo salvo `<br>`, los atributos MDC `href`/`to`, los bloques `::x` con frontmatter y los ids
//    creados desde la prosa (encabezados, `{#id}`), sea cual sea su destino (CR-01/CR-02/WR-01/WR-02
//    de 10-REVIEW). El `href` de las entradas `food` del timeline va aparte: solo http(s) (CR-03).
//    WR-03: `card-placement` exige cada ficha exactamente una vez en la unión de los `cards` de
//    days/*.yml (sin día no se pinta; en dos días duplica su id), y `anchor`, `seenIn` y los `ref`
//    de timeline y reservas solo resuelven a fichas pintadas (`renderedMonuments`, espejo de
//    DaySection → MonumentCard).
//
// Fase 11 (portada, datos de la tarjeta del viaje):
//  - D-08: `trip-dates` — en trip.yml, `endDate` no puede ser anterior a `startDate` (strings ISO
//    `YYYY-MM-DD` validados por el esquema, así que la comparación de strings es la de fechas).
//  - D-07: `trip-summary-link` — el `summary` de trip.yml no lleva enlaces (Markdown `[t](x)`,
//    autoenlace `<scheme:…>` ni URL suelta `http(s)://`/`www.`): la tarjeta entera de la portada ya
//    es un `<a>`, y un enlace dentro daría `<a>` anidado (HTML inválido, hidratación rota).
//  - Cierre G-11-3 / WR-02 (11-REVIEW): `trip-summary-inline` — el `summary` solo admite Markdown en
//    línea: una lista (también `2027. …`), una cita, una tabla, un bloque de código, un separador,
//    una línea en blanco o un componente `::x` dan una violación en trip.yml (la tarjeta lo pinta
//    dentro de `<p>` y de `<a>`). Solo se evalúa un summary sin enlace (lo demás ya es
//    trip-summary-link). El escaneo es léxico y fail-closed.
//
// Fase 12 (formas nuevas de viaje):
//  - EXT-01 / Pitfall 3: la regla `ref` recorre también las filas de las opciones de un `choice`
//    (`timelineRowsOf`); un `ref` roto dentro de una opción nombra el fichero del día.
//  - EXT-02 / D-06: `stay-ref` — el `stay` de cada día es el slug de una base de `trip.stays`
//    (comparación exacta); si no existe, también cuando el viaje no tiene `stays`, la violación
//    nombra el fichero del día. `stay-dup` — los slugs de `stays` son únicos (violación en trip.yml).
//
// Fase 12.1 (títulos de Reservas por viaje, habilitador de CAMP-04; WR-01 de la revisión):
//  - `reservas-headings` — un viaje que NO es Roma y tiene reference/reservas.yml declara en
//    `headings` un texto visible (no vacío ni solo espacios) para `table` (la cabecera de la tabla
//    siempre se pinta) y para cada grupo de `confirmed` que tenga entradas (`mesas`, `visitas`).
//    Cada clave que falte caería al texto de Roma (`RESERVAS_HEADINGS_DEFAULT`: «3 comensales»,
//    «Restaurantes · …»), que en otro viaje es información falsa. El esquema no puede exigirlo
//    (D-06: todo `.optional()`, y Roma no declara `headings`); la violación nombra el reservas.yml.
import { readdirSync, readFileSync, statSync, type Dirent } from 'node:fs'
import { basename, join, relative, sep } from 'node:path'
import { parse as parseYaml } from 'yaml'
// Import RELATIVO (Vitest plano, sin alias): la puerta usa la MISMA función que la UI (Pitfall 5).
import { STRUCTURAL_SECTION_IDS, buildTripLayout, dayPillLabel } from '../../app/utils/tripLayout'
import { RESERVAS_HEADINGS_DEFAULT } from '../../app/utils/reservasHeadings'
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
  'day-order', 'day-pill', 'trip-dates', 'trip-summary-link', 'stay-ref', 'stay-dup',
  'reservas-headings', 'card-placement', 'trip-summary-inline',
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
// Sin distinguir mayúsculas (G-09-3): un .YML/.Yaml también es YAML y llega a la clasificación;
// los `COLLECTIONS[].match` SÍ distinguen (espejo de los globs `*.yml`), así que acaba en stray-file.
const isYaml = (rel: string) => /\.ya?ml$/i.test(rel)
// Oculto = algún segmento de la ruta relativa empieza por `.` (.DS_Store, .gitkeep, .cache/x).
const isHidden = (rel: string) => rel.split('/').some(seg => seg.startsWith('.'))
const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const asArray = (v: unknown): Array<Record<string, unknown>> =>
  Array.isArray(v) ? v.filter(isPlainObject) : []

/**
 * Filas de un `day.timeline` vistas por la puerta (Fase 12, EXT-01, Pitfall 3): las de nivel
 * superior que no son `choice` más las `rows` de cada opción de cada `choice`, en orden. Así la
 * regla `ref` ve también una parada o una comida citada DENTRO de una opción; sin esto, un `ref`
 * roto en una opción pasaría la puerta y el enlace de la guía no llevaría a ninguna ficha. (La
 * regla `anchor` no lo necesita: `collectStrings` ya recorre todo el dato, `heading`/`title` de
 * las opciones incluidos.) Robusta ante YAML mal formado: todo pasa por `asArray`.
 */
export function timelineRowsOf(timeline: unknown): Array<Record<string, unknown>> {
  const rows: Array<Record<string, unknown>> = []
  for (const row of asArray(timeline)) {
    if (row.kind !== 'choice') {
      rows.push(row)
      continue
    }
    for (const opt of asArray(row.options)) rows.push(...asArray(opt.rows))
  }
  return rows
}

/**
 * Entradas directamente bajo la raíz de viajes que la puerta debe repartir. Único sitio que
 * decide qué es inerte, para que `listTripDirs` y `checkTripsRoot` repartan exactamente el mismo
 * conjunto. Solo se descartan los FICHEROS (no directorios) ocultos: .DS_Store, .gitkeep… Ningún
 * glob de colección casa con un fichero en la raíz, así que Content tampoco los carga.
 * Una CARPETA oculta NO se descarta (CR-01): Content globa con `dot: true`
 * (`trips/*\/trip.yml` casa con `trips/.x/trip.yml`) y la ingiere en las 6 colecciones, así
 * que tiene que pasar por la puerta como cualquier otra carpeta de viaje.
 */
function rootEntries(root: string): Dirent[] {
  return readdirSync(root, { withFileTypes: true })
    .filter(e => e.isDirectory() || !e.name.startsWith('.'))
}

/**
 * Carpetas de viaje (todos los directorios, ocultos incluidos), ordenadas. Una carpeta oculta
 * (`.x`) nunca es un viaje válido: `checkTrip` la falla con `trip-slug` (el slug no puede ser
 * `.x` ni distinto de la carpeta) o `trip-yml`, nombrando su ruta. Con `checkTripsRoot` reparte
 * TODAS las entradas de la raíz salvo los ficheros ocultos: cada una es una carpeta de viaje
 * (aquí) o una violación (allí), nunca se descarta en silencio. No lanza: schema.spec.ts,
 * invariants.spec.ts y tests/unit/searchIsolation.spec.ts la usan para recoger sus
 * `describe.each`, y una excepción ahí escondería al culpable tras un error de recolección.
 */
export function listTripDirs(root: string = TRIPS_ROOT): string[] {
  return rootEntries(root)
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort()
}

/**
 * Entradas sueltas en la raíz de viajes (G-09-3): toda entrada no oculta que NO es un
 * directorio (fichero, enlace simbólico u otra) es una violación `stray-file` con su ruta del
 * repo, porque Content la ignoraría en silencio. Es el complemento exacto de `listTripDirs`:
 * entre las dos cubren todas las entradas de la raíz salvo los ficheros ocultos. Comprobación de
 * la raíz, no de un viaje (por eso no vive en `checkTrip`); reutiliza la regla `stray-file` de
 * RULES.
 */
export function checkTripsRoot(root: string = TRIPS_ROOT): Violation[] {
  return rootEntries(root)
    .filter(e => !e.isDirectory())
    .map(e => e.name)
    .sort()
    .map(name => ({
      file: toPosix(relative(process.cwd(), join(root, name))),
      rule: 'stray-file' as const,
      message: 'fichero suelto fuera de una carpeta de viaje (Content lo ignoraría)',
    }))
}

/**
 * Carga PURA de un viaje a partir de sus ficheros (`rel` POSIX → contenido). Un fichero que no es
 * YAML es `stray-file` (WR-01: Content lo ignoraría en silencio), salvo si es oculto (`isHidden`:
 * .DS_Store, .gitkeep), que se ignora; todo YAML se clasifica, se parsea o produce una violación.
 * Un YAML oculto SÍ se clasifica (Content globa con `dot: true`). La extensión YAML se detecta SIN
 * distinguir mayúsculas (`isYaml`), pero los `COLLECTIONS[].match` sí distinguen (espejo de los
 * globs `*.yml` de content.config.ts): un `.YML`/`.Yaml` no casa con ninguna colección y es
 * `stray-file`, nunca se omite ni se carga como documento (G-09-3).
 */
export function loadTripFromFiles(dir: string, files: Record<string, string>, base = `content/trips/${dir}`): LoadedTrip {
  const docs: Doc[] = []
  const loadViolations: Violation[] = []
  for (const rel of Object.keys(files).sort()) {
    const file = `${base}/${rel}`
    if (!isYaml(rel)) {
      if (!isHidden(rel)) {
        loadViolations.push({ file, rule: 'stray-file', message: 'fichero no YAML en la carpeta del viaje (Content lo ignoraría)' })
      }
      continue
    }
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

// ── Escáner de enlaces de la prosa (G-10-2 / WR-01 de 10-REVIEW) ─────────────────────────────
/** Enlace en línea `[t](destino)` / `![alt](src)`: blancos (también saltos) tras `(`; destino `<…>` o pelado. */
const INLINE_LINK_RE = /\]\(\s*(?:<([^<>\n]*)>|([^\s)]*))/g
/** Autoenlace `<scheme:…>` (CommonMark): `<https://…>`, `<mailto:…>`, `<javascript:…>`. */
const AUTOLINK_RE = /<([a-z][a-z0-9+.-]{1,31}:[^\s<>]*)>/gi
/** Autoenlace de email `<a@b>` (MDC lo pinta como `mailto:`). */
const EMAIL_AUTOLINK_RE = /<([^\s<>@:]+@[^\s<>@]+)>/g
/** Email suelto (autolink de GFM, que MDC pinta como `mailto:`). */
const BARE_EMAIL_RE = /(?<![\w.+-])[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g
/** URL suelta `http(s)://` o `www.` (autolink de GFM): su destino siempre está en la lista blanca. */
const BARE_URL_RE = /\bhttps?:\/\/|\bwww\./i
/**
 * Formas de enlace que la guía no usa y la puerta rechaza SEA CUAL SEA su destino (D-05b), con la
 * etiqueta que sale en el mensaje de `cross-trip-link`.
 */
const MDC_FRONTMATTER = 'bloque MDC con frontmatter «::x / ---»'
const SETEXT_DASH = 'encabezado setext «Texto / ---»'
const REJECTED_LINK_FORMS: ReadonlyArray<readonly [RegExp, string]> = [
  // MDC parsea cada campo por separado: sin una definición en el MISMO string, `[x][r]`, `[x][]` y
  // `[r]` son texto plano. Rechazar la definición cierra las tres formas. CR-01 (10-REVIEW): sin
  // anclar al inicio de línea, porque la definición también vale dentro de `>`, `-` y `1.`, con
  // etiqueta multilínea (`[r\ns]`) o con `\]` escapado (`[a\]b]`); cubre también la nota `[^1]: …`.
  [/\[(?:[^[\]\\]|\\[\s\S])+\]:/, 'definición de referencia «[r]: …»'],
  // WR-02 (10-REVIEW): rehype-raw pinta TODO el HTML crudo (`<a href>`, `<area href>`,
  // `<form action>`, `<span id>`…), así que no se listan etiquetas: lista blanca. La guía solo usa
  // `<br>`; los autoenlaces `<scheme:…>` y `<a@b>` no son HTML (pasan por la lista blanca de destinos).
  [/<(?!br\s*\/?>|[a-z][a-z0-9+.-]{1,31}:[^\s<>]*>|[^\s<>@:]+@[^\s<>@]+>)[a-z]/i, 'HTML crudo (solo se admite <br>)'],
  // `:a[x]{href=…}` y `::a{href=…}` pintan `<a href>`; `to` es fail-closed por si un componente
  // global tipo NuxtLink se resolviera por nombre. También el binding `{:href=…}`.
  [/\{[^{}]*\b(?:href|to)\s*=/i, 'atributo MDC «{href=…}» / «{to=…}»'],
  // Advisory del plan-checker (10-06) + CR-02 (10-REVIEW): un bloque MDC con props en frontmatter
  // YAML (`::a` / `---` / `href: /trips/roma` / `---`) pinta `<a href>` (comprobado con
  // parseMarkdown de @nuxtjs/mdc 0.22.0). remark-mdc lee ese frontmatter como YAML completo
  // (`{href: …}`, `? href`, `"\x68ref"`, alias, `<<:`), así que no se buscan claves: se rechaza el
  // CONSTRUCTO, una línea `::x` seguida de una línea `---` (o más guiones), también dentro de `>`,
  // `-` o `1.`. La guía no usa ningún bloque `::x` con frontmatter.
  [/^(?:[ \t>]|[*+-][ \t]|\d{1,9}[.)][ \t])*:{2,}[A-Za-z][\w-]*[^\n]*\n(?:[ \t>]|[*+-][ \t]|\d{1,9}[.)][ \t])*-{3,}[ \t]*$/m, MDC_FRONTMATTER],
  // WR-01 (10-REVIEW): ids creados desde la prosa, que duplicarían un id de ficha o de sección
  // (lo que `card-placement` garantiza único) y desviarían `[x](#id)`. Comprobado con parseMarkdown:
  // `## Mapa` → `h2 id="mapa"` (y `ProseH2` lo envuelve en `<a href="#mapa">`, un `<a>` que no es
  // `[texto](destino)`), también dentro de `>`, `-` o `1.`; el setext `Texto / ---` o `/ ===`
  // igual; y los atributos MDC `{#id}` / `{id=…}`. La guía no usa ninguno. Los `---` de un
  // frontmatter `::x` ya rechazado no se cuentan además como setext (ver scanProseLinks).
  [/^(?:[ \t>]|[*+-][ \t]|\d{1,9}[.)][ \t])*#{1,6}(?:[ \t]|$)/m, 'encabezado Markdown «# …» (MDC le pone id y <a href="#…">)'],
  [/^[^\n]*\S[ \t]*\n(?:[ \t>]|[*+-][ \t]|\d{1,9}[.)][ \t])*=+[ \t]*$/m, 'encabezado setext «Texto / ===»'],
  [/^[^\n]*\S[ \t]*\n(?:[ \t>]|[*+-][ \t]|\d{1,9}[.)][ \t])*-+[ \t]*$/m, SETEXT_DASH],
  // Las comillas se saltan: el `#id` de un valor entrecomillado (`caption="Ver [x](#id)"`) no es un id.
  [/\{(?:[^{}"'#]|"[^"]*"|'[^']*')*(?:#|(?<![\w-])id\s*=)(?=[^{}]*\})/i, 'atributo MDC «{#id}» / «{id=…}»'],
]

/**
 * Escaneo de los enlaces de un string de prosa (D-05b / D-08, cierre G-10-2 / WR-01).
 *
 * MDC (`@nuxtjs/mdc` 0.22.0, el parser de `<MDC>`) pinta `<a>` para muchas más formas que
 * `[texto](destino)` pegado al paréntesis (comprobado con `parseMarkdown` el 2026-11-22):
 * `[x]( /trips/roma)` (espacio tras el `(`), `[x](\n../roma#x)` (salto de línea), `[x](<#id>)` y
 * `[x](</trips/roma> "t")` (destino `<…>`), `[x][r]` / `[x][]` con su definición `[r]: …`, el HTML
 * crudo `<a href>` (sin distinguir mayúsculas), los autoenlaces `<mailto:…>` / `<javascript:…>`
 * (a este MDC le quita el href), los emails sueltos (GFM → `mailto:`), las URL sueltas
 * `www.…` / `http(s)://…`, y los componentes MDC `:a[x]{href=…}`, `::a{href=…}` y `::a` con
 * `href:` en su frontmatter. NO pintan `<a>`: `[x]\n(/x)`, `[x](#a b)`, una referencia sin
 * definición, `\[x](/x)` ni el código entre comillas invertidas.
 *
 * La puerta solo ACEPTA la forma en línea `[texto](#id)` / `[texto](http(s)://…)` y los
 * autoenlaces http(s). Devuelve:
 *  - `targets`: los destinos de toda forma que MDC pinta como `<a>` (enlace en línea, también
 *    `![alt](src)`; autoenlace `<scheme:…>`; email `<a@b>` o suelto como `mailto:…`), que el
 *    llamador somete a la lista blanca (`#id` → ancla; `http(s)://` → admitido; resto →
 *    `cross-trip-link`). Las URL sueltas no son targets: su destino siempre es http(s).
 *  - `rejected`: una etiqueta por cada forma rechazada presente (definición de referencia, HTML
 *    crudo que no es `<br>`, atributo MDC `href`/`to`, bloque `::x` con frontmatter, encabezado o
 *    atributo `{#id}` / `{id=…}`), sea cual sea su destino.
 *
 * El escaneo es LÉXICO y fail-closed: un código entre comillas invertidas o un `\[` escapado
 * pueden dar un falso rojo, nunca un falso verde. No se usa un parser porque
 * `mdast-util-from-markdown` / `micromark` / `@nuxtjs/mdc` no se resuelven desde la raíz con pnpm
 * (sin hoisting), el roadmap v1.1 prohíbe dependencias nuevas, y `mdast-util-from-markdown` es
 * CommonMark puro: no vería los emails de GFM ni la sintaxis de componentes MDC.
 */
function scanProseLinks(md: string): { targets: string[], rejected: string[] } {
  const targets: string[] = []
  for (const m of md.matchAll(INLINE_LINK_RE)) targets.push(m[1] ?? m[2] ?? '')
  for (const m of md.matchAll(AUTOLINK_RE)) targets.push(m[1]!)
  for (const m of md.matchAll(EMAIL_AUTOLINK_RE)) targets.push(`mailto:${m[1]!}`)
  // Los autoenlaces ya contados se tapan para no volver a ver su email como email suelto.
  const bare = md.replace(AUTOLINK_RE, ' ').replace(EMAIL_AUTOLINK_RE, ' ')
  for (const m of bare.matchAll(BARE_EMAIL_RE)) targets.push(`mailto:${m[0]}`)
  const labels = REJECTED_LINK_FORMS.filter(([re]) => re.test(md)).map(([, label]) => label)
  // Los `---` de un frontmatter `::x` no son un setext: ese string ya está rechazado y no se duplica.
  const rejected = labels.includes(MDC_FRONTMATTER) ? labels.filter(l => l !== SETEXT_DASH) : labels
  return { targets, rejected }
}

/**
 * ¿Lleva enlace un texto Markdown-inline? Algún destino de `scanProseLinks` (enlace en línea en
 * cualquier forma, autoenlace `<scheme:…>`, email), alguna forma rechazada o una URL suelta
 * `http(s)://` / `www.` (autolink de GFM). Regla trip-summary-link.
 */
function hasLink(md: string): boolean {
  const { targets, rejected } = scanProseLinks(md)
  return targets.length > 0 || rejected.length > 0 || BARE_URL_RE.test(md)
}

/**
 * Formas de Markdown de bloque que el `summary` de trip.yml no admite (regla trip-summary-inline,
 * G-11-3 / WR-02 de 11-REVIEW), con la etiqueta que sale en el mensaje.
 */
const SUMMARY_BLOCK_FORMS: ReadonlyArray<readonly [RegExp, string]> = [
  // Lista con viñeta o numerada (`2027. …`, `1) …`), también con sangría o dentro de `>`.
  [/^[ \t>]*(?:[-*+]|\d{1,9}[.)])(?:[ \t]|$)/m, 'lista «- …» / «1. …»'],
  [/^[ \t]*>/m, 'cita «> …»'],
  // Fila delimitadora de GFM: una línea solo de `|`, `:`, `-` y blancos, con algún `-` y algún `|` o `:`.
  [/^(?=[^\n]*[|:])(?=[^\n]*-)[ \t|:-]+$/m, 'tabla «| a | b |»'],
  // Valla de tres o más acentos graves (`\x60`) o tildes, o sangría de 4 espacios / tabulador.
  [/^[ \t>]*(?:\x60{3,}|~{3,})|^(?: {4}|[ ]{0,3}\t)/m, 'bloque de código (valla «~~~» o de acentos graves, o sangría de 4 espacios)'],
  [/^[ \t>]*([-*_])(?:[ \t]*\1){2,}[ \t]*$/m, 'separador «---» / «***» / «___»'],
  [/\S[ \t]*\n(?:[ \t]*\n)+[ \t]*\S/, 'línea en blanco (dos párrafos)'],
  [/^[ \t>]*:{2,}[A-Za-z]/m, 'componente MDC de bloque «::x»'],
]

/**
 * Formas de Markdown de bloque de un `summary` (regla trip-summary-inline, D-08; cierre G-11-3 /
 * WR-02 de 11-REVIEW). Devuelve sus etiquetas en el orden de `SUMMARY_BLOCK_FORMS`.
 *
 * Por qué: TripIndex pinta el `summary` como `<p class="trip-index-summary"><MDC :tag="false"
 * unwrap="p" /></p>` dentro de `a.trip-index-card`. `unwrap="p"` solo quita los párrafos, así que
 * cualquier bloque que MDC abra queda dentro de `<p>` y de `<a>`: el navegador reubica el DOM y la
 * hidratación no casa. Dos párrafos (`Uno.\n\nDos.`) se pegan además sin espacio (`flatUnwrap`).
 *
 * Evidencia (`parseMarkdown` de @nuxtjs/mdc 0.22.0, 2026-11-23): `2027. Diez días` → `ol[start=2027]`;
 * `1) …` → `ol`; `Texto\n1. …` → `p + ol`; `- / * / + …` → `ul`; `Texto\n- …` → `p + ul`;
 * `   2027. …` → `ol`; `> …` → `blockquote`; `| a | b |\n| - | - |`, `a | b\n--- | ---` y `a\n:-`
 * → `table`; vallas de acentos graves o de `~~~`, `    Texto` y `\tTexto` → `pre`; `***`, `___` y
 * `---` solos, o `***`/`___` tras una línea de texto → `hr`; `Uno.\n\nDos.` → `p + p`;
 * `::nota\n…\n::` → elemento `nota`. Son un único `p` (en línea): los resúmenes de Roma y
 * Campania, cursiva/negrita/código/tachado, `<br>`, el salto duro de dos espacios y el salto final.
 *
 * Lo que `scanProseLinks` ya rechaza (encabezados ATX y setext —`Texto\n---` y `Texto\n-`
 * incluidos—, HTML crudo, `[r]: …`, `::x` con frontmatter, `{href=…}`, `{#id}`) ya es
 * `trip-summary-link`: si `hasLink(md)` es verdadero no se evalúa aquí, para no avisar dos veces.
 * Si un summary tiene un enlace y además un bloque, se avisa del enlace; el bloque aparece en la
 * pasada siguiente. El string sigue en rojo: no hay falso verde.
 *
 * El escaneo es LÉXICO y fail-closed: puede dar un falso rojo, nunca un falso verde. Falsos rojos
 * conocidos (MDC los deja en `p`): `Texto\n2027. …` (una lista ordenada que interrumpe un párrafo
 * tiene que empezar en 1), una línea que empieza por código en línea de tres acentos graves y una
 * línea de continuación con 4 espacios de sangría. No se usa un parser porque `@nuxtjs/mdc` no se
 * resuelve desde la raíz con pnpm (sin hoisting) y el roadmap v1.1 no admite dependencias nuevas.
 */
function summaryBlockForms(md: string): string[] {
  if (hasLink(md)) return []
  return SUMMARY_BLOCK_FORMS.filter(([re]) => re.test(md)).map(([, label]) => label)
}

/**
 * Anclas `#id` de los enlaces internos (cualquier forma que MDC pinta como `<a>`: `[texto](#id)`,
 * `[texto]( #id)`, `[texto](<#id>)`…). Captura cualquier carácter salvo blanco/paréntesis (no solo
 * [a-z0-9-]) para que un ancla con mayúsculas o Unicode se compare tal cual y falle, en vez de
 * escaparse del escaneo.
 */
export function extractAnchors(md: string): string[] {
  return scanProseLinks(md).targets.filter(t => t.startsWith('#')).map(t => t.slice(1))
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

/** Aplica las 23 reglas de la puerta (`RULES`) a un viaje cargado. Lista vacía = viaje sano. */
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

  // trip-dates (D-08) / trip-summary-link (D-07) / trip-summary-inline (D-08, G-11-3) — datos de la
  // tarjeta de la portada.
  for (const d of tripDocs) {
    const { startDate, endDate, summary } = d.data
    if (typeof startDate === 'string' && typeof endDate === 'string' && endDate < startDate) {
      push(d.file, 'trip-dates', `endDate (${endDate}) anterior a startDate (${startDate})`)
    }
    if (typeof summary === 'string' && hasLink(summary)) {
      push(d.file, 'trip-summary-link', 'summary con enlace: la tarjeta de la portada ya es un enlace; quita [texto](destino)')
    }
    // Una sola violación por summary, con todas sus formas de bloque (solo si no hay enlace).
    const blocks = typeof summary === 'string' ? summaryBlockForms(summary) : []
    if (blocks.length > 0) {
      push(d.file, 'trip-summary-inline', `summary con Markdown de bloque (${blocks.join(', ')}): la tarjeta de la portada lo pinta dentro de <p> y <a> y rompe la hidratación; escribe una frase o párrafo en línea (D-08)`)
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

  // card-placement (G-10-2 / WR-03): apariciones de cada ficha en los `cards` de los días, en el
  // orden de `days` (por ruta) y de cada `cards`; una entrada por aparición (dos veces en el mismo
  // día cuenta 2). Los slugs que no son fichas ya son violaciones `ref` y aquí se ignoran.
  const placements = new Map<string, Doc[]>()
  for (const d of days) {
    for (const ref of Array.isArray(d.data.cards) ? d.data.cards : []) {
      const slug = String(ref)
      if (!monumentSlugs.has(slug)) continue
      placements.set(slug, [...(placements.get(slug) ?? []), d])
    }
  }
  // Espejo de DaySection (day.cards → monById → MonumentCard :id="monument.slug"): el ÚNICO sitio
  // que pinta id=<slug> de una ficha. Una ficha fuera de esta unión no existe en el DOM.
  const renderedMonuments = new Set(placements.keys())
  for (const d of monuments) {
    if (d.slug === '') continue
    const where = placements.get(d.slug) ?? []
    if (where.length === 0) {
      push(d.file, 'card-placement', `ficha "${d.slug}" no está en el cards de ningún día: MonumentCard no la pinta y #${d.slug} no existe en la guía (D-08)`)
    }
    else if (where.length > 1) {
      const files = [...new Set(where.map(x => x.file))]
      for (const file of files) {
        push(file, 'card-placement', `ficha "${d.slug}" aparece ${where.length} veces en cards (${files.join(', ')}): id #${d.slug} duplicado en el DOM (D-08)`)
      }
    }
  }

  // Los ref de timeline (stop y food) y de reservas.table solo resuelven a fichas PINTADAS.
  const stopOrFood = new Set([...renderedMonuments, ...foodSlugs])
  const artistArt = new Set(artists.filter(d => d.kind === 'artist').map(d => d.slug))
  const artistArch = new Set(artists.filter(d => d.kind === 'arquitectura').map(d => d.slug))

  for (const d of days) {
    for (const ref of Array.isArray(d.data.cards) ? d.data.cards : []) {
      if (!monumentSlugs.has(String(ref))) push(d.file, 'ref', `cards "${String(ref)}" no existe en monuments`)
    }
    // Filas de las opciones de un `choice` incluidas (Pitfall 3, Fase 12).
    for (const row of timelineRowsOf(d.data.timeline)) {
      if (row.kind === 'stop' && typeof row.ref === 'string' && !stopOrFood.has(row.ref)) {
        push(d.file, 'ref', `timeline stop ref "${row.ref}" no resuelve`)
      }
      if (row.kind === 'food') {
        for (const e of asArray(row.entries)) {
          if (typeof e.ref === 'string' && !stopOrFood.has(e.ref)) push(d.file, 'ref', `timeline food ref "${e.ref}" no resuelve`)
          // CR-03 (10-REVIEW): TimelineFood pinta `<a :href="entry.href">` tal cual (Vue no sanea
          // el href y el esquema es un z.string() pelado). No es prosa, así que scanProseLinks no
          // lo ve: se somete aquí a la lista blanca D-05 (b), solo http(s)://.
          if (typeof e.href === 'string' && !/^https?:\/\//i.test(e.href)) {
            push(d.file, 'cross-trip-link', `timeline food href "${e.href}" no admitido (D-05): solo http(s)://`)
          }
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
      const ref = String(link.ref)
      if (renderedMonuments.has(ref)) continue
      push(d.file, 'ref', monumentSlugs.has(ref)
        ? `seenIn ref "${ref}" es una ficha que no se pinta en ningún día (cards)`
        : `seenIn ref "${ref}" no es un monument`)
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

  // stay-dup / stay-ref (D-06, Fase 12): bases del viaje. Los slugs de `trip.stays` se cuentan
  // (un slug repetido es UNA violación en trip.yml, por slug) y el `stay` de cada día debe estar
  // en ese conjunto, vacío si el viaje no declara `stays`. Comparación EXACTA de strings: la
  // puerta no normaliza mayúsculas ni espacios (`stay: Salerno` no resuelve a `salerno`).
  const staySlugs = new Set<string>()
  for (const d of tripDocs) {
    const counts = new Map<string, number>()
    for (const s of asArray(d.data.stays)) {
      const slug = String(s.slug ?? '')
      counts.set(slug, (counts.get(slug) ?? 0) + 1)
      staySlugs.add(slug)
    }
    for (const [slug, n] of counts) {
      if (n > 1) push(d.file, 'stay-dup', `stay "${slug}" duplicado en stays`)
    }
  }
  for (const d of days) {
    const stay = d.data.stay
    if (typeof stay === 'string' && !staySlugs.has(stay)) {
      push(d.file, 'stay-ref', `stay "${stay}" no existe en trip.yml stays`)
    }
  }

  // reservas-headings (Fase 12.1, WR-01): fuera de Roma, cada bloque que se pinta lleva su
  // título propio. `table` siempre (la cabecera de la tabla no tiene `v-if`); `mesas`/`visitas`
  // solo si ese grupo tiene entradas (D-03: un grupo vacío no pinta su `h4`). Un valor ausente,
  // `null`, no string o solo espacios cuenta como ausente (el resolver caería al texto de Roma).
  // Roma es el viaje cuyos textos SON los defaults: no declara `headings` y queda exento.
  if (t.dir !== 'roma') {
    for (const d of reference.filter(x => x.slug === 'reservas')) {
      const headings = isPlainObject(d.data.headings) ? d.data.headings : {}
      const groups = new Set(asArray(d.data.confirmed).map(c => c.group))
      for (const key of ['mesas', 'visitas', 'table'] as const) {
        if (key !== 'table' && !groups.has(key)) continue
        const value = headings[key]
        if (typeof value !== 'string' || value.trim() === '') {
          push(d.file, 'reservas-headings', `falta headings.${key}: heredaría el texto de Roma («${RESERVAS_HEADINGS_DEFAULT[key]}»)`)
        }
      }
    }
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
  // WR-03: una ficha solo es ancla si se pinta (renderedMonuments); el resto de entidades, siempre.
  const anchorable = new Set<string>([
    ...entities.filter(d => d.collection !== 'monument').map(d => d.slug),
    ...renderedMonuments,
    ...layout.map(e => e.id),
  ])
  for (const d of t.docs) {
    for (const str of collectStrings(d.data)) {
      // G-10-2 / WR-01: toda forma que MDC pinta como <a>; las formas rechazadas, sea cual sea su destino.
      const { targets, rejected } = scanProseLinks(str)
      for (const label of rejected) {
        push(d.file, 'cross-trip-link', `forma de enlace no admitida (D-05): ${label} — escribe [texto](#id) o [texto](https://…)`)
      }
      for (const target of targets) {
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
