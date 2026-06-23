---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Phase 8 context gathered
last_updated: "2026-06-23T20:14:33.682Z"
last_activity: 2026-06-23
progress:
  total_phases: 8
  completed_phases: 7
  total_plans: 39
  completed_plans: 33
  percent: 85
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-06-18)

**Core value:** La 1.0 debe ser exactamente igual que la guía de hoy (paridad visual y funcional al 100%), pero construida de forma dinámica, data-driven y mantenible.
**Current focus:** Phase 08 — Verificación de paridad

## Current Position

Phase: 08 (Verificación de paridad) — EXECUTING
Plan: 2 of 7
Status: Ready to execute
Last activity: 2026-06-23

Progress: [█████████░] 85%

## Performance Metrics

**Velocity:**

- Total plans completed: 33
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
| 06 | 5 | - | - |
| 07 | 4 | - | - |

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
| Phase 06 P01 | 2min | 2 tasks | 2 files |
| Phase 06 P02 | 3min | 2 tasks | 2 files |
| Phase 06 P03 | 2min | 1 tasks | 1 files |
| Phase 06 P04 | 4min | 2 tasks | 3 files |
| Phase 06 P05 | ~20min | 2 tasks | 1 files |
| Phase 07 P01 | 8min | 3 tasks | 8 files |
| Phase 07 P02 | 5min | 2 tasks | 2 files |
| Phase 07 P03 | 14min | 2 tasks | 3 files |
| Phase 07 P04 | 10min | 1 task auto (+1 human-verify pending) | 1 files |
| Phase 08 P01 | 24min | 2 tasks | 2 files |

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
- [Phase 6 P01]: ruta del dia = TODAS las day.cards SIN filtro por type (Pitfall 2) - el critical_override del plan prevalece sobre SC#3/D-02/D-03 stale; sabado=8 incl. vaticano + auditorium; SC#4 (paridad de URL) es la fuente de verdad
- [Phase 6 P01]: pointFor devuelve coords (lat,lng) NUNCA mapsQuery (Pitfall 4, coords no-opcional -> rama ?query= muerta); capStops verbatim Math.round((i*(middle.length-1))/(slots-1)) (Pitfall 3, no Math.floor); pass-through con datos reales (max 10), probado con fixture sintetico 12->10 indices [0,1,3,4,5,6,8,9]
- [Phase 6 P01]: dayRoute.spec.ts en Vitest plano (import relativo, sin @nuxt/test-utils) carga los YAML reales con node:fs+yaml (patron invariants.spec); encadenado del test identico al consumidor DaySection (cards->monById->filter->pointFor); 55 unit tests verde
- [Phase Phase 6 P02]: buildHaystack es SUPERCONJUNTO de card.textContent (name/italian/roman + badge + sections + facts + sorrentino + culture + artists/arch label/note); un subconjunto regresaría SC#1 (Pitfall 1)
- [Phase Phase 6 P02]: createSearchIndex indexa SOLO monumentos (D-02): MiniSearch idField slug, fields name/italian/haystack, storeFields slug/name/day, searchOptions prefix:true + fuzzy:0.2 suave + boost name/italian:3>haystack:1 + combineWith OR (D-01)
- [Phase Phase 6 P02]: Markdown crudo se concatena sin destripar (tokenizador MiniSearch separa */[]/#/() -> Tardobarroco/Bernini indexables) y no se hace toLowerCase manual; searchIndex.spec en Vitest plano (import relativo, fixtures as Monument, sin @nuxt/test-utils)
- [Phase ?]: [Phase 6 P03]: ruta del día UI cableada en la banda .day-stats de DaySection — botón <a class=day-route-btn> con :href reactivo derivado de day.cards en SSG prerender (sustituye el stats.appendChild imperativo del index.html), v-if=points.length>=2, target=_blank rel=noopener, etiqueta via routeLabel; CERO CSS nuevo, sin <style scoped>
- [Phase ?]: [Phase 6 P03]: points reutiliza la MISMA cadena que dayCards (filtro defensivo (m): m is Monument => !!m) + .map(pointFor), SIN filtro por type (Pitfall 2/critical_override) — sábado conserva vaticano+auditorium = 8 paradas, verificado en el HTML generado (5 días: 6/8/7/10/7 paradas); FEAT-09 UI completo
- [Phase 6 P04]: FEAT-03 UI cableada — useSearch() accesor singleton (query/isOpen/results useState + onInput/onSelect) + useSearchController() (índice MiniSearch CLIENT-ONLY construido en onMounted desde monById, hooks ANTES del await useTrip = fix A1; listener outside-click). Reemplaza el dropdown innerHTML DOM-scraper del index.html:6447-6469 por índice tipado + plantilla Vue auto-escapada
- [Phase 6 P04]: índice MiniSearch en shallowRef de módulo (indexRef), NUNCA useState (solo query/isOpen/results plano se serializan); onInput tolera índice null (devuelve []) hasta que onMounted lo construye; resultados mapeados a {slug,name,day} planos para mantener results serializable
- [Phase 6 P04]: SearchBox.vue renderiza el shell .search-wrap VERBATIM + dropdown SOLO con {{ }} (T-V5: cero v-html, mejora sancionada sobre innerHTML); >=2 chars abre, max 8 filas (slice 0,8), 'Sin resultados' verbatim con estilo inline; input :value+@input (no v-model) para que onSelect limpie query; click -> onSelect -> navigateToCard (F5, hash sin cambiar D-03); cero CSS, sin bloque style
- [Phase 6 P04]: TheHero sustituye su placeholder #search por <SearchBox/> EN EL MISMO SITIO (D-04, no reubica); el HTML generado tiene EXACTAMENTE un #search/.search-wrap/#search-results (dropdown prerenderiza cerrado con 'Sin resultados' y 0 filas = default results=[]/isOpen=false, sin mismatch de hidratación); índice monuments-only (D-02) = todo resultado resuelve en monById, sin cambio en F5
- [Phase 6]: F6 CERRADA — sign-off humano de paridad búsqueda+ruta APROBADO: en el sitio /guiaRoma/ generado, la búsqueda cliente alcanza >= paridad (dropdown abre a >=2 chars, <=8 filas con nombre+día, 'Sin resultados' sin match, clic en resultado hace scroll-highlight de la ficha SIN cambiar el hash, SC#2/D-03) y el botón 'Ver ruta del día (N paradas)' es paridad EXACTA por día (misma N, mismas paradas en orden, sábado incl. Vaticano+Auditorium) — verificado claro/oscuro × móvil/desktop, consola limpia salvo el mensaje conocido de hidratación color-mode. FEAT-03 y FEAT-09 completos
- [Phase 6]: tests/parity/search-route.spec.ts es AUTOCONTENIDO (3er clon del patrón modes/navigation.spec: beforeAll genera+copia a subdir guiaRoma/+sirve bajo /guiaRoma/ en base de puerto 5740, NO el webServer del golden que sirve el index.html VIEJO); asevera comportamiento DOM/texto (no píxeles: Phase 8 posee el visual-diff total): dropdown >=2 abre/<2 cerrado, cap 8, 'Sin resultados', resultado->.highlight+hash-sin-cambiar, botón ruta visible/etiqueta/href con prefijo Google Maps walking NUNCA fetcheado; gate de consola tolera SOLO el error de hidratación color-mode; 10/10 verde. Los 5 fallos PRE-EXISTENTES de suite completa (4× golden.spec pixel-diff -> Phase 8; 1× shell.spec dev-routing por lock nuxi rancio) son fuera de alcance y están en deferred-items.md, NO causados por esta fase
- [Phase 7]: [Phase 7 P02]: LeafletMap.client.vue es la PRIMERA isla .client.vue del repo — 3 capas anti-'window is not defined' (sufijo .client + <ClientOnly> en TripView + import('leaflet') dinámico DENTRO de onMounted). pnpm generate limpio (0 'window is not defined'); el HTML prerenderizado tiene 0 custom-marker / 0 leaflet-container (isla genuinamente client-only)
- [Phase 7]: [Phase 7 P02]: popups card/concert = <a href='#slug'> SIN handler (los intercepta el listener en CAPTURA de F5, gateado por monById.has(id)); guided (Coliseo, vaticano) = TEXTO PLANO sin ancla (onclick inline del original DROPPEADO). Anadir @click reproduciria CR-01
- [Phase 7]: [Phase 7 P02]: #mapa lleva el chrome estatico verbatim (index.html:2361-2371) y SOLO #leaflet-map dentro de <ClientOnly>; #fallback = caja #leaflet-map VACIA del mismo tamano (D-02, cero salto de layout); #map-offline-banner en el .map-wrapper ESTATICO (fuera de ClientOnly) -> en el HTML prerenderizado y alcanzable por getElementById (A3). Unico useCardNavigationController() intacto
- [Phase ?]: [Phase 7 P03]: hero/detail @error → motifSvg(monument.motif) via v-html de constante de CONFIANZA (svgMotifs.ts); hero SIN estilos inline (.card-hero svg base.css:719 lo cuadra), detail CON los 4 estilos inline VERBATIM inyectados en la etiqueta <svg> (base.css:825 apunta a img, no a svg). heroHidden/no-motif = rama muerta del original portada por fidelidad
- [Phase ?]: [Phase 7 P03]: notas persistentes con clave EXACTA roma-note-<slug>, lectura en onMounted (vacío en SSR → sin warning de hidratación), guardado @input con debounce ~200ms en try/catch; :value/@input (no v-model); SÓLO monumentos. Verificado: el textarea prerenderizado está vacío
- [Phase ?]: [Phase 7 P03]: el motif llega a DetailPhoto.global.vue por provide('monumentMotif')/inject a través del subárbol del MDCRenderer (A2); confirmado hydration-safe por pnpm generate. La aserción de paridad del SVG correcto la hará el spec del Plan 04
- [Phase ?]: [Phase 7 P03]: eslint.config.mjs relaja SÓLO vue/max-attributes-per-line para DetailPhoto.global.vue (mismo precedente que MonumentCard/Timeline/secciones) por el <span v-else-if v-html> inline en el .detail-photo whitespace-sensible; CERO-CSS y el resto de reglas siguen activas. culture v-for ref→cultureRef (template-shadow del ref importado)
- [Phase 7 P04]: tests/parity/map-fallback-notes.spec.ts es AUTOCONTENIDO (4º clon del patrón modes/navigation/search-route.spec: beforeAll genera+copia a subdir guiaRoma/+sirve bajo /guiaRoma/ en base de puerto 5760; NO el webServer del golden que sirve el index.html VIEJO). 12/12 verde (SC#1–SC#7 × mobile+desktop): SC#1 39 marcadores+2★ con #leaflet-map vacío en SSG, SC#2 popup card→.highlight con hash sin cambiar (F5), SC#3 ambos popups ★ (Coliseo+vaticano) texto-solo sin ancla (quirk honrado), SC#4 banner offline al abortar tiles, SC#5+6 hero/detail→SVG al abortar imágenes (caption conservada), SC#7 notas round-trip bajo roma-note-<slug>. Los marcadores de Leaflet se solapan físicamente → se abren con dispatchEvent('click') sobre el elemento resuelto (NO .click()/force, que abre el popup del marcador encima en ese píxel); la puerta de consola tolera el net::ERR_FAILED DELIBERADO de los aborts (flag tolerateAborts) además del mensaje color-mode. Task 2 (sign-off humano de paridad) PENDIENTE — requisitos FEAT-02/UI-05/FEAT-04 NO marcados completos hasta la aprobación
- [Phase ?]: [Phase 8 P01]: back-stack back-half añadida a map-fallback-notes.spec (popup→ficha) y search-route.spec (resultado→ficha) — mirror EXACTO de navigation.spec.ts:217-242 (originY → #back-btn.show → click force → expect.poll(scrollY).toBe(originY) → .show fuera); specs EXTENDIDAS no reescritas, conteos preservados (12/12, 10/10)
- [Phase ?]: [Phase 8 P01]: settleScroll() (clon de navigation.spec:93-101) load-bearing ANTES del click en Volver — el scrollIntoView suave de la navegación seguía EN VUELO al clicar y el scrollTo de goBack competía → en móvil el scroll no convergía a originY y .show no se limpiaba. navStack instrumentado confirmó UN solo push (sin bug de app); carrera entre dos smooth-scrolls concurrentes (Rule 1, robustez de test, no debilita la aserción)

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

Last session: 2026-06-23T20:14:25.776Z
Stopped at: Phase 8 context gathered
Resume file: None
