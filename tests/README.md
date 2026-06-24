# Tests — la puerta de paridad SC#4

Este directorio contiene las tres capas de verificación de guiaRoma. Su pieza
central es la **puerta SC#4**: un único comando que debe pasar en verde para
afirmar que la build Nuxt es paridad del `index.html` vivo. Este README es el
contrato legible-por-humanos de esa puerta: qué ejecuta, qué excluye y por qué,
y qué invariantes la hacen *a prueba de manipulación* (D-04, Pitfall 4, D-01).

> El primer pase real en verde + la clasificación de diffs (D-02) son del **Plan 06**.
> Este README es **documentación**: describe la puerta, no la fuerza a verde, y
> **nunca** toca el baseline congelado.

---

## 1. El comando-puerta: `pnpm verify` y sus tres capas

```bash
pnpm verify
```

`verify` (en `package.json`) encadena un **build limpio al frente** y luego las
tres capas, en este orden (D-03 — el build va primero para que el diff refleje
el código ACTUAL, no un `.output/` rancio):

```
pnpm generate && pnpm test:unit && pnpm test:data && pnpm test:parity
```

| Capa | Script | Qué verifica | Runner |
|------|--------|--------------|--------|
| (build) | `pnpm generate` | Build estático limpio bajo `/guiaRoma/` (0 «window is not defined», salida real que consumen las capas de paridad). | `nuxi generate` |
| 1 | `pnpm test:unit` | **Lógica pura** portada del `index.html`: matriz de ritmo (`isVisible`), pila de navegación, `computeActiveSection` (+130), `capStops`/`pointFor`/`buildDirUrl` de la ruta del día, construcción del índice MiniSearch. | Vitest (`tests/unit`) |
| 2 | `pnpm test:data` | **Invariantes de datos**: esquema zod por fichero (DATA-05), cross-refs resueltos, equivalencia 1:1 texto+enlaces del corpus migrado (migration-diff). | Vitest (`tests/data`) |
| 3 | `pnpm test:parity` | **Paridad** con alcance de puerta: Playwright contra la build servida bajo `/guiaRoma/` — el visual-diff Nuxt↔golden (SC#1) + los specs de comportamiento autocontenidos. | Playwright (`playwright.gate.config.ts`) |

`test:parity` es:

```bash
playwright test -c playwright.gate.config.ts --grep-invert "reutiliza el MISMO TripView"
```

Usa la **config con alcance de puerta** (`playwright.gate.config.ts`, no la base)
y aplica el grep-invert que es el «cinturón» de la exclusión #2 (ver §2).

---

## 2. Las DOS exclusiones de la puerta (con razón — D-04)

La puerta deja fuera EXACTAMENTE dos cosas. Ambas están documentadas con su
razón porque **D-04 exige que toda exclusión sea intencional y atribuible**: una
caída silenciosa de cobertura debe ser detectable (Pitfall 4, ver §4).

### Exclusión #1 — `golden.spec.ts`, a nivel de FICHERO (`testIgnore`)

- **Mecanismo:** `testIgnore: ['**/golden.spec.ts']` en `playwright.gate.config.ts`.
  A nivel de fichero (no por título ni línea frágil) → **estable ante renombrados**.
- **Razón:** `golden.spec.ts` re-renderiza el `index.html` **VIEJO** y es la
  herramienta de captura del baseline F1, **no** una comparación Nuxt↔golden. Esa
  comparación la hace ahora `tests/parity/visual-diff.spec.ts` (Plan 02), así que
  `golden.spec.ts` es **redundante** dentro de la puerta y además es **inestable
  bajo carga paralela** (los 4 fallos de pixel-diff diferidos a F8; ver
  `.planning/phases/06-…/deferred-items.md`).
- **Sigue vivo:** `golden.spec.ts` y los scripts `test:golden` / `test:golden:update`
  permanecen intactos como la **herramienta de captura F1 a demanda** (regenerar el
  baseline solo si `main` cambia de verdad — ver §3, está PROHIBIDO en F8).

### Exclusión #2 — el test de dev-routing (`shell.spec.ts`), por env-flag + grep-invert

- **Test:** `routing dinámico /trips/[slug]` → `/trips/roma reutiliza el MISMO
  TripView y un slug desconocido 404 (ARCH-02)` (`shell.spec.ts:242`, en ambos
  proyectos mobile+desktop).
- **Mecanismo (cinturón y tirantes):**
  1. **Tirantes (el que GARANTIZA):** `test.skip(!process.env.RUN_DEV_ROUTING, …)`
     a **nivel de describe** (`shell.spec.ts:204`) + early-return defensivo en el
     `beforeAll` (`shell.spec.ts:220`). Playwright evalúa la skip de describe en
     tiempo de colección, **antes** del `beforeAll` → con el flag sin definir, el
     `spawn` de `pnpm dev` **nunca** ocurre. (Plan 04.)
  2. **Cinturón:** `--grep-invert "reutiliza el MISMO TripView"` en `test:parity`
     (Plan 03), deseleccionando el mismo test por su título estable.
- **Razón:** ese test lanza un **servidor `nuxi dev`** real, **frágil a un lock
  rancio de `nuxi dev`** (la fragilidad que lo difirió en Fase 5; ver
  `deferred-items.md`). Mantenerlo en la puerta la volvería no-determinista.
  ARCH-02 (TripView reutilizado en `/trips/roma`) queda cubierto por el **build
  estático** + las **aserciones estáticas** de `shell.spec.ts` (que SÍ siguen en
  la puerta).
- **Ejecutable a demanda:** `RUN_DEV_ROUTING=1 pnpm test:parity`.

> Las **aserciones estáticas** de `shell.spec.ts` (shell + `#inicio` + footer,
> cabecera D-09, disciplina de prerender `no-trips-dir`) **NO** se excluyen: solo
> se deselecciona el test de dev-routing, nunca se borra.

---

## 3. Invariante de baseline CONGELADO (D-01)

El baseline visual es **inmutable**. Reglas duras de F8:

- **`pnpm test:golden:update` (a.k.a. `playwright test --update-snapshots`) está
  PROHIBIDO en F8.** Rebaselinaría el golden contra Nuxt, **destruyendo la
  referencia objetiva** capturada desde `main` en Fase 1.
- Los **56 PNGs** en `tests/parity/golden.spec.ts-snapshots/` son **read-only**:
  la puerta los **compara**, nunca los **escribe**. En mismatch, los
  `*-actual.png` / `*-diff.png` van a `test-results/` (efímero), no al dir de
  snapshots.
- `golden.spec.ts` es la **herramienta de captura F1 a demanda** — el único modo
  legítimo de regenerar esos PNGs, y solo si `main` cambia de verdad (fuera de F8).
- `visual-diff.spec.ts` **NUNCA** pasa el flag de actualización: lee el baseline
  congelado vía el `snapshotPathTemplate` de `playwright.gate.config.ts`
  (`tests/parity/golden.spec.ts-snapshots/{arg}-{projectName}{ext}`), de modo que
  `toHaveScreenshot(\`inicio-light.png\`)` resuelve al PNG congelado
  `inicio-light-desktop.png` en vez de auto-crear uno Nuxt-contra-sí-mismo.

Cómo confirmar que el baseline sigue intacto (debe salir 56 y exit 0):

```bash
ls tests/parity/golden.spec.ts-snapshots/ | wc -l   # => 56
git diff --quiet -- tests/parity/golden.spec.ts-snapshots/ && echo "baseline INTACTO"
```

---

## 4. Conteo de tests de la puerta — REGISTRADO (Pitfall 4)

Para que una **sobre-exclusión accidental** sea visible (la puerta se pondría
verde saltándose cobertura sin avisar), registramos aquí el número de tests que
la puerta selecciona. Una futura discrepancia entre este número y un `--list`
fresco es la **señal de alarma**.

| Magnitud | Valor | Cómo se obtiene |
|----------|-------|-----------------|
| Tests que la puerta **ejecuta** (`test:parity`, con el cinturón grep-invert) | **80** en **11 ficheros** | `pnpm exec playwright test -c playwright.gate.config.ts --grep-invert "reutiliza el MISMO TripView" --list` → línea `Total:` |
| Config de puerta **en crudo** (solo `testIgnore` golden, antes del grep-invert) | **82** en **11 ficheros** | `pnpm exec playwright test -c playwright.gate.config.ts --list` → línea `Total:` |

La diferencia **82 → 80** son exactamente los **2** del test de dev-routing
(mobile + desktop) que retira el grep-invert. (Con `RUN_DEV_ROUTING` sin definir,
la skip de describe de Plan 04 deja esos 2 como `skipped` en una corrida real;
en `--list` el grep-invert los retira de la cuenta, dejando 80 seleccionados.)
`golden.spec.ts` aporta **0** a ambos conteos (excluido a nivel de fichero).

Desglose por fichero de los **80** seleccionados (suma = 80):

| Fichero | Tests |
|---------|------:|
| `modes.spec.ts` | 14 |
| `map-fallback-notes.spec.ts` | 12 |
| `search-route.spec.ts` | 10 |
| `render-reference.spec.ts` | 8 |
| `theme.spec.ts` | 6 |
| `shell.spec.ts` | 6 |
| `render-timeline.spec.ts` | 6 |
| `render-cards.spec.ts` | 6 |
| `navigation.spec.ts` | 6 |
| `visual-diff.spec.ts` | 4 |
| `subpath.spec.ts` | 2 |

**Recalcular y comparar** (si el `Total:` ya no es 80 / 11 ficheros, una
exclusión cambió — investigar ANTES de tocar este README):

```bash
pnpm exec playwright test -c playwright.gate.config.ts \
  --grep-invert "reutiliza el MISMO TripView" --list | tail -1
# Esperado: «Total: 80 tests in 11 files»
```

> Conteos medidos empíricamente el 2026-06-23 contra `playwright.gate.config.ts`
> + `package.json` de esta rama (no estimados). Re-medir si se añade/retira un
> spec de paridad o cambia cualquiera de las dos exclusiones.
