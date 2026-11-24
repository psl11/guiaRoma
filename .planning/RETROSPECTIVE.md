# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Migración a Nuxt 4

**Shipped:** 2026-06-24
**Phases:** 8 | **Plans:** 39 | **Tasks:** 76

### What Was Built
- Migración completa del `index.html` único (6.665 líneas / 734 KB) a **Nuxt 4 SSG** bajo `/guiaRoma/`, con paridad visual y funcional al 100% — firmada por humano como «paridad-buena».
- **Contenido a datos tipados:** 6 colecciones zod en Nuxt Content v3 (`shared/schemas.ts`), 85 ficheros YAML (38 monumentos + 26 gastro + 13 arte/arquitectura + 5 días + 2 referencia + 1 trip) migrados 1:1, con un harness cheerio de diff y validación que rompe el build.
- **UI componentizada** sobre un único árbol data-driven (`useTrip`+`TripView`) y CSS editorial conservado VERBATIM; tres singletons de interacción (`useCardNavigation`, `useTripModes`, `useSearch`).
- **Features portadas 1:1:** tema sin FOUC, mapa Leaflet en isla client-only, búsqueda MiniSearch sobre datos, ruta del día, notas por ficha, navegación + scrollspy, 3 modos de ritmo, imagen-con-fallback.
- **Puerta de verificación de paridad:** golden de 56 PNGs + suite Playwright (visual-diff + comportamiento) + invariantes de datos, encadenados en `pnpm verify` (80 parity + 87 unit + 295 data).

### What Worked
- **Capturar el golden de paridad ANTES de divergir** (Fase 1, desde `main`) dio una red de seguridad objetiva para las 7 fases siguientes. Fue la decisión más rentable del milestone.
- **CSS verbatim + datos tipados como fuente de verdad** → paridad "por construcción" en lugar de re-implementación con riesgo de drift.
- **Specs de paridad autocontenidos** (cada uno genera+sirve su propio build bajo `/guiaRoma/`): aislaron cada fase de regresiones del webServer compartido y verificaron contra el render real de SSG, no contra el dev server.
- **Sign-off humano por fase (F3–F7) + global (F8)**: convirtió "tests verdes" en una atestación de paridad consciente; el patrón escaló limpio al cierre.
- **El code review por fase atrapó bugs reales** (p.ej. `meta`→`heroMeta` en F3; el listener nav registrado tras `await` en F5) antes de que se asentaran.

### What Was Inefficient
- **La paridad de fuentes consumió 7 rondas en F8 (08-06).** Perseguir el clon byte-exacto del Lora de Google (network) contra el Lora self-hosted (offline) fue un callejón: distinto cut (kerning/GPOS) → deltas de wrap que ninguna tolerancia honesta absorbe. La resolución correcta (re-baselinar el golden desde el build Nuxt, aceptar paridad *efectiva*) podría haberse tomado antes con un análisis de coste/beneficio temprano.
- **`@nuxtjs/mdc` `unwrap` no elimina el `<div>` raíz** (Pitfall de F4): coste de diagnóstico repetido hasta fijar `:tag=false`.
- **Marcado mecánico de requisitos por delante del sign-off humano:** FEAT-02/UI-05/FEAT-04 y PARITY-02 quedaron `[x]` por los commits de cierre de plan (07-01/07-03/08-01) antes de la atestación humana que F8 supuestamente gateaba — la atestación real fue el último paso, no el flip del checkbox.

### Patterns Established
- **Paridad por construcción:** copiar la fuente de verdad (CSS, contenido) verbatim antes que reescribir; medir contra un baseline congelado capturado pre-divergencia.
- **Spec de paridad autocontenido:** `beforeAll` genera + copia a subdir `guiaRoma/` + sirve bajo `/guiaRoma/`; tolera exactamente el mensaje conocido de hidratación color-mode y falla ante cualquier otro error de consola.
- **Un host por efecto:** cada singleton de interacción (`useState`) registra sus listeners en un único componente dueño; los consumidores solo leen.
- **Excepciones de paridad documentadas explícitamente** (D-06 `#mapa`, D-01 re-baseline) en el sign-off, no como fallos silenciados.

### Key Lessons
1. **Decide "paridad efectiva vs byte-exacta" pronto y por coste/beneficio.** Cuando un residuo de paridad es de rasterización/font-cut y el arreglo es desproporcionado, re-baselinar contra el render real que se envía es la respuesta — no seguir persiguiendo el clon. (Confirma la nota de memoria "pragmatic parity over byte fidelity".)
2. **El golden pre-divergencia es la inversión de mayor ROI** en una migración con listón de paridad. Capturarlo primero, congelarlo, y medir todo contra él.
3. **El flip del checkbox de requisito ≠ la atestación.** Si una fase gatea un sign-off humano, el marcado de "completo" debe ser ese sign-off, no el cierre mecánico del plan que lo precede.
4. **Specs autocontenidos > webServer compartido** cuando el dev server o el artefacto por defecto no representan el render de producción.

### Cost Observations
- Model mix: ejecución con executor=opus, verifier/checkers=sonnet (perfil "quality").
- Timeline: ~6 días (2026-06-18 → 2026-06-24), 247 commits, 1 contribuidor.
- Notable: la fase de verificación (F8) concentró el esfuerzo más caro (font parity, 7 rondas de clasificación de diffs) pese a ser "solo verificación" — la cola de paridad pixel fue el grueso del coste del milestone.

---

## Milestone: v1.1 — Multi-viaje + Campania

**Shipped:** 2026-11-24
**Phases:** 7 (9-14 + 12.1 insertada) | **Plans:** 39 | **Tasks:** 96

### What Was Built
- **Plataforma por viaje:** búsqueda, navegación, notas y preferencias aisladas por viaje (claves `roma-*` intactas), y puerta de datos *fail-closed* sobre todo `content/trips/`.
- **Forma desde datos:** `buildTripLayout` (días, secciones y pastillas por presencia de datos) y chrome por viaje en `trip.yml`, con test-trampa anti-fugas de Roma.
- **Portada + rutas:** `/` como índice, `/trips/<slug>/` estático, redirección de los enlaces antiguos y borradores fuera de la build.
- **Formas nuevas:** A/B, «Dormís en…», cinco transportes, naturaleza con SVG propios, ruta por modo, «Con niños», mapa multi-ciudad y títulos de Reservas por viaje.
- **Campania 2027** completa (10 días, 24 fichas, 172 «⚠ por confirmar») y **verificación final** con upgrade real desde la guía viva y firma en móvil. Publicado con v1.0 en GitHub Pages.

### What Worked
- **«Un único sospechoso por fallo»:** el orden código → datos → URL → extensiones → contenido mantuvo los 56 goldens sin re-baseline en todo el hito (solo la excepción aprobada de ROUTE-06).
- **Mover la URL de Roma en dos pasos** (`_harness.ts` con `ROMA_URL` sin cambiar, después un diff de una línea) convirtió la Fase 11 en un cambio trivial de revisar.
- **El mecanismo `draft` antes que el contenido:** el esqueleto de Campania (Fase 12) probó cada forma nueva sin publicarse, y la Fase 13 solo tocó YAML.
- **La inserción decimal (12.1)** cuando el contenido necesitó una forma nueva, en vez de forzar el esquema desde la fase de contenido.
- **El oráculo real:** el test de upgrade ejecuta el `index.html` de `main` en el mismo origen en lugar de un test escrito a mano que podía pasar en vacío.

### What Was Inefficient
- **Tres fases necesitaron un plan de cierre de hueco tras la UAT** (09-06, 10-06, 11-08): la puerta de datos tenía rendijas (*fail-open*, formas de enlace de MDC, Markdown de bloque) que la revisión de código vio y la UAT confirmó. La regla «la puerta nunca omite en silencio» debió fijarse desde el plan 09-02.
- **Verificación `stale` al cierre (9, 10, 12.1):** los informes cubren ficheros compartidos (`tests/data/trips.ts`, `invariants.spec.ts`, `tests/README.md`) que toda fase posterior toca, así que caducan por diseño. Se cerró con override.
- **Muchos hallazgos de revisión diferidos en bloque** (todos los de la Fase 12, IN de 9-11): sin efecto visible, pero acumulan ~30 elementos de deuda.
- **Flake del scrollspy móvil** reaparecido en varias puertas (29,7 s de 30 s) sin poder tocarlo por ser un spec congelado.

### Patterns Established
- **Puerta de datos fail-closed por viaje:** cada violación nombra fichero, regla y detalle; «dientes» en memoria y en disco para cada regla.
- **Centinelas de build:** tests de datos que inspeccionan `.output` y `sql_dump` decodificados para probar que un borrador o un texto de Roma no se filtra.
- **Valores de enum ⇒ estilo obligatorio:** un test enum → CSS/SVG hace fallar `pnpm verify` si un valor nuevo queda sin estilo.
- **Roma byte a byte como contrato:** fixtures HTML de secciones de Roma capturados antes del cambio (Reservas) y comparados con `Buffer.equals`.
- **«⚠ por confirmar» como dato:** los datos de campo no verificables se marcan en el contenido y un spec vigila el mínimo y su ausencia en campos de texto plano.

### Key Lessons
1. **Si un informe de verificación cubre ficheros compartidos por todas las fases, caducará.** Hay que limitar `covered_files` a lo propio de la fase o aceptar que la puerta final (Fase 14) es la verificación de referencia.
2. **Las invariantes de la puerta de datos se diseñan *fail-closed* desde el primer plan,** no se endurecen fase a fase tras la UAT.
3. **El oráculo de paridad tiene que fijarse a algo inmutable** (un commit o tag) antes de fusionar con `main`, o queda atado a un fichero que alguien puede borrar.
4. **Insertar una fase decimal es barato** y mantiene limpia la frontera plataforma/contenido.

### Cost Observations
- Model mix: perfil «quality» (executor opus, verifier y checkers sonnet).
- Timeline: 4 días (2026-11-20 → 2026-11-23), 387 commits (51 `fix(`), 1 contribuidor.
- UAT: 28 tests pass, 3 issues (uno en cada una de 9, 10 y 11), cerrados con planes de hueco.
- Notable: el coste se concentró en las puertas de datos y en las re-verificaciones tras la revisión de código, no en el contenido de Campania.

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 8 | 39 | Baseline: migración con golden pre-divergencia + sign-off humano por fase |
| v1.1 | 7 | 39 | Orden «un sospechoso por fallo», borradores antes del contenido, fase decimal para formas nuevas, oráculo real de upgrade |

### Cumulative Quality

| Milestone | Tests (gate) | Coverage | Zero-Dep Additions |
|-----------|-------------|----------|-------------------|
| v1.0 | 80 parity + 87 unit + 295 data | 33/33 requisitos | 0 paquetes nuevos en F8 |
| v1.1 | 126 parity + 567 unit + 774 data | 32/32 requisitos | 0 dependencias nuevas en todo el hito |

### Top Lessons (Verified Across Milestones)

1. (v1.0) Capturar y congelar un baseline objetivo antes de divergir es la red de seguridad de una migración de paridad.
2. (v1.0) Paridad efectiva de lo que se envía > clon byte-exacto cuando el coste es desproporcionado.
3. (v1.0, v1.1) La red de seguridad congelada (goldens) aguanta un hito entero de cambios estructurales si cada fase tiene un único sospechoso de regresión.
4. (v1.1) Las puertas automáticas se diseñan *fail-closed* desde el principio; endurecerlas tras la UAT cuesta un plan extra por fase.
