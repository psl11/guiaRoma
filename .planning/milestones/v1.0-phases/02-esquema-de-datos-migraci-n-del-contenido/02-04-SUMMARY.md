---
phase: 02-esquema-de-datos-migraci-n-del-contenido
plan: 04
subsystem: database
tags: [nuxt-content, yaml, monuments, migration, data-04, data-06, mdc, cross-refs, fidelity-gate]

# Dependency graph
requires:
  - phase: 02
    plan: 01
    provides: "MonumentSchema (shared/schemas.ts) + schema.spec.ts (validacion por fichero); enum Motif/PlaceType, Link {ref,label,note}"
  - phase: 02
    plan: 02
    provides: "scripts/migration-diff.ts + tests/data/migration-diff.spec.ts (puerta de fidelidad 1:1 index.html ⇄ YAML por id, con SKIP de ids no migrados)"
provides:
  - "21 fichas de monumento (viernes/sabado/domingo) en content/trips/roma/monuments/*.yml validadas contra MonumentSchema y equivalentes 1:1 al index.html (texto + enlaces) por migration-diff"
  - "Patron de migracion de monument: cross-refs card-artists/card-arch como arrays de Link; detail-photo como :detail-photo{src/alt/caption} MDC inline en su posicion exacta; culture-box con item-cabecera {title:'Referencias...', text:''}; facts/hero/sorrentino estructurados; day/coords/type/roman desde places; motif desde CARD_TO_MOTIF"
  - "scripts/migration-diff.ts endurecido para validar fichas reales: extrae <img alt>, separa hermanos en linea con espacio, strip de MDC inline (alt/caption), day estructural, %27 en mapsQuery"
affects: [wave-3, plan-02-05, plan-fichas-artistas, plan-fichas-gastronomia, verificacion-paridad, fase-4-render, data-04, data-06]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Monument YAML: un objeto por fichero, slug = ancla #id = basename; prosa por secciones [{heading,body}] en orden de DOM, body Markdown-inline (**strong**/_em_/[t](#id))"
    - "Cross-refs card-artists → artists[] de Link y card-arch → arch[] de Link; la etiqueta visible (Artistas:/Arquitectura:) + el [texto](#id) viven en Link.label (Md), la nota parentetica en Link.note; enlaces multiples = varios Links"
    - "detail-photo = componente MDC :detail-photo{src alt caption} EMBEBIDO en el body de su seccion, en su posicion exacta (en 'En que fijarse' ANTES de la lista); detail-list = lista markdown (guion) en el mismo body"
    - "culture-box: item-cabecera {title: '<etiqueta del box>', text: ''} seguido de un item por ref-item {title: ref-title, text: prosa} — preserva la etiqueta variable del box (Referencias literarias/culturales/...) sin redefinir el esquema"
    - "Campos desde places[] (day/coords/type/roman) y desde CARD_TO_MOTIF (motif); vaticano guided + badge guiado, auditorium concert (Domingo noche), pantheon day 'Viernes / Sábado'"

key-files:
  created:
    - content/trips/roma/monuments/galleria-sciarra.yml
    - content/trips/roma/monuments/fontana-trevi.yml
    - content/trips/roma/monuments/santignazio.yml
    - content/trips/roma/monuments/pantheon.yml
    - content/trips/roma/monuments/piazza-navona.yml
    - content/trips/roma/monuments/campo-fiori.yml
    - content/trips/roma/monuments/vaticano.yml
    - content/trips/roma/monuments/doria-pamphilj.yml
    - content/trips/roma/monuments/santeustachio.yml
    - content/trips/roma/monuments/castel-santangelo.yml
    - content/trips/roma/monuments/tempietto.yml
    - content/trips/roma/monuments/smt.yml
    - content/trips/roma/monuments/fontanone.yml
    - content/trips/roma/monuments/auditorium.yml
    - content/trips/roma/monuments/giardino-aranci.yml
    - content/trips/roma/monuments/buco-serratura.yml
    - content/trips/roma/monuments/bocca-verita.yml
    - content/trips/roma/monuments/ghetto.yml
    - content/trips/roma/monuments/tartarughe.yml
    - content/trips/roma/monuments/vittoriano.yml
    - content/trips/roma/monuments/monti.yml
  modified:
    - scripts/migration-diff.ts

key-decisions:
  - "Etiqueta del culture-box (Referencias literarias/culturales/...) como item-cabecera {title, text:''} en culture[], porque MonumentSchema no modela un label de box y el esquema no se puede redefinir (Plan 01); preserva las palabras visibles y deja a Fase 4 tratar el primer item como cabecera"
  - "Prefijo visible Artistas:/Arquitectura: incluido en el primer Link.label de artists[]/arch[] (es texto que el migration-diff cuenta); enlaces multiples como Links sucesivos; la nota en <span> (p.ej. '(aquí está enterrado)' del Pantheon) en Link.note"
  - "Endurecer scripts/migration-diff.ts (Plan 02) en vez de distorsionar los datos: sin el fix el gate de DATA-04 era insatisfacible para CUALQUIER ficha real (toda ficha tiene facts pegados, hero.alt, day, y/o mapsQuery con apostrofo). El fix preserva/aumenta los dientes (alt ahora se compara, frase/enlace perdidos se siguen detectando)"
  - "coliseo NO recibe ficha (es guided y no tiene article.card; vive solo en places/timeline) — confirmado por acceptance_criteria del plan"

patterns-established:
  - "Migracion monument 1:1 verificada por doble puerta: schema.spec (forma/enum por fichero) + migration-diff (equivalencia normalizada de texto+enlaces por id). Bucle de trabajo: escribir YAML → diffEntry → corregir hasta 0 missing/extra"
  - "MDC inline en datos: el harness de fidelidad es consciente de :component{...} (extrae alt/caption, descarta nombre/atributos/src) para que la prosa con componentes case con el HTML"

requirements-completed: [DATA-04, DATA-06, DATA-01]

# Metrics
duration: 27min
completed: 2026-06-19
---

# Phase 2 Plan 04: Migración 1:1 de 21 fichas de monumento (viernes/sábado/domingo) Summary

**Las 21 fichas de monumento de viernes, sábado y domingo (galleria-sciarra..monti, incl. vaticano guiado y auditorium concierto) migradas 1:1 a YAML tipado en `content/trips/roma/monuments/` — prosa por secciones en Markdown-inline lista para MDC, `detail-photo` como componente inline en su posición exacta, cross-refs `card-artists`/`card-arch` como arrays de Link, y cada una validada contra `MonumentSchema` (DATA-01) y verificada equivalente al `index.html` (texto + enlaces, 0 pérdidas/sobrantes) por `migration-diff` (DATA-04).**

## Performance

- **Duration:** ~27 min
- **Started:** 2026-06-19T08:46:49Z
- **Completed:** 2026-06-19T09:13Z
- **Tasks:** 2 (autónomas)
- **Files created:** 21 YAML de monumento
- **Files modified:** 1 (scripts/migration-diff.ts — deviación Rule 1/3)

## Accomplishments
- 14 fichas viernes/sábado (galleria-sciarra, fontana-trevi, santignazio, pantheon, piazza-navona, campo-fiori, vaticano, doria-pamphilj, santeustachio, castel-santangelo, tempietto, smt, fontanone, auditorium) migradas 1:1.
- 7 fichas domingo (giardino-aranci, buco-serratura, bocca-verita, ghetto, tartarughe, vittoriano, monti) migradas 1:1; **sin** ficha espuria de coliseo.
- `vaticano` type guided + badge guiado; `auditorium` type concert (day Domingo noche); `pantheon` day "Viernes / Sábado", motif pantheon.
- Cross-refs `card-artists` (→ #art-*) y `card-arch` (→ #arq-*) conservados como arrays de Link en las 8 fichas que los tienen (fontana-trevi, santignazio, pantheon, piazza-navona, vaticano, doria-pamphilj, castel-santangelo, bocca-verita, ghetto, vittoriano, tempietto, smt, fontanone), más los enlaces internos inline de la prosa de vaticano (#art-rafael/#art-michelangelo/#art-bernini).
- `detail-photo` como `:detail-photo{src alt caption}` MDC inline en su posición exacta (antes de la `detail-list` en "En qué fijarse"); `culture-box`/`sorrentino-box` conservados.
- **DATA-04:** las 21 fichas pasan `migration-diff` con 0 palabras/enlaces faltantes o sobrantes. **DATA-01/05:** las 21 validan contra `MonumentSchema`.

## Task Commits

Cada tarea se commiteó atómicamente:

1. **Task 1: Migrar viernes + sábado (14 monumentos)** — `1f2b4db` (feat) — incluye el fix de `scripts/migration-diff.ts`
2. **Task 2: Migrar domingo (7 monumentos)** — `297f2bf` (feat)

**Plan metadata:** (commit final docs — este SUMMARY + STATE + ROADMAP)

## Files Created/Modified
- `content/trips/roma/monuments/*.yml` (21) — una ficha de monumento por fichero (objeto YAML), slug = ancla `#id` = basename. Cada una: slug/trip/roman/name/italian/day/coords/type/motif, hero {src,alt}, sections [{heading, body}] en orden de DOM, facts [{label,value}], mapsQuery, y opcionalmente badge/artists[]/arch[]/sorrentino/culture[].
- `scripts/migration-diff.ts` — endurecido para validar fichas reales (ver Deviations).

## Decisions Made
- **Etiqueta del `culture-box` como item-cabecera.** El box (`Referencias literarias`/`culturales`/`culturales y literarias`) tiene una etiqueta variable que `MonumentSchema.culture` (`[{title, text}]`) no modela. Como no se puede redefinir el esquema (Plan 01), se codifica como primer item `{title: '<etiqueta>', text: ''}` seguido de un item por `ref-item`. Preserva las palabras visibles (DATA-04) y deja a Fase 4 tratar el primer item como cabecera del box.
- **Prefijo `Artistas:`/`Arquitectura:` en `Link.label`.** Es texto visible que el migration-diff cuenta; va en la `label` (Md) del primer Link de `artists[]`/`arch[]`, con el `[texto](#id)` que aporta el enlace. La nota parentética en `<span>` (Pantheon: "(aquí está enterrado)") va en `Link.note`.
- **`coliseo` sin ficha** (guided sin `article.card`; vive solo en `places`/timeline) — confirmado por acceptance_criteria.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug / Rule 3 - Blocking] `scripts/migration-diff.ts` no podía validar fichas reales de monumento (gate DATA-04 insatisfacible)**
- **Found during:** Task 1 (primera ficha, galleria-sciarra)
- **Issue:** El harness de fidelidad (Plan 02) producía diffs falsos para CUALQUIER monumento real, por cuatro causas: (a) el HTML pega el texto de elementos en línea adyacentes sin separador (`.facts-row`: `<span>label</span><span>value</span>` → "labelvalue"), mientras el lado YAML une campos con espacio → token de frontera no casaba (`críticol-v` vs `crítico`+`l-v`); (b) `<img alt>` NO se extraía del HTML pero la denylist declara que `alt` SÍ cuenta en YAML → `hero.alt` y el alt de `detail-photo` salían como "texto sobrante"; (c) el `:detail-photo{src=… alt=… caption=…}` MDC del body inyectaba el nombre del componente, la URL y los nombres de atributo como palabras sobrantes; (d) `day` (metadato de `places`, no del texto de la ficha) salía como sobrante; (e) `encodeURIComponent` deja el apóstrofo sin escapar, pero las `.maps-link` del index.html usan `%27` → el enlace de Maps de toda ficha con apóstrofo (Sant'Ignazio, Campo de' Fiori, Sant'Eustachio, Sant'Angelo, dell'Acqua) salía como faltante/sobrante. Sin arreglar esto, DATA-04 era imposible de cumplir para datos fieles.
- **Fix:** En `scripts/migration-diff.ts`: (a) `domToMarkdown` une hijos con un espacio (normalize colapsa el doble espacio en prosa, inocuo); (b) `domToMarkdown` emite el `alt` de `<img>` (simétrico con la denylist; añade dientes); (c) nuevo `stripMdcComponents` que, en el lado YAML, reduce `:componente{...}` a sólo los valores de `alt`/`caption` (descarta nombre, llaves, nombres de atributo y `src`); (d) `day` añadido a `STRUCTURAL_KEYS` (como `coords`/`type`); (e) nuevo `encodeMapsQuery` = `encodeURIComponent(q).replace(/'/g,'%27')` para casar la codificación del HTML (verificado: `%27` en las 38 `.maps-link`).
- **Files modified:** scripts/migration-diff.ts
- **Verification:** Los 11 casos siempre-corren del normalizador y los 4 fixtures negativos siguen en verde (el gate conserva los dientes: detecta frase/enlace/ancla faltantes). Las 21 fichas migradas dan 0 missing/extra en `migration-diff.spec.ts`. `eslint scripts tests/data` en verde.
- **Committed in:** `1f2b4db` (parte del commit de Task 1)

---

**Total deviations:** 1 auto-fixed (Rule 1/3 — corrección del gate de fidelidad, imprescindible para cumplir DATA-04 sobre datos reales). Sin scope creep: ningún cambio de esquema (Plan 01) ni del contrato; el fix sólo hace que el harness compare correctamente texto+enlaces y mantiene/aumenta su capacidad de detección.
**Impact on plan:** El fix es la condición necesaria para que el plan pueda demostrar DATA-04. Los datos migrados no se distorsionaron para "pasar" el test.

## Issues Encountered
- **`tsx` no instalado** para un runner ad-hoc por-id: descartado; se usó el `migration-diff.spec.ts` real vía Vitest (canónico) más un spec inspector temporal (`tests/data/_inspect.spec.ts`, **eliminado** antes de finalizar) para iterar el multiset de palabras/enlaces.
- **Falsa lectura inicial de equivalencia de Maps:** el inspector imprimía ambos conjuntos de enlaces y el apóstrofo decodificado (`Sant'Ignazio`) parecía igual al `%27` del HTML; el spec real (que compara como conjuntos) lo destapó. Resuelto con `encodeMapsQuery` (deviación 1e).

## Cross-plan / Out-of-scope notes (no son fallos de este plan)
- **`tests/data/schema.spec.ts` → `conteo monument: expected 21 to be 38`**: el conteo agregado de 38 monumentos sólo pasa cuando el **Plan 02-05** migre los 17 restantes (lunes/martes). Las 21 fichas de ESTE plan validan por fichero. No es un fallo de este plan.
- **`tests/data/invariants.spec.ts` (5 rojos)**: el spec de invariantes NO es incremental (carga todas las colecciones y exige que toda cross-ref resuelva). Está rojo porque otras colecciones de Wave 3/2 aún no existen: `day.cards[]` necesita 38 monumentos (faltan 17, Plan 05), `timeline.ref` y anclas inline apuntan a `#g-*` (gastronomía, otro plan) y `#art-*`/`#arq-*` (artistas, otro plan). **Verificado que TODAS mis refs `artists[].ref`/`arch[].ref` (arq-antigua/barroco/medieval/moderna/renacimiento, art-bernini/borromini/caravaggio/michelangelo/pozzo/rafael) son anclas reales del index.html** → resolverán en verde cuando lleguen las fichas de artistas. La verificación de ESTE plan es `schema.spec && migration-diff.spec` (ambos en verde para los 21 ids), no invariants.

## Next Phase Readiness
- 21/38 monumentos migrados; el Plan 02-05 (paralelo en Wave 3) migrará los 17 de lunes/martes y dejará el conteo de schema y el invariants en verde junto con los planes de artistas/gastronomía/reference.
- El patrón de migración de monument (cross-refs, detail-photo MDC, culture-box, facts/hero/sorrentino, places/motif) queda establecido y verificado para que el Plan 05 lo reutilice 1:1.

## Known Stubs
None — las 21 fichas tienen contenido real y completo (texto + enlaces 1:1 con el index.html). No hay valores placeholder que lleguen a la UI; el `text: ''` del item-cabecera de `culture-box` es intencional (sólo porta la etiqueta del box en `title`) y queda documentado arriba.

## Self-Check: PASSED
- 21/21 ficheros de monumento verificados en disco.
- SUMMARY.md presente.
- Commits `1f2b4db` (Task 1) y `297f2bf` (Task 2) verificados en `git log`.

---
*Phase: 02-esquema-de-datos-migraci-n-del-contenido*
*Completed: 2026-06-19*
