import type { InjectionKey } from 'vue'

// Contexto de viaje (PLAT-02, Fase 9 — D-08): `TripView` publica el slug del viaje que se está
// viendo y todo su árbol (NavPills, BackButton, TheHero, Timeline*, MonumentCard, SearchBox…) lo
// lee por `inject`, sin prop drilling. Así los accesores (`useCardNavigation`, `useTripModes`…)
// resuelven solos el viaje correcto y las claves de estado/persistencia salen por viaje.
//
// (a) TRAMPA DEL SELF-INJECT (Vue 3.5): `inject` lee los provides del componente PADRE
// (`instance.parent.provides`), nunca los del propio componente. `TripView`, que hace el `provide`,
// NO ve su propio valor: si dentro de TripView se llamara a un accesor sin argumento, `inject`
// devolvería null. Por eso los accesores aceptan el slug POR ARGUMENTO y TripView se lo pasa
// explícitamente a su controller (`useCardNavigationController(props.slug)`).
//
// (b) REGLA DEL PRIMER AWAIT: dentro de un composable `async` (los controllers), la instancia activa
// se pierde tras el primer `await` interno (no hay `withAsyncContext` fuera de `<script setup>`), y
// `inject`/`onMounted` dejan de funcionar sin avisar — el mismo bug A1 documentado en
// useCardNavigation. `useTripSlug()` se llama SIEMPRE en el tramo síncrono, antes del primer `await`.
//
// `useTripSlug()` lanza (no devuelve un valor por defecto) fuera de un descendiente de TripView: un
// slug silenciosamente equivocado mezclaría notas y preferencias entre viajes; un error ruidoso hace
// fallar el prerender (`failOnError`) y se detecta enseguida.
//
// `provide`/`inject` son auto-importados por Nuxt.
export const TripSlugKey: InjectionKey<string> = Symbol('tripSlug')

/** Publica el slug del viaje para los descendientes. Llamar en TripView antes de cualquier `await`. */
export function provideTripSlug(slug: string): void {
  provide(TripSlugKey, slug)
}

/** Lee el slug del viaje publicado por el `<TripView>` ancestro; lanza si no hay ninguno. */
export function useTripSlug(): string {
  const slug = inject(TripSlugKey, null)
  if (slug === null) {
    throw new Error('useTripSlug() fuera de un descendiente de <TripView> (dentro de TripView, pasa el slug por argumento)')
  }
  return slug
}
