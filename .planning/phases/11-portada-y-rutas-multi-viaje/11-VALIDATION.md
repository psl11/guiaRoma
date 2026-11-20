---
phase: "11"
slug: "portada-y-rutas-multi-viaje"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
# audit-milestone §5.5 distinguishes NOT-VALIDATED (draft) from PARTIAL (validated + nyquist_compliant: false) (#2117)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-20"
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
| ROUTE-01 | Portada: `<title>`/`<h1>` «Guías de viaje», una tarjeta por viaje publicado (título plano, fechas, destinos, resumen, `href` `/guiaRoma/trips/roma/`), sin `id`, estado vacío | e2e (gate) | `pnpm exec playwright test -c playwright.gate.config.ts tests/parity/portada.spec.ts` | ❌ W0 | ⬜ pending |
| ROUTE-01 | `formatTripDates` / orden de viajes | unit | `pnpm exec vitest run tests/unit/tripDates.spec.ts` | ❌ W0 | ⬜ pending |
| ROUTE-01/05 | En dev la portada lista solo Roma; `/trips/prueba` sigue funcionando | e2e dev | `pnpm test:trips` | ❌ W0 | ⬜ pending |
| ROUTE-02 | `trips/roma/index.html` existe; `/` sirve la portada y `ROMA_URL` sirve Roma | e2e + node | `pnpm test:parity` (shell.spec) + `pnpm test:data` (build-isolation) | ✅ modificar | ⬜ pending |
| ROUTE-02 | `readTripManifest()` y rutas `['/','/trips/roma/']` | unit | `pnpm exec vitest run tests/unit/tripManifest.spec.ts` | ❌ W0 | ⬜ pending |
| ROUTE-03 | `/#viernes`, `/#pantheon`, `/index.html#gastronomia` → `/trips/roma/#x` (como carga directa); sin hash / hash inválido se queda; Atrás sin bucle | e2e (gate, servidor tipo Pages) | `pnpm exec playwright test -c playwright.gate.config.ts tests/parity/legacy-redirect.spec.ts` | ❌ W0 | ⬜ pending |
| ROUTE-03 | Script de redirección en el `<head>` de la portada antes del primer stylesheet y ausente en Roma | static | dentro de `legacy-redirect.spec.ts` | ❌ W0 | ⬜ pending |
| ROUTE-04 | 0 peticiones a `__nuxt_content/`, `sql_dump`, `.wasm` al cargar portada y Roma | e2e (gate) | `portada.spec.ts` | ❌ W0 | ⬜ pending |
| ROUTE-05 | Sin `trips/prueba` ni `trips/forma`; ningún fichero de `.output/public` (dumps decodificados) contiene los centinelas; control positivo con Roma | node | `pnpm test:data` (build-isolation) | ✅ invertir | ⬜ pending |
| ROUTE-05 | Esquema acepta/rechaza `draft`, `startDate`, `endDate`, `destinations`, `summary` (incl. `2026-02-30`) | data | `pnpm test:data` | ✅ ampliar | ⬜ pending |
| ROUTE-06 | Roma: `footer .trip-back a` «← Todos los viajes» → baseURL; `footer .container p` = 1; prueba: pie solo con el enlace | e2e | `pnpm test:parity` (shell/portada) + `pnpm test:trips` (shape.spec) | ✅/❌ | ⬜ pending |
| D-13 | Clic en pastilla no remonta TripView | e2e (gate) | `portada.spec.ts` | ❌ W0 | ⬜ pending |
| D-21 | Todo selector de `multitrip.css` empieza por `.trip-index` | unit (static) | `pnpm exec vitest run tests/unit/multitripCss.spec.ts` | ❌ W0 | ⬜ pending |
| PAR-01 | 56 goldens sin `--update-snapshots`; snapshots sin diff | e2e (gate) + git | `pnpm test:parity` + `git diff --quiet -- tests/parity/golden.spec.ts-snapshots/` | ✅ | ⬜ pending |
| PAR-02 | Toda la suite de Roma verde en `ROMA_URL=/guiaRoma/trips/roma/` | e2e (gate) | `pnpm test:parity` | ✅ vía harness | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/parity/_harness.ts` — `ROMA_URL`/`ROMA_HTML` (commit propio, valor actual `/guiaRoma/`)
- [ ] `tests/parity/_pagesServer.ts` — servidor que imita GitHub Pages (301 a barra final, `404.html`)
- [ ] `tests/parity/portada.spec.ts` — ROUTE-01/04/06, D-13
- [ ] `tests/parity/legacy-redirect.spec.ts` — ROUTE-03
- [ ] `tests/unit/tripDates.spec.ts`, `tests/unit/tripManifest.spec.ts`, `tests/unit/multitripCss.spec.ts`
- [ ] Ampliar `tests/data/schema.spec.ts` / `invariants.spec.ts`; invertir `build-isolation.spec.ts`
- [ ] Test dev en `tests/trips/` (portada oculta drafts)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Aspecto de la portada en móvil real | ROUTE-01 | Juicio visual (no hay golden de la portada) | Abrir `/guiaRoma/` en el móvil, comprobar legibilidad y tema oscuro |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
