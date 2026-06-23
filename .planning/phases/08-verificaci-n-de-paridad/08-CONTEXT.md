# Phase 8: Verificación de paridad - Context

**Gathered:** 2026-06-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Demostrar **objetivamente** la paridad 100% con el `index.html` vivo y dejar una **puerta** que debe pasar antes de dar la 1.0 por buena. F8 **prueba** la paridad; **no** la mejora ni añade features. Combina tres patas:

1. **Visual-diff a pixel del sitio Nuxt GENERADO** contra el golden inmutable de F1 (las 14 vistas × claro/oscuro × móvil/desktop = 56 PNGs) — **SC#1**.
2. **E2E de comportamiento** de cada feature (matriz de ritmo, tema sin flash, búsqueda ≥2/máx8/"Sin resultados", URL de ruta del día, notas persistentes, pila "volver" desde mapa/búsqueda/timeline, scrollspy `+130`) — **SC#2**.
3. **Invariantes de datos** (conteos de fichas, ids únicos, cross-refs que resuelven, `motif` por monumento) — **SC#3**.

Todo en **verde como un único comando-puerta** + un **sign-off humano final** de paridad (**SC#4**). Cubre **PARITY-02**. Depende de **F7**.

**Hallazgo que reencuadra la fase (CRÍTICO para research/planner):** el `tests/parity/golden.spec.ts` actual **re-captura el `index.html` VIEJO** (`page.goto('/index.html')` vía el webServer de `playwright.config.ts` que sirve `serve .` en :4173). Es la herramienta de **captura/baseline de F1**, **NO** una comparación Nuxt↔golden. **La comparación que da nombre a la fase — el sitio Nuxt generado contra el golden — todavía NO existe** y es la pieza principal de obra nueva de F8. Los "4 fallos de golden" diferidos a F8 en STATE.md son *flakiness re-renderizando el HTML viejo bajo carga paralela* (recibido `1264×714` vs esperado `1280×1576`), **no** brechas de paridad de Nuxt.

**Incluye:**
- Un **spec de visual-diff NUEVO** que hace build+serve del sitio Nuxt bajo `/guiaRoma/` (patrón autocontenido F4-F7) y compara las 14 vistas contra los **56 PNGs congelados** de F1.
- Un **comando-puerta único** que encadena `test:unit` + `test:data` + la suite Playwright de paridad y sale verde.
- **Auditoría** de los specs de comportamiento por-fase (F3-F7) contra la lista de SC#2 y **relleno de los huecos** que falten (candidato: pila "volver" de punta a punta por cada punto de entrada).
- **Sign-off humano** final de paridad.

**No incluye** (fuera de F8 — ver Deferred):
- **Merge `release/nuxt-4` → `main`** y **montar deploy/CI** (GitHub Pages). F8 para en "verde + sign-off"; shippear la 1.0 es un acto separado.
- **Rebaselinar el golden** contra Nuxt (rompería la referencia). `nuxt generate` ya verde (no es objetivo nuevo).
- **Pixel del mapa** (no hay baseline de `#mapa` en el golden; tiles OSM no deterministas) — el mapa queda **solo-comportamiento**.

</domain>

<decisions>
## Implementation Decisions

### Heredado y BLOQUEADO por fases previas / paridad (no reabrir)
- **Paridad = ley** (Core Value): F8 es la **puerta que lo demuestra**, no una fase de mejora. Lo que el usuario ve y puede hacer no cambia.
- **Golden de F1 = baseline INMUTABLE.** Los 56 PNGs (`tests/parity/golden.spec.ts-snapshots/`) son la referencia objetiva. Capturados con: **A5** (TODAS las peticiones de imagen abortadas por `resourceType==='image'` → fuerza el fallback SVG por `motif`, estado offline-determinista), **A8** (`snapshotPathTemplate` SIN sufijo de plataforma; capturado en linux), `maxDiffPixelRatio: 0.01`, **captura por elemento** (no fullPage, A6), `animations:'disabled'` + `caret:'hide'`. **NUNCA rebaselinar contra Nuxt.**
- **Patrón de spec autocontenido** (F3-F7): cada spec hace su **propio** `nuxt generate` + serve bajo `/guiaRoma/` (puerto propio), tolera **SOLO** el mensaje conocido de hidratación de `@nuxtjs/color-mode` (SSG) y falla ante cualquier otro error de consola. **NO** usa el `webServer` de `playwright.config.ts` (que sirve el `index.html` VIEJO). F7 añadió `tolerateAborts` para los `net::ERR_FAILED` deliberados de `route.abort`.
- **Comportamiento ya verificado por-fase = activos reutilizables**: `theme.spec`/`shell.spec` (F3), `render-cards/timeline/reference.spec` + `modes.spec` (F4), `navigation.spec` 6/6 (F5), `search-route.spec` 10/10 (F6), `map-fallback-notes.spec` 12/12 SC#1-SC#7 (F7). **Invariantes de datos** ya existen: `tests/data/{invariants,schema,migration-diff}.spec.ts` (F2). **Lógica pura**: `tests/unit/*` (10 specs).
- **D1 (unión discriminada SQL `artist`/`reference` todo-null) RESUELTO en F7** (supersets planos `ArtistRowSchema`/`ReferenceRowSchema`): `#arte`/`#arquitectura`/`#reservas`/`#practica` **renderizan con datos reales** — prerequisito de las vistas `ref-*` del visual-diff. La entrada "abierta" de STATE.md está **stale**.

### Área 1 — Visual-diff Nuxt↔golden (SC#1)
- **D-01 (topología = spec NUEVO, golden congelado):** un spec autocontenido **nuevo** (build+serve Nuxt bajo `/guiaRoma/`) compara las 14 vistas contra los **56 PNGs existentes como baseline de SOLO LECTURA**. `golden.spec.ts` se queda **tal cual** como herramienta de captura/procedencia de F1 (sirve el `index.html` viejo) y **a demanda** para regenerar baseline. **`test:golden:update` PROHIBIDO en F8.** Invariante duro: *baselines congelados + comparar el sitio generado, nunca rebaselinar.* La **mecánica** (fichero nuevo vs repuntar; cómo hacer que el nuevo spec lea el directorio de snapshots de F1 pese a la plantilla `{testFileName}-snapshots`) = **discreción del planner**.
- **D-02 (política ante un diff = INVESTIGAR Y CLASIFICAR, no a priori):** correr el visual-diff **una vez** y **clasificar cada diff**: (a) **real** (estructura/color/espaciado/tipografía cuadrada) → **corregir el componente Nuxt** hasta cuadrar dentro del `0.01`; (b) **artefacto demostrablemente no determinista** → decidir umbral/máscara **con evidencia y justificación escrita**. El bar sigue siendo **paridad = ley**: nada se tolera sin justificar. **Riesgo material a investigar PRIMERO:** el golden se capturó del `index.html` con **Google Fonts** (el `settle()` espera `document.fonts.ready` para matar el FOUT); el sitio Nuxt **self-hostea** las mismas familias vía `@nuxt/fonts` — si los ficheros no son byte-equivalentes, el render de glifos puede diferir a nivel sub-pixel **en todo el texto** (ruido AA global). Hay que caracterizar esto antes de fijar umbral/máscara (¿se puede alinear la fuente? ¿es un mask de texto justificado? ¿pasa dentro de 0.01?).
- **Reusar verbatim el harness de determinismo del golden** (en el spec nuevo): A5 (`route('**/*', img→abort else continue)`), `settle()` (forzar `loading='eager'`, `networkidle`, esperar cada `<img>` `complete`, `document.fonts.ready`, doble `requestAnimationFrame`), `animations:'disabled'`, dark vía `addInitScript(localStorage roma-theme=dark)`. **Vistas = las 14 del golden** (`inicio`, `dia-{viernes,sabado,domingo,lunes,martes}`, `ref-{reservas,gastronomia,practica,arte,arquitectura}`, `card-{monumento=#galleria-sciarra, guided=#vaticano, concert=#auditorium}`). **`#mapa` NO es vista del golden** (ver D-06).

### Área 2 — Puerta verde de la suite (SC#4)
- **D-03 (comando-puerta ÚNICO):** F8 define **un comando** (p. ej. `pnpm verify`) que encadena `test:unit` (lógica pura) + `test:data` (invariantes F2) + la **suite Playwright de paridad**. **Verde de ese comando = condición de la 1.0.** Una sola fuente de verdad de "paridad demostrada" (cubre SC#1+SC#2+SC#3).
- **D-04 (sacar del gate los 2 fallos no-Nuxt, documentados):** (1) `golden.spec.ts` **NO entra** en el comando-puerta — re-renderiza el `index.html` viejo, redundante una vez existe el spec Nuxt↔golden; queda ejecutable **a demanda** para regenerar baseline. (2) `shell.spec.ts:224` (dev-routing `/trips/[slug]` que lanza `nuxt dev`, **frágil al entorno** por el lock de `nuxi dev` rancio) **fuera del gate**: ARCH-02 ya está probado por el **build estático** + la parte **estática** de `shell.spec`. **Ambas exclusiones documentadas con razón.** Principio: el comando-puerta es **determinista y verde de verdad** (sin fallos tolerados sin justificar).

### Área 3 — Alcance comportamiento/datos (SC#2/SC#3)
- **D-05 (AUDITAR + RELLENAR HUECOS):** F8 **no reescribe**. Mapea cada ítem enumerado de **SC#2** a su spec por-fase, **aserta que todos pasan** dentro del gate, y **añade SOLO las aserciones que falten**. Candidato concreto de hueco a verificar/rellenar: la **pila "volver" (`goBack` restaura el scroll) de punta a punta desde CADA punto de entrada** — mapa (popup→ficha→volver), búsqueda (resultado→ficha→volver), timeline/enlace interno (→ficha→volver) — no solo el scroll-a-ficha (que `navigation.spec` SC#1 ya cubre para enlaces internos). Los invariantes de datos de F2 (`invariants.spec`/`schema.spec`) cubren **SC#3** (ids únicos, cross-refs, conteos 38 monumentos / 26 food / etc., `motif` por monumento).
- **D-06 (mapa = SOLO comportamiento, sin pixel):** `#mapa` **no tiene baseline en el golden** (tiles OSM = red/no deterministas; F1 no lo capturó), así que su paridad **no puede ser por pixel** contra el golden congelado. El mapa queda verificado por el **spec de comportamiento F7** (39 marcadores + 2★, popups→`navigateToCard`, banner offline con heurística exacta `tilesErrored>3 && tilesLoaded===0`, `fitBounds`; 12/12) **dentro del gate** + el chrome estático presente en el HTML prerenderizado. Es la **única excepción deliberada a la paridad-pixel**, a documentar explícitamente en el sign-off. **F8 NO captura un baseline nuevo de `#mapa`.**

### Área 4 — Cierre y frontera de alcance (SC#4)
- **D-07 (sign-off humano final):** el cierre de F8 = **suite verde + UN sign-off humano final de paridad global** (un humano revisa los resultados del visual-diff + la suite verde y aprueba). La parte automática **demuestra**; el humano da el OK que declara la 1.0 "paridad-buena". Consistente con el patrón de sign-off de F3-F7 (recordatorio: el sign-off de F7 quedó pendiente — Task 2 — y debe estar cerrado antes/durante F8).
- **D-08 (alcance PARA en verde + sign-off):** F8 entrega la **puerta de verificación** y **para**. El **merge `release/nuxt-4` → `main`** y el **deploy/CI** (GitHub Pages) quedan **FUERA de F8** (honra **D-06 de F1**: CI/deploy deliberadamente no montado; `main` intacto). Son el acto separado de **shippear la 1.0** (cierre de milestone / paso de ship dedicado). El roadmap de 8 fases **acaba en verificación**.

### Claude's Discretion (research/planner deciden; no requieren al usuario)
- **Topología exacta del spec visual-diff** y la mecánica para que lea el directorio de snapshots **congelado** de F1 (p. ej. `snapshotPathTemplate` por-proyecto, copiar/symlink el dir, o un `toHaveScreenshot` con path explícito) — sin rebaselinar.
- **Forma/nombre del comando-puerta** (`pnpm verify` u otro) y **orquestación** (script que encadena los 3, o un `testIgnore`/grep que excluye `golden.spec`+`shell.spec:224` de `playwright test`).
- **build-once vs builds por-spec**: si consolidar la suite parity a **un único build servido una vez** (global-setup compartido) vs aceptar los `nuxt generate` por-spec actuales (aislamiento, pero 8-10 builds por corrida) — decisión de **rendimiento del gate**.
- **Mecánica de la clasificación de diffs** (D-02): cómo correr "una vez", dónde se revisan los `*-diff.png`/`*-actual.png`, y dónde se anota la clasificación real-vs-artefacto.
- **Qué aserciones concretas faltan** tras la auditoría SC#2 y **cómo** se añaden (extender un spec existente vs un spec pequeño nuevo de "back-stack por punto de entrada").
- Cómo se documentan las exclusiones del gate (deferred-items / comentario en el spec / README de tests).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Harness de paridad existente (el núcleo de F8)
- `tests/parity/golden.spec.ts` — **herramienta de captura de F1** (sirve el `index.html` viejo, `goto('/index.html')`). Define las **14 vistas** (`VIEWS`, líneas 17-32: nombre→selector) y el **`settle()`** (44-69) y el **A5 image-block** (91-93) que el spec NUEVO debe **reusar verbatim**. **NO modificar para apuntar a Nuxt** (D-01); queda como captura/baseline a demanda.
- `tests/parity/golden.spec.ts-snapshots/` — **los 56 PNGs congelados** (14 vistas × {light,dark} × {mobile,desktop}). Baseline de **solo lectura** del visual-diff. No regenerar.
- `playwright.config.ts` — `maxDiffPixelRatio: 0.01`, `animations:'disabled'`, `caret:'hide'`, `snapshotPathTemplate` sin sufijo de plataforma (A8, línea 35), proyectos `mobile` (iPhone 12, chromium) y `desktop` (1280×800, chromium), y el `webServer` (`serve .` :4173) que sirve el `index.html` viejo. El spec nuevo **no** debe usar ese webServer (patrón autocontenido).
- `tests/parity/{modes,navigation,search-route,map-fallback-notes,render-cards,render-timeline,render-reference,theme,shell}.spec.ts` — specs de comportamiento por-fase a **auditar** (SC#2). `map-fallback-notes.spec.ts` (F7) es el **único verificador del mapa** (D-06). Cualquiera de ellos es el **patrón de spec autocontenido** a replicar para el visual-diff.
- `tests/data/{invariants,schema,migration-diff}.spec.ts` — invariantes de datos (SC#3): ids únicos, cross-refs (`timeline.ref`/`cards[]`/`seenIn`/`archLink`), conteos (38/26/13/5/2/1), fidelidad 1:1.
- `tests/unit/*.spec.ts` — 10 specs de lógica pura (pace, cardNav, dayRoute, searchIndex, mapMarkers, mapOffline, svgMotifs, foodGroups, tripIndexes, dayLabel).
- `package.json` — scripts `test:golden` (=`playwright test`), `test:golden:update` (PROHIBIDO en F8), `test:unit`, `test:data`, `generate`. F8 añade el comando-puerta (D-03).

### Fuente de verdad de la paridad
- `index.html` (raíz) — la versión viva; el golden lo representa byte-idéntico a `origin/main` ANTES de divergir.
- `.planning/ROADMAP.md` §Phase 8 — goal + los **4 success criteria** (visual-diff de las 14 vistas; E2E enumerado; invariantes de datos; suite verde como condición de la 1.0).
- `.planning/REQUIREMENTS.md` — **PARITY-02** (esta fase) y **PARITY-01** (el golden de F1, ya completo).
- `.planning/PROJECT.md` — **Core Value** (paridad 100%) + constraint "`main` intacto, rama de release, no romper nada" (frontera de D-08).
- `CLAUDE.md` — §6 "Verificación de PARIDAD" (Playwright, screenshots a pixel) y §"Deployment" (salida estática GitHub Pages = el ship que queda FUERA de F8).

### Decisiones/landmines arrastradas relevantes a F8
- `.planning/phases/05-navegaci-n-transversal/deferred-items.md` — el flake de `golden.spec` (re-captura del index.html viejo, `dia-viernes-light-desktop` bajo carga paralela) y el `shell.spec:224` dev-routing bloqueado por lock de `nuxi dev` (los 2 fallos que D-04 saca del gate).
- `.planning/phases/06-derivados-de-datos-b-squeda-y-ruta-del-d-a/deferred-items.md` — tabla de los 5 fallos pre-existentes de suite completa (4× golden pixel → F8; 1× shell dev-routing).
- `.planning/phases/07-isla-client-only-mapa-fallback-de-imagen-y-notas/07-CONTEXT.md` — diseño del mapa (D-06: solo-comportamiento) + nota de que D1 está resuelto y `#arte/#arquitectura/#reservas/#practica` ya renderizan (prerequisito del visual-diff de las vistas `ref-*`).
- `.planning/STATE.md` — "Accumulated Context" con las decisiones A5/A6/A8 del golden y los sign-offs de F3-F7.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`tests/parity/golden.spec.ts` `VIEWS` + `settle()` + A5 image-block** — copiar verbatim al spec de visual-diff nuevo; garantiza comparación apples-to-apples contra el golden.
- **Los 56 PNGs de F1** — baseline de solo lectura; el visual-diff los reusa sin tocarlos.
- **9 specs de comportamiento por-fase + `tests/data/*` + `tests/unit/*`** — ya verdes; F8 los **audita y agrupa** en el gate, no los reescribe.
- **El patrón autocontenido** (beforeAll genera+copia a subdir `guiaRoma/`+sirve bajo `/guiaRoma/` en un puerto base; gate de consola que tolera solo el mensaje color-mode; `tolerateAborts` para los aborts deliberados) — el visual-diff nuevo lo replica (precedente: `map-fallback-notes.spec.ts`, puerto base 5760).

### Established Patterns
- **"Lógica pura → `utils` + Vitest; comportamiento → Playwright autocontenido"** (F2-F7) — F8 cierra el patrón con el visual-diff y el comando-puerta.
- **Specs autocontenidos con su propio build+serve bajo `/guiaRoma/`** — NO el `webServer` del golden.
- **Gate de consola estricto** (tolera SOLO el mensaje de hidratación de color-mode; `tolerateAborts` para `route.abort`).
- **Determinismo de captura**: A5 (imágenes bloqueadas→SVG), `settle()` (eager+networkidle+fonts.ready+doble rAF), `animations:'disabled'`, dark vía `addInitScript`.

### Integration Points
- **`tests/parity/<nuevo-visual-diff>.spec.ts`** (NUEVO) — build+serve Nuxt + comparar las 14 vistas contra los 56 PNGs congelados.
- **`package.json`** (MODIFICAR) — añadir el comando-puerta (D-03) y la exclusión de `golden.spec`/`shell.spec:224` del gate (D-04).
- **`playwright.config.ts`** (POSIBLE MODIFICAR) — si la topología del visual-diff necesita `snapshotPathTemplate`/proyecto/`testIgnore` para leer el dir de snapshots congelado y/o excluir specs del gate.
- **Specs de comportamiento existentes** (POSIBLE MODIFICAR mínimamente) — solo para **rellenar** las aserciones de SC#2 que falten (D-05), sin reescribir.
- **El sitio Nuxt (componentes)** — solo se toca si el visual-diff revela un diff **real** (D-02), para cuadrar la paridad; no como obra nueva.

### ⚠️ Notas para el research/planner
- **El visual-diff es la primera vez que se compara Nuxt↔golden** — espera diffs en la primera corrida; trátalos con D-02 (investigar/clasificar), no como fallo de setup.
- **Fuentes self-host vs Google Fonts** = el riesgo nº1 de ruido AA global; caracterízalo antes de decidir umbral/máscara.
- **`snapshotPathTemplate` es `{testFileName}-snapshots`** → un spec nuevo buscaría su PROPIO dir de snapshots; reusar los 56 PNGs de `golden.spec.ts-snapshots/` exige una solución explícita (parte de D-01, discreción del planner).
- **Sign-off de F7 pendiente** (Task 2) — debe cerrarse; F8 no puede declarar paridad global con una fase previa sin firmar.

</code_context>

<specifics>
## Specific Ideas

- **Las 14 vistas exactas** (= golden): `inicio`, `dia-viernes/sabado/domingo/lunes/martes`, `ref-reservas/gastronomia/practica/arte/arquitectura`, `card-monumento` (#galleria-sciarra), `card-guided` (#vaticano), `card-concert` (#auditorium). × {light,dark} × {mobile 390px / desktop 1280×800}.
- **Comando-puerta** (forma ilustrativa, nombre = planner): `pnpm verify` = `test:unit` + `test:data` + parity (excluyendo `golden.spec` y `shell.spec:224`).
- **Política de diff:** correr una vez → clasificar → real=corregir componente, artefacto=umbral/máscara justificada. Investigar las **fuentes self-host** primero.
- **Mapa:** sin pixel; cubierto por `map-fallback-notes.spec` (12/12) dentro del gate; excepción documentada en el sign-off.
- **Cierre:** verde + sign-off humano; **sin** merge ni deploy.

</specifics>

<deferred>
## Deferred Ideas

- **Merge `release/nuxt-4` → `main` + montar deploy/CI** (GitHub Pages, `.github/workflows/deploy.yml` del esqueleto de CLAUDE.md) — el acto de **shippear la 1.0**, FUERA de F8 (honra D-06 de F1; `main` intacto). Pertenece al **cierre de milestone / un paso de ship dedicado** tras verde + sign-off.
- **Consolidar la suite parity a UN build servido una vez** (vs los `nuxt generate` por-spec actuales) — optimización de rendimiento del gate; el planner decide si entra en F8 o queda como mejora.
- **Baseline visual suplementario del chrome de `#mapa`** (caja vacía + banner, tiles enmascarados) — descartado en F8 (sería un baseline nuevo fuera del golden congelado); posible mejora futura.
- **Endurecer `shell.spec:224` con `NUXT_IGNORE_LOCK=1`** en vez de excluirlo — alternativa considerada; D-04 lo saca del gate por ahora, el hardening queda como mejora opcional para el dueño del test.

</deferred>

---

*Phase: 8-Verificación de paridad*
*Context gathered: 2026-06-23*
