import { isVisible as isVisibleForPace, type ItemPace } from '~/utils/pace'

// `useTripModes()` — estado reactivo ÚNICO de los tres modos del viaje (FEAT-06/07/08).
//
// Reúne lo que en el index.html eran funciones globales sueltas + clases imperativas sobre
// `document.body` (`setPace`/`setLightMode`/`setResumen` + sus `restore*`, líneas 6505-6577):
//   · pace    — ritmo del viaje ('optimistic' | 'neutral' | 'slow'), filtra el timeline.
//   · light   — modo "caminar menos" (movilidad reducida) → body.light-mode.
//   · resumen — modo resumen (vista índice) → body.modo-resumen.
// Es la fuente de verdad COMPARTIDA entre `TheHero` (los controles del masthead, Plan 05) y
// los `TimelineStop`/`TimelineTransport` (que consultan `isVisible`, Plan 03): `useState`
// crea un singleton por clave en SSR/hidratación, así que ambos lados ven el MISMO estado
// (D-03). Reemplaza el anti-patrón de DOM imperativo por un composable reactivo: nada de
// manipular clases del DOM a mano ni de escanear el árbol, nada de funciones globales — las
// clases de body salen de `useHead({ bodyAttrs })` (CLAUDE.md §What NOT to Use).
//
// SEPARACIÓN ESTADO ↔ EFECTOS (CR-01): `useTripModes()` es el ACCESOR PURO — solo lee los
// `useState` y devuelve `{ pace, light, resumen, isVisible }`. Es idempotente y se puede llamar
// desde CUALQUIER componente (TheHero y los ~65 TimelineStop/TimelineTransport) sin registrar
// efectos secundarios. Los efectos (watch light→slow, useHead({ bodyAttrs }), restore+persist
// en onMounted) viven en `useTripModesController()`, que se invoca UNA SOLA VEZ — en `TheHero`
// (posee los controles y se monta una vez). Antes ambos vivían juntos y se re-registraban por
// instancia: ~65 watches del acoplamiento light→slow, ~65 entradas de bodyAttrs compitiendo y
// ~65 onMounted leyendo/escribiendo localStorage. La separación garantiza que los efectos corren
// exactamente una vez por instancia de la app, mientras el estado sigue siendo un singleton
// `useState` (sin singleton mutable a nivel de módulo, que se filtraría entre requests de SSR).
//
// DEFAULT = HTML PRERENDERIZADO (Pitfall 3): los valores iniciales 'optimistic'/false/false
// son EXACTAMENTE lo que el prerender emite, así que el primer paint del SSG no tiene mismatch
// de hidratación. La preferencia guardada se restaura SOLO en `onMounted` (1 frame después del
// paint): es un micro-flash INTENCIONAL (SC#4), lo OPUESTO al tema (que sí usa script anti-FOUC
// vía color-mode). Por eso la lectura de localStorage NO vive en el setup síncrono — hacerlo
// rompería el prerender y reintroduciría el mismatch.
//
// Acoplamiento light→slow (Pitfall 5): activar "caminar menos" fuerza el ritmo más tranquilo
// (`watch(light, on => { if (on) pace.value = 'slow' })`, SIN rama else — mapea index.html:6552
// `if (on) setPace('slow')`). DESACTIVARLO NO revierte el ritmo: el usuario puede subirlo a mano
// después. La ausencia del `else` es load-bearing.
//
// `isVisible(itemPace)` delega en la función PURA `isVisible` de `app/utils/pace.ts` (importada
// aquí como `isVisibleForPace` para no auto-sombrearse con el método que el composable expone):
// la matriz de ritmo vive en un solo sitio, testeada en Vitest plano (tests/unit/pace.spec.ts).
//
// POR VIAJE (Fase 9, D-08): los tres estados viven en claves `useState` sufijadas con el slug
// (`tripStateKey(slug, 'pace')` → `pace:<slug>`), así que el ritmo y los modos de un viaje no se
// mezclan con los de otro. El slug llega por argumento o, si falta, por `useTripSlug()` (inject
// desde TripView; TheHero y los Timeline* son descendientes). Los defaults son los MISMOS para
// todos los viajes (D-06: sin defaults por viaje ni campo nuevo en el esquema).
//
// `useState`/`computed` son auto-importados por Nuxt; `tripStateKey`/`tripStorageKey` de
// `app/utils/tripStorage.ts`; `useTripSlug` de `app/composables/useTripContext.ts`.
export function useTripModes(slug: string = useTripSlug()) {
  const pace = useState<'optimistic' | 'neutral' | 'slow'>(tripStateKey(slug, 'pace'), () => 'optimistic') // DEFAULT = prerenderizado
  const light = useState(tripStateKey(slug, 'light'), () => false)
  const resumen = useState(tripStateKey(slug, 'resumen'), () => false)

  // El método expuesto delega en la función pura (la matriz no se reimplementa aquí).
  const isVisible = (itemPace: ItemPace) => isVisibleForPace(itemPace, pace.value)

  return { pace, light, resumen, isVisible }
}

// `useTripModesController()` — registra los EFECTOS SECUNDARIOS de los modos UNA SOLA VEZ.
// Se invoca exclusivamente en `TheHero` (el dueño de los controles, montado una vez). NO llamar
// desde los componentes del timeline: ellos solo necesitan el accesor `useTripModes()`.
//
// Clases de `<body>` vía `useHead({ bodyAttrs })` (declarativo, SSR-safe), NUNCA tocando el DOM
// a mano. `useHead`/`onMounted`/`watch` son auto-importados por Nuxt.
//
// Claves de localStorage POR VIAJE (Fase 9, D-04): `tripStorageKey(slug, 'pace'|'light'|'resumen')`
// → `<slug>-pace` ('optimistic'|'neutral'|'slow'), `<slug>-light` ('1'|'0'), `<slug>-resumen`
// ('1'|'0'). En Roma coinciden BYTE A BYTE con las de la guía viva (`roma-pace`, `roma-light`,
// `roma-resumen`): una preferencia guardada hoy sigue siendo válida, sin migración. Solo se lee y
// escribe por clave exacta (nunca se enumera, borra ni renombra nada de localStorage). El ritmo
// guardado se VALIDA contra los tres literales antes de asignar (T-04-01/T-09-01: un valor
// manipulado solo podría activar clases CSS conocidas, sin sink de inyección; un valor fuera del
// enum se ignora). El tema claro/oscuro NO es por viaje: sigue global con su propia clave en
// `nuxt.config.ts` (`colorMode.storageKey`, D-07).
//
// El slug se lee con `useTripSlug()` como PRIMERA sentencia (tramo síncrono): TheHero, su host,
// es descendiente de TripView, así que el inject resuelve.
export function useTripModesController() {
  const slug = useTripSlug()
  const { pace, light, resumen } = useTripModes(slug)

  // Activar light fuerza el ritmo tranquilo (index.html:6552). SIN else: desactivar NO
  // revierte pace (Pitfall 5) — el usuario decide si volver a subirlo.
  watch(light, (on) => {
    if (on) pace.value = 'slow'
  })

  // Clases de <body> declarativas: 'light-mode' si light, 'modo-resumen' si resumen.
  useHead({
    bodyAttrs: {
      class: computed(() =>
        [light.value ? 'light-mode' : '', resumen.value ? 'modo-resumen' : '']
          .filter(Boolean)
          .join(' '),
      ),
    },
  })

  onMounted(() => {
    // Restauración SOLO en cliente (micro-flash intencional, SC#4). El orden importa:
    // pace ANTES que light, porque al poner light=true el watch fuerza pace='slow'
    // (index.html:6650-6652 restorePace() → restoreLightMode()).
    const kPace = tripStorageKey(slug, 'pace')
    const kLight = tripStorageKey(slug, 'light')
    const kResumen = tripStorageKey(slug, 'resumen')
    const savedPace = localStorage.getItem(kPace)
    if (savedPace === 'optimistic' || savedPace === 'neutral' || savedPace === 'slow') {
      pace.value = savedPace
    }
    if (localStorage.getItem(kLight) === '1') light.value = true
    if (localStorage.getItem(kResumen) === '1') resumen.value = true

    // Persistencia DENTRO de onMounted: registrar los watch en cliente evita escribir en
    // prerender. Claves por viaje, mismos valores que la versión viva.
    watch(pace, v => localStorage.setItem(kPace, v))
    watch(light, v => localStorage.setItem(kLight, v ? '1' : '0'))
    watch(resumen, v => localStorage.setItem(kResumen, v ? '1' : '0'))
  })
}
