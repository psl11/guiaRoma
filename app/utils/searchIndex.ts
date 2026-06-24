/**
 * Lógica PURA de búsqueda en cliente (FEAT-03) — sin DOM, sin estado, sin Nuxt/Vue.
 *
 * Reemplaza el `buildSearchIndex()` + filtro `includes()` del index.html (6435-6442 y
 * 6447-6466), que ESCRAPEABA el DOM: `content = card.textContent.toLowerCase()` y luego
 * `cards.filter(c => c.content.includes(q))`. Eso es el anti-patrón "buscar scrapeando el
 * DOM" (CLAUDE.md §"Buscar scrapeando el DOM"): sin ranking, sin prefijo, sin tolerancia a
 * erratas y acoplado al HTML renderizado. Aquí se sustituye por un haystack derivado de los
 * DATOS tipados (`Monument`) y un índice invertido real (MiniSearch 7.2.0).
 *
 * `buildHaystack(m)` es DELIBERADAMENTE un SUPERCONJUNTO del antiguo `card.textContent`
 * (RESEARCH §Pitfall 1 / SC#1 "encontrar AL MENOS lo que encuentra hoy"). El esquema de la
 * Fase 2 reparte ese texto visible en muchos campos; concatenarlos TODOS garantiza que
 * ninguna palabra que el `card.textContent` indexaba hoy se pierda. Incluye, en este orden:
 *   `name`, `italian`, `roman`; `badge` (p. ej. "Sorrentino" / "Caravaggio"); cada
 *   `sections[].heading` + `sections[].body` (el body ya embebe el caption de :detail-photo
 *   y los bullets de :detail-list como MDC inline); cada `facts[].label` + `facts[].value`;
 *   `sorrentino.label` + `sorrentino.text`; cada `culture[].title` + `culture[].text`; y cada
 *   `artists[]`/`arch[]` `label` + `note` (la etiqueta de `arch` lleva palabras de estilo como
 *   "Tardobarroco" que el `card.textContent` SÍ indexaba). Un superconjunto es seguro; un
 *   subconjunto sería una regresión de SC#1.
 *
 * NO se toca el Markdown a mano: los campos Md (`*.body`, `*.text`, `Link.label`/`note`) son
 * Markdown-inline (p. ej. `Arquitectura: **Tardobarroco**`, `[Bernini](#art-bernini)`). El
 * tokenizador por defecto de MiniSearch (`SPACE_OR_PUNCTUATION`) ya separa por `*`/`[`/`]`/
 * `#`/`(`/`)`, de modo que las palabras ("Tardobarroco", "Bernini") quedan indexadas. Tampoco
 * se hace `toLowerCase()` manual: el `processTerm` por defecto de MiniSearch ya minuscula.
 *
 * `createSearchIndex(monuments)` es una FÁBRICA pura: datos → instancia de MiniSearch
 * configurada (idField `slug`, prefijo + fuzzy suave, `name`/`italian` con boost por encima de
 * la prosa). El índice se construye SOLO sobre MONUMENTOS (D-02), nunca sobre gastro/artistas.
 * La construcción reactiva del índice en CLIENTE (`onMounted`) y el estado de query/dropdown
 * llegan en el Plan 06-04 — este módulo no añade estado reactivo ni nada de `useState` (el
 * índice MiniSearch jamás se serializa a `useState`).
 *
 * Vive en `app/utils/` (igual que `cardNav.ts`/`pace.ts`/`tripIndexes.ts`) para que Nuxt
 * auto-importe `buildHaystack`/`createSearchIndex` Y para poder testear SC#1 en Vitest plano,
 * sin runtime Nuxt (su test: `tests/unit/searchIndex.spec.ts`). Funciones puras: sin I/O, sin
 * estado, sin efectos, sin dependencia de Nuxt/Vue/DOM.
 */
import MiniSearch from 'minisearch'
import type { Monument } from '~~/shared/schemas'

/**
 * Construye el haystack de búsqueda de un monumento: una única cadena con TODOS los campos
 * de texto visibles del antiguo `.card` (SUPERCONJUNTO de `card.textContent`, RESEARCH
 * §Pitfall 1). Concatena el Markdown crudo a propósito (el tokenizador lo separa) y NO
 * minuscula (lo hace MiniSearch). Guardas `?? []` en los arrays opcionales (igual que
 * `tripIndexes.ts`); `?? ''` para la `note` opcional de los `Link`.
 */
export function buildHaystack(m: Monument): string {
  const parts: string[] = [m.name, m.italian, m.roman]
  if (m.badge) parts.push(m.badge)
  for (const s of m.sections) parts.push(s.heading, s.body)
  for (const f of m.facts) parts.push(f.label, f.value)
  if (m.sorrentino) parts.push(m.sorrentino.label, m.sorrentino.text)
  for (const c of m.culture ?? []) parts.push(c.title, c.text)
  for (const a of m.artists ?? []) parts.push(a.label, a.note ?? '')
  for (const a of m.arch ?? []) parts.push(a.label, a.note ?? '')
  return parts.join(' ')
}

/**
 * Documento indexado por MiniSearch: las claves consultadas (`name`/`italian`/`haystack`) +
 * las almacenadas (`slug`/`name`/`day`) para el dropdown del Plan 06-04. `slug` es el ancla
 * `#id` (convención del repo), NO el `id` reservado.
 */
type SearchDoc = {
  slug: string
  name: string
  italian: string
  day: string
  haystack: string
}

/**
 * Fábrica PURA: monumentos → `MiniSearch` configurado (D-01 / D-02 / <minisearch_config>).
 *   - `idField: 'slug'` (el ancla `#id`, no el `id` reservado).
 *   - `fields: ['name', 'italian', 'haystack']` indexados.
 *   - `storeFields: ['slug', 'name', 'day']` devueltos en cada resultado (el dropdown muestra
 *     `name` + `day`).
 *   - `searchOptions`: `prefix: true` + `fuzzy: 0.2` (suave, ≤20% del término — NO agresivo) +
 *     `boost` con `name`/`italian` por encima de `haystack` (la prosa) + `combineWith: 'OR'`
 *     (amplio = seguro para el "al menos" de SC#1; el `includes(q)` original ya era amplio).
 * Indexa SOLO monumentos (D-02). Sin Nuxt/Vue/DOM, sin `useState`.
 */
export function createSearchIndex(monuments: Monument[]): MiniSearch<SearchDoc> {
  const mini = new MiniSearch<SearchDoc>({
    idField: 'slug',
    fields: ['name', 'italian', 'haystack'],
    storeFields: ['slug', 'name', 'day'],
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      boost: { name: 3, italian: 3, haystack: 1 },
      combineWith: 'OR',
    },
  })
  mini.addAll(monuments.map(m => ({
    slug: m.slug,
    name: m.name,
    italian: m.italian,
    day: m.day,
    haystack: buildHaystack(m),
  })))
  return mini
}
