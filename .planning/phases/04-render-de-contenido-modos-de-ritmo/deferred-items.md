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

---

## D-04-B: variante `metro` / `metro-b` perdida en los datos F2 del timeline + ausente del enum

- **Descubierto en:** Plan 04-03 (Timeline), al transcribir `TimelineTransport.vue` contra index.html.
- **Qué pasa:** El `index.html` tiene CINCO variantes de `.tl-transport` con color de borde propio:
  `taxi`/`walk`/`train` (en el enum del esquema) **y** `metro` (index.html:4069 lunes, :4767 martes)
  y `metro-b` (index.html:3478 domingo). El borde lo da `base.css:513-516` (`.tl-transport.metro`
  naranja `#d4801a`, `.tl-transport.metro-b` azul `#2c5aa0`). PERO: (a) el enum del esquema solo
  admite `['taxi','walk','train']` (`shared/schemas.ts:100`); (b) las filas de transporte que el
  original renderiza como `metro`/`metro-b` quedaron en los datos F2 **SIN campo `variant`**
  (verificado: `content/trips/roma/days/domingo.yml` la fila "Hotel → Aventino" — que el original es
  `tl-transport metro-b` — no tiene `variant:`; idem las filas metro de lunes/martes). La migración
  per-card de F2 no capturó esa clase (la migration-diff es por multiset de palabras + href, y la
  clase de variante no es ni palabra ni href).
- **Impacto:** Esas filas (3 en total: 1 metro-b domingo + 2 metro lunes/martes) se renderizarán
  como `.tl-transport` SIN clase de variante → SIN su color de borde (naranja/azul). Divergencia
  VISUAL menor pero real respecto al golden. El resto (taxi/walk/train) es correcto.
- **Por qué se difiere:** El esquema zod y los datos de los 5 días son alcance de la **Fase 2**, no
  de este plan (SCOPE BOUNDARY). `TimelineTransport.vue` ya está PREPARADO: bindea `row.variant`
  DIRECTO como clase (no un check hardcodeado), así que en cuanto los datos/enum recuperen
  `metro`/`metro-b` la fila reproducirá el borde sin tocar el componente.
- **Arreglo sugerido (plan futuro / verificador):** (1) ampliar el enum a
  `['taxi','walk','train','metro','metro-b']` en `shared/schemas.ts`; (2) añadir `variant: metro` /
  `variant: metro-b` a las 3 filas en `domingo.yml`/`lunes.yml`/`martes.yml`; (3) re-validar
  `pnpm test:data`. Lo cierra la verificación E2E del Plan 05 (`render-timeline.spec.ts`).

---

## D-04-C: prosa Markdown `**…**` emite `<strong>`, no `<b>` — afecta a `.tl-meta-item.ok/.warn b`

- **Descubierto en:** Plan 04-03 (Timeline), al transcribir `TimelineMeta`/`TimelineTransport`.
- **Qué pasa:** En el `index.html` las negritas del timeline son `<b>` (p. ej. `⏱ <b>60 min</b>`),
  y hay reglas CSS que apuntan a `b` ESPECÍFICAMENTE con color SEMÁNTICO:
  `.tl-meta-item.ok b { color:#5a7a3a }` y `.tl-meta-item.warn b { color:#c47a2a }`
  (`base.css:499-500`). Pero los datos F2 codifican esas negritas como Markdown `**60 min**`, que
  `<MDC>` renderiza como `<strong>`. El selector `b` NO matchea `<strong>`. Hay un `strong` genérico
  (`base.css:153`, weight 600 + `--ink`) que SÍ aplica, así que la negrita se ve en peso correcto,
  pero en los meta `ok`/`warn` el COLOR semántico (oliva/ámbar) NO se aplica (queda `--ink`).
  Adicional: en `.tl-transport-mode-meta` el original tiene un `<br>` (`⏱ <b>…</b><br>💶 …`) que los
  datos F2 perdieron (es `⏱ **…** 💶 **…**` con espacio, sin `<br>`).
- **Impacto:** (a) negritas de `.tl-meta-item.ok`/`.warn` sin su color semántico (oliva/ámbar) → un
  matiz de color, no de estructura; (b) el salto de línea del meta de transporte se pierde → el
  `⏱ …` y el `💶 …` van en la misma línea en vez de en dos. Divergencias VISUALES menores.
- **Alcance — IMPORTANTE:** Esto NACE de la codificación Markdown de los datos de la **Fase 2** (`**`
  siempre → `<strong>`; el `<br>` no es palabra y se descartó en la migración) y es TRANSVERSAL a
  TODO `<MDC>` de la app (MonumentCard ya envía sus `facts`/`culture` así desde 04-02). NO lo causa
  este plan; el plan PRESCRIBE explícitamente renderizar estos campos con `<MDC>` (matriz unwrap de
  UI-SPEC). Fuera del SCOPE BOUNDARY de 04-03 (no se tocan datos de F2 ni el CSS verbatim).
- **Arreglo sugerido (plan futuro / verificador):** o bien (i) un override de Prose `strong`→`<b>`
  (global o local) para que las negritas emitan `<b>` y casen los selectores `b` existentes; o bien
  (ii) ampliar los selectores CSS a `b, strong` donde aplique; y reponer el `<br>` del meta de
  transporte en los datos F2 (o codificarlo en el Markdown). Lo asevera la verificación E2E del
  Plan 05 contra el golden.
