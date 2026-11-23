---
phase: 04-render-de-contenido-modos-de-ritmo
plan: 02
subsystem: ui
tags: [nuxt, vue, mdc, mdc-renderer, components-override, dropcap, detail-list, art-link, parity]

# Dependency graph
requires:
  - phase: 02-datos-tipados
    provides: "esquema zod Monument (sections[].body Md, facts, artists/arch Link[], culture, sorrentino, mapsQuery) + 38 YAML de monumento migrados"
  - phase: 03-pagina-layout-tema
    provides: "patrón de componente (script setup lang=ts + <MDC> + markup verbatim + CERO CSS), TripView/useTrip, CSS editorial global, eslint per-file allowlist (Topbar/Timeline)"
  - phase: 04-render-de-contenido-modos-de-ritmo (Plan 01)
    provides: "DetailPhoto.global.vue (resuelve :detail-photo), decisión Pitfall 1 = opción b (NO ProseUl global)"
provides:
  - "app/components/MonumentCard.vue — la .card de monumento completa data-driven (UI-02): header/hero plano/prosa MDC con dropcap/facts/maps-link/sorrentino/culture/notes shell"
  - "Patrón: override LOCAL de tags en <MDCRenderer :components> con componentes OBJETO (ul→detail-list, a→art-link) sin tocar el registro global — resuelve Pitfall 1 sin romper artistas"
  - "Patrón: <MDC> + :tag=false (+ unwrap opcional) para render SIN <div> envoltorio (paridad de marcado)"
affects: [04-05-hero-cableado, 05-derivados-navegacion, 07-mapa-fallback-imagen]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Override de tag inline en MDC vía <MDC v-slot=body> → <MDCRenderer :body :components :tag=false>: scope LOCAL al componente (objeto, no .global.vue)"
    - "Componente local render-function (defineComponent + h) tipado DefineComponent<any,any,any> para encajar en el prop components de MDCRenderer"
    - "Campos Md vs plano detectados por grep sobre los 38 YAML: facts.value y culture.text/artists.label/arch.label van por <MDC>, no por interpolación"

key-files:
  created:
    - app/components/MonumentCard.vue
  modified:
    - eslint.config.mjs

key-decisions:
  - "Pitfall 1 resuelto LOCALMENTE (sin ProseUl global, opción b de 04-01): <MDCRenderer :components=\"{ ul: DetailListUl }\"> con un componente OBJETO local que emite <ul class=\"detail-list\"> — las listas de artista (otro componente) quedan intactas"
  - "card-artists/card-arch: la convención de datos F2 NO coincide con el <interfaces> del plan — el label ES Markdown completo con prefijo + enlace (`Artistas: [Bernini](#art-bernini)`); se renderiza con <MDC> + override a→ArtLink (repone class=\"art-link\"), NO con prefijo hardcodeado + <a> manual"
  - "facts[].value (tipado z.string) lleva Markdown en 2 fichas (san-luigi enlace, pantheon **negrita**) → se renderiza con <MDC unwrap=\"p\" :tag=false>, no como texto plano"
  - "culture[]: la migración F2 codificó el label del .culture-box como culture[0] con text:'' (verificado en las 18 fichas) → culture[0].title = label, culture.slice(1) = ref-items"
  - ":tag=false en todos los <MDC>/<MDCRenderer> para suprimir el <div> envoltorio que mete MDCRenderer por defecto (verificado en render real con pnpm generate)"
  - "A4 (maps-link apóstrofo): encodeURIComponent deja `'` literal (no %27 como el original) — funcionalmente idéntico; los acentos (%C3%A8) sí coinciden; se sigue la prescripción del plan"

patterns-established:
  - "Override de prose-tag scoped a un componente: pasar el componente como OBJETO (no nombre) en :components de <MDCRenderer> → resolveComponentInstance lo usa tal cual, sin registro global"
  - "Marcado inline whitespace-sensitive (card-artists con .art-link inline-block): una línea con separadores {{ ' ' }} explícitos + relajación per-file de vue/*-content-newline + vue/max-attributes-per-line (paridad por construcción, no reformateable)"

requirements-completed: [UI-02]

# Metrics
duration: 35min
completed: 2026-06-20
---

# Fase 4 Plan 02: MonumentCard — la ficha de monumento data-driven Summary

**`MonumentCard.vue` reproduce 1:1 la `.card` de monumento (index.html:2450-2510): prosa por secciones con `<MDC>` SIN unwrap (dropcap en la 1ª), `:detail-photo` resuelto, listas `.detail-list` y enlaces `.art-link` vía override LOCAL de tags en `<MDCRenderer :components>` (sin ProseUl global → artistas intactos), hero plano (D-01) y notas shell (D-02); paridad de marcado verificada byte-a-byte con un render real.**

## Performance

- **Duration:** ~35 min (incluye un render real con `pnpm generate` para verificar paridad de DOM, dado que el plan defiere la verificación E2E al Plan 05)
- **Started:** 2026-06-20T10:11Z (carga de plan + lectura de fuentes + greps sobre los 38 YAML)
- **Completed:** 2026-06-20T10:46Z
- **Tasks:** 1 (type=auto)
- **Files modified:** 2 (1 creado: MonumentCard.vue + 1 modificado: eslint.config.mjs)

## Accomplishments
- **`app/components/MonumentCard.vue`** — la `.card` de monumento COMPLETA, transcripción 1:1 del markup de `index.html:2450-2510` + el patrón `card-artists`/`card-arch` (2521), data-bound desde un `Monument` tipado, CERO CSS, sin `<style scoped>`.
- **Pitfall 2 (dropcap) resuelto:** `sections[].body` se renderiza con `<MDCRenderer :tag=false>` SIN unwrap → `<p>` reales como hijos DIRECTOS de `.card-section`; la 1ª sección lleva el dropcap (sin clase extra), las 2..n llevan `.no-dropcap`. Verificado: el `<p>` no queda envuelto en ningún `<div>`.
- **Pitfall 1 (`.detail-list`) resuelto LOCALMENTE:** override `ul`→`DetailListUl` (componente objeto local) en `:components` de `<MDCRenderer>` → `<ul class="detail-list">` con ✦+bordes SOLO en MonumentCard; las listas de artista (otro componente, sin clase) quedan intactas. NO se creó ningún `ProseUl.global.vue` (decisión b de 04-01 honrada).
- **`:detail-photo` resuelto:** `DetailPhoto.global.vue` (Plan 04-01) renderiza `.detail-photo > img` + caption dentro de la prosa. Verificado en el render real.
- **`card-artists`/`card-arch` con paridad exacta:** descubierta la convención real de F2 (el `label` es Markdown completo con prefijo + enlace; la nota es un span inline) y reproducida con `<MDC>` + override `a`→`ArtLink` (repone `class="art-link"`) — el HTML sale **byte-idéntico** al original (verificado en vaticano 3-enlaces y pantheon con nota).
- **Verificación de render REAL:** dado que el plan defiere la verificación de DOM al Plan 05, se montó un probe temporal + `pnpm generate` para confirmar que `:detail-photo`, `.detail-list`, dropcap, facts (incl. Markdown), maps-link, sorrentino, culture-box y notes shell salen como el original; el probe se eliminó y `nuxt.config.ts` se revirtió.

## Task Commits

1. **Task 1: MonumentCard — .card verbatim con prosa MDC (dropcap), hero plano y notas shell (UI-02)** - `e710932` (feat) — incluye la relajación per-file en `eslint.config.mjs` (deviation Rule 3).

**Plan metadata:** `<docs-hash>` (docs: complete plan — SUMMARY/STATE/ROADMAP/REQUIREMENTS).

## Files Created/Modified
- `app/components/MonumentCard.vue` — la ficha de monumento data-driven (UI-02). `defineProps<{ monument: Monument }>()`; dos componentes locales render-function (`DetailListUl` para `ul`→`.detail-list`, `ArtLink` para `a`→`.art-link`); prosa por secciones con `<MDCRenderer :tag=false :components>`; facts/sorrentino/culture/note con `<MDC unwrap="p" :tag=false>`; maps-link con `encodeURIComponent` + `rel="noopener"`; notes-area shell con `data-note-key` sin v-model. CERO CSS.
- `eslint.config.mjs` — bloque per-file para `MonumentCard.vue` que apaga `vue/singleline-html-element-content-newline`, `vue/multiline-html-element-content-newline` y `vue/max-attributes-per-line` (el marcado de `card-artists` es whitespace-sensitive y no admite reformateo sin perder paridad de espaciado).

## Decisions Made

- **Override LOCAL de tags en MDC (no global).** `<MDC>` resuelve componentes inline contra el registro GLOBAL (por eso DetailPhoto es `.global.vue`), pero `<MDCRenderer>` acepta un prop `components` (`Record<string, string | DefineComponent<any,any,any>>`) que se mergea sobre el mapa de prose. Pasando el componente como **objeto** (no nombre), `resolveComponentInstance` lo usa tal cual sin buscarlo en el registro global → el override es LOCAL a MonumentCard. Así `ul`→`.detail-list` y `a`→`.art-link` NO afectan a otros componentes (artistas). Mecanismo verificado leyendo `MDCRenderer.vue` (líneas 85, 116-117, 297-314) y confirmado en el render real.
- **`:tag=false` obligatorio para la paridad de marcado.** `<MDC unwrap="p">` (y `<MDCRenderer>` por defecto) NO eliminan el envoltorio raíz: `unwrap` solo desenvuelve el `<p>` interno, pero `tag` por defecto es `"div"` → sale `<div class="">…</div>`. Con `:tag=false` no hay envoltorio. Se aplica a TODOS los `<MDC>`/`<MDCRenderer>` de MonumentCard.
- **card-artists/card-arch: el plan asumía mal la forma del dato.** El `<interfaces>` del plan suponía `label` plano + prefijo hardcodeado + `<a class="art-link">` manual. La realidad (verificada en las 21 entradas de cada bloque): `label` es Markdown con el prefijo "Artistas:"/"Arquitectura:" en la 1ª entrada + el enlace `[Texto](#ref)`, las siguientes solo el enlace, y `note` (solo pantheon) es la anotación inline. Renderizado con `<MDC>` por entrada + override `a`→`ArtLink` + separador `{{ ' ' }}` explícito → byte-idéntico al original.
- **culture[] codifica el label del box como culture[0] con text:''** (decisión de la migración F2). Verificado en las 18 fichas con culture: exactamente una entrada de texto vacío y siempre la primera, con título "Referencias …". Por eso `culture[0].title` es el `<span class="label">` y `culture.slice(1)` son los `.ref-item`.
- **facts[].value puede ser Markdown** aunque el esquema lo tipe `z.string` (2 fichas). Se renderiza con `<MDC>` para reproducir el `<strong>`/`<a>` del original.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] El render de `card-artists`/`card-arch` del plan habría divergido (label es Markdown, no texto plano)**
- **Found during:** Task 1 (lectura de los YAML + verificación de render real)
- **Issue:** El `<interfaces>`/`<action>` del plan prescribía `<a class="art-link" :href="'#'+link.ref">{{ link.label }}</a>` con prefijo "Artistas:"/"Arquitectura:" hardcodeado. Pero los datos de F2 guardan el bloque ENTERO como Markdown en `label` (prefijo + `[Texto](#ref)`), con la 1ª entrada llevando el prefijo. Interpolar `link.label` como texto plano habría mostrado el Markdown crudo (`Artistas: [Bernini](#art-bernini)`), y hardcodear el prefijo lo habría DUPLICADO.
- **Fix:** Render de cada `label` con `<MDC>` + override LOCAL `a`→`ArtLink` (componente objeto que repone `class="art-link"`, que `ProseA` no pone); separador `{{ ' ' }}` entre enlaces; la nota (pantheon) en su `<span style>` inline VERBATIM. El prefijo viene del propio dato.
- **Files modified:** app/components/MonumentCard.vue
- **Verification:** Render real (`pnpm generate`) byte-idéntico al original en vaticano (3 enlaces + 2 de arquitectura) y pantheon (1 enlace + nota). `pnpm typecheck`/`pnpm lint` verdes.
- **Committed in:** `e710932` (commit de Task 1)

**2. [Rule 1 - Bug] `facts[].value` y la estructura de `.culture-box` habrían divergido**
- **Found during:** Task 1 (greps sobre los 38 YAML)
- **Issue:** (a) `facts[].value` lleva Markdown en san-luigi (enlace) y pantheon (**negrita**); interpolarlo como texto mostraría `**` y `[..](..)` crudos. (b) El `<span class="label">` del `.culture-box` NO es texto fijo (varía: "Referencias culturales"/"literarias"/"culturales y literarias") y la migración F2 lo codificó como `culture[0]` con `text:''`; un `v-for` ingenuo sobre todo `culture[]` metería un `.ref-item` vacío espurio y un label hardcodeado incorrecto.
- **Fix:** (a) `facts[].value` → `<MDC unwrap="p" :tag=false>`. (b) `<span class="label">{{ culture[0].title }}</span>` + `v-for="ref in culture.slice(1)"` para los `.ref-item`.
- **Files modified:** app/components/MonumentCard.vue
- **Verification:** Render real: pantheon facts muestran `<strong>entrada con hora</strong>`; culture-box con label correcto y sin ref-item vacío. typecheck/lint verdes.
- **Committed in:** `e710932` (commit de Task 1)

**3. [Rule 3 - Blocking] Envoltorio `<div class="">` de MDC + fricciones de tipo/lint**
- **Found during:** Task 1 (typecheck + lint + render real)
- **Issue:** (a) `<MDC unwrap="p">` deja un `<div class="">` envoltorio (divergencia de marcado) → se añadió `:tag=false`. (b) Pasar `ArtLink` (con prop `href` tipada) en `:components` disparaba TS2322 de varianza → anotación `DefineComponent<any,any,any>` con `eslint-disable-next-line @typescript-eslint/no-explicit-any` (precedente useTrip F3). (c) El marcado inline de `card-artists` (whitespace-sensitive) violaba `vue/*-content-newline`/`max-attributes-per-line` → relajación per-file en `eslint.config.mjs` (precedente Topbar/Timeline).
- **Fix:** `:tag=false` en todos los `<MDC>`/`<MDCRenderer>`; anotación de tipo + eslint-disable local; bloque per-file en eslint.config.mjs.
- **Files modified:** app/components/MonumentCard.vue, eslint.config.mjs
- **Verification:** `pnpm typecheck` exit 0; `pnpm lint` (repo completo) exit 0; render real sin `<div class="">` (salvo el del caption de DetailPhoto, fuera de alcance).
- **Committed in:** `e710932` (commit de Task 1)

---

**Total deviations:** 3 (2 bugs de paridad por desajuste plan↔datos F2, 1 blocking de tipo/lint/envoltorio MDC).
**Impact on plan:** Las tres son necesarias para la paridad/correctitud exigida por el `core value` (idéntico al index.html). NO hay scope creep: solo afectan a `MonumentCard.vue` (el `files_modified` del plan) + la relajación per-file de eslint (precedente 04-01). Los datos de F2 NO se tocaron.

## Issues Encountered
- **`<MDC>` no expone `components`.** El wrapper `<MDC>` solo reenvía `tag/class/value/unwrap` a `MDCRenderer`; para el override de tags hay que usar el slot de `<MDC>` (`v-slot="{ body }"`) y pasar el AST a `<MDCRenderer :components>`. Confirmado leyendo `MDC.vue`/`MDCRenderer.vue`.
- **Resolución de componentes en MDC.** `resolveComponentInstance` resuelve nombres-string contra el registro GLOBAL (scope de MDCRenderer), por eso un nombre local no funcionaría; la vía local es pasar el **objeto** del componente, que se usa tal cual.
- **Flakiness del content DB en `pnpm dev`.** Tras varios ciclos de HMR, el endpoint `__nuxt_content/monument/query` devolvió `no such table: _content_monument`. Se resolvió verificando con `pnpm generate` (build SSG determinista, la misma vía del Plan 05) en lugar de dev.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- **Plan 04-05 (cableado de TheHero)** y **Plan 05 (derivados/navegación)** ya pueden instanciar `<MonumentCard :monument>` por cada id de `day.cards[]` (vía `DaySection`/`TripView`). El componente es presentacional puro (sin estado), así que el filtrado por ritmo (clases de body de `useTripModes`) y el modo resumen aplican por CSS sin tocarlo.
- **Verificación E2E (Plan 05, `tests/parity/render-cards.spec.ts`):** este plan ya verificó el DOM real con un probe temporal + `pnpm generate` (detail-photo resuelto, detail-list, dropcap, art-link, facts con Markdown, maps-link, sorrentino, culture, notes shell). El Plan 05 lo formaliza en un spec Playwright autocontenido sin rebaselinar el golden (D-08).
- **Frontera F5 (interceptación de `a[href^="#"]`):** los enlaces `.art-link` y los de prosa de sección son planos (`href="#…"`), la interceptación SPA es F5 (concern de STATE sigue abierto).
- **Frontera F7 (D-01/D-02):** el hero es `<img>` plano (fallback SVG = F7) y las notas son shell sin persistencia (FEAT-04 = F7).
- **Deferred (ver `deferred-items.md` D-04-A):** `DetailPhoto.global.vue` y `TheHero.vue` (planes anteriores) dejan un `<div class="">` envoltorio por usar `<MDC unwrap="p">` sin `:tag=false`. Fuera de alcance de 04-02; arreglo trivial sugerido para un plan futuro.

## Self-Check: PASSED

- Fichero verificado en disco: `app/components/MonumentCard.vue`, `eslint.config.mjs`, `04-02-SUMMARY.md`, `deferred-items.md`.
- Commit verificado en git: `e710932` (feat 04-02).
- Gates verdes: `pnpm typecheck` (exit 0), `pnpm lint` (repo completo, exit 0), greps `<automated>` (no-dropcap/data-note-key/encodeURIComponent presentes; AUSENCIA de onerror/@error/<style>).
- Sin regresiones: `pnpm test:unit` (21/21), `pnpm test:data` (295/295).
- Paridad de DOM verificada con render real (`pnpm generate` + probe temporal eliminado): card-artists byte-idéntico (vaticano/pantheon), `<p>` hijo directo de `.card-section` (dropcap), `.detail-list`, `.detail-photo`, facts con Markdown.

---
*Phase: 04-render-de-contenido-modos-de-ritmo*
*Completed: 2026-06-20*
