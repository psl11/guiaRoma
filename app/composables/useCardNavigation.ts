// `useCardNavigation()` — estado y comportamiento ÚNICOS de la navegación transversal (FEAT-05).
//
// Reúne lo que en el index.html eran funciones globales sueltas + estado mutable a nivel de módulo
// (navStack/navigateToCard/goBack/updateBackBtn 6382-6409, updateActivePill 6488-6501, init 6649-6659):
//   · navStack      — pila LIFO de posiciones de scroll para "volver" (en memoria, sin localStorage;
//                     paridad exacta con index.html:6382 `const navStack = []`, se pierde al recargar).
//   · activeSection — id de la sección activa del scrollspy → pastilla `.active` de NavPills.
//   · navigateToCard — navegar a una ficha: push de scroll, scrollIntoview suave, `.highlight` 2500ms.
//   · goBack        — volver a la posición anterior de la pila (window.scrollTo suave).
// Es la fuente de verdad COMPARTIDA y la API pública estable de D-05: F5 (enlaces de prosa/timeline),
// F6 (búsqueda) y F7 (popups del mapa) enchufan a `navigateToCard`/`goBack`/`activeSection`/`canGoBack`
// SIN refactor. `useState` crea un singleton por clave en SSR/hidratación, así que todos los
// consumidores ven el MISMO estado (D-05), sin singleton mutable a nivel de módulo (que se filtraría
// entre requests de SSR).
//
// SEPARACIÓN ESTADO ↔ EFECTOS (Pitfall 4, calcada de useTripModes): `useCardNavigation()` es el
// ACCESOR PURO — solo lee los `useState` y devuelve `{ navStack, activeSection, canGoBack,
// navigateToCard, goBack }`. Es idempotente y se puede llamar desde CUALQUIER componente
// (NavPills, BackButton y los futuros consumidores F6/F7) sin registrar efectos secundarios. Los
// efectos (el listener de click delegado + el de scroll) viven en `useCardNavigationController()`,
// que se invoca UNA SOLA VEZ — en `TripView` (posee la página y se monta una vez). Si los listeners
// se registraran por instancia consumidora habría N listeners de click/scroll: `navigateToCard` se
// dispararía varias veces y la pila se corrompería. La separación garantiza que se registran
// exactamente una vez.
//
// DEFAULT = HTML PRERENDERIZADO (Pitfall 2/Pattern 2): los valores iniciales `[]` y `''` son
// EXACTAMENTE lo que el prerender SSG emite (los shells F3 de NavPills/BackButton se renderizan SIN
// `.active` ni `.show`), así que el primer paint del SSG no tiene mismatch de hidratación. El cálculo
// real del scrollspy (`updateActivePill()`) corre SOLO en `onMounted` (cliente), espejo del `init()`
// de index.html:6655. Un default no-vacío marcaría una pastilla que el HTML prerenderizado no marca.
//
// D-01 (DELEGACIÓN, no DOM-scan): el listener de click es un `document.addEventListener` NATIVO (NO un
// handler de plantilla Vue, NO el `bindCardLinks` del original, NO un `ProseA.global.vue`). Los enlaces de prosa
// MDC se renderizan como `<NuxtLink>` que adjunta su propio `onClick` al `<a>`; un listener nativo en
// `document` con `closest('a[href^="#"]')` es el mecanismo que captura esos clics de forma fiable
// (Pitfall 1). A1 RESUELTO EMPÍRICAMENTE (Plan 05-03): el listener corre en fase de CAPTURA
// (`addEventListener(..., true)`) + `stopPropagation()`. En burbuja (default de 05-02) el salto nativo
// del ancla ganaba la carrera y la navegación NO se interceptaba; la captura corre antes que cualquier
// handler en burbuja y `stopPropagation` lo corta. Lo decidió tests/parity/navigation.spec.ts.
// D-02: solo se interceptan los enlaces a FICHA (`isFichaTarget` → `monById.has(id)`); los enlaces de
// sección caen al salto de ancla nativo. D-03: `navigateToCard` hace `preventDefault` → navegar a una
// ficha NO cambia el hash de la URL (la pila en memoria es el "volver", no el historial).
//
// `computeActiveSection` e `isFichaTarget` se delegan a la lógica PURA de `app/utils/cardNav.ts`
// (Plan 05-01, auto-importada): la matriz del scrollspy y el discriminador ficha-vs-sección viven en un
// solo sitio, testeados en Vitest plano (tests/unit/cardNavigation.spec.ts) — mismo precedente de
// delegación que `useTripModes.isVisible` → `pace.isVisible`.
//
// `useState`/`computed`/`onMounted`/`onUnmounted` son auto-importados por Nuxt; `computeActiveSection`/
// `isFichaTarget` son auto-importados de `app/utils/cardNav.ts`.
export function useCardNavigation() {
  // DEFAULT = prerenderizado: [] → BackButton sin `.show`; '' → ninguna pastilla `.active`.
  const navStack = useState<number[]>('cardNav:stack', () => [])
  const activeSection = useState<string>('cardNav:activeSection', () => '')

  // Reemplaza el `updateBackBtn()` imperativo (index.html:6385-6388): el binding
  // `:class="{ show: canGoBack }"` de BackButton se actualiza solo al cambiar navStack.length.
  const canGoBack = computed(() => navStack.value.length > 0)

  // Port VERBATIM de index.html:6390-6398. `navStack.value.push(...)` sobre el array-ref de
  // `useState` ES reactivo en Vue 3 (el ref envuelve el array en un proxy reactivo que rastrea
  // la mutación) → `canGoBack` se recalcula. El `if (el)` guard se porta tal cual (Pitfall 2:
  // un id que no resuelve es un no-op silencioso, sin error). El offset de la cabecera fija lo
  // cubre `scroll-padding-top:124px` (base.css:3, Pitfall 5) — NO se añade offset manual.
  function navigateToCard(id: string, event?: Event) {
    if (event) event.preventDefault() // D-03: la URL no cambia (6391)
    navStack.value.push(window.scrollY) // 6393
    const el = document.getElementById(id)
    if (el) { // 6395 — guard verbatim
      el.scrollIntoView({ behavior: 'smooth', block: 'start' }) // 6396
      el.classList.add('highlight') // 6397
      setTimeout(() => el.classList.remove('highlight'), 2500) // 6398 — 2500ms exacto
    }
  }

  // Port VERBATIM de index.html:6403-6409. Pop LIFO; el guard `typeof prev === 'number'` hace
  // que `goBack()` sobre una pila vacía sea un no-op.
  function goBack() {
    const prev = navStack.value.pop() // 6404
    if (typeof prev === 'number') {
      window.scrollTo({ top: prev, behavior: 'smooth' }) // 6406
    }
  }

  return { navStack, activeSection, canGoBack, navigateToCard, goBack }
}

// `useCardNavigationController()` — registra los EFECTOS SECUNDARIOS de la navegación UNA SOLA VEZ.
// Se invoca exclusivamente en `TripView` (el dueño de la página, montado una vez). NO llamar desde
// NavPills/BackButton ni desde los futuros consumidores F6/F7: ellos solo necesitan el accesor puro
// `useCardNavigation()`.
//
// `useTrip` es `async` y devuelve `monById` (computed `Map<slug, Monumento>`, keyed por slug = el
// `#fragmento` de los enlaces). Se consulta el slug 'roma' — el MISMO que `TripView` pasa a `useTrip`
// (Pitfall 2); `useAsyncData` deduplica por clave, así que `monById` es el MISMO computed poblado.
//
// REGISTRO SÍNCRONO DE HOOKS (Plan 05-03 — A1 / fix de bug). `onMounted`/`onUnmounted` se registran
// SÍNCRONAMENTE, ANTES de cualquier `await`. Vue asocia un hook de ciclo de vida a la instancia
// ACTIVA en el momento de llamarlo; tras un `await` en setup async la instancia activa se PIERDE y
// el hook se convierte en un no-op SILENCIOSO. La versión 05-02 hacía `await useTrip('roma')` y LUEGO
// `onMounted(...)` → los listeners de click y scroll NUNCA se adjuntaban (FEAT-05 muerta en el SSG:
// el scrollspy no marcaba pastilla y los enlaces de ficha saltaban nativos). El spec
// tests/parity/navigation.spec.ts lo detectó (RED) y exige este orden. `monById` se obtiene tras el
// await y se guarda en `monByIdRef` (un holder reactivo capturado síncronamente); el handler de
// click lo lee en el momento del clic (post-hidratación, cuando el await ya resolvió).
//
// PITFALL 1 (A1) RESUELTO — FASE DE CAPTURA. El listener de click se registra en fase de CAPTURA
// (`addEventListener('click', onDelegatedClick, true)`) y hace `e.stopPropagation()` tras el
// `preventDefault()`. En fase de BURBUJA el salto de ancla nativo del `<a href="#slug">` ganaba la
// carrera (verificado empíricamente: el hash cambiaba a #slug, sin `.highlight`, sin scroll suave).
// La captura corre ANTES de cualquier handler en burbuja (incluido el `onClick` de NuxtLink en la
// prosa MDC) y `stopPropagation` lo corta; `preventDefault` cancela el salto nativo del ancla. Es
// la diferencia decidida por el spec de 05-03 frente a la burbuja default de 05-02.
//
// Mecanismo de los listeners (RESEARCH §Pattern 3): registro en `onMounted`, limpieza en `onUnmounted`
// con las MISMAS referencias de función Y la MISMA fase (capture=true en ambos, o el navegador no los
// empareja). El original (index.html) nunca limpia (la página vive para siempre); aquí `onUnmounted`
// es higiene defensiva barata (HMR en dev, futura navegación entre `/trips/[slug]`).
//
// `useTrip`/`shallowRef`/`onMounted`/`onUnmounted` son auto-importados por Nuxt; `computeActiveSection`/
// `isFichaTarget` se auto-importan de `app/utils/cardNav.ts`.
export async function useCardNavigationController() {
  const { navigateToCard, activeSection } = useCardNavigation()

  // Holder reactivo de `monById`, capturado SÍNCRONAMENTE para que los hooks se registren antes del
  // await. Arranca con un Map vacío (paridad con el prerender: nada interceptable hasta hidratar);
  // se rellena tras `await useTrip('roma')`. El handler de click lo lee en tiempo de clic.
  const monByIdRef = shallowRef<Map<string, unknown>>(new Map())

  // D-01: listener de click delegado. `closest('a[href^="#"]')` encuentra el ancla; si el destino
  // NO es una ficha (`isFichaTarget` → `monById.has(id)` falso) se retorna pronto → salto de ancla
  // nativo (D-02). Si lo es: `preventDefault` (D-03, la URL no cambia) + `stopPropagation` (Pitfall 1,
  // corta el `onClick` de NuxtLink y el salto nativo) + `navigateToCard`. Listener NATIVO en
  // `document`, fase de CAPTURA (NO un handler de plantilla Vue): gana el clic frente al `onClick` que
  // NuxtLink adjunta a los `<a>` de la prosa MDC. Reemplaza el `bindCardLinks` DOM-scan del original
  // (index.html:6420-6429, CLAUDE.md §"Buscar scrapeando el DOM").
  function onDelegatedClick(e: MouseEvent) {
    const a = (e.target as HTMLElement).closest('a[href^="#"]')
    if (!a) return
    const id = a.getAttribute('href')!.slice(1)
    if (!isFichaTarget(id, monByIdRef.value)) return // sección → salto nativo (D-02)
    e.preventDefault() // D-03: la URL no cambia
    e.stopPropagation() // Pitfall 1: cortar el onClick de NuxtLink / el salto nativo del ancla
    navigateToCard(id, e)
  }

  // Scrollspy (port de index.html:6488-6501): lee TODAS las `<section>` reales a `{ id, offsetTop }`
  // y delega el algoritmo last-wins (offset +130 load-bearing) en `computeActiveSection`. El
  // `classList.toggle('active')` imperativo del original lo reemplaza el `:class` reactivo de NavPills.
  function updateActivePill() {
    const sections = Array.from(document.querySelectorAll('section')).map(s => ({
      id: s.id,
      offsetTop: (s as HTMLElement).offsetTop,
    }))
    activeSection.value = computeActiveSection(window.scrollY, sections)
  }

  // Hooks SÍNCRONOS (antes del await): así Vue los asocia a la instancia activa de TripView.
  onMounted(() => {
    document.addEventListener('click', onDelegatedClick, true) // Pitfall 1: NATIVO, document, CAPTURA
    window.addEventListener('scroll', updateActivePill, { passive: true }) // {passive:true} verbatim (6501)
    updateActivePill() // cálculo inicial, espejo de init() index.html:6655
  })

  onUnmounted(() => {
    document.removeEventListener('click', onDelegatedClick, true) // misma referencia + misma fase (capture)
    window.removeEventListener('scroll', updateActivePill)
  })

  // Tras registrar los hooks, resolver los datos y poblar el holder de monById (deduplicado con el
  // useTrip de TripView). En SSG resuelve en prerender; el ref se rellena antes de que el usuario
  // pueda hacer clic.
  const { monById } = await useTrip('roma')
  monByIdRef.value = monById.value
  // Mantener el holder sincronizado si `monById` se recalcula (p. ej. al resolver useAsyncData en
  // cliente durante la hidratación): el listener siempre ve el índice vigente.
  watch(monById, v => (monByIdRef.value = v))
}
