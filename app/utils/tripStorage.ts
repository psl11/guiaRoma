/**
 * Claves por viaje (PLAT-03, Fase 9) — funciones PURAS.
 *
 * Dos familias de claves, ambas derivadas del slug del viaje que se está viendo:
 *   - `tripStorageKey(slug, name)` → `${slug}-${name}`: claves de `localStorage` (D-04). Para el
 *     slug `roma` reproduce BYTE A BYTE las claves que ya escribe la guía viva (`roma-pace`,
 *     `roma-light`, `roma-resumen`, `roma-note-<ficha>`), así que no hay migración ni pérdida de
 *     notas/preferencias. Es una decisión de un solo sentido: cambiar la plantilla después exigiría
 *     migrar lo que ya está guardado en los navegadores.
 *   - `tripStateKey(slug, name)` → `${name}:${slug}`: claves de `useState` (D-08). El estado en
 *     memoria (pila de «Volver», pastilla activa, ritmo, modos, búsqueda) queda aislado por viaje.
 *
 * Sin validación ni normalización: la forma del slug (`^[a-z0-9]+$`) la garantiza el esquema del
 * viaje, no esta utilidad.
 *
 * Se extrae a `app/utils/` (igual que `pace.ts`) para que Nuxt la auto-importe en composables y
 * componentes Y para poder testearla en Vitest plano, sin runtime Nuxt (su test,
 * `tests/unit/tripStorage.spec.ts`, fija el contrato D-04). Sin I/O, sin estado, sin dependencias.
 */

/** Clave de `localStorage` de un viaje (D-04): `roma` + `pace` → `roma-pace`. */
export function tripStorageKey(slug: string, name: string): string {
  return `${slug}-${name}`
}

/** Clave de `useState` de un viaje (D-08): `roma` + `cardNav:stack` → `cardNav:stack:roma`. */
export function tripStateKey(slug: string, name: string): string {
  return `${name}:${slug}`
}
