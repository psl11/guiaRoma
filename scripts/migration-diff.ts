// Harness de fidelidad 1:1 index.html ⇄ YAML migrado (D-07 / D-08).
//
// PROPÓSITO (DATA-04): la transcripción manual de ~64 fichas densas con muchos enlaces
// internos es propensa a perder un href o cambiar una frase (RESEARCH Pitfall 4). Este
// módulo es la red automática: extrae del `index.html` —por id de ficha— el TEXTO VISIBLE
// y el CONJUNTO de enlaces (Maps externos + anclas internas #id), lo normaliza y lo compara
// contra los datos YAML migrados. El spec `tests/data/migration-diff.spec.ts` ejecuta este
// diff y FALLA si falta o sobra texto o algún enlace.
//
// CRITERIO D-08 (02-CONTEXT.md 51): equivalencia NORMALIZADA de texto + enlaces, NO byte-
// exacta. El markup puede cambiar (HTML → Markdown) pero no se pierde ni se añade texto ni
// enlace. Por eso:
//   - El texto se compara como MULTISET DE PALABRAS normalizadas (robusto a que la prosa se
//     reparta en otros campos/orden; detecta una frase perdida o añadida — Pitfall 4).
//   - Los enlaces se comparan como CONJUNTOS de href (externos http + anclas #id).
//
// REGLAS DURAS:
//   - index.html es la FUENTE inmutable: se lee SOLO-LECTURA (readFileSync), nunca se escribe.
//   - NADA de regex sobre el HTML para el texto: el anidamiento real de <em>/<strong>/<a>
//     dentro de <p> rompe las regex (RESEARCH Don't Hand-Roll 226-236). cheerio hace el
//     parseo robusto del DOM.
//   - builtins de Node con prefijo `node:` (convención 02-PATTERNS / subpath.spec.ts).
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { load, type Cheerio, type CheerioAPI } from 'cheerio'
import type { AnyNode } from 'domhandler'

// ── Fuente inmutable: index.html cargado UNA vez ─────────────────────────────
const HTML_PATH = join(process.cwd(), 'index.html')
const $: CheerioAPI = load(readFileSync(HTML_PATH, 'utf8'))

// Raíz del contenido migrado. Cada id de ficha vive en `<colección>/<id>.yml`. El orden
// de búsqueda refleja dónde puede estar cada tipo de ancla del index.html.
const CONTENT_ROOT = join(process.cwd(), 'content', 'trips', 'roma')
const YAML_DIRS = ['monuments', 'food', 'artists', 'reference', 'days'] as const

// Prefijo de la URL de búsqueda de Google Maps que usan TODAS las .maps-link /
// .gastro-maps-link del index.html (verificado: 38 + 21 ocurrencias, mismo patrón).
const MAPS_PREFIX = 'https://www.google.com/maps/search/?api=1&query='

// ── extractFromHtml(id) ──────────────────────────────────────────────────────
// Selecciona el contenedor de la ficha por id (article.card | .gastro-card |
// article.artist-card) y devuelve su texto visible (con <strong>/<em>/<a> convertidos a
// Markdown para casar con la prosa YAML) + el Set de href que contiene.

export interface Extracted {
  /** Texto visible del contenedor, con strong/em/a convertidos a Markdown-inline. */
  text: string
  /** Conjunto de href: externos (http…) + anclas internas (#id). */
  links: Set<string>
}

/** ¿Existe en el index.html un contenedor de ficha con este id? */
export function htmlHasId(id: string): boolean {
  return selectCard(id).length > 0
}

/** Lista (en orden de aparición en el DOM) de los ids de ficha anclados del index.html. */
export function knownHtmlIds(): string[] {
  return $('article.card[id], .gastro-card[id], article.artist-card[id]')
    .map((_, el) => $(el).attr('id') as string)
    .get()
}

function selectCard(id: string): Cheerio<AnyNode> {
  // Escapar el id para el selector (los ids del index.html son [a-z0-9-], pero por
  // robustez ante un id inesperado evitamos romper el selector).
  const safe = id.replace(/"/g, '\\"')
  return $(
    `article.card[id="${safe}"], .gastro-card[id="${safe}"], article.artist-card[id="${safe}"]`,
  ).first()
}

/**
 * Convierte el subárbol DOM de un contenedor a texto Markdown-inline:
 *   <strong>/<b> → **texto**, <em>/<i> → _texto_, <a href> → [texto](href)
 *   <img alt>     → el texto ALT (es contenido visible/accesible migrado — la ficha YAML
 *                   lo guarda en `hero.alt` y en el `alt=` de :detail-photo, y la denylist
 *                   declara que `alt`/`caption` SÍ cuentan; por simetría el lado HTML debe
 *                   emitirlo, si no toda ficha con hero daría `alt` como "texto sobrante").
 * Recoge además todos los href en `links`. El resto de etiquetas aportan sólo su texto.
 *
 * Los hijos se unen con UN ESPACIO (no ''): en el HTML dos elementos en línea adyacentes sin
 * blanco entre ellos (p.ej. `<span class="label">Horario crítico</span><span class="value">L-V…`)
 * se pegarían en un único token ("críticol-v"), mientras que el lado YAML — que junta strings de
 * campos distintos con espacio — los separa. Unir con espacio aquí casa ambos lados; `normalize`
 * colapsa cualquier espacio doble que esto introduzca dentro de un <p>, así que es inocuo para la
 * prosa y sólo arregla el pegado de `.facts-row` (label+value), card-header, etc.
 * (No es un conversor Markdown perfecto — D-08 sólo exige equivalencia de texto+enlaces.)
 */
function domToMarkdown(node: AnyNode, links: Set<string>): string {
  // Nodo de texto: cheerio ya decodifica las entidades HTML en `.data`.
  if (node.type === 'text') return (node as unknown as { data: string }).data ?? ''
  if (node.type !== 'tag') return '' // comentarios, etc. → sin texto visible

  const el = node as unknown as { name: string, attribs: Record<string, string>, children: AnyNode[] }
  const inner = el.children.map(c => domToMarkdown(c, links)).join(' ')
  const tag = el.name.toLowerCase()

  switch (tag) {
    case 'strong':
    case 'b':
      return `**${inner}**`
    case 'em':
    case 'i':
      return `_${inner}_`
    case 'img':
      // El texto alternativo es contenido visible/accesible; el src es estructural (no texto).
      return el.attribs?.alt ?? ''
    case 'a': {
      const href = el.attribs?.href
      if (href) {
        links.add(href)
        return `[${inner}](${href})`
      }
      return inner
    }
    default:
      return inner
  }
}

// Subárboles que son CHROME de UI, no contenido editorial migrado: NO cuentan como texto.
//   - .notes-area: el bloque de "Notas in situ" + el <textarea> (Fase 7, no es prosa).
//   - .artist-avatar: la inicial decorativa de la ficha (B / IV / ?). Es estructural (el YAML
//     la guarda en el campo `avatar`, ya excluido del texto vía STRUCTURAL_KEYS): para que la
//     comparación sea SIMÉTRICA hay que excluirla también del lado HTML; si no, su letra
//     aparecería como "texto faltante" en las 13 artist-cards.
//   - .maps-link / .gastro-maps-link: la ETIQUETA del botón ("Ver en Google Maps" /
//     "📍 Google Maps") la genera el componente en Fase 4; su href SÍ se captura como enlace,
//     pero su texto no es prosa migrada (el dato sólo guarda `mapsQuery`).
const CHROME_SELECTOR = '.notes-area, .artist-avatar'
const MAPS_LINK_SELECTOR = '.maps-link, .gastro-maps-link'

export function extractFromHtml(id: string): Extracted {
  const original = selectCard(id)
  if (original.length === 0) {
    throw new Error(`extractFromHtml: no hay ficha con id "${id}" en index.html`)
  }
  const links = new Set<string>()

  // Capturar PRIMERO los href de los botones de Maps (su etiqueta se excluye del texto, pero
  // el enlace forma parte del conjunto a comparar — D-08).
  original.find(MAPS_LINK_SELECTOR).each((_, a) => {
    const href = $(a).attr('href')
    if (href) links.add(href)
  })

  // Clonar para poder retirar el chrome sin tocar el DOM de la fuente (index.html inmutable).
  const card = original.clone()
  card.find(CHROME_SELECTOR).remove()
  // Quitar la ETIQUETA de los botones de Maps (su href ya está capturado arriba).
  card.find(MAPS_LINK_SELECTOR).remove()

  const node = card.get(0) as AnyNode
  const text = domToMarkdown(node, links)
  return { text, links }
}

// ── Prosa de NIVEL SECCIÓN/GRUPO (fuera de las cards) ───────────────────────────
// El `extractFromHtml`/`diffEntry` de arriba es PER-CARD: selecciona article.card /
// .gastro-card / article.artist-card y sólo ve el texto de ese subárbol. Pero el index.html
// tiene prosa editorial que vive FUERA de toda card: el `section-eyebrow` y el párrafo
// introductorio de cada sección-página (gastronomía/arte/arquitectura), y el `gastro-intro`
// de NIVEL GRUPO (Quinto quarto, Ghetto). Esa prosa es invisible al diff per-card → fue el
// hueco que dejó caer 8 textos en la migración (02-VERIFICATION gap). Estos helpers la
// extraen para que el spec la diffee 1:1 contra los campos YAML (trip.sections / food.groupIntro).

/** Eyebrow (`.section-eyebrow`) + intro (`.gastro-intro`/`.art-intro`) de una sección-página. */
export interface SectionMetaExtract {
  /** Texto del `.section-eyebrow` (plano, sin markup ni enlaces). */
  eyebrow: string
  /** Texto del párrafo intro, con strong/em/a convertidos a Markdown-inline. */
  intro: string
}

/**
 * Extrae eyebrow + intro de una sección-página por su id de ancla (`gastronomia`/`arte`/
 * `arquitectura`). El eyebrow es el primer `.section-eyebrow` dentro de la `<section>`; el
 * intro es el primer `.gastro-intro`/`.art-intro` (el de NIVEL SECCIÓN, que en el HTML es un
 * `<p>`, no los `<div class="gastro-intro">` de nivel grupo). Lanza si la sección no existe.
 */
export function extractSectionMeta(sectionId: 'gastronomia' | 'arte' | 'arquitectura'): SectionMetaExtract {
  const section = $(`section#${sectionId}`).first()
  if (section.length === 0) {
    throw new Error(`extractSectionMeta: no hay <section id="${sectionId}"> en index.html`)
  }
  const eyebrowEl = section.find('.section-eyebrow').first()
  // El intro de sección es un <p> (los .gastro-intro de grupo son <div>): restringir a <p>
  // evita capturar por error un intro de grupo como si fuera el de la sección.
  const introEl = section.find('p.gastro-intro, p.art-intro').first()
  if (eyebrowEl.length === 0 || introEl.length === 0) {
    throw new Error(`extractSectionMeta: falta eyebrow o intro en la sección "${sectionId}"`)
  }
  const links = new Set<string>()
  return {
    eyebrow: eyebrowEl.text(),
    intro: domToMarkdown(introEl.get(0) as AnyNode, links),
  }
}

/**
 * Extrae el `gastro-intro` de NIVEL GRUPO asociado a un `gastro-section-title` cuyo texto
 * coincide (normalizado) con `groupTitle` (= el campo `group` de la ficha food). El intro de
 * grupo es el `<div class="gastro-intro">` que sigue inmediatamente al título; si ese título
 * no va seguido de un intro (la mayoría de grupos no tienen), devuelve null. Texto con
 * strong/em/a → Markdown-inline. Lanza si no encuentra el título.
 */
export function extractGroupIntro(groupTitle: string): string | null {
  const target = normalize(groupTitle)
  const titleEl = $('p.gastro-section-title')
    .filter((_, el) => normalize($(el).text()) === target)
    .first()
  if (titleEl.length === 0) {
    throw new Error(`extractGroupIntro: no hay gastro-section-title "${groupTitle}" en index.html`)
  }
  const next = titleEl.next()
  if (!next.hasClass('gastro-intro')) return null // grupo sin intro
  const links = new Set<string>()
  return domToMarkdown(next.get(0) as AnyNode, links)
}

// ── normalize(s) ──────────────────────────────────────────────────────────────
// Reglas mínimas y testeables de D-08: convertir strong/em HTML a Markdown (por si llega
// HTML crudo), decodificar entidades comunes y COLAPSAR espacios. Devuelve un string
// canónico; la comparación de texto se hace luego por MULTISET de palabras de este string.

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': '\'',
  '&apos;': '\'',
  '&nbsp;': ' ',
}

export function normalize(s: string): string {
  return (
    s
      // strong/em HTML → Markdown (idempotente si ya viene en Markdown).
      .replace(/<\s*(strong|b)\s*>([\s\S]*?)<\s*\/\s*\1\s*>/gi, '**$2**')
      .replace(/<\s*(em|i)\s*>([\s\S]*?)<\s*\/\s*\1\s*>/gi, '_$2_')
      // Entidades HTML comunes → carácter (numéricas decimales también).
      .replace(/&[a-z]+;|&#\d+;/gi, m => ENTITIES[m.toLowerCase()] ?? decodeNumericEntity(m) ?? m)
      // Colapsar TODO espacio en blanco (incl. saltos de línea de los bloques YAML).
      .replace(/\s+/g, ' ')
      .trim()
  )
}

function decodeNumericEntity(m: string): string | undefined {
  const hit = /^&#(\d+);$/.exec(m)
  return hit ? String.fromCodePoint(Number(hit[1])) : undefined
}

/**
 * Multiset de "palabras" de un texto normalizado, para comparar equivalencia sin depender
 * del orden ni de cómo se reparta la prosa entre campos. Se eliminan los marcadores de
 * énfasis (`*`, `_`) y la sintaxis de enlace Markdown (los enlaces se comparan aparte como
 * conjunto de href), quedando sólo las palabras visibles. La puntuación de borde se recorta.
 */
export function textMultiset(normalized: string): Map<string, number> {
  // Quitar la sintaxis de enlace dejando SOLO el texto visible: [t](url) → t
  const noLinks = normalized.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  // Quitar marcadores de énfasis Markdown.
  const noEmph = noLinks.replace(/[*_]/g, '')
  const words = noEmph
    .toLowerCase()
    .split(/\s+/)
    // Recortar puntuación de los extremos, conservando letras/dígitos/€/% internos.
    .map(w => w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter(Boolean)
  const ms = new Map<string, number>()
  for (const w of words) ms.set(w, (ms.get(w) ?? 0) + 1)
  return ms
}

// ── Lado YAML: texto + enlaces ────────────────────────────────────────────────

/** Recorre recursivamente un objeto recogiendo todos los strings (prosa + campos). */
export function collectStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === 'string') acc.push(value)
  else if (Array.isArray(value)) for (const v of value) collectStrings(v, acc)
  else if (value && typeof value === 'object') for (const v of Object.values(value)) collectStrings(v, acc)
  return acc
}

/**
 * Reconstruye el conjunto de href que el YAML representa:
 *   - anclas internas `[texto](#id)` de cualquier campo Markdown → `#id`
 *   - `mapsQuery` → la URL de búsqueda de Google Maps (igual que .maps-link del HTML)
 * (Se comparan CONJUNTOS, no posiciones — D-08.)
 */
export function yamlLinks(yamlObj: Record<string, unknown>): Set<string> {
  const links = new Set<string>()
  const strings = collectStrings(yamlObj)
  // Anclas internas Markdown.
  const anchorRe = /\]\(#([a-z0-9-]+)\)/gi
  for (const s of strings) {
    let m: RegExpExecArray | null
    while ((m = anchorRe.exec(s)) !== null) links.add(`#${m[1]}`)
    // URLs externas embebidas en Markdown `[t](http…)`.
    const extRe = /\]\((https?:\/\/[^)]+)\)/gi
    let e: RegExpExecArray | null
    while ((e = extRe.exec(s)) !== null) links.add(e[1])
  }
  // Maps: reconstruir desde mapsQuery (campo tipado, no inline).
  const q = yamlObj.mapsQuery
  if (typeof q === 'string' && q.length > 0) {
    links.add(MAPS_PREFIX + encodeMapsQuery(q))
  }
  return links
}

// Las .maps-link del index.html codifican el apóstrofo como `%27` (común en italiano:
// Sant'Angelo, dell'Acqua, de' Fiori). `encodeURIComponent` deja el apóstrofo SIN escapar
// (es un carácter "unreserved" en su tabla), así que la reconstrucción ingenua no casa con
// el href fuente y el diff reporta el enlace de Maps como faltante/sobrante en toda ficha con
// apóstrofo. Igualar la codificación del HTML (verificado: `%27` en las 38 .maps-link).
export function encodeMapsQuery(q: string): string {
  return encodeURIComponent(q).replace(/'/g, '%27')
}

// Claves ESTRUCTURALES del YAML cuyo string NO es prosa visible: ids, enums, urls/queries,
// y banderas. Se excluyen del MULTISET DE TEXTO (algunas, como `ref`/`mapsQuery`, ya
// participan en el conjunto de ENLACES). Todo string que no esté bajo una de estas claves se
// trata como texto editorial migrado (denylist pequeña y estable > allowlist frágil).
const STRUCTURAL_KEYS = new Set<string>([
  'slug', 'trip', 'id', 'ref', 'href', 'src', 'mapsQuery',
  'motif', 'type', 'kind', 'variant', 'level', 'category', 'badgeKind', 'group',
  'order', 'zoom', 'lat', 'lng', 'icon', 'avatar',
  // `day` viene del array `places` (metadato del popup del mapa), NO del texto de la ficha
  // (la `article.card` no contiene "Viernes"). Como `coords`/`type`, es estructural: excluirlo
  // del multiset de texto, si no toda ficha daría su día como "texto sobrante".
  'day',
  // `groupIntro` es prosa de NIVEL GRUPO (Quinto quarto, Ghetto): vive en la ficha
  // representativa del grupo pero su texto NO está dentro del subárbol `.gastro-card` del
  // index.html (es el `<div class="gastro-intro">` que precede a la rejilla del grupo). El diff
  // PER-CARD no puede verlo en el HTML, así que incluirlo aquí daría "texto sobrante" en esa
  // ficha. Su fidelidad 1:1 la cubre el bloque de prosa de nivel grupo (extractGroupIntro).
  'groupIntro',
])

/**
 * Recoge los strings de PROSA del YAML (omite los valores bajo claves estructurales).
 * `alt` (texto alternativo de imagen) y `caption` SÍ cuentan: son contenido visible migrado.
 */
export function collectProseStrings(value: unknown, key: string | null, acc: string[] = []): string[] {
  if (typeof value === 'string') {
    if (!key || !STRUCTURAL_KEYS.has(key)) acc.push(value)
  }
  else if (Array.isArray(value)) {
    // Los elementos de un array heredan la "clave" del array (p.ej. howTo: [Md, Md]).
    for (const v of value) collectProseStrings(v, key, acc)
  }
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) collectProseStrings(v, k, acc)
  }
  return acc
}

// ── MDC inline components en la prosa YAML (D-02) ───────────────────────────────
// La `detail-photo` se migra como componente MDC inline dentro del `body` de su sección:
//   :detail-photo{src="…" alt="…" caption="…"}
// Para el diff de TEXTO sólo cuenta el contenido VISIBLE/ACCESIBLE del componente: el `alt`
// (que el lado HTML ya emite desde <img alt>) y el `caption` (el `.detail-photo-caption` del
// HTML). El nombre del componente (`detail-photo`), las llaves, los nombres de atributo y el
// `src` (URL, estructural) NO son texto migrado y se descartan — si no, "detail-photo", la URL
// y "src/alt/caption" entrarían como "texto sobrante" y el diff nunca casaría.
const MDC_COMPONENT_RE = /:[a-z][a-z0-9-]*\{([^}]*)\}/gi
const MDC_ATTR_RE = /\b(alt|caption)\s*=\s*"([^"]*)"/gi

export function stripMdcComponents(s: string): string {
  return s.replace(MDC_COMPONENT_RE, (_full, attrs: string) => {
    const parts: string[] = []
    let m: RegExpExecArray | null
    MDC_ATTR_RE.lastIndex = 0
    while ((m = MDC_ATTR_RE.exec(attrs)) !== null) parts.push(m[2])
    return ` ${parts.join(' ')} ` // espacios de guarda: el componente no pega con el texto vecino
  })
}

/** Texto normalizado del lado YAML: concatena SÓLO la prosa/campos visibles (sin chrome). */
export function yamlText(yamlObj: Record<string, unknown>): string {
  return normalize(stripMdcComponents(collectProseStrings(yamlObj, null).join(' ')))
}

// ── diffEntry(id, yamlObj) ─────────────────────────────────────────────────────
// Normaliza ambos lados y devuelve qué texto/enlaces faltan (están en el HTML pero no en el
// YAML → PÉRDIDA) o sobran (están en el YAML pero no en el HTML → ADICIÓN). Vacío en las
// cuatro listas = equivalencia (D-08).

export interface Diff {
  /** Palabras presentes en el HTML que faltan en el YAML (pérdida de texto). */
  missingWords: string[]
  /** Palabras presentes en el YAML que no están en el HTML (texto añadido). */
  extraWords: string[]
  /** Enlaces (href) presentes en el HTML que faltan en el YAML. */
  missingLinks: string[]
  /** Enlaces (href) presentes en el YAML que no están en el HTML. */
  extraLinks: string[]
}

function diffMultisets(a: Map<string, number>, b: Map<string, number>): string[] {
  // Devuelve los elementos (con multiplicidad) que están en `a` por encima de `b`.
  const out: string[] = []
  for (const [k, n] of a) {
    const deficit = n - (b.get(k) ?? 0)
    for (let i = 0; i < deficit; i++) out.push(k)
  }
  return out
}

export function diffEntry(id: string, yamlObj: Record<string, unknown>): Diff {
  const html = extractFromHtml(id)
  const htmlWords = textMultiset(normalize(html.text))
  const yamlWords = textMultiset(yamlText(yamlObj))
  const htmlLinks = html.links
  const yLinks = yamlLinks(yamlObj)

  return {
    missingWords: diffMultisets(htmlWords, yamlWords),
    extraWords: diffMultisets(yamlWords, htmlWords),
    missingLinks: [...htmlLinks].filter(l => !yLinks.has(l)),
    extraLinks: [...yLinks].filter(l => !htmlLinks.has(l)),
  }
}

/** ¿El diff reporta equivalencia total (sin faltantes ni sobrantes)? */
export function isEquivalent(d: Diff): boolean {
  return (
    d.missingWords.length === 0
    && d.extraWords.length === 0
    && d.missingLinks.length === 0
    && d.extraLinks.length === 0
  )
}

// ── Helper de existencia de YAML por id (para SKIPear ids no migrados) ──────────
// Wave 3 migra el contenido en paralelo por colección. El spec ejecuta el diff de forma
// INCREMENTAL: para cada id, si ya hay fichero YAML lo verifica; si no, lo SKIPea. Sin esto,
// los planes de migración en paralelo se harían false-red entre sí por los ids que otro plan
// aún no ha escrito.

/** Devuelve la ruta del `.yml` migrado para un id, o null si aún no existe. */
export function resolveYamlPath(id: string): string | null {
  for (const dir of YAML_DIRS) {
    const p = join(CONTENT_ROOT, dir, `${id}.yml`)
    if (existsSync(p)) return p
  }
  return null
}

/** ¿Ya existe el fichero YAML migrado para este id? */
export function hasYaml(id: string): boolean {
  return resolveYamlPath(id) !== null
}

// ── bootstrapDraft(id) — opcional (D-07) ────────────────────────────────────────
// Emite un borrador YAML mínimo desde el HTML para acelerar la transcripción de Wave 3. NO
// es el dato final (no infiere el esquema completo): vuelca el texto Markdown extraído y la
// lista de enlaces como punto de partida. El diff posterior verifica el resultado migrado.

export function bootstrapDraft(id: string): string {
  const { text, links } = extractFromHtml(id)
  const md = normalize(text)
  const lines = [
    `# Borrador autogenerado desde index.html para "${id}" (D-07).`,
    `# NO es el dato final: revisa y estructura según shared/schemas.ts. El diff verifica el resultado.`,
    `slug: ${id}`,
    `# --- texto visible (Markdown-inline) ---`,
    `_draftText: |`,
    ...md.split('. ').map(seg => `  ${seg.trim()}${seg.endsWith('.') ? '' : '.'}`),
    `# --- enlaces detectados (${links.size}) ---`,
    `_draftLinks:`,
    ...[...links].map(l => `  - ${l}`),
  ]
  return lines.join('\n')
}
