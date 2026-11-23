---
phase: "11"
slug: "portada-y-rutas-multi-viaje"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: true) (#2117)
status: validated
nyquist_compliant: true
wave_0_complete: true
created: "2026-11-20"
validated: "2026-11-23"
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source: `11-RESEARCH.md` §«Validation Architecture».

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.9 (`tests/unit`, `tests/data`) + Playwright 1.61.0 (puerta `playwright.gate.config.ts`; `tests/trips` con `playwright.trips.config.ts` sobre `nuxi dev`, puerto 5300) |
| **Config file** | `vitest.config.ts`, `playwright.gate.config.ts`, `playwright.trips.config.ts` |
| **Quick run command** | `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && pnpm test:unit && pnpm test:data` |
| **Full suite command** | `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && pnpm verify` (incluye `rm -rf .data .nuxt .output`) + `pnpm typecheck && pnpm lint`; aparte y nunca a la vez: `rm -rf .data .nuxt && pnpm test:trips` |
| **Estimated runtime** | quick < 10 s; full ~ 6-9 min; trips ~ 1-2 min |

---

## Sampling Rate

- **After every task commit:** quick run + `pnpm typecheck && pnpm lint` si se tocan tipos/config
- **After every plan wave:** full suite (`pnpm verify`) + `git diff --quiet -- tests/parity/golden.spec.ts-snapshots/`; en waves que toquen `tests/trips`, `content/trips/*` o la portada, también `pnpm test:trips`
- **Before `/gsd-verify-work`:** full suite verde + `pnpm test:trips` verde + conteo de la puerta re-registrado en `tests/README.md`
- **Max feedback latency:** 10 seconds (quick)

---

## Per-Task Verification Map

| Req / SC | Behavior | Test Type | Automated Command | File Exists | Status |
|----------|----------|-----------|-------------------|-------------|--------|
| ROUTE-01 | Portada: `<title>`/`<h1>` «Guías de viaje», una tarjeta por viaje publicado (título plano, fechas, destinos, resumen, `href` `/guiaRoma/trips/roma/`), sin `id`, estado vacío | e2e (gate) | `pnpm exec playwright test -c playwright.gate.config.ts tests/parity/portada.spec.ts` | ✅ | ✅ green |
| ROUTE-01 | `formatTripDates` / orden de viajes | unit | `pnpm exec vitest run tests/unit/tripDates.spec.ts` | ✅ | ✅ green |
| ROUTE-01/05 | En dev la portada lista solo Roma; `/trips/prueba` sigue funcionando | e2e dev | `pnpm test:trips` | ✅ | ✅ green |
| ROUTE-02 | `trips/roma/index.html` existe; `/` sirve la portada y `ROMA_URL` sirve Roma | e2e + node | `pnpm test:parity` (shell.spec) + `pnpm test:data` (build-isolation) | ✅ modificado | ✅ green |
| ROUTE-02 | `readTripManifest()` y rutas `['/','/trips/roma/']` | unit | `pnpm exec vitest run tests/unit/tripManifest.spec.ts` | ✅ | ✅ green |
| ROUTE-03 | `/#viernes`, `/#pantheon`, `/index.html#gastronomia` → `/trips/roma/#x` (como carga directa); sin hash / hash inválido se queda; Atrás sin bucle | e2e (gate, servidor tipo Pages) | `pnpm exec playwright test -c playwright.gate.config.ts tests/parity/legacy-redirect.spec.ts` | ✅ | ✅ green |
| ROUTE-03 | Script de redirección en el `<head>` de la portada antes del primer stylesheet y ausente en Roma | static | dentro de `legacy-redirect.spec.ts` | ✅ | ✅ green |
| ROUTE-04 | 0 peticiones a `__nuxt_content/`, `sql_dump`, `.wasm` al cargar portada y Roma | e2e (gate) | `portada.spec.ts` | ✅ | ✅ green |
| ROUTE-05 | Sin `trips/prueba` ni `trips/forma`; ningún fichero de `.output/public` (dumps decodificados) contiene los centinelas; control positivo con Roma | node | `pnpm test:data` (build-isolation) | ✅ invertido | ✅ green |
| ROUTE-05 | Esquema acepta/rechaza `draft`, `startDate`, `endDate`, `destinations`, `summary` (incl. `2026-02-30`) | data | `pnpm test:data` | ✅ ampliado | ✅ green |
| ROUTE-06 | Roma: `footer .trip-back a` «← Todos los viajes» → baseURL; `footer .container p` = 1; prueba: pie solo con el enlace | e2e | `pnpm test:parity` (shell/portada) + `pnpm test:trips` (shape.spec) | ✅ | ✅ green |
| G-11-3 (ROUTE-01, D-07/D-08) | `summary` con Markdown de bloque (listas incl. «2027. …», cita, tabla, código, separador, línea en blanco, `::x`) → violación `trip-summary-inline` en trip.yml; un fallo de la consulta de la portada hace fallar `nuxt generate` (createError fatal 500) | data + unit | `pnpm vitest run tests/data/invariants.spec.ts -t "G-11-3"` + `pnpm vitest run tests/unit/tripIndexFatal.spec.ts` | ✅ ampliado (11-08) | ✅ green |
| D-13 | Clic en pastilla no remonta TripView | e2e (gate) | `portada.spec.ts` | ✅ | ✅ green |
| D-21 | Todo selector de `multitrip.css` empieza por `.trip-index` | unit (static) | `pnpm exec vitest run tests/unit/multitripCss.spec.ts` | ✅ | ✅ green |
| PAR-01 | 56 goldens sin `--update-snapshots`; snapshots sin diff | e2e (gate) + git | `pnpm test:parity` + `git diff --quiet -- tests/parity/golden.spec.ts-snapshots/` | ✅ | ✅ green |
| PAR-02 | Toda la suite de Roma verde en `ROMA_URL=/guiaRoma/trips/roma/` | e2e (gate) | `pnpm test:parity` | ✅ vía harness | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `tests/parity/_harness.ts` — `ROMA_URL`/`ROMA_HTML` (commit propio, valor actual `/guiaRoma/`)
- [x] `tests/parity/_pagesServer.ts` — servidor que imita GitHub Pages (301 a barra final, `404.html`)
- [x] `tests/parity/portada.spec.ts` — ROUTE-01/04/06, D-13
- [x] `tests/parity/legacy-redirect.spec.ts` — ROUTE-03
- [x] `tests/unit/tripDates.spec.ts`, `tests/unit/tripManifest.spec.ts`, `tests/unit/multitripCss.spec.ts`
- [x] Ampliar `tests/data/schema.spec.ts` / `invariants.spec.ts`; invertir `build-isolation.spec.ts`
- [x] Test dev en `tests/trips/` (portada oculta drafts)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Aspecto de la portada en móvil real | ROUTE-01 | Juicio visual (no hay golden de la portada) | Abrir `/guiaRoma/` en el móvil, comprobar legibilidad y tema oscuro |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-11-20 (validate-phase --auto, retroactive audit); re-audited 2026-11-23 after gap closure 11-08 (G-11-3): `pnpm test:unit` 575/575, `pnpm test:data` 906/906 (Node 22).

**Evidence (orchestrator-run at HEAD after 11-07, Node 22, caches cleared):**
- `pnpm verify`: unit **301/301**, data **377/377**, parity **110/110** (13 files; 56 goldens, sin `--update-snapshots`); EXIT=0.
- `pnpm test:trips`: **19/19** (aislamiento + forma/trampa/chrome/título + portada dev).
- `git diff 6315f26 HEAD -- tests/parity/golden.spec.ts-snapshots/ tests/parity/golden.spec.ts app/assets/css/{base,tokens,fonts,leaflet}.css` vacío.
- Nuevos specs estables: `portada.spec.ts` 70/70 con `--repeat-each 5`; `legacy-redirect.spec.ts` 56/56 con `--repeat-each 4`.

## Validation Audit 2026-11-20

| Metric | Count |
|---|---|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
