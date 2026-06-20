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

---

## D-04-D: `queryCollection('artist'/'reference')` devuelve filas con TODOS los campos null (uniones discriminadas no se materializan en SQL) — BLOQUEANTE para #arte/#arquitectura/#reservas/#practica

- **Descubierto en:** Plan 04-04 (secciones de referencia), al verificar el render real con
  `pnpm generate` + un probe que enchufaba `GastroSection`/`ReservasSection`/`PracticaSection`/
  `ArtistCard` a `useTrip('roma')`. GastroSection (colección `food`, `z.object`) renderizó perfecto;
  las otras tres salieron VACÍAS.
- **Qué pasa (diagnóstico exacto, vía probe de diagnóstico con `pnpm generate`):**
  - `queryCollection('artist').all()` devuelve **13 filas** (el conteo correcto) pero cada fila solo
    tiene las columnas base de Content (`id`, `extension`, `meta`, `stem`, `__hash__`) — los campos
    del esquema (`slug`, `trip`, `kind`, `name`, `sections`, `seenIn`, `terms`…) **NO existen como
    columnas SQL**: salen `undefined`/`null` (p. ej. `slug === null` en las 13).
  - `queryCollection('reference').all()` → **2 filas**, mismo problema (todos los campos null).
  - Como `trip` NO es columna real, el filtro de `useTrip` `.where('trip','=','roma').all()` matchea
    **0 filas** → `artists`/`reference` (y por tanto `refById`) llegan VACÍOS a los componentes.
  - El prerender además emite errores de runtime: `[request error] [POST]
    /__nuxt_content/artist/query` y `/__nuxt_content/reference/query`.
  - Las colecciones `z.object` (`trip`/`day`/`monument`/`food`) NO tienen el problema: sus campos SÍ
    se materializan y se consultan bien (GastroSection es la prueba viva).
- **Causa raíz:** `ArtistSchema` y `ReferenceSchema` son `z.discriminatedUnion` (schemas.ts:175/248).
  Content v3 no sabe expandir una unión discriminada a columnas SQL (el MISMO motivo por el que sus
  item-types generados son `{}` vacíos — ya documentado en `useTrip.ts:29-36` y en STATE como **D1**).
  El dump SQLite existe (los `.txt` están), pero los datos viven en un blob no-columnar y `.where()`
  por campo no los alcanza. Es exactamente el carry-forward D1: _"D1 (unión SQL artist/reference en
  useTrip) diferido a F4 antes de rellenar #arte/#arquitectura/#reservas/#practica"_.
- **Impacto:** Los COMPONENTES de 04-04 son correctos (verificado byte-a-byte con datos ESTÁTICOS en
  un segundo probe: ArtistCard art/glosario, ReservasSection tabla+badges+is-done, PracticaSection
  prosa+detail-list+media salen idénticos al index.html). Pero con el flujo de datos REAL
  (`useTrip`→`queryCollection`) las cuatro secciones de referencia NO renderizarán contenido hasta
  resolver D1. **Es bloqueante para la verificación E2E del DOM del Plan 05** (`render-reference.spec`)
  y para la paridad real de #arte/#arquitectura/#reservas/#practica.
- **Por qué se difiere (NO se arregla en 04-04):** (1) es un cambio ARQUITECTÓNICO de la CAPA DE
  DATOS (cómo se almacenan/consultan las colecciones-unión), no de los componentes de este plan
  (`files_modified` = los 7 ficheros de UI). (2) Tocaría `shared/schemas.ts` (la fuente de verdad de
  F2, consumida por `content.config.ts` Y por los 295 tests de `tests/data`) o `useTrip.ts` — fuera
  del SCOPE BOUNDARY de 04-04. (3) El propio plan asume que `useTrip` entrega los datos (solo aborda
  el problema de TIPOS, ya resuelto por el cast de F3) y DIFIERE la verificación de render al Plan 05.
- **Arreglo sugerido (plan de la capa de datos / Plan 05 / verificador) — opciones a evaluar:**
  1. **Aplanar el almacenamiento, conservar el tipo de unión en el borde.** Definir las colecciones
     `artist`/`reference` con un `z.object` SUPERSET (todos los campos de las ramas como opcionales)
     en `content.config.ts` SOLO para que Content materialice columnas, y seguir validando/estrechando
     con el `discriminatedUnion` de `shared/schemas.ts` en `tests/data` y en `useTrip` (cast por
     `kind`/`slug`). Mantiene la validación estricta de F2 y desbloquea el query por `trip`/`slug`.
  2. **Una colección por rama** (`artist` art/arq separadas, o cargar reservas/practica por `slug`
     con dos `z.object` independientes en vez de la unión). Más ficheros de config, pero columnas
     limpias.
  3. **Bypass de query para estas dos colecciones**: cargarlas con un loader que lea el dump completo
     y filtre en memoria (menos idiomático, evita reescribir el esquema).
     Cualquier opción debe re-pasar `pnpm test:data` (295) y validarse con un render real
     (`pnpm generate`) antes de que el Plan 05 cablee las secciones en `TripView`.
- **Verificación de que los componentes ya están listos:** render estático (probe eliminado) confirmó
  paridad de marcado de los 3 componentes nuevos; en cuanto D1 entregue los datos, `TripView` (Plan
  05) podrá montar `<ArtistCard>`/`<ReservasSection>`/`<PracticaSection>`/`<GastroSection>` sin
  tocarlos.
