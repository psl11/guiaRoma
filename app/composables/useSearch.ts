import type MiniSearch from 'minisearch'
import type { Monument } from '~~/shared/schemas'

// `useSearch(slug?)` — estado y comportamiento de la búsqueda en cliente (FEAT-03), POR VIAJE
// (PLAT-01 / D-08, Fase 9): cada viaje tiene su propio índice, su propio estado y sus propios datos.
//
// Cierra FEAT-03 atando comportamiento al shell `.search-wrap` que F3 ya renderizó
// (TheHero, sin manejadores). Reemplaza el dropdown DOM-scraper del index.html
// (`searchResults.innerHTML = matches.map(...)`, 6447-6469) por un índice tipado +
// plantilla Vue auto-escapada. Reúne lo que en el original eran un índice a nivel de
// módulo + un handler de `input` + un listener de outside-click globales:
//   · query    — texto del input (`useState`, default '' = lo que prerenderiza el SSG).
//   · isOpen   — visibilidad del dropdown (`useState`, default false).
//   · results  — filas a pintar, OBJETOS PLANOS `{ slug, name, day }` (`useState`, default []).
//   · onInput  — port de index.html:6448-6457 (trim, guard ≥2, slice 8, abrir/cerrar).
//   · onSelect — port de index.html:6459-6461 (limpiar input + cerrar + navigateToCard).
//
// SEPARACIÓN ESTADO ↔ EFECTOS (Pitfall 4 / CR-01, calcada de useCardNavigation y
// useTripModes): `useSearch()` es el ACCESOR PURO — solo lee los `useState` y devuelve
// `{ query, isOpen, results, onInput, onSelect }`. Es idempotente y se puede llamar desde
// cualquier sitio. Los EFECTOS (construir el índice MiniSearch en cliente + el listener de
// outside-click en `document`) viven en `useSearchController()`, que se invoca UNA SOLA VEZ
// — en `SearchBox` (posee el control y se monta una vez). Si el listener se registrara por
// instancia consumidora habría N listeners de click; uno solo garantiza el cierre correcto.
//
// ÍNDICE CLIENT-ONLY, NUNCA SERIALIZADO (D-02): el índice MiniSearch es estado EFÍMERO de
// cliente; vive en un `Map<string, MiniSearch>` a nivel de módulo (`indexes`, UNA entrada por slug
// de viaje), NUNCA en `useState`. Solo `query`/`isOpen`/`results` (plano serializable) son `useState`,
// con claves sufijadas por viaje (`search:query:<slug>`… vía `tripStateKey`, D-08). Mapear
// los resultados de MiniSearch a `{ slug, name, day }` mantiene `results` serializable (los
// `SearchResult` de MiniSearch llevan metadatos no necesarios). El índice se indexa SOLO sobre
// MONUMENTOS (D-02: `createSearchIndex` los toma de `monById`), así que todo resultado resuelve
// en `monById` y `navigateToCard` (F5) basta sin cambio alguno en F5.
//
// REGISTRO SÍNCRONO DE HOOKS (Plan 05-03 — A1 / fix de bug, repetido aquí). En
// `useSearchController` los hooks `onMounted`/`onUnmounted` se registran SÍNCRONAMENTE, ANTES
// de cualquier `await`. Vue asocia un hook de ciclo de vida a la instancia ACTIVA en el
// momento de llamarlo; tras un `await` en setup async la instancia activa se PIERDE y el hook
// se vuelve un no-op SILENCIOSO (FEAT muerta en el SSG, igual que el bug de F5). El controller
// AWAITea `useTrip(slug)` para `monById`, así que los hooks van PRIMERO; el índice se
// construye en `onMounted` (solo cliente) leyendo `monById` por un holder reactivo.
//
// EL SLUG LLEGA POR INJECT (D-08): `SearchBox` es descendiente de `TripView`, que publica el slug
// del viaje (`provideTripSlug`). El accesor lo toma por defecto de `useTripSlug()`; el controller lo
// lee en su PRIMERA sentencia, antes de cualquier `await` (tras un await la instancia se pierde y
// `inject` dejaría de funcionar — Pitfall 2 / regla del primer await de useTripContext.ts).
//
// `useState`/`shallowRef`/`onMounted`/`onUnmounted`/`watch` son auto-importados por Nuxt;
// `createSearchIndex` se auto-importa de `app/utils/searchIndex.ts` (Plan 06-02);
// `navigateToCard` viene de `useCardNavigation(slug)` (F5, del MISMO viaje); `useTrip`,
// `useTripSlug` y `tripStateKey` son auto-imports.

// Tipo de fila del dropdown — los `storeFields` de MiniSearch (searchIndex.ts) + lo que la
// plantilla pinta vía `{{ }}`: `name` (título) y `day` (meta). `slug` es el ancla `#id`.
type SearchResultRow = { slug: string, name: string, day: string }

// Índices MiniSearch a nivel de módulo, UNO POR SLUG de viaje (CLIENT-ONLY, NUNCA `useState`).
// Se escribe SOLO en cliente (`onMounted`/`watch` de `useSearchController`), nunca en prerender,
// igual que el holder único anterior: compartir este Map entre peticiones SSR es inocuo porque en
// servidor siempre está vacío. Una entrada por slug → sin resultados cruzados aunque dos viajes
// compartan el slug de una ficha (`spagna`). Lo lee `onInput()` en tiempo de tecleo; sin entrada
// (antes de hidratar/montar) `onInput` devuelve [] hasta que el índice está listo.
const indexes = new Map<string, MiniSearch>()

export function useSearch(slug: string = useTripSlug()) {
  // DEFAULT = prerenderizado: '' (input vacío), false (dropdown cerrado), [] (sin filas).
  const query = useState<string>(tripStateKey(slug, 'search:query'), () => '')
  const isOpen = useState<boolean>(tripStateKey(slug, 'search:open'), () => false)
  const results = useState<SearchResultRow[]>(tripStateKey(slug, 'search:results'), () => [])

  const { navigateToCard } = useCardNavigation(slug)

  // Port de index.html:6448-6457. `q = value.trim()` (MiniSearch minuscula internamente, así
  // que basta con trim). Guard `q.length < 2` → cerrar + return (6449). En caso contrario,
  // buscar, `.slice(0, 8)` (6450) y mapear a objetos planos serializables; abrir el dropdown.
  // El índice de este slug puede no existir antes de hidratar/montar → `?? []` (sin filas).
  function onInput(value: string) {
    query.value = value
    const q = value.trim()
    if (q.length < 2) {
      isOpen.value = false
      return
    }
    const matches = indexes.get(slug)?.search(q) ?? []
    results.value = matches.slice(0, 8).map(r => ({
      slug: r.slug as string,
      name: r.name as string,
      day: r.day as string,
    }))
    isOpen.value = true
  }

  // Port de index.html:6459-6461: limpiar el input, cerrar el dropdown y navegar a la ficha
  // vía F5. `navigateToCard` hace `preventDefault` (D-03) → el hash de la URL NO cambia. El
  // índice es monuments-only (D-02) → el slug siempre resuelve en `monById` (sin cambio en F5).
  function onSelect(slug: string, event?: Event) {
    isOpen.value = false
    query.value = ''
    navigateToCard(slug, event)
  }

  return { query, isOpen, results, onInput, onSelect }
}

// `useSearchController()` — registra los EFECTOS SECUNDARIOS de la búsqueda UNA SOLA VEZ.
// Se invoca exclusivamente en `SearchBox` (el dueño del control, montado una vez). NO llamar
// desde otros consumidores: ellos solo necesitan el accesor puro `useSearch()`.
//
// `useTrip` es `async` y devuelve `monById` (computed `Map<slug, Monumento>`). Se consulta el
// slug del viaje resuelto por inject — el MISMO que TripView pasa a `useTrip`; `useAsyncData`
// deduplica por clave, así que `monById` es el MISMO computed poblado (sin doble fetch).
//
// REGISTRO SÍNCRONO DE HOOKS (A1): `const slug = useTripSlug()` es la PRIMERA sentencia (inject
// solo funciona en el tramo síncrono) y `onMounted`/`onUnmounted` se registran ANTES del
// `await useTrip(slug)`. `monById` se captura en `monByIdRef` (holder reactivo creado
// síncronamente) y se rellena tras el await + `watch(monById, …)` para mantenerlo al día. El
// índice se CONSTRUYE en `onMounted` (solo cliente — MiniSearch jamás corre en prerender) a
// partir de `[...monByIdRef.value.values()]`. El listener de outside-click se registra/limpia
// con la MISMA referencia de función.
export async function useSearchController() {
  const slug = useTripSlug()
  const { isOpen } = useSearch(slug)

  // Holder reactivo de `monById`, capturado SÍNCRONAMENTE para registrar los hooks antes del
  // await. Arranca con un Map vacío; se rellena tras `await useTrip(slug)`. El build del
  // índice (en onMounted) lo lee; el watch lo mantiene sincronizado si monById se recalcula.
  const monByIdRef = shallowRef<Map<string, Monument>>(new Map())

  // Outside-click (port de index.html:6467-6469): si el clic NO cae dentro de `.search-wrap`,
  // cerrar el dropdown. Listener NATIVO en `document` (el original usaba `document.addEventListener`).
  // WR-03: el `e.target` de un click es casi siempre un Element, pero el cast `as HTMLElement` es
  // solo una aserción de compilación — si llegara un target no-Element (null/Text node), `.closest`
  // sería undefined y lanzaría TypeError, encendiendo la puerta de errores de consola del spec de
  // paridad. Guardar con `instanceof Element` evita el null-deref latente sin cambiar el comportamiento.
  function onDocumentClick(e: MouseEvent) {
    const t = e.target
    if (t instanceof Element && !t.closest('.search-wrap')) {
      isOpen.value = false
    }
  }

  // Hooks SÍNCRONOS (antes del await): Vue los asocia a la instancia activa de SearchBox.
  onMounted(() => {
    // Índice CLIENT-ONLY: construir en cliente desde monById (monuments-only, D-02). El holder
    // ya está poblado tras el await (que resuelve en prerender), pero el build se hace aquí para
    // garantizar que MiniSearch nunca se instancia en SSR/prerender.
    indexes.set(slug, createSearchIndex([...monByIdRef.value.values()]))
    document.addEventListener('click', onDocumentClick)
  })

  onUnmounted(() => {
    document.removeEventListener('click', onDocumentClick) // misma referencia de función
  })

  // Tras registrar los hooks, resolver los datos y poblar el holder (deduplicado con el useTrip
  // de TripView). En SSG resuelve en prerender; el ref se rellena antes de que el usuario teclee.
  const { monById } = await useTrip(slug)
  monByIdRef.value = monById.value
  // Mantener el holder sincronizado si `monById` se recalcula (p. ej. al resolver useAsyncData en
  // cliente durante la hidratación) y reconstruir el índice si ya estaba montado.
  watch(monById, (v) => {
    monByIdRef.value = v
    if (indexes.has(slug)) indexes.set(slug, createSearchIndex([...v.values()]))
  })
}
