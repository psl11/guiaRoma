# Roadmap: guiaRoma

## Milestones

- ✅ **v1.0 Migración a Nuxt 4** — Fases 1-8 (shipped 2026-06-24)
- 🚧 **v1.1 Multi-viaje + Campania** — Fases 9-14 (in progress)

## Phases

<details>
<summary>✅ v1.0 Migración a Nuxt 4 (Fases 1-8) — SHIPPED 2026-06-24</summary>

Re-plataforma el `index.html` único (6.665 líneas) a Nuxt 4 SSG con paridad visual y funcional al 100%: contenido a datos tipados (Nuxt Content v3 + zod), UI componentizada, arquitectura multi-viaje, offline self-hosted, y una suite Playwright de verificación de paridad como puerta de la 1.0. Detalle completo archivado en `milestones/v1.0-ROADMAP.md`.

- [x] Phase 1: Andamiaje + Golden de paridad (3 plans) — completed 2026-06-18
- [x] Phase 2: Esquema de datos + migración del contenido (7 plans) — completed 2026-06-19
- [x] Phase 3: Capa de página, layout y tema (5 plans) — completed 2026-06-19
- [x] Phase 4: Render de contenido + modos de ritmo (5 plans) — completed 2026-06-20
- [x] Phase 5: Navegación transversal (3 plans) — completed 2026-06-21
- [x] Phase 6: Derivados de datos — búsqueda y ruta del día (5 plans) — completed 2026-06-21
- [x] Phase 7: Isla client-only — mapa, fallback de imagen y notas (4 plans) — completed 2026-06-23
- [x] Phase 8: Verificación de paridad (7 plans) — completed 2026-06-24

**Resultado:** `pnpm verify` VERDE (80 parity + 87 unit + 295 data); 33/33 requisitos; paridad firmada por humano (1.0 «paridad-buena»). Merge a `main` + deploy quedan como acto de ship separado (D-08); `main` intacto.

</details>

### 🚧 v1.1 Multi-viaje + Campania (In Progress)

**Milestone Goal:** Que la guía soporte varios viajes de verdad, *data-driven*, publicando Campania 2027 como segundo viaje sin que Roma cambie lo más mínimo.

**Principio de orden:** primero se desacopla el código con Roma todavía en `/` y la puerta de paridad intacta (9, 10); después se mueve la URL sin tocar componentes (11); después se amplía el esquema con un esqueleto (12) y solo entonces se redacta contenido (13). Cada fallo de paridad tiene un único sospechoso: código → datos → URL → extensiones → contenido. Los 56 goldens de Roma **no se re-baselinan** en todo el hito salvo excepción aprobada explícitamente por el usuario.

- [ ] **Phase 9: Plataforma por viaje** - Búsqueda, navegación, persistencia y validación de datos acotadas al viaje, con Roma intacta en `/`
- [ ] **Phase 10: Forma y chrome desde datos** - Días, secciones, pastillas, cabecera, pie, leyenda y título salen de los datos de cada viaje (Roma verbatim)
- [ ] **Phase 11: Portada y rutas multi-viaje** - Portada índice en `/`, Roma en `/trips/roma/`, redirección de enlaces antiguos y prerender de todos los viajes, con goldens sin cambios
- [ ] **Phase 12: Formas nuevas de viaje** - Opciones A/B, «Dormís en…», transportes nuevos, naturaleza, mapa multi-ciudad, ruta del día por modo y nota familiar, probados con un esqueleto de Campania
- [ ] **Phase 13: Contenido Campania 2027** - Los 10 días, fichas, gastronomía, reservas y práctica de Campania redactados en tono slow y publicados
- [ ] **Phase 14: Verificación del milestone** - Puerta completa desde build limpia, test de upgrade desde la guía viva y sign-off humano de Roma y Campania en móvil real

## Phase Details

### Phase 9: Plataforma por viaje
**Goal**: Cualquier guía funciona aislada de las demás — su búsqueda, sus enlaces entre fichas, sus preferencias guardadas y la validación de su contenido pertenecen a su viaje — sin que Roma cambie ni de URL ni de aspecto
**Depends on**: Phase 8 (v1.0 completada)
**Requirements**: PLAT-01, PLAT-02, PLAT-03, PLAT-04
**Success Criteria** (what must be TRUE):
  1. Con dos viajes cargados (Roma y un viaje de prueba), buscar en la guía de Roma solo devuelve fichas de Roma y buscar en la del viaje de prueba solo devuelve las suyas (p. ej. «Pantheon» aparece en Roma y no en el otro)
  2. En cualquier guía, no solo en Roma, pulsar un enlace a ficha hace scroll y la resalta, «Volver» restaura la posición anterior y la pastilla activa sigue al scroll
  3. Quien ya usa Roma abre la guía y encuentra sus notas, su ritmo, «caminar menos» y el modo resumen tal como los dejó (claves `roma-*` intactas, sin migración destructiva); las notas y preferencias de otro viaje no se mezclan con las de Roma
  4. Un YAML inválido en cualquier viaje (slug de viaje no válido, carpeta distinta del slug, id duplicado, id que choca con un ancla de sección, enlace `#ficha` que apunta fuera del viaje, nombre reservado de Content) hace fallar `pnpm verify` señalando el fichero culpable
  5. La puerta de paridad de Roma sigue verde en `/` sin ningún cambio en `tests/parity/` ni re-baseline de goldens
**Plans**: 5/5 plans executed
Plans:
**Wave 1**
- [x] 09-01-PLAN.md — Tracer: contexto de viaje (provide/inject) + navegación y preferencias/notas por viaje, probado en Roma (`/`) con la paridad intacta (PLAT-02, PLAT-03)
- [x] 09-02-PLAN.md — Puerta de datos por viaje: `tests/data/trips.ts` (loader + `checkTrip`, mensajes con el fichero culpable), `describe.each` en esquema e invariantes, fixtures «dientes», `TRIP_SLUG_RE` (PLAT-04)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 09-03-PLAN.md — Viaje ficticio `prueba` (dev-only) validado por la puerta + búsqueda por viaje (índice MiniSearch por slug) (PLAT-01, PLAT-04)

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 09-04-PLAN.md — E2E de aislamiento en `/trips/prueba` (`pnpm test:trips`, fuera de la puerta) + guardián de acoplamiento en `test:unit` (PLAT-01..03)

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 09-05-PLAN.md — Cierre: centinela de build, `verify` desde cachés limpias, README y puerta completa de la fase (PLAT-01..04, SC4/SC5)
**Research**: no (refactor mecánico; inventario `file:line` de acoplamientos ya hecho en `research/ARCHITECTURE.md`)
**Notas**: barrido `grep` de `useTrip('roma')`, claves `useState`/`localStorage` globales e índice MiniSearch de módulo convertido en tareas; `tests/data` parametrizado por viaje (conteos y `migration-diff` solo para Roma). La persistencia por viaje usa `${slug}-${key}`, por lo que las claves actuales de Roma ya cumplen el esquema (la prueba real de upgrade desde `main` va a la Fase 14).

### Phase 10: Forma y chrome desde datos
**Goal**: La forma de cada guía (cuántos días, qué secciones y pastillas, qué textos de marca) la deciden los datos de su viaje, y Roma —con sus textos movidos verbatim a su `trip.yml`— se ve idéntica
**Depends on**: Phase 9
**Requirements**: SHAPE-01, SHAPE-02, SHAPE-03, SHAPE-04, SHAPE-05
**Success Criteria** (what must be TRUE):
  1. Un viaje de 10 días que repite día de la semana (dos sábados) muestra 10 secciones de día con su nombre y fecha y 10 pastillas distintas, cada una llevando a su día; Roma sigue mostrando sus 5 días con las anclas `#viernes`…`#martes`
  2. Un viaje sin datos para una sección opcional (p. ej. Arte o Arquitectura) no muestra esa sección ni su pastilla; Roma sigue mostrando sus 12 pastillas en el mismo orden
  3. La marca de la cabecera, el pie y la leyenda del mapa de cada guía salen de su `trip.yml`, y la pestaña del navegador muestra el título propio del viaje; en Roma son exactamente los textos actuales (pestaña «Roma · 19—23 giugno 2026»)
  4. En la guía de un viaje de prueba no aparece ningún texto propio de Roma («Roma», «Einaudi», «giugno 2026»…): un test-trampa falla si alguno se cuela
  5. Tras mover los textos de Roma a datos, la puerta de paridad sigue verde en `/` con los 56 goldens sin re-baseline
**Plans**: 5/5 plans executed
Plans:
**Wave 1**
- [x] 10-01-PLAN.md — Tracer: `buildTripLayout` puro → pastillas y `<main>` de TripView desde el layout (una sección por día, solo secciones con datos), Roma idéntica (SHAPE-01, SHAPE-02)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 10-02-PLAN.md — Chrome desde `trip.yml`: esquema aditivo (test D-10 primero), `pageTitle`/`brand`/`mapLegend`/`footer` de Roma verbatim, respaldo neutro, test verbatim contra index.html y guardián D-17 (SHAPE-03, SHAPE-04, SHAPE-05)

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 10-03-PLAN.md — Puerta de datos de forma: `DAY_SLUG_RE` + `pill`, reglas `day-pill`/`day-order`, anclas según presencia, `cross-trip-link` en lista blanca (cierra WR-01/WR-02) (SHAPE-01, SHAPE-02)

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 10-04-PLAN.md — Viaje dev-only `forma` (10 días, dos sábados, sin Arte/Arquitectura) + E2E de forma + centinela de build (SHAPE-01, SHAPE-02, SHAPE-05)

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 10-05-PLAN.md — Test-trampa (ningún texto de Roma fuera de Roma) + chrome y pestaña por viaje en dev + README + puerta completa de la fase (SHAPE-03, SHAPE-04, SHAPE-05)
**UI hint**: yes
**Research**: no (textos a YAML verbatim + función pura `buildTripLayout` con test)
**Notas**: esquema estrictamente aditivo (todo campo nuevo `.optional()`); primero se prueba que el YAML de Roma sin cambios sigue validando y después se añaden sus valores verbatim. Vigilar regresiones de píxel en pie (`<br>`, MDC), marca (`brand-dot`) y etiqueta «Pratica». Slugs de día con fecha para viajes nuevos (`sabado-19`); Roma conserva `viernes…martes`.

### Phase 11: Portada y rutas multi-viaje
**Goal**: El usuario entra por una portada que lista los viajes publicados y llega a cada guía en su propia URL estática; los enlaces antiguos de Roma siguen funcionando y Roma, en su nueva URL, pasa la puerta de paridad sin re-baseline
**Depends on**: Phase 10
**Requirements**: ROUTE-01, ROUTE-02, ROUTE-03, ROUTE-04, ROUTE-05, ROUTE-06, PAR-01, PAR-02
**Success Criteria** (what must be TRUE):
  1. Al abrir `/guiaRoma/` se ve una portada con una tarjeta por viaje publicado (título, fechas, destinos, resumen) que lleva a su guía; un viaje marcado `draft` no aparece en la portada ni se genera su página
  2. La guía de Roma se abre en `/guiaRoma/trips/roma/` y cada viaje publicado en `/guiaRoma/trips/<slug>/`, como páginas estáticas generadas que cargan sin descargar `sql_dump` ni WASM
  3. Un enlace antiguo (`/guiaRoma/#viernes`, `/guiaRoma/#pantheon`, `/guiaRoma/index.html#gastronomia`) lleva a la misma ancla dentro de `/trips/roma/` y pulsar «Atrás» no entra en bucle; `/guiaRoma/` sin hash se queda en la portada
  4. Desde cualquier guía el usuario puede volver a la portada con el enlace discreto que decida el usuario para ROUTE-06 (recomendado: «← Todos los viajes» en el pie, con re-captura documentada solo de esa captura de Roma); si el usuario decide no añadirlo, ROUTE-06 se mueve a Future y no se toca ningún golden
  5. En `/trips/roma/` los 56 goldens pasan sin `--update-snapshots` (salvo la excepción aprobada de ROUTE-06) y toda la suite de comportamiento de Roma sigue verde; un test asevera que `/` sirve la portada y la URL de Roma sirve Roma (evita specs «verdes» contra la portada)
**Plans**: 7/7 plans executed
Plans:
**Wave 1**
- [x] 11-01-PLAN.md — Harness de paridad (D-18 paso 1): `tests/parity/_harness.ts` con `ROMA_URL` sin cambiar su valor y los 11 specs de Roma usándolo, puerta verde (PAR-01, PAR-02)
- [x] 11-02-PLAN.md — Borradores fuera de la build: `draft` en el esquema, `scripts/tripManifest.mjs` (+ `.d.mts`), exclusión en Content, prueba/forma `draft: true`, escaneo de `sql_dump` decodificados, `prerenderRoutes` (ROUTE-05, ROUTE-02)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 11-03-PLAN.md — Roma en `/guiaRoma/trips/roma/` (commit del movimiento: rutas del manifiesto + flip de `ROMA_URL` + inversiones de shell/build-isolation/romaChrome) + «← Todos los viajes» en el pie + clave de página por slug (ROUTE-02, ROUTE-04, ROUTE-06, PAR-01, PAR-02)
- [x] 11-04-PLAN.md — Datos de la tarjeta: `startDate`/`endDate`/`destinations`/`summary` en el esquema y en Roma, `app/utils/tripDates.ts`, reglas `trip-dates`/`trip-summary-link` (ROUTE-01)

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 11-05-PLAN.md — Portada en `/` (`TripIndex`), `multitrip.css` bajo `.trip-index` con guardián, test portada-vs-Roma en shell.spec, `tests/trips` en la nueva URL y portada en dev sin borradores (ROUTE-01, ROUTE-05, PAR-01, PAR-02)

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 11-06-PLAN.md — Redirección de enlaces antiguos `/guiaRoma/#ancla` (script en el head de la portada) + servidor de test tipo GitHub Pages + `legacy-redirect.spec.ts` (ROUTE-03)

**Wave 5** *(blocked on Wave 4 completion)*
- [x] 11-07-PLAN.md — `portada.spec.ts` (portada, sin `sql_dump`/WASM, vuelta a la portada, borradores en 404, sin remontajes, backstops), re-registro del conteo (110/13) y puerta completa de la fase (ROUTE-01, ROUTE-04, ROUTE-05, ROUTE-06, PAR-01, PAR-02)

**Cross-cutting constraints:** <!-- gsd:generated -->
- D-22: generate/Playwright/eslint/typecheck con Node 22 en el PATH, `rm -rf .data .nuxt .output` antes de generar; test:trips nunca a la vez que verify

**UI hint**: yes
**Research**: sí — comportamiento real de GitHub Pages con barra final y 301 (y un servidor de test que lo imite; plan B `autoSubfolderIndex: false` o `trailing-slash`), scroll al hash tras la redirección, `pageKey` de `trips/[slug].vue`
**Decisiones previas (⚠)**: ROUTE-06 (enlace a la portada en Roma) y cualquier excepción al «cero re-baseline» deben resolverse **antes de planificar esta fase**
**Notas**: primero un commit propio con `tests/parity/_harness.ts` y `ROMA_URL` sin cambiar su valor; después el movimiento de URL, cuyo único diff en los specs de Roma es esa constante. Navegación portada → guía con `<a href>` de documento completo (no SPA), construido con `app.baseURL` y barra final. La URL concreta `/trips/campania/` se materializa en la Fase 13, cuando Campania deja de ser `draft`; aquí el mecanismo se prueba con Roma y un viaje de prueba.

### Phase 12: Formas nuevas de viaje
**Goal**: La guía sabe mostrar todo lo que un viaje como Campania necesita y Roma no tenía — días con alternativas, bases de alojamiento, ferris y coche, lugares de naturaleza, varias ciudades en el mapa — validado con un esqueleto mínimo de Campania antes de redactar su contenido
**Depends on**: Phase 11
**Requirements**: EXT-01, EXT-02, EXT-03, EXT-04, EXT-05, EXT-06, EXT-07
**Success Criteria** (what must be TRUE):
  1. Un día con alternativas muestra «Elige una» con las opciones A y B apiladas y separadas por «— o bien —», con las filas comunes antes y después; ambas siguen visibles con cualquier ritmo y en modo resumen
  2. Cada día del esqueleto de Campania indica «Dormís en…» con su base, y el timeline muestra los tramos en ferry, coche, autobús, bici y avión cada uno con su estilo propio
  3. Una playa, poza termal, río o sendero tiene ficha, marcador propio en el mapa y un dibujo de reserva cuando su imagen no carga; una ficha puede mostrar una nota para familias con niños
  4. El mapa de un viaje de varias ciudades encuadra todos sus marcadores (Nápoles, Procida, Ischia y Salerno a la vista a la vez), mientras Roma conserva exactamente su vista actual
  5. «Ver ruta del día» abre Google Maps en el modo adecuado al día (a pie, coche o transporte público) y no aparece en los días de ferry; en Roma sigue siendo a pie con las mismas paradas, y la puerta de paridad de Roma sigue verde
**Plans**: 2/7 plans executed
Plans:
**Wave 1**
- [x] 12-01-PLAN.md — «Elige una» de punta a punta: `ChoiceRow` estricto en el timeline (D-18 Roma primero), `TimelineChoice.vue` + `tripshapes.css` (última en `css[]`), borrador `campania` (trip.yml + jueves 24 A/B) y dientes del esquema (EXT-01)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 12-02-PLAN.md — Regla `ref` dentro de opciones + primer `ref` en una opción (D-05), alternativas visibles con cualquier ritmo/«Caminar menos»/resumen, dos `choice` contiguos y 3 opciones; los cinco días del esqueleto; guardián de `tripshapes.css`, clases nuevas fuera del HTML de Roma y centinela de Campania (EXT-01)

**Wave 3** *(blocked on Wave 2 completion)*
- [ ] 12-03-PLAN.md — «Dormís en…»: `trip.stays` + `day.stay`, `stayFor`, línea en la cabecera del día (jueves 24; los demás días reciben su base en 12-04/12-05) y reglas `stay-ref`/`stay-dup` (EXT-02)

**Wave 4** *(blocked on Wave 3 completion)*
- [ ] 12-04-PLAN.md — Naturaleza: `nature` + 4 motivos SVG (sea/thermal/river/trail), `MARKER_STYLE`/`markerPopupHtml` con Roma byte a byte, Sorgeto/Epomeo/Valle del Calore (EXT-04)

**Wave 5** *(blocked on Wave 4 completion)*
- [ ] 12-05-PLAN.md — Transportes ferry/coche/autobús/bici/avión: `TransportVariant`/`StatVariant`, bandas y glifos, `enumStyles.spec.ts` con `train` exento (EXT-03)

**Wave 6** *(blocked on Wave 5 completion)*
- [ ] 12-06-PLAN.md — Ruta del día por modo: `day.route`, `timelineRows.ts`, `routeCards`/`routeVisible`/`routeTitle`, oculta en días de ferry y sin mezclar opciones; Roma byte a byte (EXT-06)

**Wave 7** *(blocked on Wave 6 completion)*
- [ ] 12-07-PLAN.md — «Con niños» (`family`), mapa multi-ciudad (Nápoles, Procida, Ischia y Salerno a la vez), `tripshapes.css` = UI-SPEC y cierre: conteos re-registrados y puerta completa (EXT-07, EXT-05)

**Cross-cutting constraints:** <!-- gsd:generated -->
- D-19: Node 22, cachés limpias antes de generate/test:trips, nunca a la vez; release/nuxt-4

**UI hint**: yes
**Research**: sí — modelado de la fila `choice` en `timeline` y su interacción con modos de ritmo, modo resumen, ruta del día y numeración de marcadores; coste real de motifs SVG nuevos frente a mapeo provisional
**Decisiones previas (⚠)**: EXT-01 (opciones A/B apiladas y siempre visibles vs selector) y EXT-04 (motifs SVG nuevos de naturaleza vs reutilizar provisionalmente los existentes) deben resolverse **antes de planificar esta fase**
**Notas**: el esqueleto de Campania (`trip.yml` + 2-3 días, uno con A/B, varias bases, una ficha `nature`) nace como `draft: true` (ROUTE-05), así que los tests necesitan poder generar borradores. Todo valor nuevo de enum lleva su CSS/SVG y un test «cada valor tiene estilo o SVG»; CSS nuevo solo en `multitrip.css` (`base.css` intacto). `DayOptions` con raíz `<div>`, nunca `<section>` (el scrollspy toma todas las `<section>`).

### Phase 13: Contenido Campania 2027
**Goal**: La familia puede usar la guía de Campania 2027 sobre el terreno: diez días con su logística, una ficha por lugar, dónde comer, qué reservar y cómo moverse, con los datos dudosos señalados
**Depends on**: Phase 12
**Requirements**: CAMP-01, CAMP-02, CAMP-03, CAMP-04, CAMP-05, CAMP-06
**Success Criteria** (what must be TRUE):
  1. La guía de Campania muestra los 10 días (sábado 19 – lunes 28 de junio de 2027) con su timeline, horarios y logística (vuelos, Alibus, ferris, coche de alquiler, conciertos de Ultimo y Pinguini Tattici Nucleari), incluidas las dos jornadas con alternativas (jueves 24 y sábado 26), en el tono slow y auténtico del planning
  2. Cada lugar relevante (Nápoles, Procida, Ischia, Salerno, Cilento, Vesubio, Casertavecchia, Campos Flégreos) tiene ficha con imagen, nombre italiano, prosa y enlace a Google Maps, y su marcador en el mapa
  3. Las secciones de Gastronomía (pizzerías de barrio, mozzarella di bufala, tabernas, trattorias de monte), Reservas (alojamiento por base, ferris, coche, conciertos, vuelos) y Práctica (ferris, conducción/ZTL y coche en islas, calor, calzado, consejos con niños) están completas para Campania
  4. Los datos de campo críticos (horarios de ferry, fechas de conciertos, acceso nocturno a Sorgeto con niños, coche en Procida/Ischia) aparecen verificados o marcados visiblemente como «por confirmar»
  5. Campania aparece en la portada y se abre en `/guiaRoma/trips/campania/` según la decisión de publicación de ROUTE-05; todo su contenido valida en `pnpm verify` y la puerta de Roma sigue verde
**Plans**: TBD
**Research**: sí — verificación de datos de campo: restricción de vehículos en Procida/Ischia en 2027, horarios y muelles de ferry (Caremar/Porta di Massa), seguridad de Sorgeto de noche con niños, fechas de los conciertos, la «carrera popular» Spaccanapoli del domingo 20
**Decisiones previas (⚠)**: **fecha de devolución del coche (25 vs 26)** — decide si el sábado 26 (día VIII) es en coche o en transporte público y cómo se cuenta en Reservas; **pendiente del usuario**, necesaria antes de redactar ese día. ROUTE-05: publicar Campania solo cuando esté completa (`draft` hasta entonces) o con días provisionales — necesaria antes de cerrar esta fase
**Notas**: fuente `.planning/inputs/campania-2027-itinerario-raw.md` (año 2027; el «2026» del texto es errata). Solo YAML e imágenes: si aparece una forma de contenido que el esquema no cubre, se vuelve a la Fase 12 (inserción decimal), no se fuerza el esquema aquí. Tras editar YAML, `rm -rf .data .nuxt .output` antes de generar.

### Phase 14: Verificación del milestone
**Goal**: Hay evidencia de que v1.1 se puede publicar: Roma idéntica y sin pérdida de datos para quien ya la usa, Campania usable sobre el terreno, todo comprobado desde una build limpia y firmado por una persona en un móvil real
**Depends on**: Phase 13
**Requirements**: PAR-03, PAR-04
**Success Criteria** (what must be TRUE):
  1. `pnpm verify` pasa completo desde una build limpia (`.data`, `.nuxt`, `.output` borrados), con los 56 goldens de Roma sin re-baseline salvo la excepción aprobada, y `app/assets/css/base.css` sin diff respecto a `main`
  2. Un usuario de la guía viva (`index.html` de `main`) que escribió notas y eligió ritmo y modos abre la nueva versión en el mismo origen y, en `/trips/roma/`, ve sus notas y preferencias desde la primera carga
  3. Ir de la portada a Roma, de Roma a Campania y volver con «Atrás» no mezcla búsqueda, notas ni modos entre viajes, y ninguna guía descarga `sql_dump` ni WASM
  4. Una persona firma Roma y Campania en un móvil real, en claro y oscuro, incluido el uso sin conexión (fallback de imágenes y banner de mapa offline)
**Plans**: TBD
**Research**: no (puerta y checklist ya definidos)
**Notas**: el merge a `main` y el deploy a GitHub Pages siguen siendo un acto de ship aparte (fuera del hito); el primer deploy público será v1.0 + v1.1 a la vez.

## Decisiones abiertas (⚠ requieren al usuario)

| # | Decisión | Requisito | Resolver antes de |
|---|----------|-----------|-------------------|
| 1 | Enlace «← Todos los viajes» en Roma (cambia una captura del pie) o ninguno en v1.1 | ROUTE-06 / PAR-01 | Planificar la Fase 11 |
| 2 | Opciones A/B apiladas y siempre visibles (recomendado) vs selector que oculte la no elegida (TRIP-02, futuro) | EXT-01 | Planificar la Fase 12 |
| 3 | Motifs SVG nuevos de naturaleza vs reutilizar provisionalmente los existentes (`garden`, `tower`, `rooftops`) | EXT-04 | Planificar la Fase 12 |
| 4 | Fecha de devolución del coche (25 vs 26): día VIII en coche o en transporte público | CAMP-01 | Redactar el día VIII en la Fase 13 |
| 5 | Publicar Campania solo cuando esté completa (`draft` hasta entonces) vs con días provisionales | ROUTE-05 | Cerrar la Fase 13 (el esqueleto de la Fase 12 nace `draft: true`) |

Por defecto, **ningún golden de Roma se re-baselina** en todo el hito; cualquier excepción necesita aprobación explícita del usuario.

## Progress

**Execution Order:**
Phases execute in numeric order: 9 → 10 → 11 → 12 → 13 → 14 (las fases 9-12 no dependen del contenido de Campania)

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Andamiaje + Golden de paridad | v1.0 | 3/3 | Complete | 2026-06-18 |
| 2. Esquema de datos + migración | v1.0 | 7/7 | Complete | 2026-06-19 |
| 3. Capa de página, layout y tema | v1.0 | 5/5 | Complete | 2026-06-19 |
| 4. Render de contenido + modos de ritmo | v1.0 | 5/5 | Complete | 2026-06-20 |
| 5. Navegación transversal | v1.0 | 3/3 | Complete | 2026-06-21 |
| 6. Derivados de datos — búsqueda y ruta del día | v1.0 | 5/5 | Complete | 2026-06-21 |
| 7. Isla client-only — mapa, fallback, notas | v1.0 | 4/4 | Complete | 2026-06-23 |
| 8. Verificación de paridad | v1.0 | 7/7 | Complete | 2026-06-24 |
| 9. Plataforma por viaje | v1.1 | 5/5 | In Progress | - |
| 10. Forma y chrome desde datos | v1.1 | 5/5 | In Progress | - |
| 11. Portada y rutas multi-viaje | v1.1 | 7/7 | In Progress | - |
| 12. Formas nuevas de viaje | v1.1 | 2/7 | In Progress | - |
| 13. Contenido Campania 2027 | v1.1 | 0/TBD | Not started | - |
| 14. Verificación del milestone | v1.1 | 0/TBD | Not started | - |

---

*Full v1.0 detail archived in `.planning/milestones/v1.0-ROADMAP.md`. v1.1 roadmap created 2026-11-20 (borrador pendiente de aprobación del usuario).*
