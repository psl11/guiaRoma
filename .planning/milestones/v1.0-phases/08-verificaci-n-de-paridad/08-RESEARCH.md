# Phase 8: Verificación de paridad - Research

**Researched:** 2026-06-23
**Domain:** Playwright visual-regression + E2E parity verification gate for a Nuxt-4 SSG migration
**Confidence:** HIGH (harness, font mechanics, and snapshot mechanics all verified on disk / against official docs)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Heredado y BLOQUEADO por fases previas / paridad (no reabrir):**
- **Paridad = ley** (Core Value): F8 es la **puerta que lo demuestra**, no una fase de mejora. Lo que el usuario ve y puede hacer no cambia.
- **Golden de F1 = baseline INMUTABLE.** Los 56 PNGs (`tests/parity/golden.spec.ts-snapshots/`) son la referencia objetiva. Capturados con: **A5** (TODAS las peticiones de imagen abortadas por `resourceType==='image'` → fuerza el fallback SVG por `motif`, estado offline-determinista), **A8** (`snapshotPathTemplate` SIN sufijo de plataforma; capturado en linux), `maxDiffPixelRatio: 0.01`, **captura por elemento** (no fullPage, A6), `animations:'disabled'` + `caret:'hide'`. **NUNCA rebaselinar contra Nuxt.**
- **Patrón de spec autocontenido** (F3-F7): cada spec hace su **propio** `nuxt generate` + serve bajo `/guiaRoma/` (puerto propio), tolera **SOLO** el mensaje conocido de hidratación de `@nuxtjs/color-mode` (SSG) y falla ante cualquier otro error de consola. **NO** usa el `webServer` de `playwright.config.ts` (que sirve el `index.html` VIEJO). F7 añadió `tolerateAborts` para los `net::ERR_FAILED` deliberados de `route.abort`.
- **Comportamiento ya verificado por-fase = activos reutilizables**: `theme.spec`/`shell.spec` (F3), `render-cards/timeline/reference.spec` + `modes.spec` (F4), `navigation.spec` 6/6 (F5), `search-route.spec` 10/10 (F6), `map-fallback-notes.spec` 12/12 SC#1-SC#7 (F7). Invariantes de datos en `tests/data/{invariants,schema,migration-diff}.spec.ts` (F2). Lógica pura en `tests/unit/*` (10 specs).
- **D1 (unión discriminada SQL `artist`/`reference` todo-null) RESUELTO en F7** (supersets planos `ArtistRowSchema`/`ReferenceRowSchema`): `#arte`/`#arquitectura`/`#reservas`/`#practica` **renderizan con datos reales** — prerequisito de las vistas `ref-*` del visual-diff. La entrada "abierta" de STATE.md está **stale**.

**D-01 (topología = spec NUEVO, golden congelado):** un spec autocontenido **nuevo** (build+serve Nuxt bajo `/guiaRoma/`) compara las 14 vistas contra los **56 PNGs existentes como baseline de SOLO LECTURA**. `golden.spec.ts` se queda **tal cual** (sirve `index.html` viejo) y a demanda para regenerar baseline. **`test:golden:update` PROHIBIDO en F8.** Invariante: *baselines congelados + comparar el sitio generado, nunca rebaselinar.* La mecánica (fichero nuevo; cómo leer el dir de snapshots de F1 pese a `{testFileName}-snapshots`) = discreción del planner.

**D-02 (política ante un diff = INVESTIGAR Y CLASIFICAR, no a priori):** correr el visual-diff **una vez** y clasificar cada diff: (a) **real** → corregir el componente Nuxt hasta cuadrar dentro del `0.01`; (b) **artefacto no determinista** → decidir umbral/máscara con evidencia y justificación escrita. Bar = paridad = ley. **Riesgo material a investigar PRIMERO:** golden capturado del `index.html` con Google Fonts vs Nuxt self-host vía `@nuxt/fonts` — caracterizar antes de fijar umbral/máscara.

**Reusar verbatim el harness de determinismo del golden** (en el spec nuevo): A5 (`route('**/*', img→abort else continue)`), `settle()`, `animations:'disabled'`, dark vía `addInitScript(localStorage roma-theme=dark)`. **Vistas = las 14 del golden** (`inicio`, `dia-{viernes,sabado,domingo,lunes,martes}`, `ref-{reservas,gastronomia,practica,arte,arquitectura}`, `card-monumento=#galleria-sciarra`, `card-guided=#vaticano`, `card-concert=#auditorium`). **`#mapa` NO es vista del golden** (D-06).

**D-03 (comando-puerta ÚNICO):** F8 define **un comando** (p. ej. `pnpm verify`) que encadena `test:unit` + `test:data` + la suite Playwright de paridad. **Verde de ese comando = condición de la 1.0.**

**D-04 (sacar del gate los 2 fallos no-Nuxt, documentados):** (1) `golden.spec.ts` **NO entra** en el gate (re-renderiza `index.html` viejo, redundante; a demanda para regenerar baseline). (2) `shell.spec.ts:224` (dev-routing `/trips/[slug]` que lanza `nuxt dev`, frágil al lock de `nuxi dev` rancio) **fuera del gate**: ARCH-02 ya está probado por el build estático + la parte estática de `shell.spec`. **Ambas exclusiones documentadas con razón.**

**D-05 (AUDITAR + RELLENAR HUECOS):** F8 **no reescribe**. Mapea cada ítem de SC#2 a su spec por-fase, **aserta que todos pasan** en el gate, y añade **SOLO** las aserciones que falten. Candidato concreto: la **pila "volver" (`goBack` restaura el scroll) de punta a punta desde CADA punto de entrada** — mapa (popup→ficha→volver), búsqueda (resultado→ficha→volver), timeline/enlace interno (→ficha→volver). Los invariantes de datos de F2 cubren SC#3.

**D-06 (mapa = SOLO comportamiento, sin pixel):** `#mapa` **no tiene baseline en el golden** (tiles OSM no deterministas; F1 no lo capturó). Verificado por `map-fallback-notes.spec` (F7, 12/12) **dentro del gate** + el chrome estático prerenderizado. **Única excepción deliberada a la paridad-pixel**, a documentar en el sign-off. F8 NO captura baseline nuevo de `#mapa`.

**D-07 (sign-off humano final):** cierre de F8 = **suite verde + UN sign-off humano final de paridad global**. (Recordatorio: el sign-off de F7 quedó pendiente — Task 2 — y debe estar cerrado antes/durante F8.)

**D-08 (alcance PARA en verde + sign-off):** F8 entrega la **puerta** y **para**. El **merge `release/nuxt-4` → `main`** y el **deploy/CI** (GitHub Pages) quedan **FUERA de F8**. El roadmap de 8 fases acaba en verificación.

### Claude's Discretion
- **Topología exacta del spec visual-diff** y la mecánica para que lea el dir de snapshots congelado de F1 (`snapshotPathTemplate` por-proyecto, copiar/symlink, o `toHaveScreenshot` con path explícito) — sin rebaselinar.
- **Forma/nombre del comando-puerta** (`pnpm verify` u otro) y orquestación (script que encadena los 3, o `testIgnore`/grep que excluye `golden.spec`+`shell.spec:224`).
- **build-once vs builds por-spec**: consolidar la suite parity a un único build (global-setup) vs aceptar los `nuxt generate` por-spec (aislamiento, pero 8-10 builds por corrida).
- **Mecánica de la clasificación de diffs** (D-02): cómo correr "una vez", dónde se revisan los `*-diff.png`/`*-actual.png`, dónde se anota la clasificación.
- **Qué aserciones concretas faltan** tras la auditoría SC#2 y **cómo** se añaden (extender un spec vs spec pequeño nuevo de "back-stack por punto de entrada").
- Cómo se documentan las exclusiones del gate (deferred-items / comentario en spec / README de tests).

### Deferred Ideas (OUT OF SCOPE)
- **Merge `release/nuxt-4` → `main` + montar deploy/CI** (GitHub Pages, `.github/workflows/deploy.yml`) — el acto de shippear la 1.0, FUERA de F8 (honra D-06 de F1; `main` intacto). Cierre de milestone / paso de ship dedicado.
- **Consolidar la suite parity a UN build servido una vez** — optimización de rendimiento; el planner decide si entra en F8.
- **Baseline visual suplementario del chrome de `#mapa`** (caja vacía + banner, tiles enmascarados) — descartado en F8 (sería baseline nuevo fuera del golden congelado); posible mejora futura.
- **Endurecer `shell.spec:224` con `NUXT_IGNORE_LOCK=1`** en vez de excluirlo — D-04 lo saca del gate; hardening opcional para el dueño del test.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PARITY-02 | Suite de verificación visual (visual-diff) y comportamental que confirma paridad 100% con el `index.html` actual; debe pasar antes de dar la 1.0 por buena | The net-new **Nuxt↔golden visual-diff spec** (§Standard Stack, §Code Examples) provides SC#1; the **single gate command** (§Validation Architecture) chains `test:unit`+`test:data`+parity for SC#2/SC#3/SC#4; the **SC#2 audit + back-stack gap-fill** (§Architecture Patterns, §Runtime State Inventory) closes the one enumerated behavior gap. The font-equivalence analysis (§Common Pitfalls Pitfall 1) de-risks the #1 visual-diff threat before any threshold is set. |
</phase_requirements>

## Summary

Phase 8 is a **test/verification phase, not a UI-building phase**. The Nuxt site is feature-complete after F7; F8 builds the objective proof that it is pixel-and-behavior identical to the live `index.html`, plus a single green gate command that becomes the precondition for declaring 1.0. The Nuxt components are touched **only** if the visual-diff surfaces a *real* diff (D-02), never as new work.

The single largest piece of net-new work is a **new self-contained Playwright spec** that runs `pnpm generate`, serves the static build under `/guiaRoma/`, and screenshots the **same 14 views** the golden captured — comparing them against the **56 frozen golden PNGs** in `tests/parity/golden.spec.ts-snapshots/`. The existing `golden.spec.ts` re-captures the OLD `index.html` and is the F1 baseline/capture tool, **not** a Nuxt↔golden comparison — that comparison has never existed. The "4 golden failures" deferred to F8 are flakiness re-rendering the old HTML under parallel load, not Nuxt parity gaps. Two mechanics need resolving (both Claude's discretion): how the new spec reads the *frozen* golden directory despite Playwright's `{testFileName}-snapshots` template, and how to chain the three test layers into one gate that deterministically excludes `golden.spec.ts` and `shell.spec.ts:224`.

**The #1 risk — font sub-pixel noise — was investigated on disk first (as D-02 demands) and is structurally low.** The golden's `index.html` loads Cormorant Garamond v21 / Lora v37 / JetBrains Mono v24 from Google's `fonts.gstatic.com` at runtime; the Nuxt build self-hosts the **same Google source families** via `@nuxt/fonts` with `provider: 'google'`. Disk evidence: the latin-subset `unicode-range` blocks in the Nuxt build's generated CSS are **byte-identical** to those in `index.html`'s Google CSS, and the `totalSfntSize` of the downloaded woff2 differs by only 24 bytes (0.02%) — i.e. the same glyph outlines, packaged in a slightly different woff2 container/subset boundary. Identical outlines + identical Chromium/FreeType rasterizer → identical pixels for the rendered Spanish/Italian body text. AA noise, if any, is confined to subset boundaries and must be **confirmed empirically by the first visual-diff run** (D-02's "run once, classify"); do **not** pre-apply a font mask.

**Primary recommendation:** Add one new self-contained visual-diff spec that re-uses `golden.spec.ts`'s `VIEWS` + `settle()` + A5 verbatim and points its snapshot directory at the frozen golden dir via a config-level `snapshotPathTemplate` keyed on `{arg}` (the view name) so the file name does not gate the directory; add a `pnpm verify` script that runs `test:unit` → `test:data` → `playwright test` with `golden.spec.ts` and the dev-routing test excluded via `--grep-invert`/`testIgnore`; audit SC#2 against the five behavior specs and add only the missing "back-stack from map + search entry points" assertions; close the F7 sign-off; finish with the human parity sign-off. **No new dependencies.**

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Pixel-parity visual-diff (SC#1) | Test runner (Playwright, build-time/CI) | Static build (`.output/public`) | Compares the *generated static HTML* against frozen PNGs; runs against a local static server, never a live backend. |
| Behavior E2E (SC#2) | Test runner (Playwright) | Client (hydrated browser) | Exercises hydrated client behavior (scroll, theme, search, notes, back-stack) on the static build. |
| Data invariants (SC#3) | Test runner (Vitest, Node) | Content files (`content/trips/roma/*.yml`) | Pure Node assertions over YAML — no browser, no build. Already exist (F2). |
| Single gate command (SC#4) | Build tooling (`package.json` script) | — | Orchestration only; chains the three runners. |
| Frozen baseline storage | Repo (`tests/parity/golden.spec.ts-snapshots/`) | — | Read-only artifact; F8 must not write to it. |

## Standard Stack

### Core (all already installed — no new deps)
| Library | Version (verified) | Purpose | Why Standard |
|---------|--------------------|---------|--------------|
| `@playwright/test` | 1.61.0 [VERIFIED: package.json] | Visual-diff (`toHaveScreenshot`) + behavior E2E | Already the project's parity tool (golden + 5 behavior specs). `toHaveScreenshot` uses pixelmatch with `maxDiffPixelRatio`. [CITED: playwright.dev/docs/test-snapshots] |
| `vitest` | 4.1.9 [VERIFIED: package.json] | Pure-logic + data invariants runner | `test:unit` (10 specs) + `test:data` (3 specs) already green. |
| `pnpm` | 10.32.1 [VERIFIED: package.json `packageManager`] | Script orchestration of the gate | The `verify` script chains the three runners. |
| `nuxi generate` | nuxt 4.4.8 [VERIFIED: package.json] | Produces `.output/public` static build | Every self-contained spec already calls `pnpm generate` once in `beforeAll`. |

### Supporting (already present)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@nuxt/fonts` | 0.14.0 [VERIFIED: package.json] | Self-hosts the 3 Google families at build | Already configured `provider: 'google'` — the font-source-equivalence linchpin for SC#1 (see Pitfall 1). |
| `serve` (via `pnpm dlx serve`) | latest (transient) [ASSUMED] | Static file server under `/guiaRoma/` | Each self-contained spec spawns `pnpm dlx serve -l <port> <previewRoot>`. Same as F4-F7. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New self-contained visual-diff spec | Repoint `golden.spec.ts` at Nuxt | **FORBIDDEN by D-01** — `golden.spec.ts` is the F1 capture/provenance tool; repointing it loses the ability to regenerate the baseline and conflates capture with comparison. |
| `snapshotPathTemplate` keyed on `{arg}` | `toHaveScreenshot(['..','golden.spec.ts-snapshots',name])` array form | The array form **throws** if the path escapes the test file's own `-snapshots` dir [CITED: playwright.dev/docs/test-snapshots]. Config template is the supported escape hatch. |
| Per-spec `nuxt generate` (status quo) | One shared build via `globalSetup` | Status quo gives isolation (8-10 builds/run, slow); shared build is faster but couples specs. Performance call — Claude's discretion (D + Deferred). |
| `--grep-invert` to exclude specs from gate | `testIgnore` in a gate-specific config | Both work; `testIgnore` needs a second config file, `--grep-invert`/`--grep` needs stable test-title patterns. See §Validation Architecture. |

**Installation:** None. F8 adds **zero** dependencies — only a `package.json` script and a new spec file.

**Version verification:**
```bash
# All already in package.json; confirmed present on disk:
# @playwright/test 1.61.0, vitest 4.1.9, nuxt 4.4.8, @nuxt/fonts 0.14.0, pnpm@10.32.1
```
[VERIFIED: /home/vcompanyb/guiaRoma/package.json read 2026-06-23]

## Package Legitimacy Audit

> Phase 8 installs **no external packages**. Audit is N/A — no `npm install`/`pnpm add` occurs. The only runtime helper invoked, `serve`, is fetched transiently by the *existing* specs via `pnpm dlx serve` (unchanged by F8); it is already in use by F1's `playwright.config.ts` webServer and the F4-F7 self-contained specs.

| Package | Registry | Disposition |
|---------|----------|-------------|
| (none) | — | No installs in this phase |

**Packages removed due to slopcheck [SLOP] verdict:** none (no installs)
**Packages flagged as suspicious [SUS]:** none (no installs)

## Architecture Patterns

### System Architecture Diagram

```
                          F8 GATE COMMAND  (pnpm verify)
                                   │
          ┌────────────────────────┼────────────────────────────┐
          ▼                        ▼                             ▼
   pnpm test:unit            pnpm test:data            playwright test (parity)
   (Vitest, Node)            (Vitest, Node)            EXCLUDING golden.spec.ts
   10 pure-logic specs       invariants/schema/         + shell.spec.ts dev-route
          │                  migration-diff (SC#3)              │
          ▼                        ▼            ┌───────────────┼───────────────────┐
       green ─────────────────► green           ▼               ▼                   ▼
                                          behavior specs    NEW visual-diff    map-fallback-notes
                                          (F3-F7, SC#2)     spec (SC#1)        (F7, SC#2 + D-06)
                                                │                │                   │
                                                │      pnpm generate (beforeAll)     │
                                                │                ▼                   │
                                                │       .output/public ──► cp to     │
                                                │       previewRoot/guiaRoma/        │
                                                │                ▼                   │
                                                │       pnpm dlx serve -l PORT       │
                                                │       http://localhost:PORT/guiaRoma/
                                                │                │                   │
                                                ▼                ▼                   ▼
                                          DOM/text          toHaveScreenshot   marker/popup/
                                          assertions        per VIEW ×         banner/notes
                                          (no pixels)       {light,dark} ×      assertions
                                                            {mobile,desktop}
                                                                 │
                                                                 ▼
                                          reads FROZEN baseline (read-only):
                                          tests/parity/golden.spec.ts-snapshots/*.png
                                                                 │
                                          on diff ─► *-actual.png + *-diff.png in test-results/
                                                                 │
                                                                 ▼
                                                    D-02: run once → classify
                                                    real → fix Nuxt component
                                                    artifact → justified threshold/mask
                                                                 │
                          all green ───────────────────────────►│
                                                                 ▼
                                                    D-07: human parity sign-off → 1.0
```

The diagram traces the primary use case (the gate run) from command to sign-off. The visual-diff spec's data flow (generate → copy → serve → screenshot → compare-against-frozen) is the net-new path; everything else is reused.

### Recommended Project Structure (additions only)
```
tests/parity/
├── golden.spec.ts                  # UNCHANGED — F1 capture tool (old index.html); NOT in gate (D-04)
├── golden.spec.ts-snapshots/       # UNCHANGED — 56 frozen PNGs; read-only baseline (D-01)
├── <new-visual-diff>.spec.ts       # NEW — Nuxt build vs frozen golden (SC#1). Reuses VIEWS/settle/A5
├── modes/navigation/search-route/
│   map-fallback-notes/...spec.ts   # AUDIT for SC#2; minimal back-stack gap-fill only (D-05)
└── shell.spec.ts                   # UNCHANGED; its dev-routing test (~:224) excluded from gate (D-04)
package.json                        # MODIFY — add `verify` gate script (D-03)
playwright.config.ts                # POSSIBLE MODIFY — snapshotPathTemplate / project for the new spec
tests/README.md (or deferred-items) # document the 2 gate exclusions (D-04, Claude's discretion)
```

### Pattern 1: Self-contained build+serve spec (the F4-F7 template)
**What:** Each parity spec is fully autonomous: `beforeAll` runs `pnpm generate` (guarded by `ensureBuild`), copies `.output/public` into a temp `previewRoot/guiaRoma/` subdir, spawns a detached `pnpm dlx serve` on a spec-unique base port, and `waitForServer`s. `afterAll` kills the process group and `rmSync`s the temp dir. A strict console gate tolerates only the color-mode hydration message (and, with `tolerateAborts`, the deliberate `net::ERR_FAILED` of `route.abort`).
**When to use:** The new visual-diff spec MUST replicate this — it is the only pattern that serves the *generated Nuxt site* under the production subpath. **Never** use the `webServer` in `playwright.config.ts` (it serves the OLD `index.html`).
**Example:** (verbatim from the real harness)
```typescript
// Source: tests/parity/map-fallback-notes.spec.ts:85-143 (read 2026-06-23)
const OUTPUT_DIR = join(process.cwd(), '.output', 'public')

function ensureBuild(): void {
  if (!existsSync(join(OUTPUT_DIR, 'index.html'))) {
    const gen = spawnSync('pnpm', ['generate'], { stdio: 'inherit', shell: false })
    expect(gen.status, 'pnpm generate debe salir 0').toBe(0)
  }
  expect(existsSync(join(OUTPUT_DIR, 'index.html')), '.output/public/index.html debe existir').toBe(true)
}

const STATIC_PORT = 5760 + Number(process.env.TEST_WORKER_INDEX ?? 0) // pick a FREE base port (see ports table)
test.beforeAll(async () => {
  test.setTimeout(180_000)
  ensureBuild()
  previewRoot = mkdtempSync(join(tmpdir(), 'guiaroma-vdiff-'))
  const subDir = join(previewRoot, 'guiaRoma')
  mkdirSync(subDir, { recursive: true })
  cpSync(OUTPUT_DIR, subDir, { recursive: true })
  server = spawn('pnpm', ['dlx', 'serve', '-l', String(STATIC_PORT), previewRoot],
    { stdio: 'ignore', shell: false, detached: true })
  server.unref()
  await waitForServer(`http://localhost:${STATIC_PORT}/guiaRoma/`)
})
```
**Used base ports already taken:** modes=5700, navigation=5720, search-route=5740, map-fallback-notes=5760. The new visual-diff spec must pick a free base, e.g. **5780**.

### Pattern 2: Reuse `VIEWS` + `settle()` + A5 verbatim for apples-to-apples capture
**What:** The golden was produced with a precise determinism harness. The new spec must capture under *identical* conditions or the diff is meaningless.
**When to use:** Always, in the new visual-diff spec.
**Example:**
```typescript
// Source: tests/parity/golden.spec.ts:17-32, 44-93 (read 2026-06-23). Copy VERBATIM.
const VIEWS = [
  ['inicio', '#inicio'], ['dia-viernes', '#viernes'], ['dia-sabado', '#sabado'],
  ['dia-domingo', '#domingo'], ['dia-lunes', '#lunes'], ['dia-martes', '#martes'],
  ['ref-reservas', '#reservas'], ['ref-gastronomia', '#gastronomia'], ['ref-practica', '#practica'],
  ['ref-arte', '#arte'], ['ref-arquitectura', '#arquitectura'],
  ['card-monumento', '#galleria-sciarra'], ['card-guided', '#vaticano'], ['card-concert', '#auditorium'],
] as const
// settle(): force loading='eager', await networkidle, await every <img>.complete,
//           await document.fonts.ready, double rAF to settle SVG-swap reflow.
// A5: page.route('**/*', r => r.request().resourceType()==='image' ? r.abort() : r.continue())
//     registered BEFORE goto → forces the deterministic SVG-fallback (offline) state.
// dark: page.addInitScript(() => localStorage.setItem('roma-theme','dark'))
```
**Critical adaptation:** the golden does `page.goto('/index.html')` against the old-HTML webServer. The new spec does `page.goto('http://localhost:<port>/guiaRoma/')` against its own served Nuxt build. Everything else (route-abort, settle, per-element `scrollIntoViewIfNeeded` + `toHaveScreenshot(name)`) stays identical.

### Pattern 3: Pointing the new spec at the FROZEN golden directory (D-01 mechanic)
**What:** `snapshotPathTemplate` defaults to `{testDir}/{testFileName}-snapshots/{arg}-{projectName}{ext}` (current config, line 35). A *new* spec file would therefore look for `<new-file>.spec.ts-snapshots/`, not the golden's dir. The golden filenames are `{arg}-{projectName}.png` (e.g. `inicio-light-desktop.png` where `{arg}` = `inicio-light` and `{projectName}` = `desktop`).
**Recommended mechanic (cleanest, verified against docs):** override `snapshotPathTemplate` so the directory is **fixed to the golden dir** and the file identity comes only from `{arg}` + `{projectName}` — decoupling it from `{testFileName}`. Per-project override is supported [CITED: playwright.dev/docs/api/class-testproject — TestProject.snapshotPathTemplate].
```typescript
// playwright.config.ts — pin the visual-diff baseline to the FROZEN golden dir.
// {arg} carries the per-view "name-theme" the spec passes to toHaveScreenshot();
// {projectName} carries mobile/desktop (matching the golden's A8 no-platform-suffix scheme).
snapshotPathTemplate: 'tests/parity/golden.spec.ts-snapshots/{arg}-{projectName}{ext}'
```
With this template, the new spec calls `toHaveScreenshot(\`${name}-${theme}.png\`)` — `{arg}` resolves to `inicio-light`, `{projectName}` to `desktop`, yielding `tests/parity/golden.spec.ts-snapshots/inicio-light-desktop.png` (the existing frozen PNG). **No file is created** because the baseline already exists; a mismatch writes `*-actual.png` + `*-diff.png` to `test-results/` (not to the snapshots dir), so the frozen baseline stays untouched.
**Caveat:** this template is currently shared by `golden.spec.ts` too (same dir, same naming) — which is fine, since both legitimately read the same 56 PNGs. If the planner prefers isolation, a **per-project** `snapshotPathTemplate` on a dedicated project (e.g. project `vdiff-desktop`) scoped via `testMatch` to the new spec keeps the override local. Either is valid (Claude's discretion).
**Alternatives (also valid):** symlink `tests/parity/<new>.spec.ts-snapshots` → `golden.spec.ts-snapshots` (filesystem-level; fragile across OS, git-tracked symlink quirks), or `cpSync` the 56 PNGs into the new spec's dir in `beforeAll` (read-only copy; duplicates the baseline in `test-results`, never committed). The config-template approach is preferred: zero file duplication, zero symlink portability risk.

### Anti-Patterns to Avoid
- **Repointing `golden.spec.ts` at the Nuxt build** — violates D-01; it is the F1 capture/provenance tool.
- **Running `playwright test --update-snapshots` (a.k.a. `test:golden:update`) in F8** — FORBIDDEN (D-01). It would rebaseline the golden against Nuxt, destroying the objective reference.
- **Pre-applying a font/text mask "just in case"** — violates D-02 ("investigate and classify, not a priori"). Run once, look at the actual `*-diff.png`, *then* justify any mask in writing.
- **Putting `#mapa` in the visual-diff** — D-06: no golden baseline exists for it (non-deterministic OSM tiles). Map is behavior-only.
- **Using the `playwright.config.ts` webServer for the new spec** — serves the OLD `index.html`; the new spec must self-host the generated Nuxt build.
- **Letting `golden.spec.ts` or the dev-routing test into the gate** — D-04: they are non-deterministic against the gate's intent (one re-renders old HTML and is flaky under parallel load; the other spawns `nuxi dev` and is fragile to a stale lock).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Pixel comparison + diff image generation | A custom pixelmatch loop | `expect(locator).toHaveScreenshot()` | Built-in; honors `maxDiffPixelRatio: 0.01`, `animations:'disabled'`, `caret:'hide'` already configured; emits `*-actual`/`*-diff`/`*-expected` to `test-results/`. [CITED: playwright.dev/docs/test-snapshots] |
| Cross-OS baseline naming | Manual platform suffix logic | A8 `snapshotPathTemplate` already strips the platform segment | Golden captured on linux without `-linux`; the template (config line 35) preserves that. |
| Deterministic font/image state | Re-implementing FOUT/lazy-load waits | `settle()` from `golden.spec.ts` (verbatim) | Already battle-tested: eager-load, `networkidle`, per-`<img>.complete`, `document.fonts.ready`, double-rAF. |
| Offline SVG-fallback state | Toggling component props | A5 route-abort by `resourceType==='image'` | Forces every `onerror→motifSvg` swap deterministically; matches how the golden was captured. |
| Data invariants (counts, unique ids, cross-refs, motif) | New assertions in Playwright | `tests/data/{invariants,schema,migration-diff}.spec.ts` (F2) | Already green and Node-pure; SC#3 is fully covered. F8 only *includes* them in the gate. |
| Test orchestration / parallelism | A bespoke runner | `pnpm` script + Playwright workers | The gate is three CLI invocations; no custom harness needed. |

**Key insight:** F8 is ~90% **wiring and auditing existing, green assets**. The only genuinely new code is one visual-diff spec (a 5th clone of the self-contained pattern with `toHaveScreenshot` instead of DOM assertions), one `package.json` script, and possibly a handful of back-stack assertions. Resist the urge to "improve" the behavior specs — D-05 says audit and gap-fill, not rewrite.

## Runtime State Inventory

> This is a verification phase (not a rename/refactor), but the gate's *determinism* depends on runtime/environment state. The relevant inventory is "what runtime state could make the gate non-deterministic or read/write the frozen baseline."

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data (baseline) | **56 frozen golden PNGs** in `tests/parity/golden.spec.ts-snapshots/` (verified: exactly 56 files, names `{view}-{theme}-{project}.png`). | **Read-only.** Gate must compare against, never write. `--update-snapshots` FORBIDDEN. |
| Live service config | **None.** No backend, no DB, no external service runs during the gate. Nitro is dormant (ARCH-03). | None — verified: `nuxt.config.ts` has no active `server/api/*`; build is 100% static. |
| OS-registered state | **Stale `nuxi dev` lock** can block `shell.spec.ts:224` (the dev-routing test spawns `pnpm dev`). This is exactly why D-04 excludes it from the gate. | Exclude `shell.spec.ts:224` from gate (D-04). Optional hardening `NUXT_IGNORE_LOCK=1` is Deferred. |
| Secrets/env vars | `NUXT_APP_BASE_URL=/guiaRoma/` is set **inside** the dev-routing test's spawn env (shell.spec.ts:214), not globally. The static build bakes `app.baseURL:'/guiaRoma/'` from `nuxt.config.ts`. | None — the served build already carries the subpath; no env needed for the visual-diff/behavior specs. |
| Build artifacts | `.output/public/` (regenerated each run by `ensureBuild`); `node_modules/.cache/nuxt/.nuxt/cache/fonts/` (10 woff2, byte-identical to `.output/public/_fonts/`, verified via `cmp`). A **stale** `.output/public` from a prior branch state would make the visual-diff test the wrong build. | The self-contained pattern's `ensureBuild` regenerates only if `index.html` is missing. **Recommendation:** the gate should `rm -rf .output` (or run `pnpm generate` unconditionally) before the parity suite so the diff reflects current code, not a stale build. (Planner: weigh against build-once perf — Deferred.) |

**Canonical question answered:** After the gate runs, the only artifact that must remain pristine is the 56-PNG baseline; everything else (`.output`, temp `previewRoot`s) is ephemeral and torn down per-spec.

## Common Pitfalls

### Pitfall 1: Font sub-pixel AA noise across all text (THE #1 RISK — investigated first per D-02)
**What goes wrong:** A global ~sub-pixel anti-aliasing difference on every glyph would push many views past `maxDiffPixelRatio: 0.01`, producing a sea of "diffs" that are neither real layout/color regressions nor cleanly maskable.
**Why it (largely) does NOT happen here — disk-verified evidence:**
1. `index.html` loads the 3 families from Google `fonts.gstatic.com` at runtime (`<link href="fonts.googleapis.com/css2?family=Cormorant+Garamond...&Lora...&JetBrains+Mono...&display=swap">`, line 13). [VERIFIED: index.html:11-13]
2. `nuxt.config.ts` configures `@nuxt/fonts` with **`provider: 'google'`** for all 3 families (latin + latin-ext subsets). [VERIFIED: nuxt.config.ts:66-90]
3. The **latin-subset `unicode-range` blocks in the Nuxt build's generated CSS (`.output/public/_nuxt/entry.*.css`) are byte-identical** to the corresponding blocks in `index.html`'s live Google CSS — e.g. both contain exactly `U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,...` and `U+0100-02BA,...,U+A720-A7FF`. Same Google subset partitioning. [VERIFIED: curl of Google css2 vs grep of built CSS, 2026-06-23]
4. The downloaded woff2's uncompressed `totalSfntSize` differs by only **24 bytes (120604 vs 120580, 0.02%)** between Google's direct latin slice and the nuxt/fonts cached file — i.e. the **same Cormorant Garamond v21 glyph outlines**, repackaged with a marginally different subset boundary / name-table. [VERIFIED: woff2 header struct-parse, 2026-06-23]
5. Both render through the **same Chromium + FreeType** rasterizer with `animations:'disabled'`; identical outlines through an identical rasterizer → identical pixels.
**How to avoid:** Trust the structural equivalence but **prove it empirically** — run the visual-diff **once** (D-02). Inspect the `*-diff.png` for any text-heavy view (e.g. `ref-arte`, `inicio`). Expected outcome: passes within 0.01. If a view fails *only* on faint glyph-edge noise concentrated at subset boundaries (rare CJK/symbol glyphs are absent from the guide's Spanish/Italian text, so this is unlikely), *then* a justified `maxDiffPixels` bump or a narrow text mask may be warranted — documented in writing. Do **not** mask pre-emptively.
**Warning signs:** A diff that is uniformly faint across all text but with **zero** structural/color/layout shift → font-AA artifact. A diff concentrated in one region with hard edges → a *real* component diff (fix the Nuxt component, D-02 path (a)).

### Pitfall 2: New-spec snapshot directory mismatch (silently creates a new baseline)
**What goes wrong:** Without overriding `snapshotPathTemplate`, the new spec looks in `<new-file>.spec.ts-snapshots/`, finds nothing, and **creates** fresh snapshots from the Nuxt render — silently "passing" while comparing Nuxt against *itself*, defeating the entire phase.
**Why it happens:** Default template is keyed on `{testFileName}` (config line 35).
**How to avoid:** Pin the template to the golden dir (Pattern 3) **and** add a guard assertion in the spec: `expect(existsSync('tests/parity/golden.spec.ts-snapshots/inicio-light-desktop.png')).toBe(true)` in `beforeAll`, so a misconfiguration fails loudly instead of auto-baselining. Run the gate in CI-equivalent mode (no `--update-snapshots`) so missing baselines error rather than create.
**Warning signs:** First run is suspiciously all-green with new `.png` files appearing under the new spec's name; `git status` shows untracked snapshot files.

### Pitfall 3: Parallel-worker flakiness re-rendering long pages (the actual "4 golden failures")
**What goes wrong:** The deferred "4 golden failures" were `dia-viernes-light-desktop` etc. receiving a wrong viewport size (`1264×714` vs expected `1280×1576`) under parallel load — a *capture* flake on the OLD HTML, not a Nuxt parity gap. The new Nuxt visual-diff could hit the same class of flake on tall views (`#martes`, `#sabado`) if lazy-image reflow isn't settled.
**Why it happens:** Tall sections reflow as lazy images swap to SVG; element screenshots taken mid-reflow differ in height.
**How to avoid:** `settle()` (Pattern 2) already forces `loading='eager'` + per-`<img>.complete` + double-rAF, which is the fix. Additionally, the visual-diff spec can pin `workers: 1` (or a low cap) *for the parity project* to avoid viewport contention, and rely on `toHaveScreenshot`'s built-in retry. Per-element capture (A6) is already more stable than fullPage.
**Warning signs:** A view passes in isolation but fails in the full suite; diff shows a vertical shift / truncation rather than content changes.

### Pitfall 4: Gate exclusions silently stop matching (the gate goes green while skipping coverage)
**What goes wrong:** Excluding `golden.spec.ts` and `shell.spec.ts:224` by a brittle pattern (line number, fragile title substring) can silently exclude *more* than intended (or nothing) after a future edit, so the gate reports green while skipping real coverage.
**Why it happens:** `--grep-invert` matches test *titles*; renaming a test changes what's excluded. Line `:224` is not a Playwright selector — you exclude by file or title, not line.
**How to avoid:** Exclude `golden.spec.ts` at the **file** level (`testIgnore: '**/golden.spec.ts'` in a gate config, or omit it from the test path glob). Exclude the dev-routing test by a **stable, explicit title grep** (`--grep-invert "reutiliza el MISMO TripView"`) or, better, move that one test behind an env flag (`test.skip(!process.env.RUN_DEV_ROUTING, ...)`) so the gate never spawns `nuxi dev`. Add a comment + a `tests/README.md` note explaining *why* each is excluded (D-04 requires documented reasons). Assert the gate's expected test count so an accidental over-exclusion is visible.
**Warning signs:** Gate runtime drops sharply; Playwright reports far fewer tests than expected.

### Pitfall 5: The F7 sign-off is still open (cannot declare global parity on an unsigned phase)
**What goes wrong:** F7's Task 2 (human parity sign-off for map/fallback/notes) is **pending** per STATE.md; FEAT-02/UI-05/FEAT-04 are not marked complete. F8's D-07 global sign-off cannot honestly certify 1.0 while a constituent phase is unsigned.
**How to avoid:** The plan must include closing the F7 sign-off as an explicit prerequisite task (or verify it's closed) before the F8 global sign-off. [CITED: 08-CONTEXT.md §code_context "Sign-off de F7 pendiente"]
**Warning signs:** `pnpm test` for `map-fallback-notes.spec` is 12/12 green but the requirement checkboxes for FEAT-02/UI-05/FEAT-04 are unchecked.

## Code Examples

### Visual-diff spec core loop (the net-new SC#1 work)
```typescript
// Source: synthesized from golden.spec.ts:71-110 + the self-contained pattern (map-fallback-notes.spec.ts)
// Reuses VIEWS + settle() + A5 VERBATIM; swaps goto target to the served Nuxt build.
for (const theme of ['light', 'dark'] as const) {
  test(`nuxt↔golden ${theme}`, async ({ page }) => {
    // A5 — block all image requests → deterministic SVG-fallback (offline) state. Register BEFORE goto.
    await page.route('**/*', route =>
      route.request().resourceType() === 'image' ? route.abort() : route.continue())
    if (theme === 'dark') {
      await page.addInitScript(() => localStorage.setItem('roma-theme', 'dark'))
    }
    await page.goto(`http://localhost:${STATIC_PORT}/guiaRoma/`)   // NOT /index.html
    await settle(page)                                              // verbatim from golden.spec.ts
    for (const [name, sel] of VIEWS) {
      const locator = page.locator(sel)
      await locator.scrollIntoViewIfNeeded()
      // Resolves to tests/parity/golden.spec.ts-snapshots/<name>-<theme>-<projectName>.png
      // via the pinned snapshotPathTemplate (Pattern 3). Honors maxDiffPixelRatio:0.01.
      await expect(locator).toHaveScreenshot(`${name}-${theme}.png`)
    }
  })
}
// Console gate: tolerate ONLY the color-mode hydration message + (since A5 aborts) net::ERR_FAILED.
// i.e. trackConsoleErrors(page, /* tolerateAborts */ true) — see map-fallback-notes.spec.ts:100-110.
```

### The single gate command (D-03)
```jsonc
// package.json "scripts" — illustrative; exact name/shape = Claude's discretion.
{
  "test:parity": "playwright test --grep-invert \"reutiliza el MISMO TripView\"",
  // ^ runs all tests/parity/*.spec.ts EXCEPT the dev-routing test (D-04). golden.spec.ts excluded
  //   at file level via a gate-scoped config OR by not matching its title; see note below.
  "verify": "pnpm test:unit && pnpm test:data && pnpm test:parity"
}
```
**Excluding `golden.spec.ts` cleanly:** simplest is a tiny gate config `playwright.gate.config.ts` that extends the base and adds `testIgnore: ['**/golden.spec.ts']`, invoked as `playwright test -c playwright.gate.config.ts`. This avoids relying on grepping `golden.spec.ts`'s titles (`golden light`/`golden dark`). Either way, document both exclusions and assert the resulting test count.

### SC#2 back-stack gap-fill (the one concrete missing assertion, D-05)
```typescript
// The gap: "Volver restores scroll" is proven END-TO-END only from the timeline entry point
// (navigation.spec.ts SC#1). map-fallback-notes.spec SC#2 proves popup→ficha→.highlight but
// NOT popup→ficha→Volver→scroll-restored. search-route.spec proves result→ficha→.highlight but
// NOT →Volver→scroll-restored. Add the back-half to each (extend the existing spec, do NOT rewrite).
//
// Pattern (mirror navigation.spec.ts:231-242):
const originY = await page.evaluate(() => window.scrollY)
await popupLink.dispatchEvent('click')                 // map popup → ficha
await expect(page.locator(`#${slug}`)).toHaveClass(/\bhighlight\b/)
await expect(page.locator('#back-btn')).toHaveClass(/\bshow\b/)
await page.click('#back-btn', { force: true })          // Volver
await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(originY)  // scroll restored
await expect(page.locator('#back-btn')).not.toHaveClass(/\bshow\b/)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single `toHaveScreenshot` config, one snapshot dir per file | Per-project `snapshotPathTemplate` override | Playwright ≥ ~1.51 (PR #34525 fixed multi-project template bug) | Lets the new spec read the frozen golden dir without symlinks. [CITED: github.com/microsoft/playwright/issues/34507] Project is on 1.61.0 — well past the fix. |
| Google Fonts at runtime (CDN dependency) | `@nuxt/fonts` `provider:'google'` self-host at build | Already done in F1 (BUILD-02) | Same source glyphs, local serving → offline + (verified) glyph-equivalent to the golden's runtime fonts. |

**Deprecated/outdated:**
- The STATE.md "D1 open" blocker is **stale** — resolved in F7 (flat superset row schemas); `#arte/#arquitectura/#reservas/#practica` render with real data, so the `ref-*` views are valid visual-diff targets. [CITED: 08-CONTEXT.md §decisions "D1 ... RESUELTO en F7"]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `serve` (fetched via `pnpm dlx serve`) remains available/resolvable in the run environment | Standard Stack | If offline/unresolvable, all self-contained specs (incl. the new one) fail at `beforeAll`. Mitigation: it's already used by F1's webServer + 4 existing specs, so the environment clearly has it cached; could vendor a static server if needed. |
| A2 | Glyph outlines (not just unicode-range CSS) are identical between Google's `display=swap` woff2 and `@nuxt/fonts`' re-served woff2 | Pitfall 1 | If `@nuxt/fonts` re-subsets in a way that perturbs hinting, some text views could show faint AA noise. This is **exactly** what D-02's "run once, classify" resolves empirically; the 24-byte `totalSfntSize` delta makes a material difference unlikely. Not a blocker — a known, planned investigation. |
| A3 | The pinned `snapshotPathTemplate` (Pattern 3) does not break `golden.spec.ts`'s own capture/regenerate use | Architecture Patterns | If it did, regenerating the baseline on-demand (D-01) would write to the wrong place. Low risk: same dir + same `{arg}-{projectName}` naming as today's config (line 35). Per-project scoping (alternative) fully isolates if needed. |

**If this table is empty:** it is not — three assumptions are flagged, all low-risk and all resolvable within F8's own work (the font one is literally D-02's mandated investigation).

## Open Questions (RESOLVED)

1. **build-once vs per-spec builds for gate runtime**
   - What we know: 5 self-contained specs each call `pnpm generate` (guarded by `ensureBuild`, which skips if `.output/public/index.html` exists — so within one `playwright test` invocation they share the first build). The new spec adds a 6th.
   - What's unclear: whether to consolidate to an explicit `globalSetup` single build for speed, and whether to force a clean rebuild (`rm -rf .output`) so the gate never tests a stale build.
   - Recommendation: keep the existing `ensureBuild` sharing (it already de-dupes within a run); add a clean-build step at the **front of the gate** (`pnpm generate` once before `playwright test`) so all parity specs test the current code. Treat full `globalSetup` consolidation as the Deferred optimization. (Claude's discretion.)

2. **Exact exclusion mechanism for `golden.spec.ts` + dev-routing test**
   - What we know: file-level `testIgnore` (gate config) for `golden.spec.ts`; title-grep or env-flag skip for the dev-routing test.
   - What's unclear: whether to introduce a second `playwright.gate.config.ts` or keep one config + CLI flags.
   - Recommendation: a small `playwright.gate.config.ts` extending the base with `testIgnore: ['**/golden.spec.ts']` is the most robust (immune to title renames) and self-documents the exclusion. (Claude's discretion.)

3. **Whether any SC#2 gap beyond the back-stack exists**
   - What we know: theme/no-flash (theme.spec, F3), pace matrix (modes.spec, F4), search ≥2/max8/"Sin resultados" (search-route.spec, F6), day-route URL (search-route.spec, F6), notes persistence (map-fallback-notes.spec, F7), scrollspy +130 (navigation.spec, F5) are all covered. The audit must confirm each maps to a passing test in the gate.
   - What's unclear: only confirmable by running the audit during planning/execution.
   - Recommendation: the plan's first task is the SC#2 audit table (item → spec → assertion); the only *predicted* gap is the back-stack-from-map/search end halves (Code Examples). (D-05.)

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node + pnpm | All test runs | ✓ | pnpm 10.32.1 | — |
| `@playwright/test` + chromium | Visual-diff + behavior E2E | ✓ | 1.61.0 | — (chromium is the only installed browser; both projects force `browserName:'chromium'`) |
| `pnpm dlx serve` | Static server in self-contained specs | ✓ (used by F1 + F4-F7) | transient | Could vendor `node:http` static server if registry unreachable |
| Frozen golden PNGs | Visual-diff baseline | ✓ | 56 files | — (MUST exist; guard-assert in `beforeAll`) |
| `@nuxt/fonts` cache / `_fonts` woff2 | Font determinism for visual-diff | ✓ | 10 woff2, byte-identical cache↔output | — (regenerated at build) |
| `better-sqlite3` | `@nuxt/content` at build time | ✓ | ^12.11.1 (`onlyBuiltDependencies`) | — (build-time only; output is static) |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none material — `serve` is the only transient fetch and is already proven present.

## Validation Architecture

> `workflow.nyquist_validation: true` [VERIFIED: .planning/config.json]. For F8 the gate command and the 56-PNG visual-diff **are** the validation strategy — this section IS the deliverable's spec.

### Test Framework
| Property | Value |
|----------|-------|
| Frameworks | Playwright 1.61.0 (parity/visual + behavior E2E) + Vitest 4.1.9 (unit + data) |
| Config files | `playwright.config.ts` (exists; line 35 = A8 template, line 27 = `maxDiffPixelRatio:0.01`); a new `playwright.gate.config.ts` recommended for gate exclusions (see Wave 0) |
| Quick run command | `pnpm test:unit` (pure logic, < 5s) |
| Full parity command | `pnpm test:parity` (generate + serve + visual-diff + behavior, minutes) |
| Single gate command | `pnpm verify` = `test:unit && test:data && test:parity` (D-03) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PARITY-02 / SC#1 | Pixel-parity of 14 views × {light,dark} × {mobile,desktop} vs frozen golden | visual-regression | `pnpm test:parity` (the NEW visual-diff spec, `toHaveScreenshot`) | ❌ Wave 0 (net-new spec) |
| PARITY-02 / SC#2 (theme) | `data-theme` toggles, no flash | E2E | (in `test:parity`) `theme.spec.ts` | ✅ (F3) |
| PARITY-02 / SC#2 (pace) | Optimistic/neutral/slow matrix + light→slow + resumen | E2E | `modes.spec.ts` | ✅ (F4) |
| PARITY-02 / SC#2 (search) | ≥2 chars, max 8, "Sin resultados", result→navigate | E2E | `search-route.spec.ts` | ✅ (F6) |
| PARITY-02 / SC#2 (day-route URL) | `(N paradas)` + Google Maps walking href | E2E | `search-route.spec.ts` | ✅ (F6) |
| PARITY-02 / SC#2 (notes) | `roma-note-<slug>` persistence round-trip | E2E | `map-fallback-notes.spec.ts` | ✅ (F7) |
| PARITY-02 / SC#2 (scrollspy +130) | `.nav-pill.active` switches at `scrollY+130` | E2E | `navigation.spec.ts` | ✅ (F5) |
| PARITY-02 / SC#2 (back-stack: timeline) | Volver restores scroll from internal link | E2E | `navigation.spec.ts` SC#1 | ✅ (F5) |
| PARITY-02 / SC#2 (back-stack: map) | Volver restores scroll from map popup | E2E | extend `map-fallback-notes.spec.ts` | ❌ Wave 0 (gap-fill) |
| PARITY-02 / SC#2 (back-stack: search) | Volver restores scroll from search result | E2E | extend `search-route.spec.ts` | ❌ Wave 0 (gap-fill) |
| PARITY-02 / SC#3 | Counts (38/26/13/5/2/1), unique ids, cross-refs resolve, motif per monument | data invariants | `pnpm test:data` (`invariants/schema/migration-diff.spec.ts`) | ✅ (F2) |
| PARITY-02 / SC#4 | Whole suite green = 1.0 precondition + human sign-off | gate + manual | `pnpm verify` + D-07 sign-off | ❌ Wave 0 (gate script + sign-off) |

### Sampling Rate
- **Per task commit:** `pnpm test:unit` (fast) + the specific spec touched (e.g. `playwright test tests/parity/<new-vdiff>.spec.ts`).
- **Per wave merge:** `pnpm test:parity` (the full Playwright parity suite) + `pnpm test:data`.
- **Phase gate:** `pnpm verify` green (all three layers), then `/gsd:verify-work`, then D-07 human parity sign-off.

### Wave 0 Gaps
- [ ] `tests/parity/<new-visual-diff>.spec.ts` — covers PARITY-02/SC#1 (the Nuxt↔golden comparison; reuses `VIEWS`+`settle()`+A5; pins `snapshotPathTemplate` to the frozen golden dir per Pattern 3; base port 5780; guard-assert baseline exists).
- [ ] `package.json` — add `verify` (D-03) and `test:parity` (gate-scoped) scripts.
- [ ] `playwright.gate.config.ts` (recommended) — `testIgnore: ['**/golden.spec.ts']`; the dev-routing test excluded via env-flag skip or title grep (D-04). Document both exclusions.
- [ ] Back-stack gap-fill — extend `map-fallback-notes.spec.ts` (popup→ficha→Volver→scroll restored) and `search-route.spec.ts` (result→ficha→Volver→scroll restored) (D-05).
- [ ] Front-of-gate clean build step (`pnpm generate`) so the diff reflects current code, not a stale `.output`.
- [ ] Close F7 human sign-off (prerequisite, Pitfall 5).

## Security Domain

> `security_enforcement` is **not set** in `.planning/config.json` (verified). F8 is a test-only, static, no-network, no-input-handling verification phase: it adds no auth, no endpoints (Nitro dormant), no user input, no crypto, and no new dependencies. There is no new attack surface.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | No auth in 1.0 (BACK-01 is v2) |
| V3 Session Management | no | No sessions; static site |
| V4 Access Control | no | No protected resources |
| V5 Input Validation | no (for F8) | Search/notes input is existing F6/F7 client behavior; F8 only *verifies* it, adds none. (Data validation = zod, covered by F2's `test:data`.) |
| V6 Cryptography | no | No crypto |
| V12 Files/Resources | marginal | The visual-diff reads the frozen baseline read-only and writes diffs only to ephemeral `test-results/`; ensure no test writes outside the repo temp dirs (the existing pattern uses `mkdtempSync`/`rmSync` correctly). |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Supply-chain via transient `pnpm dlx serve` | Tampering | Already in use F1-F7; no new package. `pnpm` lockfile governs direct deps; `serve` is dev-only and never shipped. |
| Accidental baseline tampering (rebaseline against Nuxt) | Tampering / Repudiation | D-01 invariant + `--update-snapshots` FORBIDDEN; gate runs without the update flag; guard-assert baseline existence. |

## Sources

### Primary (HIGH confidence)
- `tests/parity/golden.spec.ts` (read 2026-06-23) — `VIEWS` (14 views), `settle()`, A5 image-block, capture loop. The verbatim-reuse source.
- `tests/parity/map-fallback-notes.spec.ts` + `navigation.spec.ts` + `search-route.spec.ts` (read 2026-06-23) — the self-contained build+serve pattern, console gate, `tolerateAborts`, back-stack coverage map.
- `playwright.config.ts` (read 2026-06-23) — `maxDiffPixelRatio:0.01`, `animations:'disabled'`, `caret:'hide'`, A8 `snapshotPathTemplate` (line 35), mobile/desktop projects, old-HTML webServer.
- `package.json` (read 2026-06-23) — existing scripts (`test:golden`, `test:golden:update`, `test:unit`, `test:data`, `generate`); dependency versions.
- `nuxt.config.ts` (read 2026-06-23) — `@nuxt/fonts` `provider:'google'` config (lines 66-90); static `github_pages` preset; `app.baseURL:'/guiaRoma/'`.
- `tests/parity/golden.spec.ts-snapshots/` (listed 2026-06-23) — exactly 56 frozen PNGs, names `{view}-{theme}-{project}.png`.
- On-disk font verification (2026-06-23): `cmp` cache↔output woff2 (byte-identical); curl of Google css2 vs grep of `.output/public/_nuxt/entry.*.css` (latin `unicode-range` byte-identical); woff2 `totalSfntSize` struct-parse (120604 vs 120580, 24-byte delta).
- [playwright.dev/docs/test-snapshots](https://playwright.dev/docs/test-snapshots) — `toHaveScreenshot`, `snapshotPathTemplate`, array-path "must stay within the snapshots directory" constraint, `maxDiffPixels`/`stylePath`/`mask`.
- [playwright.dev/docs/api/class-testproject](https://playwright.dev/docs/api/class-testproject) — per-project `snapshotPathTemplate` is supported; full token list (`{arg}`, `{projectName}`, `{testFileName}`, `{testDir}`, `{platform}`, etc.).

### Secondary (MEDIUM confidence)
- [github.com/microsoft/playwright/issues/34507](https://github.com/microsoft/playwright/issues/34507) — multi-project `snapshotPathTemplate` bug, fixed by PR #34525 (~1.51); project on 1.61.0 is past it.
- [fonts.nuxt.com/get-started/providers](https://fonts.nuxt.com/get-started/providers) + [fonts.nuxt.com/get-started/configuration](https://fonts.nuxt.com/get-started/configuration) — Google provider, subsets, woff2-only default. (Did not document re-subset/outline-preservation internals — hence assumption A2, resolved empirically by D-02.)
- `.planning/STATE.md`, `.planning/phases/05.../deferred-items.md`, `.planning/phases/06.../deferred-items.md` (via CONTEXT canonical_refs) — the "4 golden flakes" + dev-routing exclusion provenance.

### Tertiary (LOW confidence)
- General Playwright visual-testing blog posts (TestDino, Medium) surfaced in search — used only to corroborate the per-project override pattern; superseded by official docs above.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all deps verified present in `package.json`; zero new installs.
- Architecture (self-contained pattern, snapshot mechanic): HIGH — pattern read verbatim from 4 existing specs; `snapshotPathTemplate` per-project confirmed by official docs.
- Pitfalls / font risk: HIGH on the structural evidence (same Google source family, byte-identical latin unicode-range, 24-byte sfnt delta); the residual sub-pixel question is MEDIUM and **planned for empirical resolution** via D-02's run-once-classify (not a gap, a designed step).
- Validation architecture: HIGH — maps every SC to an existing or net-new test; the two Wave-0 spec additions are small clones of proven patterns.

**Research date:** 2026-06-23
**Valid until:** ~2026-07-23 (stable; Playwright 1.61 and the frozen golden are fixed points). Re-verify only if the branch rebuilds fonts against a different `@nuxt/fonts` version or Google bumps the font family version (`v21`/`v37`/`v24`).

## RESEARCH COMPLETE

**Phase:** 8 - Verificación de paridad
**Confidence:** HIGH

### Key Findings
- **The phase's namesake comparison does not yet exist.** `golden.spec.ts` re-captures the OLD `index.html` (F1 baseline tool); the **Nuxt↔golden visual-diff is the single net-new spec** of F8, a 5th clone of the self-contained build+serve pattern reusing `VIEWS`+`settle()`+A5 verbatim, swapping the goto target to the served Nuxt build and pinning `snapshotPathTemplate` to the frozen 56-PNG golden dir.
- **The #1 risk (font AA noise) is structurally low — disk-verified.** `index.html` (Google CDN runtime) and the Nuxt build (`@nuxt/fonts` `provider:'google'`) draw from the **same** Cormorant v21 / Lora v37 / JetBrains Mono v24 source; latin `unicode-range` blocks are byte-identical and the woff2 `totalSfntSize` differs by 24 bytes (0.02%). Same outlines + same Chromium/FreeType → same pixels. Confirm empirically (D-02 run-once-classify); do NOT pre-mask.
- **D-01 mechanic resolved:** pin `snapshotPathTemplate` to `tests/parity/golden.spec.ts-snapshots/{arg}-{projectName}{ext}` so the new spec reads the frozen baseline (array-path form is forbidden from escaping a file's own dir per docs); add a `beforeAll` guard-assert + never pass `--update-snapshots`.
- **D-04 mechanic resolved:** exclude `golden.spec.ts` at file level (gate-scoped `testIgnore`) and the dev-routing `shell.spec.ts` test via env-flag skip / stable title grep; document both with reasons; assert the gate's test count.
- **D-05 gap is precisely one thing:** the "Volver restores scroll" end-to-end is proven only from the timeline entry point; **add the back-half (popup→ficha→Volver, result→ficha→Volver) to the existing map and search specs** — extend, do not rewrite. Everything else in SC#2/SC#3 is already green (F2-F7).
- **Two prerequisites the plan must honor:** close the **pending F7 human sign-off** before the F8 global sign-off (Pitfall 5), and force a **clean build at the front of the gate** so the diff reflects current code.

### File Created
`/home/vcompanyb/guiaRoma/.planning/phases/08-verificaci-n-de-paridad/08-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | All deps verified in package.json; zero new installs |
| Architecture | HIGH | Pattern read verbatim from 4 specs; per-project snapshotPathTemplate confirmed in official docs |
| Pitfalls (font) | HIGH (structural) / MEDIUM (residual sub-pixel) | Same Google source, byte-identical latin unicode-range, 24-byte sfnt delta; residual resolved by D-02's designed run-once step |

### Open Questions
- build-once-vs-per-spec gate runtime (recommend: keep `ensureBuild` sharing + clean build at gate front; full `globalSetup` consolidation = Deferred).
- Single config + CLI flags vs a `playwright.gate.config.ts` for exclusions (recommend the gate config — immune to title renames).
- Any SC#2 gap beyond the back-stack — confirmable only by running the audit (predicted: none beyond back-stack).

### Ready for Planning
Research complete. The planner can create PLAN.md files: one wave for the visual-diff spec + snapshot mechanic, one for the gate script + exclusions, one for the SC#2 audit + back-stack gap-fill, closing with F7 sign-off prerequisite + D-07 global parity sign-off. No new dependencies; ~90% wiring/auditing of existing green assets.
