---
phase: 04-render-de-contenido-modos-de-ritmo
plan: 04
subsystem: ui
tags: [nuxt, vue, mdc, mdc-renderer, components-override, detail-list, discriminated-union, parity, vitest, gastro, reservas, practica, artist, glossary]

# Dependency graph
requires:
  - phase: 02-datos-tipados
    provides: "esquema zod Food/Artist(discriminatedUnion kind)/Reference(discriminatedUnion slug) + 26 food + 13 artist + reservas/practica migrados; trip.sections.gastronomia/arte/arquitectura"
  - phase: 03-pagina-layout-tema
    provides: "patrón de componente (script setup lang=ts + <MDC> + markup verbatim + CERO CSS), useTrip/TripView, CSS editorial global, eslint per-file allowlist, util puro auto-importado"
  - phase: 04-render-de-contenido-modos-de-ritmo (Plan 01)
    provides: "decisión Pitfall 1 = opción b (NO ProseUl global); las listas de prosa NO son uniformes"
  - phase: 04-render-de-contenido-modos-de-ritmo (Plan 02)
    provides: "patrón de override LOCAL ul→detail-list en <MDCRenderer :components> (objeto local) + :tag=false en todo <MDC>"
provides:
  - "app/utils/foodGroups.ts — groupFood puro: agrupa food por group en ORDEN CANÓNICO del index.html (Pitfall 6), no el alfabético de queryCollection.all()"
  - "app/components/GastroCard.vue — la .gastro-card data-driven (UI-04)"
  - "app/components/GastroSection.vue — #gastronomia: intro + grupos ordenados + GastroCard (UI-04)"
  - "app/components/ArtistCard.vue — UN componente que unifica artist/arquitectura/glossary por kind (UI-04)"
  - "app/components/ReservasSection.vue — #reservas: confirmadas + tabla con badges/is-done (UI-04)"
  - "app/components/PracticaSection.vue — #practica: prosa (detail-list local) + media por category (UI-04)"
  - "Patrón: artist-trip head=note del 1er seenIn, body=labels MDC unidos por ' · ' + note de cierre"
  - "BLOQUEANTE descubierto D-04-D: queryCollection sobre uniones discriminadas (artist/reference) devuelve campos null — D1 confirmado y diagnosticado"
affects: [04-05-hero-cableado, 05-derivados-navegacion]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Util puro auto-importado con array constante de orden canónico (FOOD_GROUP_ORDER) para imponer orden de DOM sobre el alfabético de SQL (Pitfall 6)"
    - "Override LOCAL ul→detail-list reutilizado en PracticaSection (idéntico a MonumentCard); ArtistCard SIN override (listas planas, Pitfall 1)"
    - "Componente único que ramifica un discriminatedUnion por v-if (kind/slug) en template, estrechando la rama (ArtistCard/Reservas/Practica)"
    - "Sección data-bound que emite .container + contenido (NO el <section id>), que pone TripView (A3)"

key-files:
  created:
    - app/utils/foodGroups.ts
    - tests/unit/foodGroups.spec.ts
    - app/components/GastroCard.vue
    - app/components/GastroSection.vue
    - app/components/ArtistCard.vue
    - app/components/ReservasSection.vue
    - app/components/PracticaSection.vue
  modified:
    - eslint.config.mjs

key-decisions:
  - "Pitfall 6 resuelto: foodGroups.ts codifica el ORDEN CANÓNICO de los 7 grupos (array constante con los textos verbatim del index.html) y ordena por él; queryCollection('food').all() es alfabético por filename (g-bar-* saldría tercero pero su grupo es el último). Verificado en render real"
  - "Pitfall 1 honrado en ambos lados: PracticaSection aplica el override LOCAL ul→detail-list (gemelo de MonumentCard) porque sus listas SÍ son .detail-list; ArtistCard NO lo aplica (las .artist-section usan <ul> plano). Verificado en render real: arte=0 detail-list, practica=detail-list"
  - "artist-trip: la convención de datos F2 codifica el artist-trip-head como el note del PRIMER item de seenIn, el cuerpo como los label (Markdown) unidos por ' · ', y el note del ÚLTIMO item como prosa de cierre; render byte-idéntico a index.html (bernini)"
  - "groupIntro de nivel grupo (quinto quarto/ghetto) renderiza como div.gastro-intro, NO p.gastro-intro (que es la intro de SECCIÓN) — diferencia de elemento verbatim del index.html (5501/5541 vs 5340)"
  - "PracticaSection: h2 SIN clase section-title + intro en <p> con estilo INLINE verbatim + títulos de media inline-styled con mapa enum→display (chrome del original, no está en el dato)"
  - "ReservasSection: h4 de mesas/visitas y reservas-box-header son texto ESTÁTICO (chrome); heurística para filas sin ref: sin badge→<strong> (Sin reserva), con badge→texto plano (Otello) — reproduce el original exacto"
  - "ArtistCard/Reservas/Practica añadidos al allowlist per-file de eslint (marcado inline whitespace-sensible), precedente MonumentCard/Timeline"

patterns-established:
  - "Orden de render impuesto por util puro con array canónico cuando el orden de la fuente (SQL .all()) no coincide con el del DOM (Pitfall 6)"
  - "Un componente por familia que ramifica un discriminatedUnion con v-if en template (ArtistCard unifica 3 ramas: art/arq + glosario)"
  - "Override de prose-tag LOCAL aplicado selectivamente por contexto: practica SÍ (detail-list), artista NO (plano) — desde el MISMO esquema de prosa, sin tocar datos F2 ni crear globales (Pitfall 1)"

requirements-completed: [UI-04]

# Metrics
duration: 38min
completed: 2026-06-20
---

# Fase 4 Plan 04: Secciones de referencia (gastronomía / reservas / práctica / arte / arquitectura) Summary

**Las 5 secciones de referencia (UI-04) data-driven y verbatim: `GastroSection`/`GastroCard` con el agrupado en ORDEN CANÓNICO vía el util puro `groupFood` (Pitfall 6 resuelto y testeado), `ArtistCard` UN solo componente que unifica artist/arquitectura/glossary por `kind`, y `ReservasSection`/`PracticaSection` (esta última con el override LOCAL `ul→detail-list`, artistas planos — Pitfall 1 honrado en ambos lados). Render real (`pnpm generate`) byte-idéntico al `index.html`. Se DIAGNOSTICA el bloqueante D1 (D-04-D): `queryCollection` sobre las uniones discriminadas devuelve campos null.**

## Performance

- **Duration:** ~38 min (incluye un render real con `pnpm generate` + probe de diagnóstico y un segundo probe con datos estáticos para aislar la corrección de los componentes del bloqueante de la capa de datos)
- **Started:** 2026-06-20T13:07Z (carga de plan + lectura de fuentes + greps sobre los YAML/index.html)
- **Completed:** 2026-06-20T13:45Z
- **Tasks:** 2 (Task 1 con ciclo TDD: RED + GREEN)
- **Files modified:** 8 (7 creados + 1 modificado)

## Accomplishments
- **`app/utils/foodGroups.ts` + test** — `groupFood(items)` PURA auto-importada que agrupa `food` por `group` y devuelve los grupos en el ORDEN CANÓNICO del index.html (array constante `FOOD_GROUP_ORDER` con los 7 textos verbatim), conservando el orden de aparición dentro de cada grupo y propagando `groupIntro` del primer item que lo tenga. Resuelve **Pitfall 6** (queryCollection('food').all() es alfabético por filename → un Map ingenuo daría el orden equivocado). 6 casos en Vitest plano (TDD RED→GREEN).
- **`GastroCard.vue` + `GastroSection.vue`** — la `.gastro-card` (badge-+badgeKind, name, address, desc/plato vía MDC, footer con maps-link `encodeURIComponent`+`rel=noopener` e itinerary-tag anidado) y el contenedor `#gastronomia` (section-eyebrow + h2 estático "Dónde comer" + gastro-intro de sección + por grupo `gastro-section-title` + groupIntro como `div.gastro-intro` + `gastro-grid` de GastroCard). CERO CSS.
- **`ArtistCard.vue`** — UN SOLO componente (D-10) que unifica las 3 ramas del `discriminatedUnion` Artist por `kind`: `glossary` (v-if → `arch-glossary` con `arch-term` `<b>`+`<span>`) y artist/arquitectura (v-else → `artist-head` con avatar/name/dates/epithet + `artist-section` por sección con `<MDC>` SIN unwrap + `artist-trip`). **Pitfall 1 honrado:** las listas de `.artist-section` quedan `<ul>` PLANO (NO se aplica el override detail-list). CERO CSS.
- **`ReservasSection.vue`** — `reservas-box` con `reservas-confirmadas` (h4 estáticos + ul mesas/visitas con `rc-when` + MDC) y `reservas-table` con `tr.is-done`, `reservas-badge` badge-urgent/done/rec, y la heurística strong-vs-plano para las dos filas sin `ref`. CERO CSS.
- **`PracticaSection.vue`** — eyebrow + `<h2>` SIN section-title + intro inline-styled + `sections` con el override LOCAL `ul→detail-list` (gemelo de MonumentCard, **Pitfall 1**: practica SÍ lleva detail-list) + bloque de media por category (títulos inline-styled con mapa enum→display + `<ul class="detail-list">`). CERO CSS.
- **Verificación de render REAL** — `pnpm generate` + dos probes temporales (eliminados): (1) con `useTrip` real confirmó el agrupado canónico de gastronomía Y destapó el bloqueante D1; (2) con datos ESTÁTICOS confirmó que los 3 componentes nuevos salen byte-idénticos al index.html (artist-trip de bernini, glosario, tabla de reservas con strong/plano correctos, listas planas de artista vs detail-list de practica, media inline-styled).

## Task Commits

Cada tarea se commiteó atómicamente:

1. **Task 1 (RED): test de groupFood (orden canónico)** - `53b525f` (test)
2. **Task 1 (GREEN): foodGroups + GastroCard + GastroSection (UI-04, Pitfall 6)** - `ed1133d` (feat)
3. **Task 2: ArtistCard + ReservasSection + PracticaSection (UI-04, Pitfall 1)** - `11326ae` (feat)

**Plan metadata:** (commit docs final con SUMMARY/STATE/ROADMAP/REQUIREMENTS).

_Nota: Task 1 era `tdd="true"` → ciclo RED (test) → GREEN (feat); sin REFACTOR (el util ya es mínimo). Task 2 es `type=auto` (1 commit)._

## Files Created/Modified
- `app/utils/foodGroups.ts` — `groupFood(items)` pura + `FOOD_GROUP_ORDER` (array canónico) + tipo `FoodGroup`; ordena por el canon, conserva orden intra-grupo, propaga groupIntro, guard `?? []`.
- `tests/unit/foodGroups.spec.ts` — 6 casos en Vitest plano (orden canónico, Bar último, orden intra-grupo, propagación de groupIntro, guard, grupo desconocido al final).
- `app/components/GastroCard.vue` — `.gastro-card` data-driven; `defineProps<{ food: Food }>()`; desc/plato vía `<MDC unwrap="p" :tag="false">`; footer con maps-link e itinerary-tag anidado.
- `app/components/GastroSection.vue` — `#gastronomia`; `defineProps<{ food: Food[], section? }>()`; usa `groupFood`; section-eyebrow + h2 estático + gastro-intro + grupos.
- `app/components/ArtistCard.vue` — unifica artist/arquitectura/glossary por kind; `defineProps<{ artist: Artist }>()`; v-if glossary vs v-else; artist-trip con head=note[0] + labels MDC + note de cierre; listas planas (Pitfall 1).
- `app/components/ReservasSection.vue` — `#reservas`; `defineProps<{ reservas: Reference }>()`; v-if slug==='reservas'; reservas-box + tabla con badges/is-done.
- `app/components/PracticaSection.vue` — `#practica`; `defineProps<{ practica: Reference }>()`; override LOCAL `DetailListUl` (objeto) + media inline-styled.
- `eslint.config.mjs` — bloque per-file para ArtistCard/ReservasSection/PracticaSection (relaja `vue/*-content-newline` + `vue/max-attributes-per-line`; marcado inline whitespace-sensible, precedente MonumentCard/Timeline).

## Decisions Made

- **Pitfall 6 (orden canónico de gastronomía).** `foodGroups.ts` codifica `FOOD_GROUP_ORDER` (los 7 `gastro-section-title` verbatim del index.html: Pasta→Quinto quarto→Ghetto→Pizza→Gelato→Café→Bar) y ordena los grupos por su índice en ese array; los grupos no presentes en el canon van al final de forma determinista (orden de primera aparición). Dentro de cada grupo se conserva el orden de entrada y `groupIntro` se toma del primer item del grupo que lo tenga. **Verificado en render real**: la salida sale exactamente en orden canónico (no el alfabético de `.all()`).
- **Pitfall 1 honrado en AMBOS lados (sin conflicto con Plan 01).** Como el Plan 01 NO creó `ProseUl` global (opción b), las listas de `.artist-section` ya salen `<ul>` PLANO por defecto → ArtistCard NO necesita tocar nada y NO aplica el override detail-list (paridad correcta). PracticaSection SÍ aplica el override LOCAL `ul→DetailListUl` (gemelo exacto de MonumentCard del Plan 02), porque sus listas en el original son `.detail-list`. **No hubo el conflicto que el plan preveía** (ProseUl global convirtiendo listas de artista) precisamente porque no existe ese global. Datos de F2 intactos.
- **artist-trip — convención de datos F2.** El `artist-trip-head` es el `note` del PRIMER item de `seenIn` (p. ej. "✦ Lo verás en este viaje"); el cuerpo son los `label` (Markdown `[texto](#ancla)`) de cada item renderizados con `<MDC>` y SEPARADOS por ` · `; el `note` del ÚLTIMO item (índice > 0), si existe, es prosa de cierre que se añade tras ` · `. Verificado byte-a-byte contra index.html:5963-5966 (bernini).
- **groupIntro como `div.gastro-intro`.** La intro de SECCIÓN es `p.gastro-intro` (index.html:5340), pero la intro de NIVEL GRUPO (quinto quarto/ghetto) es `div.gastro-intro` (index.html:5501/5541). Se respeta la diferencia de elemento. Verificado en render real (2 div + 1 p).
- **PracticaSection diverge en chrome.** Su `<h2>` NO lleva `.section-title` (a diferencia de reservas/gastronomía), la intro va en un `<p>` con estilo INLINE verbatim, y los títulos de los bloques de media (`Libros`/`Películas imprescindibles`/…) son chrome del original con estilo inline y NO están en el dato (`media[].category` es solo el enum) → mapa `enum→display`. El primer título lleva `margin-top:1rem`, el resto `1.25rem` (verbatim).
- **ReservasSection — texto estático + heurística de filas sin ref.** Los dos `<h4>` ("✅ Ya reservado · 3 comensales" / "🎟️ Visitas y entradas reservadas") y el `reservas-box-header` son chrome del original (no están en el dato), reproducidos verbatim (incl. el `style="margin-top:.7rem;"` del h4 de visitas). Para las filas sin `ref`: si NO hay badge → `<strong>` (fila "Sin reserva (hacer cola)"), si SÍ hay badge → texto plano (fila "Otello") — reproduce el original (5323/5327) exactamente con los datos actuales.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Marcado inline whitespace-sensible viola `vue/*-content-newline` y `vue/max-attributes-per-line`**
- **Found during:** Task 2 (verify lint)
- **Issue:** El `artist-trip` de ArtistCard (enlaces separados por `{{ ' · ' }}` explícito + `<MDC>` multi-atributo en una línea), los `<li>` de `reservas-confirmadas` y las celdas de `reservas-table` (contenido PEGADO al contenedor, sin nodos de texto en blanco, verbatim del original) y los `<li>` de `.detail-list` de PracticaSection no admiten reformateo con saltos de línea sin que el compilador de Vue (`whitespace: 'condense'`) colapse los separadores/espacios y se pierda la paridad. Las reglas de formato fallaban.
- **Fix:** Bloque per-file en `eslint.config.mjs` para los 3 componentes que apaga `vue/singleline-html-element-content-newline`, `vue/multiline-html-element-content-newline` y `vue/max-attributes-per-line` (EXACTAMENTE el precedente de MonumentCard/Timeline). El resto de reglas (incl. el CERO CSS) sigue activo.
- **Files modified:** eslint.config.mjs
- **Verification:** `pnpm lint` (repo completo) exit 0; greps `<automated>` verdes.
- **Committed in:** `11326ae` (commit de Task 2)

**2. [Rule 2 - Missing Critical] `artist-head` wrapper + `<div>` interno (omitidos por el `<interfaces>` del plan)**
- **Found during:** Task 2 (lectura de index.html:5949-5956)
- **Issue:** El `<interfaces>` del plan describía la cabecera de ArtistCard como `artist-avatar + name + artist-dates + artist-epithet` directos, PERO el original los envuelve en `div.artist-head` (flex, base.css:1256) con el avatar y un `<div>` que agrupa h3/dates/epithet. Sin el wrapper, el layout flex de la cabecera (avatar a la izquierda, textos a la derecha) divergiría.
- **Fix:** Reproducido `div.artist-head > (div.artist-avatar + div > h3 + artist-dates + artist-epithet)` verbatim en las 3 ramas.
- **Files modified:** app/components/ArtistCard.vue
- **Verification:** Render real byte-idéntico a index.html (bernini + glosario).
- **Committed in:** `11326ae` (commit de Task 2)

**3. [Rule 1 - Bug] Clase del contenedor del glosario: `arch-glossary`, NO `arq-glosario`**
- **Found during:** Task 2 (lectura de index.html:6211 + base.css:1300)
- **Issue:** El `<interfaces>`/`<action>` del plan se refería a `div.artist-card.arq-glosario` para el contenedor de términos. PERO `arq-glosario` es el `id` del `<article>`, NO una clase; el CONTENEDOR de los `arch-term` es `div.arch-glossary` (base.css:1300, la rejilla 1-2 columnas). Usar `arq-glosario` como clase no aplicaría la rejilla.
- **Fix:** La raíz es `article.artist-card :id="slug"` (= `arq-glosario` como id) y el contenedor de términos es `div.arch-glossary`.
- **Files modified:** app/components/ArtistCard.vue
- **Verification:** Render real: `<article id="arq-glosario" class="artist-card">…<div class="arch-glossary"><div class="arch-term">…` idéntico al original.
- **Committed in:** `11326ae` (commit de Task 2)

---

**Total deviations:** 3 (1 blocking de lint, 2 bugs/missing de paridad por desajuste plan↔index.html).
**Impact on plan:** Las tres son necesarias para la paridad exigida por el core value (idéntico al index.html). La primera es el precedente ya establecido (allowlist de eslint); las otras dos corrigen suposiciones del `<interfaces>` del plan sobre el marcado real (igual que el Plan 02 corrigió card-artists). NO hay scope creep: solo afectan a los `files_modified` del plan + la relajación per-file de eslint. Datos de F2 NO tocados.

## Issues Encountered

### BLOQUEANTE (D-04-D / D1): `queryCollection` sobre uniones discriminadas devuelve campos null

Al verificar el render real con `useTrip('roma')`, `GastroSection` (colección `food`, `z.object`) renderizó perfecto, pero `ReservasSection`/`PracticaSection`/`ArtistCard` salieron VACÍAS. Diagnóstico exacto (vía probe de diagnóstico + `pnpm generate`):

- `queryCollection('artist').all()` → **13 filas** (conteo correcto) pero cada fila solo tiene las columnas BASE de Content (`id`, `extension`, `meta`, `stem`, `__hash__`); los campos del esquema (`slug`, `trip`, `kind`, `name`, `sections`, `seenIn`, `terms`…) salen `null`/`undefined`. `queryCollection('reference').all()` → 2 filas, mismo problema.
- Como `trip` NO es columna real, el `.where('trip','=','roma')` de `useTrip` matchea **0 filas** → `artists`/`reference`/`refById` llegan VACÍOS a los componentes. El prerender emite además `[request error] [POST] /__nuxt_content/artist/query` y `/reference/query`.
- **Causa raíz:** `ArtistSchema`/`ReferenceSchema` son `z.discriminatedUnion` → Content v3 no las materializa a columnas SQL (el mismo motivo por el que sus item-types son `{}` vacíos, ya documentado en `useTrip.ts` y en STATE como **D1**). Es exactamente el carry-forward D1: *"D1 (unión SQL artist/reference en useTrip) diferido a F4 antes de rellenar #arte/#arquitectura/#reservas/#practica"*.

**Por qué NO se arregla en este plan (Rule 4 — arquitectónico):** es un cambio de la CAPA DE DATOS (cómo se almacenan/consultan las colecciones-unión), que tocaría `shared/schemas.ts` (fuente de verdad de F2, consumida por `content.config.ts` Y por los 295 tests de `tests/data`) o `useTrip.ts` — fuera del SCOPE BOUNDARY de 04-04 (`files_modified` = los 7 ficheros de UI). El propio plan asume que `useTrip` entrega los datos (solo aborda el problema de TIPOS, ya resuelto por el cast de F3) y DIFIERE la verificación de render al Plan 05.

**Prueba de que los componentes están listos:** un segundo probe con datos ESTÁTICOS (eliminado) confirmó que los 3 componentes nuevos renderizan byte-idénticos al index.html. En cuanto D1 entregue los datos, `TripView` (Plan 05) montará `<ArtistCard>`/`<ReservasSection>`/`<PracticaSection>`/`<GastroSection>` sin tocarlos.

**Registrado en** `deferred-items.md` como **D-04-D** con 3 opciones de arreglo (aplanar el storage conservando el tipo de unión en el borde / una colección por rama / bypass de query con loader en memoria).

### Paridad menor no byte-exacta (documentadas, sin tocar datos F2)

- **artist-trip — separador del `note` de cierre.** En el original NO es byte-uniforme: bernini/barroco usan ` · ` antes del note de cierre; borromini usa `. ` + un `<span style="color:var(--ink-faint)">` atenuado. El dato F2 NO codifica ese `<span>` ni el separador. Se renderiza uniforme con ` · ` (el patrón dominante, 2/3). La fidelidad la valida la migration-diff de F2 por multiset de palabras + conjunto de hrefs (D-08, no byte-exacto), no el separador. (Divergencia: 1 parentético de borromini sin el matiz de color atenuado.)
- **gastro itinerary-tag — posición.** El plan/UI-SPEC sitúan `itineraryTag` en el FOOTER (como roscioli/armando en el original). El dato F2 lo guarda como campo top-level único; para zi-umberto el original lo tenía DENTRO del `gastro-plato`, no en el footer. Se sigue el plan (footer); las palabras están presentes (migration-diff por multiset, D-08). (Divergencia: 1 tag de zi-umberto en footer en vez de en plato.)

Ninguna de estas dos requiere tocar datos de F2 ni rompe el golden (D-08, sin rebaselinar).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness

- **Plan 04-05 (cableado de TheHero)** no consume estos componentes (son secciones de referencia, las cablea el Plan 05).
- **Plan 05 (derivados/navegación)** ya puede montar `<GastroSection :food :section>`, `<ReservasSection :reservas>`, `<PracticaSection :practica>` y `<ArtistCard :artist>` ×n en las anclas `#gastronomia`/`#reservas`/`#practica`/`#arte`/`#arquitectura` de `TripView` — **PERO antes debe resolver D-04-D/D1** (los datos de `artist`/`reference` no llegan por `queryCollection`). El render E2E del DOM (`render-reference.spec.ts`) NO pasará hasta resolverlo. Los componentes están verificados con datos estáticos: en cuanto el flujo de datos funcione, renderizan sin cambios.
- **GastroSection ya funciona end-to-end** con datos reales (colección `food`, no es unión) — la única de las 5 que no depende de D1.
- **Frontera F5 (interceptación de `a[href^="#"]`):** los enlaces de `seenIn`, `reservas-table`, prosa de práctica y maps-link son planos; la interceptación SPA es F5 (concern de STATE sigue abierto).

**Blocker/concern carry-forward:**
- **D-04-D/D1 (CRÍTICO):** resolver la materialización SQL / query de las colecciones-unión `artist`/`reference` antes del Plan 05. Detalle completo en `deferred-items.md` (D-04-D).
- D-04-A/B/C de planes previos siguen abiertos (envoltorio `<div class="">` de MDC sin `:tag=false` en DetailPhoto/TheHero; variante metro/metro-b del timeline; `**`→`<strong>` vs `<b>` semántico).

## Self-Check: PASSED

- Ficheros verificados en disco: `app/utils/foodGroups.ts`, `tests/unit/foodGroups.spec.ts`, `app/components/GastroCard.vue`, `app/components/GastroSection.vue`, `app/components/ArtistCard.vue`, `app/components/ReservasSection.vue`, `app/components/PracticaSection.vue`, `eslint.config.mjs`, `deferred-items.md`, `04-04-SUMMARY.md`.
- Commits verificados en git: `53b525f` (test RED), `ed1133d` (feat GREEN), `11326ae` (feat Task 2).
- Gates verdes: `pnpm test:unit` (27/27, incl. los 6 de foodGroups), `pnpm typecheck` (exit 0), `pnpm lint` (repo completo, exit 0); todas las gates de grep de los `<automated>` (gastro-card-badge/gastro-section-title/arch-term/reservas-table/section-eyebrow presentes; AUSENCIA de `<style>` en los 5 componentes).
- Sin regresiones: `pnpm test:data` (295/295).
- Paridad de DOM verificada con render real (`pnpm generate` + 2 probes temporales eliminados): orden canónico de gastronomía, gastro-card, artist-trip de bernini, glosario (arch-glossary + arch-term), tabla de reservas (strong/plano + is-done + badges), listas planas de artista vs detail-list de practica, media inline-styled.

---
*Phase: 04-render-de-contenido-modos-de-ritmo*
*Completed: 2026-06-20*
