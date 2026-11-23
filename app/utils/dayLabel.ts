/**
 * Deriva la etiqueta del NavPill por día a partir del `eyebrow` del día (D-04).
 *
 * El `eyebrow` tiene la forma `'<día italiano> · <fecha>'` (p. ej. `'venerdì · 19 giugno'`).
 * La etiqueta es la parte previa al separador `·`, con la primera letra en mayúscula:
 * `'venerdì · 19 giugno'` → `'Venerdì'`.
 *
 * La capitalización es LOCALE-SAFE (italiano) y afecta SOLO al primer carácter, para
 * preservar el acento grave: `.charAt(0).toLocaleUpperCase('it') + .slice(1)`. Un
 * `.toUpperCase()` sobre toda la cadena daría `VENERDÌ` y descartar el acento daría
 * `Venerdi` — ambos romperían la paridad SC#2. Por eso la etiqueta se DERIVA aquí y
 * nunca se almacena en los YAML de día.
 *
 * Vive en `app/utils/` para que Nuxt la auto-importe como `dayLabel` en los componentes
 * (NavPills, Plan 03). Es una función pura: sin I/O, sin estado, sin efectos.
 */
export function dayLabel(eyebrow: string): string {
  // `split('·')[0]` siempre existe en runtime (String.split devuelve la cadena
  // entera si no hay separador), pero con `noUncheckedIndexedAccess` su tipo es
  // `string | undefined`; el `?? ''` satisface al typechecker sin alterar el
  // comportamiento (la entrada real es un `eyebrow` no vacío de YAML validado).
  const first = (eyebrow.split('·')[0] ?? '').trim()
  return first.charAt(0).toLocaleUpperCase('it') + first.slice(1)
}
