---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: ready_to_plan
stopped_at: Phase 05 complete (3/3) — ready to discuss Phase 6
last_updated: 2026-06-21T09:47:20.006Z
last_activity: 2026-06-21
progress:
  total_phases: 8
  completed_phases: 4
  total_plans: 23
  completed_plans: 23
  percent: 50
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-18)

**Core value:** La 1.0 debe ser exactamente igual que la guía de hoy (paridad visual y funcional al 100%), pero construida de forma dinámica, data-driven y mantenible.
**Current focus:** Phase 6 — derivados de datos — búsqueda y ruta del día

## Current Position

Phase: 6
Plan: Not started
Status: Ready to plan
Last activity: 2026-06-21

Progress: [██████████] 100%

## Performance Metrics

**Velocity:**

- Total plans completed: 24
- Average duration: 9 min
- Total execution time: 0.15 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 3 | - | - |
| 02 | 7 | - | - |
| 03 | 5 | - | - |
| 04 | 5 | - | - |
| 05 | 3 | - | - |

**Recent Trend:**

- Last 5 plans: 01-01 (9 min)
- Trend: —

*Updated after each plan completion*
| Phase 01 P01-02 | 9min | 2 tasks | 11 files |
| Phase 01 P03 | 7min | 2 tasks | 8 files |
| Phase 02 P01 | 12 | 4 tasks | 9 files |
| Phase 02 P02 | 9min | 2 tasks | 2 files |
| Phase 02 P03 | 22min | 3 tasks | 6 files |
| Phase 02 P04 | 27min | 2 tasks | 21 files |
| Phase 02 P05 | 18min | 2 tasks | 17 files |
| Phase 02 P06 | 9min | 2 tasks | 26 files |
| Phase 02 P07 | 14min | 3 tasks | 18 files |
| Phase 03 P01 | 3min | 2 tasks | 4 files |
| Phase 03 P02 | 7min | 2 tasks | 3 files |
| Phase 03 P03 | 6min | 2 tasks | 5 files |
| Phase 03 P04 | 11min | 2 tasks | 2 files |
| Phase Phase 03 PP05 | 13min | 4 tasks tasks | 5 files files |
| Phase 04 P01 | 12min | 3 tasks | 5 files |
| Phase 04 P02 | 35min | 1 tasks | 2 files |
| Phase 04 P03 | 6min | 2 tasks | 7 files |
| Phase 04 P04 | 38min | 2 tasks | 8 files |
| Phase 04 P05 | 22min | 3 tasks | 8 files |
| Phase 05 P01 | 3min | 2 tasks | 2 files |
| Phase 05 P02 | 5min | 2 tasks | 4 files |
| Phase 05 P03 | ~20min | 2 tasks (1 auto + 1 human-verify) | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Fases horizontales/ordenadas por dependencia siguiendo el BUILD ORDER del research (andamiaje+golden → datos → página/layout/tema → render+modos → navegación → derivados → isla mapa → verificación)
- [Roadmap]: El golden de Playwright se captura en la Phase 1 desde `main` ANTES de divergir — red de seguridad de toda la paridad
- [Roadmap]: `day.cards: string[]` ordenado (Phase 2) es la pieza más crítica del modelo: de él se deriva la "ruta del día" (hoy depende del orden del DOM)
- [Roadmap]: `useCardNavigation` (Phase 5) se construye antes que mapa/búsqueda/enlaces, sus tres consumidores
- [Roadmap]: Mapa Leaflet + fallback de imagen (Phase 7) van al final por ser lo más sensible a SSR/hidratación
- [Phase ?]: [Fase 1]: A5 fijada — golden bloquea todas las peticiones de imagen (page.route.abort) para forzar el fallback SVG determinista (offline, BUILD-02)
- [Phase ?]: [Fase 1]: A8 fijada — snapshotPathTemplate sin sufijo de plataforma; golden capturado en linux
- [Phase ?]: [Fase 1]: fichas-tipo del golden por id literal (#galleria-sciarra/#vaticano/#auditorium) — no existe clase CSS guided/concert en el index.html
- [Phase ?]: [Fase 1]: Scaffold Nuxt 4 vía B (a mano) en raíz no vacía — preserva index.html/favicons intactos (D-02/Pitfall 1)
- [Phase ?]: [Fase 1]: CSS editorial VERBATIM (tokens/base/leaflet) sin @layer/scoped — paridad por construcción; eliminadas 2 llaves } sobrantes latentes del index.html (no-op visual, PostCSS las rechazaba)
- [Phase ?]: [Fase 1]: better-sqlite3 (dev, build-time) como conector SQLite de @nuxt/content — el sitio desplegado sigue 100% estatico
- [Phase ?]: [Fase 1]: verificación de subpath vía B (autocontenida en subpath.spec.ts: beforeAll genera+copia+spawn serve, afterAll mata+limpia) — sin tocar playwright.config.ts
- [Phase ?]: [Fase 1]: favicons en app/app.vue con useHead+app.baseURL (NO app.head.link): Nuxt no antepone baseURL a app.head.link → /favicon.svg daría 404 bajo /guiaRoma/
- [Phase ?]: [Fase 1]: subpath /guiaRoma/ verificado SOLO en local (0x404 de /_nuxt/* + 0xCDN); D-06 — no se montó CI/deploy, main intacto
- [Phase ?]: [Fase 2]: shared/schemas.ts es la fuente unica del esquema zod, importado por content.config.ts Y por schema.spec.ts (mismo contrato en config y test)
- [Phase ?]: [Fase 2]: DATA-05 se cumple via test Vitest Node-puro (safeParse por fichero), NO con el esquema de Content (no valida data-collections en build, #3351)
- [Phase ?]: [Fase 2]: cross-refs en invariants.spec (no en zod refine); slug (no id reservado) como ancla estable; prosa como sections[{heading,body}] (D-01)
- [Phase ?]: [Fase 2]: Puerta de fidelidad DATA-04 (migration-diff) — texto por multiset de palabras + enlaces por conjunto de href (D-08, no byte-exacto); index.html solo-lectura
- [Phase ?]: [Fase 2]: migration-diff SKIPea ids sin YAML via helper de existencia del harness — spec incremental sin false-red entre los 4 planes de migracion de Wave 3 en paralelo
- [Phase ?]: [Fase 2]: chrome de UI (notes-area, etiqueta boton Maps) excluido del texto pero su href capturado; denylist de claves estructurales en lado YAML; universo = 72 anclas (5 gastro sin id via revision manual)
- [Phase ?]: [Fase 2]: Plan 05 reutilizó verbatim el patrón de monument del Plan 04 sin tocar esquema ni harness; sólo transcripción de datos fieles de lunes/martes
- [Phase ?]: [Fase 2]: Los 38 monumentos quedan migrados (21 Plan 04 + 17 Plan 05); schema.spec conteo 38 y migration-diff de los 38 en verde (DATA-04/DATA-01)
- [Phase ?]: [Fase 2]: Las 26 fichas de gastronomía quedan migradas (17+9, incl. 5 sin id con slug g- generado y verificado a mano); schema.spec conteo food=26 y migration-diff de los 21 con id en verde (DATA-04/DATA-01)
- [Phase ?]: [Fase 2]: groupIntro de food NO se pobla por ficha — los gastro-intro son prosa de nivel grupo/sección fuera del subárbol DOM de cada card; atarlo a una ficha rompería su migration-diff por-card (extraWords). Campo queda optional
- [Phase ?]: [Fase 2]: Plan 07 cierra el corpus — 13 artist-cards (kind artist/arquitectura/glossary), reservas (tabla tipada badge/estado) y practica (prosa+media); pnpm test:data 100% verde con TODOS los cross-refs resueltos
- [Phase ?]: [Fase 2]: avatar de artist-card es estructural en ambos lados del diff (se excluye .artist-avatar de la extracción HTML, igual que STRUCTURAL_KEYS en YAML); seenIn lleva la prosa de cabecera/conector en label/note de los Link
- [Phase ?]: [Fase 2]: reservas.table.badge/badgeKind → optional (fila 'Sin reserva' sin badge); anclas de SECCIÓN de página (#gastronomia/#arte/#arquitectura/#inicio/#mapa) aceptadas en el invariante de anclas inline (landings SPA, no entidades)
- [Phase ?]: [Fase 2]: archLink (arq-barroco → #art-bernini/#art-borromini) INLINE en el body de la prosa, no campo aparte; arq-medieval con 2 secciones fiel al DOM (sin 'Por qué importa')
- [Phase 2]: gap closure — los 8 textos de NIVEL sección/grupo que la migración per-card dejó caer (eyebrows+intros de gastronomía/arte/arquitectura 5337/5340·5943/5945·6106/6108 + gastro-intro de quinto quarto 5501 / ghetto 5541) se capturan verbatim en TripSchema.sections (trip.yml) y food.groupIntro (g-checchino/g-giggetto); migration-diff gana extractSectionMeta/extractGroupIntro + test de nivel sección con fixtures negativos, y groupIntro va a STRUCTURAL_KEYS para no romper el diff per-card. pnpm test:data 295 verde, typecheck+lint limpios. Supersede la decisión de 02-06 de no poblar groupIntro
- [Phase 3]: [Fase 3]: dayLabel guarda split('·')[0] con ?? '' para noUncheckedIndexedAccess (TS2532) conservando la forma prescrita split('·')+toLocaleUpperCase('it'); String.split siempre devuelve >=1 elemento, sin cambio de comportamiento
- [Phase 3]: [Fase 3]: tests/unit y tests/data como runners DISJUNTOS via un solo include + scripts dedicados (test:unit / test:data), no Vitest projects; data sigue 295 verde aislado, unit 7 verde
- [Phase 3]: [Fase 3]: la etiqueta de día se DERIVA (D-04), nunca se almacena — sin campo navLabel en shared/schemas.ts y sin tocar los 5 YAML de día; helper puro en app/utils/ auto-importado como dayLabel
- [Phase 3]: [Fase 3]: useTrip(slug) es la raíz de datos (SC#1/ARCH-01): 6 useAsyncData(queryCollection) en Promise.all, filtro .where('trip','=',slug) (trip por slug), days/reference ordenados ASC, resuelto en prerender (offline); slug es la única clave consultada, nunca .where('id')
- [Phase 3]: [Fase 3]: artist/reference son z.discriminatedUnion → Content v3 genera item-types vacíos; el retorno de useTrip se tipa contra los tipos zod de shared/schemas vía as-unknown-as, y el builder .order('order') de reference se castea a any (un eslint-disable local) porque .order exige keyof y la unión omite la columna order real; runtime SQL intacto
- [Phase 3]: [Fase 3]: buildTripIndexes extraído a app/utils/ como función pura (Maps slug-keyed con guard ?? []) → SC#1 cubierto en Vitest plano sin añadir @nuxt/test-utils
- [Phase ?]: [Fase 3]: los 4 componentes de chrome (Topbar/ThemeToggle/NavPills/BackButton) reproducen el markup+clases del index.html VERBATIM y escriben CERO CSS — sin <style scoped> (data-v-* rompería selectores descendientes cross-componente como .topbar-inner .theme-btn y [data-theme] .theme-btn .moon); paridad por construcción (UI-01)
- [Phase ?]: [Fase 3]: ThemeToggle consume useColorMode() (D-08) — invierte el valor RESUELTO (colorMode.value) y escribe una preferencia CONCRETA light/dark, nunca 'system'; el icono conmuta SOLO via CSS [data-theme] (D-10/SC#4), ambos spans siempre renderizados, sin directivas condicionales (evita FOUC + mismatch de hidratacion)
- [Phase ?]: [Fase 3]: NavPills es hibrido (D-03) — 7 pastillas estructurales literales + 5 de dia DERIVADAS de props.days (v-for, href='#'+slug, etiqueta via dayLabel(eyebrow), D-04) en el orden BLOQUEADO entre Mapa y Reservas; sin estado resaltado/scrollspy (frontera F5). BackButton es shell visible-solo (D-07): onclick descartado, sin manejador ni clase de visibilidad. eslint.config.mjs permite el nombre de 1 palabra 'Topbar' (bloqueado por el contrato de auto-import)
- [Phase ?]: [Fase 3]: TripView es el poseedor de la página (A3) — llama a await useTrip(props.slug) y monta chrome + las 12 anclas slug en orden; las páginas del Plan 05 serán one-liners <TripView :slug>
- [Phase ?]: [Fase 3]: las 11 secciones no-#inicio de TripView son <section id> reales y VACÍAS (solo id, sin contenido ni height) — una altura fija desplazaría cada ancla y rompería el scrollspy de F5 (scroll-padding-top:124px); vacías, section{padding}/section+section{border-top} aplican igual que en el golden
- [Phase ?]: [Fase 3]: prosa de #inicio (TheHero) vía <MDC> con unwrap='p' en los casos inline (trip.title en h1, infoCards value) y <p> conservado en howTo (RESEARCH §Open Q1 RESUELTA); el cuadre de ritmo vertical a pixel se valida contra el golden en el parity Playwright del Plan 05
- [Phase ?]: [Fase 3]: v-if='trip' en <TheHero> estrecha Ref<Trip|null> a la prop Trip no-nula sin ocultar #inicio (trip siempre presente para / slug roma y /trips/[slug] válido con guard 404); anclas de día en español #viernes..#martes = ids reales del index.html y de nav-pills, no las grafías italianas sueltas de una nota del plan
- [Phase ?]: [Fase 3]: app.vue = NuxtPage root SIN NuxtLayout (TripView posee el chrome, A3) + head de paridad VERBATIM por useHead (D-09: lang es, title 'Roma · 19—23 giugno 2026', dos theme-color metas dark #1a1612/light #f5f0e8); bloque favicon useHead de Fase 1 preservado intacto (NO app.head.link, que no antepone baseURL → 404 bajo /guiaRoma/)
- [Phase ?]: [Fase 3]: /trips/[slug] reusa TripView con createError(404, fatal) en slug desconocido y NUNCA se prerenderiza (no se enlaza, no se toca nitro.prerender.routes); index.vue y [slug].vue son one-liners <TripView :slug> (convención A3); el build no emite dir trips/ (D-01, asertado en shell.spec)
- [Phase ?]: [Fase 3]: specs de paridad autocontenidos (build+serve propio, mirror de subpath.spec.ts) porque el webServer por defecto sirve el index.html VIEJO; prefieren aserciones DOM/texto a screenshots (no rebaselinar golden); toleran EXACTAMENTE el un mensaje esperado de hidratación color-mode SSG (D2) y fallan ante cualquier otro error de consola. SC#3 anti-FOUC en dos partes (script inline presente + dark-sin-flash), SC#4 icono solo-CSS nunca system
- [Phase ?]: [Fase 3]: F3 CERRADA — sign-off humano de paridad golden APROBADO (home idéntico al golden de Fase 1 en claro+oscuro, móvil+desktop, sin FOUC); ARCH-01/ARCH-02/UI-01/FEAT-01 completos; D1 (unión SQL artist/reference en useTrip) diferido a F4 antes de rellenar #arte/#arquitectura/#reservas/#practica
- [Phase ?]: [Fase 4 P01]: Pitfall 1 resuelto (opción b) — NO se crean ProseUl/ProseLi globales; las listas de prosa MDC no son uniformes (monumentos+practica=detail-list, artistas=plain sin clase), un override global plano rompería la paridad de los 13 artistas. Datos de F2 intactos; lo resuelve el plan consumidor (04-02/04-04)
- [Phase ?]: [Fase 4 P01]: useTripModes = estado reactivo único (useState singleton pace/light/resumen, D-03); acopla light->slow sin else (Pitfall 5, no revierte); clases de body via useHead({bodyAttrs}) sin DOM imperativo; restore+persistencia SOLO en onMounted con claves literales roma-* (micro-flash SC#4); isVisible delega en la función pura
- [Phase ?]: [Fase 4 P01]: app/utils/pace.ts = matriz isVisible pura de 3 ramas exactas (index.html:6525-6531, Pitfall 4 preservado), 9 casos en Vitest plano (TDD RED->GREEN); tipos Pace/ItemPace exportados
- [Phase ?]: [Fase 4 P01]: DetailPhoto.global.vue = PRIMER .global.vue del repo (sufijo = mecanismo de registro global para <MDC> resolveComponent); img plano sin manejador de error (frontera D-01, fallback SVG es F7); caption via <MDC unwrap=p>; eslint allowlist gemela para Timeline
- [Phase ?]: [Fase 4 P02]: MonumentCard resuelve Pitfall 1 LOCALMENTE — override ul->DetailListUl (objeto local) en :components de <MDCRenderer>, sin ProseUl global; las listas de artista quedan intactas (decisión b de 04-01 honrada)
- [Phase ?]: [Fase 4 P02]: card-artists/card-arch — el label es Markdown completo (prefijo+enlace) en los datos F2, no texto plano; se renderiza con <MDC> + override a->ArtLink (repone class=art-link), separador { ' ' } explícito, nota inline VERBATIM; byte-idéntico al original
- [Phase ?]: [Fase 4 P02]: :tag=false en todos los <MDC>/<MDCRenderer> suprime el <div> envoltorio que MDCRenderer mete por defecto (paridad de marcado); facts.value y culture.text van por <MDC> (llevan Markdown); culture[0]=label del box, slice(1)=ref-items
- [Phase ?]: [Fase 4 P02]: deferred D-04-A — DetailPhoto.global.vue y TheHero.vue dejan un <div class=''> envoltorio por <MDC unwrap=p> sin :tag=false (planes anteriores, fuera de alcance); arreglo trivial sugerido
- [Phase ?]: [Fase 4 P04]: Pitfall 6 resuelto — app/utils/foodGroups.ts codifica el ORDEN CANÓNICO de los 7 grupos de gastronomía (array constante FOOD_GROUP_ORDER verbatim del index.html) y ordena por él; queryCollection('food').all() es alfabético por filename (g-bar-* saldría tercero pero su grupo es el último). Verificado en render real
- [Phase ?]: [Fase 4 P04]: Pitfall 1 honrado en ambos lados — PracticaSection aplica el override LOCAL ul->detail-list (gemelo de MonumentCard); ArtistCard NO lo aplica (las .artist-section usan <ul> plano). Sin conflicto con Plan 01 porque no existe ProseUl global. Verificado: arte=0 detail-list, practica=detail-list
- [Phase ?]: [Fase 4 P04]: ArtistCard es UN componente que unifica artist/arquitectura/glossary por kind (v-if glossary -> arch-glossary con arch-term; v-else artist-head + artist-section + artist-trip head=note del 1er seenIn, body=labels MDC unidos por ' · ' + note de cierre); ReservasSection tabla con heurística strong/plano para filas sin ref; PracticaSection h2 sin section-title + intro/media inline-styled
- [Phase ?]: [Fase 4 P04]: BLOQUEANTE D-04-D/D1 CONFIRMADO — queryCollection('artist'/'reference').all() devuelve filas con TODOS los campos null (uniones discriminadas NO se materializan en columnas SQL); .where('trip') matchea 0 filas. Los 5 componentes son correctos (verificado con datos estáticos byte-a-byte), pero #arte/#arquitectura/#reservas/#practica NO renderizarán con datos reales hasta resolver D1. Detalle+opciones en deferred-items.md. Bloquea render-reference.spec del Plan 05
- [Phase ?]: [Fase 4 P05]: TheHero CONSUME useTripModes para cablear sus controles ya montados (D-05): 3 pace-btn :class active+@click, light/resumen :aria-pressed+@click; el 1er pace-btn pierde el active LITERAL (Vue lo mergearía y quedaría siempre activo); sin reestructurar el #inicio ni tocar el search-input (F6), CERO CSS
- [Phase ?]: [Fase 4 P05]: DaySection resuelve day.cards[]→monById→MonumentCard en ORDEN del dato (Pitfall 6, ruta del día de F6); TripView rellena las 11 secciones por props desde un SOLO useTrip (monById/food/artists/refById), #arte/#arquitectura con eyebrow/section-title estatico/art-intro fuera de las cards + ArtistCard por kind (glosario al final), #mapa vacío (F7)
- [Phase ?]: [Fase 4 P05]: [Rule 3] Timeline dispatcher — <component :is=STRING> NO resuelve auto-imports en SSG (emitia <TimelineStop> vacios, timeline sin filas); resuelto con resolveComponent() por nombre en el setup (referencia estatica → Nuxt inyecta el import). Bug latente del Plan 04-03 que solo afloraba al montar Timeline en pagina real (04-03 lo difirio al Plan 05)
- [Phase ?]: [Fase 4 P05]: los 4 specs de render/modos son AUTOCONTENIDOS (mirror de shell/theme.spec: build+serve propio bajo /guiaRoma/, toleran SOLO el error de hidratacion color-mode, no usan el webServer del golden, no rebaselinan D-08); aserción de detail-photo ESTRUCTURAL (.detail-photo>img con src/alt) no de pixel (carga real de Wikimedia = checkpoint humano D-06); persistencia via addInitScript(localStorage), micro-flash via MutationObserver
- [Phase ?]: [Fase 5 P01]: computeActiveSection es port verbatim de index.html:6492-6496 (y=scrollY+130, for-loop last-wins sin break, default ''); el +130 (no 124) se asevera load-bearing con un caso frontera 124-falla/130-pasa (scrollY 874 -> offsetTop 1000)
- [Phase ?]: [Fase 5 P01]: cardNav.ts pure/DOM-free/Nuxt-free/zero-import (window/document/useState solo en JSDoc); pushScroll/popScroll inmutables devuelven {top,rest} para test plano, el controlador del Plan 02 muta su useState y delega la forma LIFO aqui
- [Phase ?]: [Fase 5 P01]: isFichaTarget = monById.has(id) reemplaza el querySelectorAll('.card') del original (D-02) y ES el gate acotado T-05-01 que consume el Plan 02; id ausente -> salto nativo de seccion
- [Phase ?]: [Fase 5 P02]: useCardNavigation = singleton useState (accesor PURO navStack/activeSection/canGoBack/navigateToCard/goBack + controller de efectos invocado 1 vez en TripView), clon exacto de useTripModes/useTripModesController (Pitfall 4: listeners una sola vez)
- [Phase ?]: [Fase 5 P02]: navigateToCard/goBack port VERBATIM index.html:6390-6409 (preventDefault, push window.scrollY, scrollIntoView smooth block:start, .highlight 2500ms, pop+window.scrollTo); guards intactos; sin offset manual (scroll-padding-top:124px); highlightCard NO portado
- [Phase ?]: [Fase 5 P02]: click DELEGADO = document.addEventListener nativo en onMounted (NO @click Vue, NO bindCardLinks, NO ProseA.global.vue; Pitfall 1) gated por isFichaTarget (D-02); seccion->salto nativo, ficha->preventDefault (D-03)+navigateToCard; burbuja por ahora (05-03 confirma vs captura)
- [Phase ?]: [Fase 5 P02]: controller+llamada TripView async/await porque useTrip es async (Rule 1); NavPills/BackButton CABLEADOS no reestructurados (:class active por pastilla; :class show+@click goBack); CERO CSS nuevo, sin <style scoped>, base.css intacto; test:unit+typecheck+lint+generate verde
- [Phase 5 P03]: A1 RESUELTA = CAPTURA. El spec probó que el listener en burbuja (default 05-02) NO interceptaba la navegación a ficha; el controller usa ahora addEventListener('click', onDelegatedClick, true) + e.stopPropagation() tras preventDefault (y removeEventListener(...,true)) para ganar al onClick de NuxtLink / al salto nativo del ancla. JSDoc de cabecera lo registra
- [Phase 5 P03]: BUG REAL (Rule 1) bajo el síntoma burbuja-vs-captura: useCardNavigationController era async y registraba onMounted DESPUÉS de await useTrip('roma'). Vue descarta la instancia activa tras un await → los listeners de click y scroll NUNCA se adjuntaban: FEAT-05 estaba MUERTA en el sitio generado (scrollspy sin pastilla; enlaces de ficha saltaban nativamente). pnpm generate y los unit tests pasaban igual (no observan adjunción de listeners en runtime); SOLO el spec contra el sitio real lo detectó (RED)
- [Phase 5 P03]: FIX = registrar onMounted/onUnmounted SÍNCRONAMENTE antes del await; monById se lee por un holder shallowRef (monByIdRef) rellenado tras el await + watch(monById,...) para mantenerlo al día; el handler lee monByIdRef.value en tiempo de clic; add/remove con la MISMA referencia de función Y la MISMA fase (capture=true). Patrón: nunca registrar hooks de ciclo de vida tras un await en un composable async
- [Phase 5 P03]: tests/parity/navigation.spec.ts autocontenido (clon de modes.spec, NO el webServer del golden que sirve el index.html VIEJO): generate-once + serve bajo /guiaRoma/ en base de puerto 5720, tolera SOLO el error de hidratación color-mode, 6/6 verde; aserciones de comportamiento (.highlight via toHaveClass, deltas de scrollY, .nav-pill.active, hash de page.url()), sin snapshots de pixel, sin @nuxt/test-utils. SC#2 prueba el punto de conmutación +130 en navegador real (offsetTop-130+1 activa; offsetTop-130-5 no)
- [Phase 5 P03]: F5 CERRADA — sign-off humano de paridad de navegación APROBADO (idéntica al index.html vivo en claro/oscuro × móvil/desktop: scroll suave a ficha + .highlight ~2.5s + restauración de scroll por pila SC#1, conmutación de .nav-pill.active en +130 SC#2, intercepción de fichas con hash sin cambiar vs salto nativo de #reservas SC#3). FEAT-05 completo. Dos fallos de suite completa fuera de alcance → deferred-items.md (golden-light pixel flake → F8; shell dev test bloqueado por lock de nuxi dev rancio)

### Pending Todos

[From .planning/todos/pending/ — ideas captured during sessions]

None yet.

### Blockers/Concerns

[Issues that affect future work]

- [Phase 2]: Bandera de research parcial — las secciones de referencia (`index.html` líneas ~5260-6250) no se leyeron en profundidad; leerlas y afinar el esquema `reference` antes de migrar ese contenido.
- [RESUELTO en Fase 5 P03]: ~~[Phase 4/5]: Validar al implementar el cableado exacto de interceptación de `a[href^="#"]` en `<MDC>` (componente Prose-`a` custom vs listener delegado).~~ → Listener delegado nativo en CAPTURA + stopPropagation, registrado SÍNCRONAMENTE; probado en navegador real por navigation.spec.ts (SC#1/SC#3 verde) y aprobado por humano.
- [Phase 4/6/7]: BLOQUEANTE D1 abierto (heredado de F4, NO de F5) — las colecciones de unión discriminada `artist`/`reference` devuelven filas SQL todo-null, así que `#arte`/`#arquitectura`/`#reservas`/`#practica` no renderizan con datos reales. `pnpm generate` sigue OK. Resolver antes de que F6/F7 dependan de esas secciones.

## Deferred Items

Items acknowledged and carried forward from previous milestone close:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Backend | BACK-01/02/03 (auth, uploads, API Nitro activa) | v2 | Init |
| PWA | PWA-01/02 (app instalable, caché offline real de tiles) | v2 | Init |
| Multi-viaje | TRIP-01 (segundo viaje con contenido real) | Futuro | Init |

## Session Continuity

Last session: 2026-06-21T00:00:00.000Z
Stopped at: Completed 05-03-PLAN.md (navigation parity spec + A1=capture + onMounted-after-await fix; human golden sign-off APPROVED) — Phase 05 complete (3/3)
Resume file: None
