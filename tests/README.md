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
rm -rf .data .nuxt .output && pnpm generate && pnpm test:unit && pnpm test:data && pnpm test:parity
```

Desde la Fase 9, `verify` empieza borrando las cachés (`.data`, `.nuxt`, `.output`): tras
editar un YAML o el esquema, Nuxt Content sirve datos rancios desde `.data` y la puerta
validaría una build que no refleja el contenido actual.

| Capa | Script | Qué verifica | Runner |
|------|--------|--------------|--------|
| (build) | `pnpm generate` | Build estático limpio bajo `/guiaRoma/` (0 «window is not defined», salida real que consumen las capas de paridad). | `nuxi generate` |
| 1 | `pnpm test:unit` | **Lógica pura** portada del `index.html`: matriz de ritmo (`isVisible`), pila de navegación, `computeActiveSection` (+130), `capStops`/`pointFor`/`buildDirUrl` de la ruta del día, construcción del índice MiniSearch; guardián de acoplamiento a Roma. | Vitest (`tests/unit`) |
| 2 | `pnpm test:data` | **Invariantes de datos**: esquema zod por fichero (DATA-05), cross-refs resueltos, equivalencia 1:1 texto+enlaces del corpus migrado (migration-diff); por viaje (describe.each sobre content/trips, borradores incluidos) + centinela de build. | Vitest (`tests/data`) |
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

---

## 5. Aislamiento por viaje (Fase 9) — `pnpm test:trips`

La Fase 9 hace que búsqueda, navegación entre fichas, preferencias y notas sean **de
cada viaje**. La paridad de Roma (§1-§4) no puede demostrarlo sola: Roma se vería igual
aunque el estado fuera global. El aislamiento se verifica con cuatro piezas, tres dentro
de `pnpm verify` y una fuera.

### 5.1 `pnpm test:trips` — E2E sobre un segundo viaje real (FUERA de `verify`)

```bash
pnpm test:trips   # = playwright test -c playwright.trips.config.ts
```

- **Qué cubre:** los **5 tests** de `tests/trips/isolation.spec.ts`, en `/trips/prueba`
  frente a Roma:
  - *navegación en /trips/prueba (PLAT-02)* (2): un enlace a ficha (timeline y prosa)
    resalta la ficha dentro de prueba y «Volver» restaura el scroll; la pastilla activa
    sigue al scroll entre los días de prueba.
  - *búsqueda aislada por viaje (PLAT-01)* (2): en prueba, «Pantheon» no da resultados y
    «Fontana»/«Escalinata» solo traen fichas de prueba (el resultado navega dentro de
    prueba); en Roma, «Pantheon» encuentra la ficha de Roma y «Fontana» no trae fichas
    de prueba.
  - *preferencias y notas por viaje (PLAT-03)* (1): con preferencias `roma-*` sembradas,
    prueba arranca con los valores por defecto, y lo que se escribe en prueba va a
    claves `prueba-*` sin pisar las de Roma.
- **Config:** `playwright.trips.config.ts` (autocontenida, no importa las de paridad):
  `nuxi dev` en el **puerto 5300** con `NUXT_APP_BASE_URL=/guiaRoma/`, que Playwright
  arranca y para (`reuseExistingServer: false`); **un worker**, `retries: 0`, un solo
  proyecto **desktop** (1280×800, chromium); las peticiones externas se abortan.
- **Por qué está FUERA de `verify`:** necesita un **dev server**, porque `/trips/prueba`
  **no se prerenderiza** hasta la Fase 11 (la build estática solo emite «/»), y el dev
  server es frágil (primera compilación lenta, lock rancio de `nuxi dev`, recargas de
  Vite). Meterlo en la puerta la volvería no determinista, como la exclusión #2 de §2.
- **Cómo ejecutarlo:**
  1. **Node 22** en el PATH (con Node 24, `better-sqlite3`, que usa Nuxt Content, falla
     con «Module did not self-register»):
     `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH"`. Lo mismo vale para
     `nuxi generate`, `pnpm verify`, Playwright, eslint y `nuxi typecheck`.
  2. `rm -rf .data .nuxt` antes, para no heredar contenido rancio ni el lock de `nuxi dev`.
  3. **Nunca en paralelo con `pnpm verify`** (ni con `nuxi generate`): compiten por
     `.nuxt/` y `.data/`. Ejecutarlo **después** de que `verify` termine.
  4. Si `pnpm` no está en el PATH, un shim `exec corepack pnpm "$@"` delante en el PATH
     (el `pnpm` anidado de `verify` también lo necesita).

### 5.2 El viaje ficticio `content/trips/prueba/`

- **Fixture de aislamiento**, no un viaje real: `trip.yml`, 2 días (`viernes`, `sabado`)
  y 3 monumentos (`fontana-pruebas`, `spagna`, `torre-ensayo`). Algunos nombres e ids
  coinciden a propósito con Roma (`spagna`, «Fontana») para que una fuga entre viajes
  sea visible.
- **Solo dev:** se ve en `pnpm dev` → `/trips/prueba`. No se enlaza desde ningún sitio
  ni se prerenderiza (`nitro.prerender.routes` sigue siendo `['/']`). Se marcará
  **`draft: true` en la Fase 11** (ROUTE-05); ese filtro tendrá que excluir también sus
  filas del `sql_dump` público de Content, no solo las rutas de prerender.
- **Centinela `PRUEBA-CENTINELA-9F3`:** vive solo en prueba (howTo de `trip.yml` y la
  ficha `fontana-pruebas`). Si aparece en la página de Roma, algo del viaje de prueba se
  ha colado en la build (lo comprueba §5.5).
- Lo valida **la misma puerta de datos** que a Roma (§5.3).

### 5.3 Puerta de datos por viaje (`test:data`, dentro de `verify`)

- `tests/data/trips.ts` es el loader compartido (Node puro: `readFileSync` +
  `yaml.parse`, sin runtime Nuxt). `listTripDirs()` recorre **todas** las carpetas de
  `content/trips`, **borradores incluidos**, y `schema.spec.ts` / `invariants.spec.ts`
  las iteran con `describe.each` («esquema · viaje %s», «viaje %s»).
- `checkTrip()` devuelve violaciones con regla de la lista `RULES`: `yaml-parse`,
  `yaml-object`, `trip-yml`, `trip-slug`, `trip-field`, `stray-file`, `reserved-key`,
  `unknown-key`, `basename-slug`, `dup-id`, `fixed-anchor`, `ref`, `anchor`,
  `cross-trip-link`.
- Los mensajes (`formatViolations`) llevan **el fichero culpable** y la regla:
  `content/trips/<viaje>/…/<fichero>.yml: [<regla>] <detalle>`. Un YAML roto en
  cualquier viaje rompe `verify` nombrando su fichero.
- Bloque **«la puerta tiene dientes (fixtures)»** (`invariants.spec.ts`): casos
  negativos en memoria y en `tests/data/fixtures/trips/` que deben fallar con su regla;
  evita una puerta vacua en verde.
- Siguen siendo **solo de Roma**: el conteo de ficheros por colección
  (`schema.spec.ts`, D-12) y `migration-diff.spec.ts` (fidelidad contra el `index.html`).

### 5.4 Guardián de acoplamiento (`tests/unit/tripCoupling.spec.ts`, dentro de `verify`)

- Escanea `app/composables/*.ts`, `app/components/*.vue` y `app/utils/*.ts`, sin
  comentarios, y falla si reaparece: `useTrip('…')` con slug literal, una clave literal
  `roma-…`, un `useState` cuyo primer argumento no es `tripStateKey(…)`, un índice
  MiniSearch único de módulo, `getItem`/`setItem` con clave literal, o la enumeración o
  borrado de `localStorage`.
- Fija además el cableado por viaje (TripView publica el slug antes de su primer `await`;
  los controllers de búsqueda y modos leen el slug inyectado antes de esperar nada) y
  tiene su propio bloque «dientes del guardián».
- **Excepciones documentadas** (no se escanean): `app/pages/index.vue`
  (`<TripView slug="roma" />` es el hogar de «/» hasta la Fase 11) y `nuxt.config.ts`
  (`storageKey: 'roma-theme'` de color-mode: el tema es global, D-07).

### 5.5 Centinela de build (`tests/data/build-isolation.spec.ts`, dentro de `verify`)

Corre en `test:data` sobre la build que `pnpm generate` acaba de producir:

- `index.html` contiene «Galleria Sciarra» (es Roma; el spec no pasa en vacío);
- `PRUEBA-CENTINELA-9F3` no aparece ni en `index.html` ni en `_payload.json`;
- no existe `.output/public/trips`;
- el payload `__NUXT_DATA__` usa claves de estado sufijadas (`"$space:roma"`,
  `"$scardNav:stack:roma"`, `"$ssearch:query:roma"`) y ninguna `"$space"` global.

Sin build (`.output/public/index.html` ausente) el describe **se salta**, no falla en
falso. Ninguno de estos specs vive en `tests/parity/`: el conteo de §4 (80 / 11) no
cambia.

> Medido el 2026-11-20 en esta rama: `pnpm test:trips` → 5 tests en 1 fichero.
