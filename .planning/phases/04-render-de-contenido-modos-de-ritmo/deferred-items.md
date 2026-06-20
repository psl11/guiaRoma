# Deferred Items — Fase 04

Hallazgos fuera del alcance de su plan de origen, registrados para el verificador / planes
posteriores. NO se arreglan en el plan que los descubre.

---

## D-04-A: `<MDC unwrap="p">` deja un `<div class="">` envoltorio (DetailPhoto / TheHero)

- **Descubierto en:** Plan 04-02 (MonumentCard), al verificar el render real con `pnpm generate`.
- **Qué pasa:** En `@nuxtjs/mdc@0.22.0`, `<MDC … unwrap="p">` NO elimina el envoltorio raíz: la
  prop `unwrap` solo desenvuelve el `<p>` interno, pero `MDCRenderer` mantiene su `tag` por defecto
  (`"div"`). Resultado: `<MDC :value unwrap="p" />` emite `<div class="">…</div>` alrededor del
  contenido inline. Para suprimirlo hay que pasar **`:tag="false"`** además de `unwrap`.
- **Dónde se observa (fuera de 04-02):**
  - `app/components/DetailPhoto.global.vue` (Plan 04-01): el caption se renderiza con
    `<MDC :value="caption" unwrap="p" />` → en el HTML real sale
    `<div class="detail-photo-caption"><div class="">…texto…</div></div>`. El original
    (`index.html:2481`) es `<div class="detail-photo-caption">…texto…</div>` (texto directo).
  - `app/components/TheHero.vue` (Plan 03): usa el mismo patrón `<MDC unwrap="p">` en `trip.title`
    (dentro del `<h1>`) y en cada `infoCards.value` → mismo `<div class="">` envoltorio.
- **Impacto:** Divergencia ESTRUCTURAL menor (un `<div>` de bloque sin estilos dentro de un
  contenedor). El golden de F3 (TheHero) se aprobó con este envoltorio presente, así que el impacto
  VISUAL parece nulo; pero es una divergencia de marcado respecto al `index.html`.
- **Por qué se difiere:** `DetailPhoto.global.vue` y `TheHero.vue` son de planes ANTERIORES
  (04-01 / 03), fuera del `files_modified` de 04-02 (solo `MonumentCard.vue`). MonumentCard SÍ
  aplica el arreglo correcto (`:tag="false"`) en TODOS sus `<MDC>`/`<MDCRenderer>`, así que su
  propio render no tiene el envoltorio (salvo el del caption, que lo produce DetailPhoto).
- **Arreglo sugerido (plan futuro / verificador):** añadir `:tag="false"` a los `<MDC unwrap="p">`
  de `DetailPhoto.global.vue` y `TheHero.vue`. Trivial y sin cambio de comportamiento (solo quita el
  `<div>` envoltorio). Validar contra el golden de F1 tras el cambio.
