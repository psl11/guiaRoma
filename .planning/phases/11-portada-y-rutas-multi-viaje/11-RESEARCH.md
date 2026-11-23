# Phase 11: Portada y rutas multi-viaje - Research

**Researched:** 2026-11-20
**Domain:** Nuxt 4 SSG routing (Nitro prerender, `github_pages` preset), Nuxt Content 3.14 source filtering, GitHub Pages static semantics, Playwright parity harness
**Confidence:** HIGH. Almost every claim was checked against `node_modules`, a real experimental build, or a probe against live GitHub Pages hosts.

## Summary

The phase is viable with the locked decisions, but three of them need corrections before the plan is written. All three were confirmed against a full experimental build of the phase, made in a scratch copy of the repo. In that build Roma lived at `/guiaRoma/trips/roma/`, the portada was at `/`, the legacy redirect script was in place, the drafts were excluded and the footer link was added. **All 56 goldens passed without `--update-snapshots`**, and the full gate went 76/80 green. The 4 red tests were exactly the assertions this phase has to invert, plus the footer-markup problem in finding 2.

**Corrections to locked decisions:**
1. **D-13 `definePageMeta({ key: route => route.fullPath })` does not work.** `fullPath` includes the hash. Vue Router updates `currentRoute` on every native fragment navigation (`popstate`), so each pill click changes the page key and **TripView is remounted**. This was verified: after clicking `#reservas`, the router's `fullPath` was `/trips/roma/#reservas` and `#inicio` had been replaced by a new node. Use `key: route => \`trip:${String(route.params.slug)}\``. With that key there was no remount after 3 pill clicks (verified).
2. **D-03 "shell.spec.ts:158 stays green because it uses `toContainText`" is false** if the link is a `<p>` inside `footer .container`. Playwright's strict mode fails because `locator('footer .container p') resolved to 2 elements` (verified). The link must be a **direct child of `<footer>`, outside `.container`**: `<p class="trip-back"><a href>← Todos los viajes</a></p>`. That way `footer .container p` still matches exactly one element. As a bonus, it needs **zero new CSS**: `footer p` (base.css) and the global `a` rule style it correctly. Verified: shell green, and visual-diff 56/56 green with this markup.
3. **A config-time helper with `node:fs` breaks `pnpm typecheck`.** The project has no `@types/node`, and Nuxt's tsconfig uses `"types": []`. If `nuxt.config.ts` imports a `.ts` file that uses `node:fs`, typecheck fails with TS2307. Use **`scripts/tripManifest.mjs` + `scripts/tripManifest.d.mts`** instead. Verified: typecheck exit 0, lint exit 0, generate OK.

**What was confirmed viable:**
- **D-16 (drafts outside Content in production):** viable as designed with `source: { include, exclude: ['trips/<slug>/**'] }` plus `process.env.NODE_ENV`. `nuxi build`/`generate` force `production` and `nuxi dev` forces `development`. Verified: the 6 `sql_dump` files contained **0 rows** from prueba/forma (today they hold 1+2+3+1+10+2) and no sentinel. In dev, prueba and forma load (200, sentinel present) and the portada does not list them.
- **Critical pitfall for the D-17 test:** `sql_dump.txt` is **base64(gzip(JSON))**. A plain `grep` gives a FALSE NEGATIVE: today's build HAS the prueba/forma rows and `grep -r CENTINELA` finds nothing. The test must decode with `zlib.gunzipSync(Buffer.from(txt,'base64'))`.
- **GitHub Pages behaviour:** a directory without a trailing slash gets a **301 to the slash form**, and `…/index.html` is served with 200. Verified with `curl` against hosts that report `server: GitHub.com`. The `serve` used by the specs **does not** mimic this (`cleanUrls` defaults to on: `/x/index.html` → 301 `/x/index`, and `/trips/roma` → 200 without a redirect). For the new specs, use a ~30-line `node:http` server that copies Pages behaviour (code below; verified).
- **Hash redirect:** the inline script lands in `<head>` **before the stylesheet** (with `tagPriority: 'critical'`). It goes `/guiaRoma/#pantheon` → `/guiaRoma/trips/roma/#pantheon`, the `index.html#gastronomia` form works too, and "Back" returns to the previous page **with a single press** (verified). No `sql_dump`/`.wasm` is requested on the portada or on Roma (verified).
- **Anchor scroll after the redirect:** it lands **exactly where a direct load of `/trips/roma/#x` lands** (with images blocked: identical px). But on a direct load, **deep anchors (`#pantheon`, `#gastronomia`) do not land in the viewport. This is pre-existing**: the v1.0 Nuxt build at `/guiaRoma/#pantheon` behaves the same, and so does the LIVE `index.html` of `main` (top=519 px / 8607 px). Only sections near the top (`#viernes`) land at 124 px. Tests must not assert `toBeInViewport` for deep anchors.

**Primary recommendation:** Implement exactly what CONTEXT.md describes, with the 3 corrections above (slug key, link outside `.container`, `.mjs`+`.d.mts` helper). Put the URL move, the `ROMA_URL` flip, the inversion of `shell.spec`/`build-isolation`/`romaChrome` and the `tests/trips` adjustments in **one commit**, so the gate never goes red between commits.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Trip list (portada) | Frontend Server (SSG prerender) | Browser (hydration from `_payload.json`) | `queryCollection('trip').select(...)` is resolved at prerender; the client reads the payload and never touches SQLite/WASM |
| Route per trip `/trips/<slug>/` | Frontend Server (Nitro prerender) | CDN/Static (Pages: 301 to slash) | `nitro.prerender.routes` derived from data; Pages serves `trips/<slug>/index.html` |
| Draft exclusion | Build (Content config, `source.exclude`) | — | It is a build-time decision; nothing draft reaches `.output/public` |
| Legacy `/#ancla` redirect | Browser (inline `<head>` script) | — | The fragment never reaches the server; Pages has no rewrite rules |
| Back link to the portada | Browser (full-document `<a href>`) | — | No SPA between trips (D-04); every trip is an isolated document |
| Parity verification | Test harness (Playwright + static server) | — | The harness copies the Pages topology (`<tmp>/guiaRoma/`) |

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Volver a la portada (ROUTE-06) — decidido por el usuario
- **D-01:** Enlace discreto **«← Todos los viajes»** en el **pie de todas las guías, Roma incluida**. Decisión explícita
  del usuario (2026-11-20, opción recomendada).
- **D-02:** Hallazgo del scout: **ninguna de las 56 goldens captura el pie** (las 14 vistas de
  `tests/parity/visual-diff.spec.ts:56-71` son `#inicio`, los 5 días, 5 referencias y 3 fichas; el `<footer>` va después
  de todas). Por tanto el enlace se añade **sin re-capturar ninguna golden**. La aprobación del usuario para re-capturar
  la del pie queda **sin usar**; si alguna golden falla tras añadir el enlace, es un bug de layout que se arregla, nunca
  `--update-snapshots`. — **Reversibility:** reversible
- **D-03:** El pie existe en **todas** las guías porque aloja el enlace: las líneas `trip.footer` (si las hay) van
  primero, como hoy; el enlace va después, en su propio elemento. Un viaje sin `footer` muestra un pie solo con el enlace.
  Esto **sustituye** la parte «sin pie» de D-14 de la Fase 10; el test `tests/trips/shape.spec.ts:317`
  (`footer` con count 0 en `prueba`) se actualiza a «el pie solo contiene el enlace de vuelta». El aserto de
  `shell.spec.ts:158` (`toContainText('Roma · 19—23 giugno 2026')`) sigue verde porque es `toContainText`.
- **D-04:** El enlace es `<a href>` de **documento completo** a `useRuntimeConfig().app.baseURL` (nunca `/guiaRoma/`
  literal), sin `NuxtLink`. Texto fijo de UI en español (no viene de trip.yml).
- **D-05:** El estilo del enlace reutiliza las reglas existentes de `footer` en `app/assets/css/base.css:993-1010`; si
  necesita algo propio, va en un fichero CSS **nuevo** (ver D-17), nunca editando `base.css`/`tokens.css`.

#### Portada (ROUTE-01)
- **D-06:** `app/pages/index.vue` pasa a ser la portada (componente nuevo, p. ej. `TripIndex.vue`). La portada consulta
  **solo** la colección `trip` con `.select(...)` de los campos que pinta; todo sale del payload prerenderizado.
- **D-07:** Cada tarjeta muestra: **título** (plano, sin Markdown), **fechas**, **destinos** y **resumen**, y toda la
  tarjeta enlaza a `{baseURL}trips/<slug>/` (barra final). **Sin imagen** en v1.1 (offline-first; las heros son de
  Wikimedia). Si un viaje no tiene alguno de los campos opcionales, la tarjeta lo omite (sin texto de relleno).
- **D-08:** Campos nuevos **opcionales** en `TripSchema` (`shared/schemas.ts`): `startDate` y `endDate` (ISO
  `YYYY-MM-DD`, para ordenar y para el texto de fechas), `destinations` (lista de strings no vacíos) y `summary`
  (Markdown-inline, una frase o dos). Roma los recibe en `content/trips/roma/trip.yml` (2026-06-19 → 2026-06-23,
  «Roma», resumen corto en el tono de la guía). — **Reversibility:** costly — los campos pasan a ser contrato de datos
  de todos los viajes.
- **D-09:** Texto de fechas generado de forma determinista desde `startDate`/`endDate` en español
  («19–23 de junio de 2026»; si cruza mes/año, ambos completos). Sin `Intl` dependiente de la configuración regional del
  navegador en el render prerenderizado: utilidad pura con tabla de meses y test unitario.
- **D-10:** Orden: por `startDate` **descendente** (el próximo viaje arriba); empate o sin fecha → por título.
- **D-11:** Chrome de la portada, texto fijo en español: `<title>` **«Guías de viaje»**, `<h1>` «Guías de viaje». La
  portada **no** tiene Topbar, buscador, pastillas, mapa ni pie de viaje. Respeta el tema guardado (color-mode global),
  sin conmutador propio. Estado vacío (sin viajes publicados): un párrafo «Todavía no hay viajes publicados.».
- **D-12:** La portada **no puede tener anclas propias** (`id`) que choquen con la redirección legacy (D-14).

#### URLs y prerender (ROUTE-02, ROUTE-04)
- **D-13:** Roma sirve en `/guiaRoma/trips/roma/` desde `app/pages/trips/[slug].vue` (el mismo `TripView`).
  `nitro.prerender.routes` = `['/']` + `/trips/<slug>/` de cada viaje **no draft**, derivado en build leyendo
  `content/trips/*/trip.yml` (no lista a mano); `crawlLinks` sigue activo como red y `failOnError: true`. Fijar
  `definePageMeta({ key: route => route.fullPath })` en `trips/[slug].vue`. Todo enlace interno a una guía lleva
  **barra final** (evita el 301 de GitHub Pages). El comportamiento real de Pages (barra final, 301, `autoSubfolderIndex`)
  lo investiga el researcher; plan B `autoSubfolderIndex: false` o `trailing-slash` si hiciera falta.
- **D-14 (redirección legacy, ROUTE-03):** script inline en `<head>` **solo en la portada** (`useHead`,
  `tagPosition: 'head'`), antes del primer paint: si `location.hash` cumple `^#[a-z0-9-]+$` →
  `location.replace(base + 'trips/roma/' + location.hash)`. Sin lista blanca de anclas (el sufijo validado basta y no
  hay anclas propias en la portada); hash vacío o que no cumple → se queda en la portada. `LEGACY_TRIP = 'roma'` es una
  constante de migración en código, no un dato. `/guiaRoma/index.html#x` es la misma página y se cubre igual.
  `location.replace` → sin entrada de historial → «Atrás» no hace bucle. El scroll al ancla tras la redirección lo
  resuelve la carga normal de Roma con hash (el researcher confirma que el mecanismo actual de Roma ya lo hace).
- **D-15:** Ninguna guía ni la portada pide `sql_dump.txt` ni `.wasm` al cargar (ROUTE-04): test Playwright sobre la
  build estática que lo asevera para la portada y para Roma.

#### Borradores (ROUTE-05)
- **D-16:** `draft: true` (opcional, booleano) en `TripSchema`. Un viaje draft, en build de producción, **no entra en
  Content** (las fuentes de `content.config.ts` excluyen sus carpetas leyendo los `trip.yml` en tiempo de config), así
  que no aparece en la portada, no se prerenderiza **y sus filas no llegan al `sql_dump` público** (cierra CR-01 de la
  Fase 9 y AR-10-02). En `pnpm dev` los draft **sí** se cargan (siguen accesibles por URL para `pnpm test:trips`), pero
  la portada **nunca** los lista, tampoco en dev. Se añade exactamente `draft: true` a `content/trips/prueba/trip.yml` y
  se activa el `# draft: true` comentado de `content/trips/forma/trip.yml` (única excepción a D-15 de la Fase 10, que ya
  la anticipaba). Si excluir por fuentes no es viable en Content 3.14, el researcher propone la alternativa con la misma
  garantía (nada draft en el `.output/public`, verificado por grep del centinela). — **Reversibility:** reversible
- **D-17:** `tests/data/build-isolation.spec.ts` se invierte de «no existe `.output/public/trips`» a: existe
  `trips/roma/index.html`; **no** existen `trips/prueba` ni `trips/forma`; los centinelas de prueba/forma no aparecen en
  **ningún** fichero de `.output/public` (incluidos los `sql_dump`).

#### Paridad (PAR-01, PAR-02)
- **D-18:** Orden obligatorio de commits: (1) `tests/parity/_harness.ts` con `ROMA_URL` (y origen/puerto si conviene)
  y todos los specs de paridad usándolo **con el valor actual** `/guiaRoma/` — puerta verde, cero cambio de
  comportamiento; (2) el movimiento de URL, cuyo **único** diff en los specs de Roma es el valor de `ROMA_URL` →
  `/guiaRoma/trips/roma/`. Más (3): `shell.spec.ts` invierte su aserto de «no `trips/`» (D-17) y añade el test que
  asevera que `/` sirve la portada y `ROMA_URL` sirve Roma (evita specs «verdes» contra la portada).
- **D-19:** Los 56 goldens pasan **sin `--update-snapshots`** y sin tocar `tests/parity/golden.spec.ts-snapshots/`;
  `golden.spec.ts` (excluido de la puerta, renderiza el `index.html` viejo) no cambia. Cualquier otro cambio en
  `tests/parity/` fuera de D-18 está prohibido. `tests/README.md` re-registra el conteo de tests de la puerta.
- **D-20:** Claves de `localStorage` sin cambios (`roma-*`, `roma-theme`): mismo origen, así que notas y ritmo de quien
  ya usa Roma siguen ahí tras el cambio de URL. Ningún código nuevo escribe ni migra claves.

#### Restricciones que se mantienen
- **D-21:** Sin cambios en `app/assets/css/base.css`, `tokens.css`, `fonts.css`, `leaflet.css`. Los estilos de la
  portada van en un fichero nuevo (p. ej. `app/assets/css/multitrip.css`) con **todos** los selectores bajo una clase
  raíz propia de la portada (p. ej. `.trip-index`), usando los tokens existentes; sin `<style scoped>`, sin `v-html`.
  Un test asevera que ningún selector de ese fichero alcanza el DOM de Roma (o la puerta de paridad lo demuestra).
- **D-22:** Builds y Playwright con Node 22; `rm -rf .data .nuxt .output` antes de generar; nunca `test:trips` a la vez
  que `generate`/`verify`; todo en `release/nuxt-4`.

### Claude's Discretion
- Nombre y forma exacta de los componentes (`TripIndex.vue`, `TripCard`…) y de la utilidad de fechas.
- Maquetación de la portada dentro del lenguaje visual existente (tipografías y tokens de Roma); la concreta el
  UI-SPEC.
- Cómo derivar las rutas de prerender (hook de Nitro, lectura de YAML en `nuxt.config.ts`, módulo local).
- Servidor estático de test que imite a GitHub Pages (301 a barra final) para los specs de redirección.

### Deferred Ideas (OUT OF SCOPE)
- Imagen de portada por viaje en las tarjetas — futuro (exige assets locales para offline).
- Mostrar los draft en la portada en dev con etiqueta «borrador» — descartado por ahora.
- Navegación SPA entre viajes — futuro, con test de ida y vuelta (Fase 14 lo mide).
- WR-01..03 de la revisión de la Fase 10 (p. ej. `extractLinkTargets` con formas raras de enlace) — pendientes de la
  decisión del usuario en `10-UAT.md`; no se pliegan aquí.
- Desbordamiento de la barra de pastillas — Fase 12/13.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROUTE-01 | A portada at `/guiaRoma/` with one card per published trip (title, dates, destinations, summary) linking to its guide | §Pattern 1 (portada with `.select`, `draft` filter in JS, pure date/sort utilities); verified: payload of 310 B, no sql_dump |
| ROUTE-02 | Roma at `/guiaRoma/trips/roma/` (the Campania mechanism) | §Pattern 2 (routes derived from `scripts/tripManifest.mjs`); verified: emits `trips/roma/index.html` + `trips/roma/_payload.json` |
| ROUTE-03 | `/guiaRoma/#ancla` → same anchor in `/trips/roma/`, no Back loop | §Pattern 3 (inline script with `tagPriority:'critical'`); verified: lands like a direct load, Back takes 1 press; all 133 legacy ids satisfy the regex |
| ROUTE-04 | Static pages without downloading `sql_dump`/WASM | Verified: 0 requests to `sql_dump`/`.wasm` on portada and Roma; §Validation for the assertion |
| ROUTE-05 | A draft is neither listed nor published | §Pattern 4 (`source.exclude` + `NODE_ENV`); verified: 0 draft rows in the decoded dumps; dev keeps the drafts |
| ROUTE-06 | Back to the portada from every guide | §Pattern 5 (`<p class="trip-back">` outside `.container`); verified: 56 goldens + shell green, zero CSS |
| PAR-01 | 56 goldens at the new URL without re-baseline | Verified: visual-diff 4/4 (56 captures) green at `/trips/roma/` with the footer link |
| PAR-02 | Roma behaviour suite green at `/trips/roma/` | Verified: 76/80 green; the 4 red tests are the planned inversions (§Harness inventory) |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Nuxt 4 (4.4.8) + Nuxt Content 3.14.0 + zod 4.4.3 (`import { z } from 'zod'`, never the Content re-export).
- **Parity is non-negotiable**: identical visual and functional output; the 56 goldens are never re-baselined.
- Static output (`github_pages` preset) deployable to GitHub Pages; no live server.
- Offline: no CDN; Leaflet and fonts self-hosted; nothing new may depend on the network.
- Hand-written CSS kept as is; **no** Tailwind/UnoCSS; `base.css/tokens.css/fonts.css/leaflet.css` untouched (D-21).
- No `<style scoped>`, no `v-html` (project-wide rule, repeated in D-21).
- Work on `release/nuxt-4`; `main` stays untouched.
- GSD workflow: edits go through `/gsd-execute-phase`.
- Memory/operations: Node 22 (`export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH"`), `rm -rf .data .nuxt .output` before generate/gate, `use_worktrees=false`, preview the build under a `guiaRoma/` subdirectory, and the anchor gotcha (an `@click` on `<a href="#slug">` gets swallowed by the capture handler).
- Project convention (STATE.md): `pnpm typecheck` + `pnpm lint` clean in every plan (typecheck is not in `verify`, but it is the convention).

## Standard Stack

### Core (all already installed; this phase adds NO dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| nuxt | 4.4.8 | pages `index.vue` + `trips/[slug].vue`, `useHead`, `definePageMeta` | already the base [VERIFIED: package.json] |
| @nuxt/content | 3.14.0 | `source: { include, exclude }` for drafts; `queryCollection('trip').select()` | `exclude?: string[]` exists in `CollectionSource` [VERIFIED: node_modules/@nuxt/content/dist/module.d.mts:205-218] |
| nitropack | 2.13.4 (transitive) | `prerender.routes`, `crawlLinks`, `autoSubfolderIndex` (default `true`) | [VERIFIED: nitropack/dist/core/index.mjs:109 `autoSubfolderIndex: true,`] |
| yaml | ^2.9.0 (devDependency, resolved 2.9.0) | read `trip.yml` at config time | already used by `tests/data/trips.ts`; YAML 1.2 core: `2026-06-19` stays a string [VERIFIED: probe `typeof y.parse('d: 2026-06-19').d === 'string'`] |
| zod | 4.4.3 | new optional `TripSchema` fields | [VERIFIED: package.json] |
| @playwright/test | 1.61.0 | new gate specs | pinned (upgrading it changes the goldens' Chromium) |
| vitest | 4.1.9 | pure utilities (dates, ordering, manifest, CSS scoping) | [VERIFIED: package.json] |

**Installation:** none. **Do not add `@types/node`.** Its absence is the reason the helper must be `.mjs` + `.d.mts`. Adding `@types/node` with `/// <reference types="node">` would pull Node globals into the whole app program (for example, the type of `setTimeout`). [VERIFIED: `ls node_modules/@types` → only `leaflet`; `.nuxt/tsconfig.json` `"types": []`]

## Package Legitimacy Audit

This phase **installs no external package**. Everything uses dependencies already present in `package.json`, plus `node:http`/`node:fs`/`node:zlib` for the test server and the decoding.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (none new) | — | — | — | — | — | — |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none
*Pre-existing observation (out of scope):* the specs launch `pnpm dlx serve` **unpinned** (today it resolves `serve@14.2.6` / `serve-handler@6.1.7` from the dlx cache). The new specs should use the `node:http` server below, not `serve`, so they add no unpinned dependency.

## Architecture Patterns

### System Architecture Diagram

```
                         ┌───────────────────── BUILD (nuxi generate, NODE_ENV=production) ─────────────────────┐
 content/trips/*/trip.yml ──► scripts/tripManifest.mjs ──┬─► content.config.ts: source.exclude = trips/<draft>/**   │
                                                         │        └─► Content DB/sql_dump: only non-draft trips │
                                                         └─► nuxt.config.ts: prerender.routes = ['/', '/trips/<pub>/']
                                                                   │  (+ crawlLinks as safety net, failOnError)  │
                         Nitro prerender ◄─────────────────────────┘                                            │
                           ├─ '/'            → index.html (portada) + _payload.json (trips-index)               │
                           └─ '/trips/roma/' → trips/roma/index.html + trips/roma/_payload.json                 │
                         └─────────────────────────────────────────────────────────────────────────────────────┘
 RUNTIME (GitHub Pages, no server):
   /guiaRoma/            ──► portada HTML ──(head script, before CSS)── hash ^#[a-z0-9-]+$ ? ──yes──► location.replace(/guiaRoma/trips/roma/#x)
                                │                                                              │no
                                └── hydrates from _payload.json (no sql_dump/wasm) ◄───────────┘
   /guiaRoma/trips/roma  ──301 (Pages)──► /guiaRoma/trips/roma/ ──► Roma (TripView, hydrates from its payload)
   card <a href="/guiaRoma/trips/<slug>/">  and footer  <a href="/guiaRoma/">  = full documents (no SPA)
   /guiaRoma/trips/<draft>/ ──► 404.html (SPA shell) → client downloads WASM + dumps (with no draft rows) → Nuxt 404
```

### Recommended Project Structure
```
scripts/
├── tripManifest.mjs      # NEW: Node-only, readTripManifest() → [{slug, draft}] (config time)
└── tripManifest.d.mts    # NEW: types for the .mjs (keeps typecheck clean)
app/
├── pages/index.vue       # REWRITE: portada (useAsyncData('trips-index') + useHead with the redirect)
├── pages/trips/[slug].vue# + definePageMeta({ key: slug })  (no fullPath)
├── components/TripIndex.vue (or TripCard.vue)  # NEW: portada markup under .trip-index
├── components/TripView.vue  # footer: <footer> always; <p class="trip-back"> outside .container
├── utils/tripDates.ts    # NEW: formatTripDates(start,end) + sortTrips(), pure, unit-tested
└── assets/css/multitrip.css # NEW: all selectors under .trip-index (appended to the end of nuxt.config css[])
tests/parity/
├── _harness.ts           # NEW (commit 1): SITE_BASE, ROMA_URL, OUTPUT_DIR, ROMA_HTML
├── _pagesServer.ts       # NEW: Pages-like static server (301 slash, 404.html) for the new specs
├── portada.spec.ts       # NEW: portada + 0 sql_dump/wasm + no 404 _nuxt/CDN + only published trips
└── legacy-redirect.spec.ts # NEW: /#viernes, /#pantheon, /index.html#gastronomia, no hash, invalid hash, Back
```

### Pattern 1: Portada with only `trip` + `.select` (ROUTE-01, D-06/D-07/D-10/D-11)
**What:** a single `useAsyncData` with its own key; drafts are filtered **in JS** (dev loads them; production no longer has them).
**Verified example (experimental build):** the resulting payload is 310 B, with `{"trips-index":[{slug,title,startDate,endDate,destinations,summary,draft:false}]}`.
```ts
// app/pages/index.vue (or TripIndex.vue) — prototype verified in the experimental build
const { app } = useRuntimeConfig()
const base = app.baseURL.endsWith('/') ? app.baseURL : `${app.baseURL}/`   // same idiom as app/app.vue:9
const { data } = await useAsyncData('trips-index', () =>
  queryCollection('trip').select('slug', 'title', 'startDate', 'endDate', 'destinations', 'summary', 'draft').all())
const trips = computed(() => sortTrips((data.value ?? []).filter(t => !t.draft)))   // D-10 in a pure util
// href = `${base}trips/${t.slug}/`  — trailing slash ALWAYS
```
- Plain title: `inlineMdToPlain(t.title)` (`app/utils/tripLayout.ts:100`, auto-imported). [VERIFIED: grep]
- Content returns `draft: false` for Roma when the field is absent (seen in the payload), so filter with `!t.draft`. [VERIFIED: experimental build payload]
- **Avoid nested `<a>`:** the whole card is an `<a>`. If `summary` (Markdown-inline) contains a link `[x](…)`, it produces `<a>` inside `<a>`. The HTML parser closes the outer one, which causes an SSR/hydration mismatch. Add an invariant to `tests/data` ("summary without links") or render the summary as plain text. [ASSUMED: standard HTML-parser behaviour]
- Do not put **any `id`** in the portada markup (D-12). `#teleports`, the Nuxt container, satisfies the regex, but a redirect to `trips/roma/#teleports` is harmless.

### Pattern 2: Prerender routes derived from data (ROUTE-02, D-13)
```js
// scripts/tripManifest.mjs  — verified (generate OK, typecheck 0, lint 0)
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
const TRIPS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'content', 'trips')
/** @returns {{ slug: string, draft: boolean }[]} */
export function readTripManifest() {
  return readdirSync(TRIPS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(join(TRIPS_DIR, d.name, 'trip.yml')))
    .map(d => ({ slug: d.name, draft: parse(readFileSync(join(TRIPS_DIR, d.name, 'trip.yml'), 'utf8'))?.draft === true }))
    .sort((a, b) => a.slug.localeCompare(b.slug))
}
// scripts/tripManifest.d.mts
// export interface TripManifestEntry { slug: string, draft: boolean }
// export declare function readTripManifest(): TripManifestEntry[]

// nuxt.config.ts
import { readTripManifest } from './scripts/tripManifest.mjs'
const publishedRoutes = readTripManifest().filter(t => !t.draft).map(t => `/trips/${t.slug}/`)
// nitro.prerender: { crawlLinks: true, routes: ['/', ...publishedRoutes], failOnError: true }
```
- The slug comes from the **folder name** (the "folder = slug" invariant is already enforced in `tests/data`).
- Real output: `.output/public/trips/roma/index.html` (539 493 B) + `trips/roma/_payload.json`. **No** `trips/prueba` or `trips/forma`, and no `guiaRoma/` subfolder. [VERIFIED: `find .output/public` in the experimental build]
- The crawler also discovers `/guiaRoma/trips/roma/` and `/guiaRoma/` (links that already carry the base) and logs them as extra routes. They write to the **same** file (`withoutBase`, nitropack index.mjs:2124-2125). It is harmless. [VERIFIED: generate log + output]
- **Plan B (`autoSubfolderIndex:false`, `trailing-slash`) is NOT needed:** links and the redirect go to `…/` and Pages 301-redirects the slashless form while keeping the hash. [VERIFIED: probe]

### Pattern 3: Legacy redirect script (ROUTE-03, D-14)
```ts
// app/pages/index.vue — prototype verified
const LEGACY_TRIP = 'roma'   // migration constant (the coupling guard only flags `'roma-` and useTrip('…'))
useHead({
  title: 'Guías de viaje',
  script: [{
    key: 'legacy-hash-redirect',
    tagPosition: 'head',
    tagPriority: 'critical',          // ← places it BEFORE <link rel=stylesheet> (verified: offset 157 < 314)
    innerHTML: `(function(){var h=location.hash;if(/^#[a-z0-9-]+$/.test(h)){location.replace(${JSON.stringify(`${base}trips/${LEGACY_TRIP}/`)}+h)}})()`,
  }],
})
```
Verified output (portada `<head>`, in order): `<title>Guías de viaje</title><script data-hid="legacy-hash-redirect">(function(){…location.replace("/guiaRoma/trips/roma/"+h)…})()</script><link rel="stylesheet" …>`. Without `critical`, an inline script placed after a pending stylesheet waits for the CSS before it runs, which delays the redirect. [VERIFIED: experimental build; the CSS-blocking behaviour is ASSUMED standard browser behaviour]
- **No escaping problems:** the inline content is emitted verbatim. There is no CSP in the output (`grep -i content-security-policy` empty) and Pages cannot add headers. [VERIFIED]
- **All 133 `id`s of the live `index.html` satisfy `^[a-z0-9-]+$`** (0 that don't), so every legacy anchor redirects. [VERIFIED: probe on `/index.html`]
- `/guiaRoma/index.html` (no hash) loads the portada, and Nuxt normalizes the URL to `/guiaRoma/`. It is the same today with Roma. [VERIFIED: probe]
- **Back:** `favicon.svg → /guiaRoma/#pantheon → (replace) /trips/roma/#pantheon → Back` = `favicon.svg` in **1 press**. History after the redirect: `state.replaced: true`. [VERIFIED: probe]
- **Same-document pitfall:** the script runs only on a **document** load. Going from `/guiaRoma/` to `/guiaRoma/#viernes` in the same document does NOT redirect, and you stay on the portada (verified). That is harmless for real users, who arrive from external links, but **a test that navigates portada → `#x` fails**: always start from another document (`${base}favicon.svg`). Optional: also listen to `hashchange` inside the same inline script (still compliant with D-14).

### Pattern 4: Drafts outside Content in production (ROUTE-05, D-16)
```ts
// content.config.ts — verified (production: excludes = ['trips/forma/**','trips/prueba/**']; dev: [])
import { readTripManifest } from './scripts/tripManifest.mjs'
const keepDrafts = process.env.NODE_ENV === 'development'          // fail-closed: anything else excludes them
const draftExcludes = keepDrafts ? [] : readTripManifest().filter(t => t.draft).map(t => `trips/${t.slug}/**`)
const src = (include: string) => ({ include, exclude: draftExcludes })
// trip: defineCollection({ type: 'data', source: src('trips/*/trip.yml'), schema: TripSchema }), … ×6 collections
```
- `exclude` is applied as `ignore` of the glob, relative to `content/` [VERIFIED: module.mjs:1934-1939 `getExcludedSourcePaths` → `...source.exclude || []`; `glob(source.include, { cwd, ignore: getExcludedSourcePaths(source) })`].
- The env is reliable: `nuxi build`/`generate` run `overrideEnv("production")` and `nuxi dev` runs `overrideEnv("development")`. [VERIFIED: @nuxt/cli 3.35.2 dist/build-DWst0L5A.mjs:37, dev-DFnFBwYf.mjs:673]
- `content.config.ts` is loaded with c12/jiti inside the Nuxt process (module.mjs:2643-2655), so `process.env` is the one from nuxi. [VERIFIED]
- Result: `trip/day/food/monument/reference/artist` dumps carry **0** rows from `trips/prueba/` or `trips/forma/` (the current build: trip 1+1, day 10+2, food 1, monument 2+3). [VERIFIED: base64 → gunzip of both builds]
- Dev: `/guiaRoma/trips/prueba` and `/trips/forma/` return 200 with their sentinel, and the dev portada lists only Roma. [VERIFIED: `nuxi dev` probe]
- A draft in production is served `404.html` (SPA shell). The client downloads WASM + the 6 dumps (with no draft data) and shows the Nuxt 404. Acceptable per PITFALLS. [VERIFIED: probe, h1=404]

### Pattern 5: Back link in the footer (ROUTE-06, D-01..D-05) — corrected markup
```vue
<!-- TripView.vue — verified: shell.spec green + 56 goldens green + 0 new CSS -->
<footer>
  <div v-if="footerLines.length > 0" class="container">
    <p><!-- trip.footer lines, exactly as today --></p>
  </div>
  <p class="trip-back">
    <a :href="homeHref">← Todos los viajes</a>   <!-- homeHref = useRuntimeConfig().app.baseURL -->
  </p>
</footer>
```
Roma's real output: `<footer><div class="container"><p>…Roma · 19—23 giugno 2026…</p></div><p class="trip-back"><a href="/guiaRoma/">← Todos los viajes</a></p></footer>` [VERIFIED]. It renders in Cormorant italic (`footer p`) with the global link colour `rgb(139, 58, 58)` and an underline (`a { border-bottom: 1px solid var(--line) }`, base.css:149), centred. The footer measures 229 px (desktop and mobile). No CSS rule is needed. [VERIFIED: screenshot + computed style]
- **Why not inside `.container`:** `shell.spec.ts:158` → `strict mode violation: locator('footer .container p') resolved to 2 elements` (verified with that variant), and that file cannot be edited beyond D-18.
- Do not use `@click` on that `<a>` (see the memory note "capture click eats ficha-anchor"). It is a plain `href` to the root (not `#slug`), so it is not affected.
- `.trip-back` is a class in Roma's DOM. The D-21 scoping test ("no selector in multitrip.css reaches Roma") must not include `.trip-back`. Since it needs no CSS, keep it out of `multitrip.css`.

### Pattern 6: `pageKey` of `trips/[slug].vue` (corrects D-13)
```ts
definePageMeta({ key: route => `trip:${String(route.params.slug)}` })   // NOT route.fullPath
```
- Nuxt uses `meta.key` when it exists: `const source = override ?? matchedRoute?.meta.key ?? interpolatePath(...)` [VERIFIED: nuxt/dist/pages/runtime/utils.js:8-12].
- Vue Router updates the route on a native fragment navigation: `popStateHandler` → `replace(to)` + listeners (state null) [VERIFIED: vue-router 5.1.0 dist/vue-router.js:31-52].
- With `fullPath`: after clicking the `#reservas` pill, `currentRoute.fullPath = /trips/roma/#reservas` and the `#inicio` node was replaced (remount). With the slug key: 3 pills, no remount. [VERIFIED: both probes]
- The default (no `definePageMeta`) is already `/trips/roma`, without the hash. The explicit key only makes it intentional.

### Anti-Patterns to Avoid
- **`key: route => route.fullPath`**: remounts TripView on every anchor (pills, `#reservas` in prose).
- **`<p>` link inside `footer .container`**: breaks `shell.spec.ts:158` (strict mode).
- **`.ts` helper with `node:fs` imported from `nuxt.config.ts`/`content.config.ts`**: TS2307 in `pnpm typecheck`.
- **`z.iso.date()` for `startDate/endDate`**: zod emits `format: "date"`, so Content creates a `DATE` column and runs `formatDate(new Date(v))` with `getDate()` in **local timezone**. In a UTC− timezone, `2026-06-19` becomes `2026-06-18`. Use `z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(validCalendarDate)`, which gives a VARCHAR column and no conversion. [VERIFIED: content runtime/internal/schema.js:26-27 `if (property.format === "date") { type = "DATE"; }` + module.mjs:422-430 `formatDate` uses `getFullYear/getMonth/getDate`; zod `toJSONSchema(z.iso.date())` → `"format":"date"`; a `refine` is omitted from the JSON-Schema]
- **`grep` of the `sql_dump`**: false negative (base64+gzip).
- **`serve` as a "Pages mimic"**: `cleanUrls` defaults to on (`applicable()` returns `true` when undefined, serve-handler 6.1.7 index.js:256-273), so `/x/index.html` → 301 `/x/index`, and `/trips/roma` → 200 with no 301.
- **Asserting `toBeInViewport` for deep anchors after the redirect**: it fails, and v1.0 does the same (see Pitfall 3).
- **Navigating portada → `/guiaRoma/#x` in the same test without changing document**: there is no redirect (same document).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Excluding drafts from Content | post-processing `.output` to strip rows from the dumps | `source.exclude` (Content 3.14) | official, applied before parse/dump; verified |
| Route ↔ page mapping | manual list of routes | `readTripManifest()` + crawl | single source of truth with `content.config.ts` |
| Decoding the dump in the test | parsing SQL by hand | `zlib.gunzipSync(Buffer.from(txt,'base64')).toString()` + `includes(sentinel)` | verified format |
| Anti-FOUC theme on the portada | own script/toggle | `@nuxtjs/color-mode` (already global) | already injected on `/` (verified: the script is in the portada head) |
| Locale-dependent dates | `Intl.DateTimeFormat` / `toLocaleDateString` | pure month table + `split('-')` | D-09; no TZ/locale |

**Key insight:** everything this phase needs already exists in the stack. The risks are in the small details (page key, footer DOM, typecheck, dump encoding), not in missing libraries.

## Harness inventory (D-18) — every literal `/guiaRoma/` / port / build HTML read in `tests/parity`

[VERIFIED: grep + Read of every spec this session]

| Spec | Port (base + `TEST_WORKER_INDEX`) | Roma URL line | Other Roma dependencies | `goto(STATIC_URL)` |
|------|-----------------------------------|---------------|---------------------|--------------------|
| `subpath.spec.ts` | 5000 (`:29`) | `:31` `const SUBPATH_URL = \`${BASE}/guiaRoma/\`` | `ensureBuild` index.html `:68,:72`; `.nojekyll` `:123` | `:146` |
| `shell.spec.ts` | 5100 (`:85`), dev 5200 (`:207`) | `:86` | `:74,:78`; **`:186-189` no-trips (invert)**; `:158` footer; dev `:208,:244,:251` | `:126,:173` |
| `theme.spec.ts` | 5300 (`:70`) | `:72` | **`:103` `readFileSync(join(OUTPUT_DIR,'index.html'))`** | `:148,:164` |
| `render-cards.spec.ts` | 5400 (`:69`) | `:70` | `:61,:65` | `:108,:174,:188` |
| `render-timeline.spec.ts` | 5500 (`:66`) | `:67` | `:58,:62` | `:105,:138,:162` |
| `render-reference.spec.ts` | 5600 (`:79`) | `:80` | `:71,:75` | `:118,:143,:156,:172` |
| `modes.spec.ts` | 5700 (`:67`) | `:69` | `:59,:63` | `:101,:232,:250,:270,:316` |
| `navigation.spec.ts` | 5720 (`:137`) | `:139` | `:82,:86` | `:174` |
| `search-route.spec.ts` | 5740 (`:91`) | `:93` | `:65,:69` | `:129` (inside `gotoHydrated`) |
| `map-fallback-notes.spec.ts` | 5760 (`:128`) | `:130` | **`:184` `readFileSync(join(OUTPUT_DIR,'index.html'))` asserts `<div id="leaflet-map"`** | `:165` |
| `visual-diff.spec.ts` | 5780 (`:207`) | `:209` | `:104,:108` | `:271` |
| `golden.spec.ts` | webServer 4173 | `goto('/index.html')` `:128` (live `index.html`) | — | **do not touch** (excluded from the gate) |

**Key findings:**
- **`map-fallback-notes.spec.ts:184` and `theme.spec.ts:103` read `.output/public/index.html` as if it were Roma.** After the move, map-fallback **fails** (the portada has no `#leaflet-map`). Theme would pass by accident, because color-mode is global. Commit 1 must therefore introduce **`ROMA_HTML` derived from `ROMA_URL`**. That way commit 2 only changes `ROMA_URL`. [VERIFIED: in the experimental build, map-fallback passed only after pointing it at `trips/roma/index.html`]
- `ensureBuild()` (11 specs) checks `index.html`. It keeps working (the portada exists), but for coherence it should check `ROMA_HTML`.
- `describe` titles and comments containing `/guiaRoma/` **are left as they are** (they are not URLs; the `test:parity` grep-invert depends on the title "reutiliza el MISMO TripView").
- No spec uses `STATIC_ORIGIN` other than to build `STATIC_URL`; the hash assertions (`new URL(page.url()).hash`) do not depend on the path.

**Recommended `_harness.ts` (commit 1, zero behaviour change):**
```ts
import { join } from 'node:path'
export const SITE_BASE = '/guiaRoma/'
export const ROMA_URL = '/guiaRoma/'            // commit 2: '/guiaRoma/trips/roma/'  (THE ONLY diff)
export const OUTPUT_DIR = join(process.cwd(), '.output', 'public')
export const ROMA_HTML = join(OUTPUT_DIR, ROMA_URL.slice(SITE_BASE.length), 'index.html')
export const romaUrlAt = (port: number) => `http://localhost:${port}${ROMA_URL}`
```
Each spec replaces its `STATIC_URL`/`SUBPATH_URL` with `romaUrlAt(STATIC_PORT)`, its Roma `readFileSync`/`existsSync` with `ROMA_HTML`, and keeps its server/port code. Centralizing the server spawn is optional and not needed for D-18. If it is done, do it in commit 1 with the gate green.

**Outside `tests/parity` (allowed, and they must change in the move commit):**
| File | Line(s) | Change |
|------|---------|--------|
| `tests/data/build-isolation.spec.ts` | `:33-37` (`INDEX`, `PAYLOAD`), `:51-53`, `:69-71`, `:73-79` | `INDEX` → `trips/roma/index.html`, `PAYLOAD` → `trips/roma/_payload.json`; invert to "`trips/roma/index.html` exists; `trips/prueba` and `trips/forma` do not"; scan **all** of `.output/public` (decode `sql_dump.txt`) for both sentinels; add a "prueba sentinel present in its trip.yml" check outside the `skipIf` (as is already done for forma) |
| `tests/data/romaChrome.spec.ts` | `:41` `BUILT`, `:92-93` regex `/<footer><div class="container"><p>([\s\S]*?)<\/p><\/div><\/footer>/` | `BUILT` → `trips/roma/index.html`; regex without the final `<\/footer>` (now followed by `<p class="trip-back">`). Optionally assert the link's exact HTML [VERIFIED: in the experiment it failed with `expected null not to be null`] |
| `tests/trips/isolation.spec.ts` | `:23` `ROMA_URL = \`${ORIGIN}/guiaRoma/\`` | → `/guiaRoma/trips/roma/` (otherwise it tests the portada) |
| `tests/trips/shape.spec.ts` | `:39` `ROMA_URL`; `:317` `footer` count 0 | `ROMA_URL` → `/trips/roma/`; prueba: `footer` count 1, `footer .container` count 0, `footer .trip-back a` text «← Todos los viajes»; `:298-299` forma (`footer .container p` count 1) stays green with the correct markup |
| `tests/unit/tripCoupling.spec.ts` | header comment (exception for `index.vue` "hasta la Fase 11") | update the comment; the assertion `not.toContain('app/pages/index.vue')` stays true |
| `tests/README.md` | §4 (80 / 11 files) and §2 | re-register the count and breakdown; mention the new specs |

**Gate on the experimental build** (ROMA_URL = `/guiaRoma/trips/roma/` + ROMA_HTML): `4 failed / 76 passed`. The 4 failures were `shell.spec.ts:186` (no-trips, mobile+desktop) and `shell.spec.ts:118` (strict mode footer, only with the link inside `.container`). With the corrected markup, only the 2 no-trips tests remain, and they are the planned inversion. [VERIFIED]

## Common Pitfalls

### Pitfall 1: The page key with the hash remounts Roma
**What goes wrong:** every pill/anchor remounts TripView (controller, listeners, MiniSearch, `onMounted`).
**Why it happens:** `route.fullPath` includes the hash, and Vue Router processes the `popstate` of fragment navigations.
**How to avoid:** key by slug (Pattern 6). Add a test in `tests/parity/legacy-redirect.spec.ts` or `portada.spec.ts`: mark `#inicio` with a JS property, click `.nav-pill[href="#reservas"]`, and assert the mark survives.
**Warning signs:** the scrollspy or the `.highlight` "blinks", `onMounted` runs twice.

### Pitfall 2: The `sql_dump` looks clean but isn't
**What goes wrong:** the D-17 test passes vacuously.
**Why it happens:** `__nuxt_content/<col>/sql_dump.txt` = base64(gzip(JSON array of SQL)).
**How to avoid:** decode with `node:zlib`; also add a positive control (the decoded dump of `trip` contains `'trips/roma/` or "Cinque giorni") so the test is never vacuous.
**Warning signs:** a `grep -r CENTINELA .output/public` that returns nothing even on today's build (where there ARE draft rows). [VERIFIED]

### Pitfall 3: "Lands on the anchor" ≠ "the anchor is in the viewport"
**What goes wrong:** a test asserts `toBeInViewport('#pantheon')` after `/#pantheon` and fails, or is flaky.
**Why it happens:** after the native fragment jump, content above keeps reflowing (fonts/fallbacks), and deep anchors drift. **This happens the same way in the LIVE `index.html` of `main`** (`#pantheon` top=519 px desktop with images blocked; `#gastronomia` 8607 px) and in today's Nuxt build at `/guiaRoma/#pantheon` (top=520). It is pre-existing parity, not a Phase 11 regression. [VERIFIED: 3 probes]
**How to avoid:** with images blocked (`route.abort` for `resourceType==='image'`, as visual-diff does), assert: (a) final URL = `…/trips/roma/#x`; (b) `#viernes` (section) at `top ≈ 124` (it landed at 124 in every run); (c) for deep anchors, **the same position as a direct load of `/trips/roma/#x`** (identical px in the probe: 522/522, 5045/5045, 4009/4009). No `.highlight` on landing (v1.0 parity; verified `hasHighlight=false`).
**Warning signs:** tests that pass with images blocked and fail with network.

### Pitfall 4: Same-document hash navigation in tests
**What goes wrong:** `goto('/guiaRoma/')` then `goto('/guiaRoma/#pantheon')` → no redirect → `waitForURL` timeout. [VERIFIED: the first probe failed exactly like this]
**How to avoid:** start each redirect test from another document (`${base}favicon.svg`), which also serves as the target of the "Back" assertion.

### Pitfall 5: Port collisions between specs
**What goes wrong:** `TEST_WORKER_INDEX` grows with every worker restart after a failure (observed: 6100→6107 in one run). Bases spaced 20 apart can overlap after many failures.
**How to avoid:** for the new specs, use bases far from the existing ones (for example **5800** portada and **5850** legacy-redirect) and the same pattern. Do not touch existing ports (D-19).

### Pitfall 6: Commit ordering leaves the gate red
**What goes wrong:** if the move (portada at `/`) goes in one commit and the inversion of `shell.spec`/`build-isolation` in another, the commit in between has a red gate.
**How to avoid:** commit 1 = harness only (green). The move commit = app (portada, routes, drafts excluded, footer link, page key) + `ROMA_URL` flip + inversion of `shell.spec`/`build-isolation`/`romaChrome` + `tests/trips` adjustments. In `tests/parity`, the Roma specs only change the `ROMA_URL` value; `shell.spec` changes per D-18(3). The schema change (new optional fields + `draft` in prueba/forma) can go earlier as its own commit: the gate stays green because Content just gets new columns, and in the experiment `tests/data` (588 tests) passed with the new fields. [VERIFIED]

### Pitfall 7: Content cache after editing YAML/schema
Always `rm -rf .data .nuxt .output` before generate (memory note). This applies to every change of `draft:`, because the exclusion is computed when the config loads.

## Code Examples

### Pages-like static server for the new specs (verified)
```ts
// tests/parity/_pagesServer.ts — verified: /guiaRoma→301 /guiaRoma/; /trips/roma→301 /trips/roma/ (hash kept);
// …/index.html→200; draft→404 with the build's 404.html
import { createServer, type Server } from 'node:http'
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
const TYPES: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain', '.wasm': 'application/wasm' }
export function startPagesServer(outDir: string, port: number, base = '/guiaRoma/'): Promise<Server> {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://x')
    const p = decodeURIComponent(url.pathname)
    if (p === base.slice(0, -1)) { res.writeHead(301, { Location: base + url.search }); return void res.end() }
    if (!p.startsWith(base)) { res.writeHead(404); return void res.end() }
    let file = join(outDir, normalize(p.slice(base.length)).replace(/^(\.\.(\/|$))+/, ''))
    if (existsSync(file) && statSync(file).isDirectory()) {
      if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' + url.search }); return void res.end() }
      file = join(file, 'index.html')
    }
    if (!existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(404, { 'Content-Type': TYPES['.html'] })
      return void res.end(existsSync(join(outDir, '404.html')) ? readFileSync(join(outDir, '404.html')) : '')
    }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' })
    createReadStream(file).pipe(res)
  })
  return new Promise(r => server.listen(port, () => r(server)))
}
```
It serves `.output/public` directly under `/guiaRoma/` (no temp copy needed). It runs in the Playwright process: close it in `afterAll` (`server.close()`), with no process group.

### Decoding `sql_dump` (D-17)
```ts
import { gunzipSync } from 'node:zlib'
const decodeDump = (txt: string) => gunzipSync(Buffer.from(txt, 'base64')).toString('utf8')
// walk .output/public recursively: */sql_dump.txt → decodeDump; the rest → readFileSync(f,'latin1')
// expect(text).not.toContain('PRUEBA-CENTINELA-9F3'); expect(text).not.toContain('FORMA-CENTINELA-10A')
```
Sentinels: `PRUEBA-CENTINELA-9F3` [VERIFIED: tests/data/build-isolation.spec.ts:35 `const SENTINEL = 'PRUEBA-CENTINELA-9F3'`], `FORMA-CENTINELA-10A` [VERIFIED: :36 `const FORMA_SENTINEL = 'FORMA-CENTINELA-10A'`].

### ROUTE-04 assertion (verified: 0 requests)
```ts
const heavy: string[] = []
page.on('request', r => { if (/__nuxt_content\/|sql_dump|\.wasm(\?|$)/.test(r.url())) heavy.push(r.url()) })
await page.goto(`${origin}/guiaRoma/`);             await page.waitForLoadState('networkidle')
await page.goto(`${origin}/guiaRoma/trips/roma/`);  await page.waitForLoadState('networkidle')
expect(heavy).toEqual([])
// For reference: the portada requests /guiaRoma/_payload.json?<buildId>, and Roma /guiaRoma/trips/roma/_payload.json?<buildId>
```

### Spanish dates and ordering (D-09/D-10) — pure, no `Date`/`Intl`
```ts
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
export function formatTripDates(start?: string | null, end?: string | null): string | null {
  if (!start) return null
  const [y1, m1, d1] = start.split('-').map(Number)
  const full = (y: number, m: number, d: number) => `${d} de ${MESES[m - 1]} de ${y}`
  if (!end || end === start) return full(y1, m1, d1)
  const [y2, m2, d2] = end.split('-').map(Number)
  if (y1 === y2 && m1 === m2) return `${d1}–${d2} de ${MESES[m1 - 1]} de ${y1}`   // «19–23 de junio de 2026» (U+2013)
  return `${full(y1, m1, d1)} – ${full(y2, m2, d2)}`                                 // crosses month/year: both full (D-09)
}
export function sortTrips<T extends { title: string, startDate?: string | null }>(ts: T[]): T[] {
  return [...ts].sort((a, b) => (b.startDate ?? '').localeCompare(a.startDate ?? '')
    || inlineMdToPlain(a.title).localeCompare(inlineMdToPlain(b.title), 'es'))
}
```
The UI-SPEC decides on the format for crossing months within the same year ("30 de junio – 2 de julio de 2026" vs both dates in full). D-09 says "ambos completos", which is the reading the example implements.

### New `TripSchema` fields (D-08, D-16)
```ts
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(s => { const d = new Date(`${s}T00:00:00Z`); return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s }, 'fecha inexistente')
// inside TripSchema (after pageTitle):
draft: z.boolean().optional(),
startDate: IsoDate.optional(),
endDate: IsoDate.optional(),
destinations: z.array(z.string().min(1)).min(1).optional(),
summary: z.string().min(1).optional(),
```
`endDate >= startDate` and "summary without links" belong as invariants in `tests/data/trips.ts` (`checkTrip`), not as a `refine` on the object: the `row.shape` of `TripSchema` must stay a plain `z.object`. In YAML, write the dates **quoted** (`startDate: '2026-06-19'`) for clarity; with `yaml` 2.x they are strings either way. [VERIFIED: the schema with these fields + Roma's values + `draft: true` in prueba/forma passed the 588 tests of `tests/data`+`tests/unit` in the experiment, except the 4 expected inversions]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `/` = Roma; `routes: ['/']`; no link to `/trips/*` (D-01 of v1.0) | `/` = portada; `routes` derived from data; full-document links with a trailing slash | Phase 11 | the "no `trips/`" assertions get inverted |
| Drafts that are "dev-only by convention" (rows in the public dump, CR-01) | `draft: true` + `source.exclude` in production | Phase 11 | closes CR-01 / AR-10-02 |
| Footer only when `trip.footer` exists | `<footer>` always, with the back link | Phase 11 | replaces the "sin pie" part of D-14 (Phase 10) |

**Deprecated/outdated:** the comments in `app/pages/index.vue:1-10`, `app/pages/trips/[slug].vue:5-10`, `app/components/TripView.vue:45-47` ("NINGÚN enlace de ruta a /trips/*"), `content/trips/{prueba,forma}/trip.yml` (the "Fase 11: descomentar…" header) and `shell.spec.ts:16-19` become false and must be updated in the move commit.

## Runtime State Inventory

> It is a URL migration: it applies.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | `localStorage` `roma-*` + `roma-theme`: same origin (`<user>.github.io`), so they stay valid at `/trips/roma/` (D-20). The `roma-*` keys are independent of the path. [VERIFIED: tests/parity/modes.spec + map-fallback use them with no path] | None (no migration; no new code writes keys) |
| Live service config | GitHub Pages: no rules or config outside git; the first deploy happens in a later phase (D-08 deferred). Links already shared by users point to `/guiaRoma/#…` | None in config; ROUTE-03 covers them in the client |
| OS-registered state | None: verified, there are no tasks/services; the static site does not register anything | None |
| Secrets/env vars | `NUXT_APP_BASE_URL=/guiaRoma/` (only in `playwright.trips.config.ts` and shell dev); `nuxt.config` fixes `app.baseURL`. No secrets | None |
| Build artifacts | `.data` (Content SQLite cache) and `.nuxt` keep data/old excludes; `.output/public/index.html` (today Roma) changes meaning | `rm -rf .data .nuxt .output` before every generate/gate (existing rule) |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node 22 | generate / Playwright / typecheck (`better-sqlite3` ABI) | ✓ | v22.20.0 (`~/.nvm`) | — (Node 24 fails, memory note) |
| pnpm | scripts | ✓ | 10.32.1 (corepack) | — |
| Chromium (Playwright 1.61.0) | gate | ✓ | already installed (the gate ran) | — |
| `pnpm dlx serve` | existing specs | ✓ | serve 14.2.6 (dlx cache) | the new specs use `node:http` |
| Network (Wikimedia/OSM) | not required | — | — | the specs block images; offline-first |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 (`tests/unit`, `tests/data`) + Playwright 1.61.0 (gate `playwright.gate.config.ts`, mobile+desktop projects; `tests/trips` with `playwright.trips.config.ts` on `nuxi dev`) |
| Config file | `vitest.config.ts`, `playwright.gate.config.ts`, `playwright.trips.config.ts` |
| Quick run command | `pnpm test:unit && pnpm test:data` (no build: the build-dependent blocks skip themselves) |
| Full suite command | `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && pnpm verify` (= `rm -rf .data .nuxt .output && pnpm generate && pnpm test:unit && pnpm test:data && pnpm test:parity`); plus `pnpm typecheck && pnpm lint`; separately, never concurrently: `rm -rf .data .nuxt && pnpm test:trips` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROUTE-01 | `/guiaRoma/` shows `<title>`/`<h1>` «Guías de viaje», one card per published trip with plain title, dates «19–23 de junio de 2026», destinations, summary, and `href` `/guiaRoma/trips/roma/`; no `id` in the portada; empty state | e2e (gate) | `pnpm exec playwright test -c playwright.gate.config.ts tests/parity/portada.spec.ts` | ❌ Wave 0 |
| ROUTE-01 | `formatTripDates` (same month, month change, year change, start only), `sortTrips` (desc, ties/no date by title) | unit | `pnpm exec vitest run tests/unit/tripDates.spec.ts` | ❌ Wave 0 |
| ROUTE-01/05 | in dev the portada lists only Roma (prueba/forma drafts are hidden) and `/trips/prueba` still works | e2e dev | `pnpm test:trips` (new test in `tests/trips/`) | ❌ Wave 0 |
| ROUTE-02 | `trips/roma/index.html` + `trips/roma/_payload.json` exist; `/` serves the portada and `ROMA_URL` serves Roma (12 pills, `#inicio`) | e2e + node | `shell.spec.ts` (D-18(3)) + `tests/data/build-isolation.spec.ts` | ✅ (modify) |
| ROUTE-02 | `readTripManifest()` returns roma(false), prueba(true), forma(true); routes = `['/','/trips/roma/']` | unit | `pnpm exec vitest run tests/unit/tripManifest.spec.ts` | ❌ Wave 0 |
| ROUTE-03 | `/#viernes`, `/#pantheon`, `/index.html#gastronomia` → `/trips/roma/#x` (land like a direct load; `#viernes` at ~124 px); no hash / invalid hash (`#Bad_Hash`, `#a/b`) stays; Back = previous document in 1 press; mobile+desktop | e2e (gate, Pages server) | `pnpm exec playwright test -c playwright.gate.config.ts tests/parity/legacy-redirect.spec.ts` | ❌ Wave 0 |
| ROUTE-03 | the head script is in the portada `<head>` before the first `<link rel="stylesheet">` and **not** in Roma | static (node) | inside `legacy-redirect.spec.ts` or `tests/data` | ❌ Wave 0 |
| ROUTE-04 | 0 requests to `__nuxt_content/`/`sql_dump`/`.wasm` when loading the portada and Roma | e2e (gate) | `portada.spec.ts` | ❌ Wave 0 |
| ROUTE-05 | there is no `trips/prueba` or `trips/forma`; no file in `.output/public` (decoded dumps included) contains `PRUEBA-CENTINELA-9F3`/`FORMA-CENTINELA-10A`; positive control (the `trip` dump contains Roma) | node | `pnpm test:data` (`build-isolation.spec.ts`) | ✅ (invert) |
| ROUTE-05 | schema accepts `draft`/`startDate`/`endDate`/`destinations`/`summary`; rejects `2026-02-30`, empty `destinations`, `draft: "yes"`; invariants `endDate>=startDate`, `summary` without links | unit (data) | `pnpm test:data` (`schema.spec.ts`/`invariants.spec.ts`) | ✅ (extend) |
| ROUTE-06 | Roma: `footer .trip-back a` with text «← Todos los viajes» and `href` = baseURL; `footer .container p` = 1 element; prueba: footer with the link only | e2e | `shell.spec.ts` (D-18(3)) / `portada.spec.ts` + `tests/trips/shape.spec.ts:317` | ✅/❌ |
| ROUTE-06 / D-13 | clicking a pill does not remount TripView (marker on `#inicio` survives) | e2e (gate) | `portada.spec.ts` or `legacy-redirect.spec.ts` | ❌ Wave 0 |
| D-21 | every selector in `multitrip.css` starts with `.trip-index` (including inside `@media`) | unit (static) | `pnpm exec vitest run tests/unit/multitripCss.spec.ts` | ❌ Wave 0 |
| PAR-01 | 56 goldens without `--update-snapshots`; `git diff --quiet tests/parity/golden.spec.ts-snapshots/` | e2e (gate) | `pnpm test:parity` (visual-diff) | ✅ |
| PAR-02 | the whole Roma suite green at `ROMA_URL=/guiaRoma/trips/roma/` | e2e (gate) | `pnpm test:parity` | ✅ (via harness) |

### Sampling Rate
- **Per task commit:** `pnpm test:unit && pnpm test:data` + `pnpm typecheck && pnpm lint`
- **Per wave merge / before the move commit:** `pnpm verify` (Node 22) + `git diff --quiet -- tests/parity/golden.spec.ts-snapshots/`
- **Phase gate:** `pnpm verify` green + `pnpm test:trips` green (separately) + re-registered count `pnpm exec playwright test -c playwright.gate.config.ts --grep-invert "reutiliza el MISMO TripView" --list | tail -1` matching `tests/README.md`

### Wave 0 Gaps
- [ ] `tests/parity/_harness.ts`: `ROMA_URL`/`ROMA_HTML` (commit 1, value `/guiaRoma/`)
- [ ] `tests/parity/_pagesServer.ts`: Pages server (code above)
- [ ] `tests/parity/portada.spec.ts`: ROUTE-01/04/06, D-13 no-remount
- [ ] `tests/parity/legacy-redirect.spec.ts`: ROUTE-03 (start from `favicon.svg`; images blocked)
- [ ] `tests/unit/tripDates.spec.ts`, `tests/unit/tripManifest.spec.ts`, `tests/unit/multitripCss.spec.ts`
- [ ] Extensions to `tests/data/schema.spec.ts` / `invariants` for the new fields
- [ ] Dev test in `tests/trips/` (dev portada hides drafts)

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — (static site) |
| V3 Session Management | no | — |
| V4 Access Control | yes (publish only what is not a draft) | build-time exclusion (`source.exclude`) + sentinel test over the decoded output |
| V5 Input Validation | yes | `location.hash` validated against `^#[a-z0-9-]+$` before being used as a suffix; the route slug only selects a collection key (404 guard in `[slug].vue`); zod schema for the new fields |
| V6 Cryptography | no | — |
| V14 Configuration | yes | no CSP is possible on Pages; the inline script is built from constants + `JSON.stringify(baseURL)`, with no user data |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Open redirect through the legacy hash | Spoofing/Tampering | fixed destination `base + 'trips/roma/'`; the hash is only a suffix validated by regex; `location.replace` (same origin). A percent-encoded hash (`#%3Cscript%3E`) or one with `/` fails the regex and stays on the portada [VERIFIED: probe `#a/b`, `#Bad_Hash` stay] |
| Draft data leaking in the public dump (CR-01/AR-10-02) | Information disclosure | `source.exclude` in production + scanning of the **decoded** output |
| HTML injection on the portada (title/summary from YAML) | Tampering | Vue interpolation (`{{ }}`), `<MDC>` for the Markdown-inline summary; no `v-html` (project rule) |
| Nested `<a>` caused by Markdown in `summary` | Tampering (breaks hydration) | invariant "summary without links" in `tests/data` |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | An inline script after a pending `<link rel=stylesheet>` waits for the CSS before running (which is why `tagPriority:'critical'` is used) | Pattern 3 | Low: with `critical` it is already before the CSS (verified) |
| A2 | A nested `<a>` in the card causes an SSR/hydration mismatch | Pattern 1 | Low: mitigated by the invariant |
| A3 | On a **project** Pages site, an unknown route serves the project's `404.html` (`/guiaRoma/404.html`) | Pattern 4 | Low: only affects what a draft URL shows (404 either way); the probe on `primer.github.io/octicons/…` returned 404 but did not identify which `404.html` was served |
| A4 | The cause of the deep-anchor drift is late reflow (fonts/fallbacks); not investigated | Pitfall 3 | Low: it is pre-existing and identical in v1.0; it only conditions the test design |
| A5 | The month-crossing format ("30 de junio – 2 de julio de 2026" vs both in full) is what D-09 means by "ambos completos" | Code Examples | Low: the UI-SPEC sets it |

## Open Questions (RESOLVED)

1. **D-13 page key: literal `fullPath` or slug?**
   - What we know: `fullPath` remounts on every anchor (verified); slug does not.
   - RESOLVED: use `trip:${slug}`. It is the reading consistent with the intent of D-13 ("hacer explícito el remontaje entre viajes"). Record the correction in the plan's must_haves.
2. **Link markup (D-03) vs `shell.spec.ts:158`**
   - RESOLVED: `<p class="trip-back">` as a direct child of `<footer>`. It satisfies D-03 ("en su propio elemento", after the lines) and D-05 (reuses `footer p`), and needs zero CSS.
3. **Should the anchor scroll improve (re-scroll after hydration/fonts)?**
   - What we know: deep anchors do not land in the viewport, neither in v1.0 Nuxt nor in the live `index.html`.
   - RESOLVED: out of scope (it would be a change to Roma's behaviour). Tests assert "same position as a direct load". If the user wants it, it becomes a future item.
4. **New specs in `tests/parity/` vs D-19 ("cualquier otro cambio en tests/parity/ fuera de D-18 está prohibido")**
   - RESOLVED: D-19 protects the existing Roma specs. Adding new files is necessary for them to run inside `pnpm verify`/the gate (`testDir: ./tests/parity`), and D-19 itself asks for the count to be re-registered. The planner should state this in the plan.
5. **`hashchange` on the portada**
   - RESOLVED: optional, inside the same inline script (D-14 compliant). Low value; recommended only if it is cheap.

## Sources

### Primary (HIGH confidence)
- `node_modules/@nuxt/content/dist/module.d.mts:205-218` (`CollectionSource` with `exclude?: string[]`), `module.mjs:1934-1960` (exclude → glob `ignore`), `:2643-2690` (config loading via c12), `:2442-2466` + `:422-430` (DATE insert + `formatDate` local TZ), `dist/runtime/internal/schema.js:1-110` (format date → DATE column).
- `@nuxt/cli` 3.35.2 `dist/build-DWst0L5A.mjs:37`, `dist/dev-DFnFBwYf.mjs:673`, `generate-DJpMuzgA.mjs:24` (NODE_ENV).
- `nuxt` 4.4.8 `dist/pages/runtime/utils.js:8-12` (page key), `dist/app/components/utils.js:11-30`, `dist/pages/runtime/router.options.js` (scrollBehavior on the first navigation with a hash).
- `vue-router` 5.1.0 `dist/vue-router.js:27-80` (`popStateHandler`).
- `nitropack` 2.13.4 `dist/core/index.mjs:109, 2124-2125` (`autoSubfolderIndex`, `withoutBase`).
- `serve-handler` 6.1.7 `src/index.js:121-175, 256-307, 467-500, 570-700` (cleanUrls default, findRelated, sendError at the served root).
- Experimental build of the whole phase (scratch copy): generate, decoded dumps, gate 76/80 → 78/80 with the correct markup, visual-diff 56/56, probes for redirect/history/no-remount/hash/dev/typecheck/lint.
- Real GitHub Pages probe (`curl -I`, `server: GitHub.com`): `jekyllrb.com/docs` → 301 `…/docs/`; `pages.github.com/versions` → 301; `primer.github.io/octicons` → 301 `…/octicons/`; `…/octicons/index.html` → 200; unknown path → 404.
- Repo files read this session: `nuxt.config.ts`, `content.config.ts`, `shared/schemas.ts:349-401`, `app/app.vue`, `app/pages/index.vue`, `app/pages/trips/[slug].vue`, `app/components/TripView.vue`, `app/composables/useTrip.ts`, `useTripContext.ts`, `app/assets/css/base.css:984-1004,149-150,3`, all of `tests/parity/*.spec.ts` (the listed lines), `tests/data/build-isolation.spec.ts`, `tests/data/romaChrome.spec.ts`, `tests/data/trips.ts:1-60`, `tests/trips/shape.spec.ts:270-330`, `tests/trips/isolation.spec.ts:15-30`, `tests/unit/tripCoupling.spec.ts`, `tests/unit/romaChromeGuard.spec.ts`, `tests/README.md`, `playwright*.ts`, `package.json`, `content/trips/{roma,prueba,forma}/trip.yml`.

### Secondary (MEDIUM confidence)
- Web search on trailing slashes on GitHub Pages (contradictory community sources; settled by the `curl` probe): [kiwix SO mirror "github pages trailing slashes"](https://kiwix.lema.org/stackoverflow.com_en_all_2023-11/questions/33270605/github-pages-trailing-slashes), [Jekyll talk: no trailing slash on GitHub Pages](https://talk.jekyllrb.com/t/no-trailing-slash-just-fine-on-github-pages-but-eternal-redirect-locally/7851), [nuxt-github-pages (npm)](https://npmjs.com/package/nuxt-github-pages).

### Tertiary (LOW confidence)
- None used for decisions.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; options checked in `node_modules`.
- Architecture: HIGH — prototyped end to end in an experimental build, with gate, typecheck and lint.
- Pitfalls: HIGH — each one reproduced (remount, strict-mode footer, TS2307, dump false negative, same-document, anchor drift compared with the live `index.html`).

**Research date:** 2026-11-20
**Valid until:** 2026-12-20 (pinned stack; revalidate if Nuxt/Content/Playwright are upgraded)
