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

### Dónde vive la URL de Roma (Fase 11, D-18)

Desde la Fase 11 la raíz del sitio (`/guiaRoma/`) es la **portada** y la guía de Roma vive en
**`/guiaRoma/trips/roma/`**. La URL de Roma está en un **único punto**:
`tests/parity/_harness.ts` → `ROMA_URL = '/guiaRoma/trips/roma/'` (junto a `SITE_BASE`,
`OUTPUT_DIR`, `ROMA_HTML` = el `index.html` prerenderizado de Roma, y `romaUrlAt(port)`). Los
specs de Roma de `tests/parity/` nunca escriben la base ni la ruta a mano: el movimiento de URL
de la Fase 11 fue un diff de una sola línea en el harness (más el import del harness y la línea
de la URL/HTML de cada spec). `_harness.ts` no casa con `*.spec.ts`: Playwright no lo ejecuta.

### Servidor tipo GitHub Pages para los specs de la Fase 11

Los specs de Roma sirven la build copiándola a `<tmp>/guiaRoma/` con `pnpm dlx serve`. Los dos
specs nuevos de la Fase 11 — **`legacy-redirect.spec.ts`** (redirección de enlaces antiguos
`/#ancla` → `/trips/roma/#ancla`) y **`portada.spec.ts`** (portada, publicación, vuelta a la
portada, borradores) — usan en su lugar **`tests/parity/_pagesServer.ts`**
(`startPagesServer(outDir, port, base?)`): un servidor HTTP en proceso, en `127.0.0.1`, que
imita a Pages sobre `.output/public` bajo `/guiaRoma/`: `301` de `/guiaRoma` y de los
directorios sin barra final a la forma con barra (conservando la query), `index.html` de cada
directorio y **`404.html` real** para lo inexistente. `serve` no vale ahí porque su `cleanUrls`
reescribe y oculta justo esa conducta. Puertos base: 5850 (`legacy-redirect`) y 5800
(`portada`), más `TEST_WORKER_INDEX`. Los dos specs de la Fase 14 (§6) también usan
`startPagesServer`: **`upgrade-from-main.spec.ts`** (puerto base 6600) y
**`cross-trip.spec.ts`** (puerto base 6700), más `TEST_WORKER_INDEX`. Las dos exclusiones de §2
no cambian.

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
  TripView y un slug desconocido 404 (ARCH-02)` (`shell.spec.ts:268`, en ambos
  proyectos mobile+desktop).
- **Mecanismo (cinturón y tirantes):**
  1. **Tirantes (el que GARANTIZA):** `test.skip(!process.env.RUN_DEV_ROUTING, …)`
     a **nivel de describe** (`shell.spec.ts:230`) + early-return defensivo en el
     `beforeAll` (`shell.spec.ts:246`). Playwright evalúa la skip de describe en
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
| Tests que la puerta **ejecuta** (`test:parity`, con el cinturón grep-invert) | **126** en **15 ficheros** (`Total: 126 tests in 15 files`, re-medido al cierre de la Fase 14) | `pnpm exec playwright test -c playwright.gate.config.ts --grep-invert "reutiliza el MISMO TripView" --list` → línea `Total:` |
| Config de puerta **en crudo** (solo `testIgnore` golden, antes del grep-invert) | **128** en **15 ficheros** (`Total: 128 tests in 15 files`, re-medido al cierre de la Fase 14) | `pnpm exec playwright test -c playwright.gate.config.ts --list` → línea `Total:` |

La diferencia **128 → 126** son exactamente los **2** del test de dev-routing
(mobile + desktop) que retira el grep-invert. (Con `RUN_DEV_ROUTING` sin definir,
la skip de describe de Plan 04 deja esos 2 como `skipped` en una corrida real;
en `--list` el grep-invert los retira de la cuenta, dejando 126 seleccionados.)

Historia del conteo: **80 / 11** hasta la Fase 10; la Fase 11 suma **30** — 2 del test
«la portada vive en / y ROMA_URL sirve Roma» de `shell.spec.ts` (11-05), 14 de
`legacy-redirect.spec.ts` (7 × mobile + desktop, 11-06) y 14 de `portada.spec.ts`
(7 × mobile + desktop, 11-07) — y dos ficheros nuevos.
La Fase 12 no añade specs de paridad; portada.spec.ts comprueba el 404 del borrador campania
dentro de su test de borradores (recorre todos los `draft: true` del manifiesto), así que el
conteo sigue en **110 / 13**.
La Fase 12.1 no añade specs de paridad y el conteo sigue en **110 / 13** (re-medido con
`--list` al cierre del plan 12.1-01).
La Fase 13 publica Campania sin tocar ningún spec de paridad: portada.spec.ts (de solo lectura)
saca del manifiesto los viajes publicados (ahora Campania y Roma) y los borradores que quedan
(prueba y forma, que siguen dando 404), así que el conteo sigue en **110 / 13** (re-medido con
`--list` al cierre de la Fase 13, plan 13-08) y los 56 goldens no cambian.
La Fase 14 suma **16**: 4 de `upgrade-from-main.spec.ts` (2 × mobile + desktop, 14-01) y 12 de
`cross-trip.spec.ts` (6 × mobile + desktop, 14-02), y dos ficheros nuevos: **126 / 15**
(re-medido con `--list` al cierre de la Fase 14, plan 14-03; detalle en §6). Los 56 goldens
siguen sin cambios desde la etiqueta `v1.0`.
`golden.spec.ts` aporta **0** a ambos conteos (excluido a nivel de fichero).

Desglose por fichero de los **126** seleccionados (suma = 126):

| Fichero | Tests |
|---------|------:|
| `portada.spec.ts` | 14 |
| `modes.spec.ts` | 14 |
| `legacy-redirect.spec.ts` | 14 |
| `map-fallback-notes.spec.ts` | 12 |
| `cross-trip.spec.ts` | 12 |
| `search-route.spec.ts` | 10 |
| `shell.spec.ts` | 8 |
| `render-reference.spec.ts` | 8 |
| `theme.spec.ts` | 6 |
| `render-timeline.spec.ts` | 6 |
| `render-cards.spec.ts` | 6 |
| `navigation.spec.ts` | 6 |
| `visual-diff.spec.ts` | 4 |
| `upgrade-from-main.spec.ts` | 4 |
| `subpath.spec.ts` | 2 |

**Recalcular y comparar** (si el `Total:` ya no es 126 / 15 ficheros, una
exclusión cambió — investigar ANTES de tocar este README):

```bash
pnpm exec playwright test -c playwright.gate.config.ts \
  --grep-invert "reutiliza el MISMO TripView" --list | tail -1
# Esperado: «Total: 126 tests in 15 files»
```

> Conteos medidos empíricamente el 2026-11-21 (cierre de la Fase 12, plan 12-07) contra
> `playwright.gate.config.ts` + `package.json` de esta rama con `--list` (no estimados):
> `Total: 110 tests in 13 files` con el grep-invert y `Total: 112 tests in 13 files` en crudo,
> los mismos que al cierre de la Fase 11 (2026-11-20; la medida anterior, 80 / 11 y 82 / 11, es
> del 2026-06-23). Re-medido el 2026-11-22 al cierre de la Fase 13 (plan 13-08, con Campania ya
> publicada): los mismos `Total: 110 tests in 13 files` y `Total: 112 tests in 13 files`.
> Re-medido el 2026-11-22 al cierre de la Fase 14 (plan 14-03, tras una corrida de
> `pnpm verify` en verde desde cachés limpias): `Total: 126 tests in 15 files` con el
> grep-invert y `Total: 128 tests in 15 files` en crudo (+16 = los dos specs de §6).
> Re-medir si se añade/retira un spec de paridad o cambia cualquiera de las dos exclusiones.

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

- **Qué cubre:** **46 tests en 4 ficheros** (`tests/trips/isolation.spec.ts`, 5,
  `tests/trips/shape.spec.ts`, 13, `tests/trips/portada.spec.ts`, 2, y
  `tests/trips/campania.spec.ts`, 26, de las Fases 12 y 13, §5.8). En dev, la portada
  está en `/guiaRoma/` y Roma en **`/guiaRoma/trips/roma/`** (Fase 11), como en la build. Los
  de `isolation.spec.ts`, en `/trips/prueba` frente a Roma:
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
- Los de `shape.spec.ts` (Fase 10, detalle en §5.6), por prefijo de título (útil con `-g`):
  - `forma:` (4): forma no tiene Arte/Arquitectura/Reservas/Práctica; `main` sale del
    layout (10 días en orden y Gastronomía al final); cada día muestra su nombre y su
    fecha; 10 pastillas de día distintas que llevan cada una a su día.
  - `prueba:` (1): solo Inicio, Mapa y sus dos días.
  - `trampa:` (5): la lista de viajes no-Roma incluye prueba y forma; un test por viaje
    no-Roma (hoy campania, forma y prueba) que no muestra ningún texto de Roma; control
    positivo en Roma. La trampa de campania llegó sola en la Fase 12: la lista sale de
    `content/trips`, así que un viaje nuevo entra sin tocar el spec (publicado o no).
  - `chrome:` (2): forma muestra su marca, su leyenda y su pie; prueba, sin campos de
    chrome, usa el respaldo neutro.
  - `título:` (1): la pestaña de cada viaje es EXACTAMENTE su `pageTitle` o su título plano.
- Los de `portada.spec.ts` (Fase 11, §5.7): `portada (dev):` (2): la portada en dev lista
  solo los viajes publicados, dos tarjetas por `startDate` descendente (Campania primero,
  publicada en la Fase 13; Roma después), aunque prueba y forma se cargan (ningún enlace a
  ellos), y el control positivo: los borradores siguen abriéndose por URL en dev con su título
  plano.
- Los de `campania.spec.ts` (Fases 12 y 13, detalle por requisito en §5.8): prefijo `campania:`
  (26), sobre la guía real de Campania 2027 en `/guiaRoma/trips/campania` (publicada desde la
  Fase 13; el e2e corre en dev como el resto).
- **Config:** `playwright.trips.config.ts` (autocontenida, no importa las de paridad):
  `nuxi dev` en el **puerto 5300** con `NUXT_APP_BASE_URL=/guiaRoma/`, que Playwright
  arranca y para (`reuseExistingServer: false`); **un worker**, `retries: 0`, un solo
  proyecto **desktop** (1280×800, chromium); las peticiones externas se abortan.
- **Por qué está FUERA de `verify`:** necesita un **dev server**, porque `/trips/prueba` y
  `/trips/forma` son **borradores** (`draft: true`, Fase 11): **no se prerenderizan** ni
  entran en la build, solo existen en dev (Campania está publicada desde la Fase 13: se
  prerenderiza y también se sirve en dev); y el dev
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
- **Solo dev — `draft: true` (Fase 11, ROUTE-05):** su `trip.yml` declara `draft: true`
  (el único cambio del viaje en la Fase 11). `scripts/tripManifest.mjs` lo lee en tiempo de
  config y, **fuera de `nuxi dev`**, `content.config.ts` excluye sus ficheros de las 6
  colecciones de Nuxt Content: no entra en la build de producción, ni en sus rutas de
  prerender, ni en ninguna fila de los `sql_dump` públicos. En `pnpm dev` **sí se carga**
  (`/guiaRoma/trips/prueba/`), para poder escribirlo y revisarlo, pero la portada no lo lista
  (tampoco en dev). En la build, `/guiaRoma/trips/prueba/` responde **404**.
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
  `cross-trip-link`, `day-order`, `day-pill`, `trip-dates`, `trip-summary-link`, `stay-ref`,
  `stay-dup` y `reservas-headings` (Fase 12.1, ver §5.9).
- Los mensajes (`formatViolations`) llevan **el fichero culpable** y la regla:
  `content/trips/<viaje>/…/<fichero>.yml: [<regla>] <detalle>`. Un YAML roto en
  cualquier viaje rompe `verify` nombrando su fichero.
- Bloque **«la puerta tiene dientes (fixtures)»** (`invariants.spec.ts`): casos
  negativos en memoria y en `tests/data/fixtures/trips/` que deben fallar con su regla;
  evita una puerta vacua en verde.
- Siguen siendo **solo de Roma**: el conteo de ficheros por colección
  (`schema.spec.ts`, D-12) y `migration-diff.spec.ts` (fidelidad contra el `index.html`).
- **`tests/data/campania-content.spec.ts`** (Fase 13, CAMP-01…CAMP-06): el contrato de
  CONTENIDO de Campania sobre el mismo loader (`loadTrip('campania')`). El marcador
  `**⚠ por confirmar**` va siempre en negrita, sin U+FE0F y nunca en un campo de texto plano
  (y nunca en Roma); ningún texto lleva palabras de Roma (`tests/trips/romaLeaks.ts`); solo se
  nombran los establecimientos de la lista verificada D-14; los diez días (slugs, orden 1..10,
  pastillas, bases, tramos y rutas) y las 24 fichas (numerales, imagen, nota familiar); Reservas
  con sus propios títulos y Práctica con sus temas; al menos 15 marcadores en la guía; y el
  describe «publicación (D-02)»: sin `draft: true`, sin la marca de control de la Fase 12 en
  `howTo` y con la tarjeta de la portada completa.

### 5.4 Guardián de acoplamiento (`tests/unit/tripCoupling.spec.ts`, dentro de `verify`)

- Escanea `app/composables/*.ts`, `app/components/*.vue` y `app/utils/*.ts`, sin
  comentarios, y falla si reaparece: `useTrip('…')` con slug literal, una clave literal
  `roma-…`, un `useState` cuyo primer argumento no es `tripStateKey(…)`, un índice
  MiniSearch único de módulo, `getItem`/`setItem` con clave literal, o la enumeración o
  borrado de `localStorage`.
- Fija además el cableado por viaje (TripView publica el slug antes de su primer `await`;
  los controllers de búsqueda y modos leen el slug inyectado antes de esperar nada) y
  tiene su propio bloque «dientes del guardián».
- **Excepciones documentadas** (no se escanean): `app/pages/index.vue` (la portada «/»
  desde la Fase 11; solo fija la constante de migración de la redirección de anclas antiguas
  de Roma) y `nuxt.config.ts`
  (`storageKey: 'roma-theme'` de color-mode: el tema es global, D-07).

### 5.5 Centinela de build (`tests/data/build-isolation.spec.ts`, dentro de `verify`)

Corre en `test:data` sobre la build que `pnpm generate` acaba de producir:

- Roma se prerenderiza en **`trips/roma/index.html`** (Fase 11), y esa página contiene
  «Galleria Sciarra» (es Roma; el spec no pasa en vacío);
- `PRUEBA-CENTINELA-9F3` y `FORMA-CENTINELA-10A` no aparecen ni en el HTML de Roma ni en
  `_payload.json`;
- **no existen `trips/prueba` ni `trips/forma`**: los borradores no se prerenderizan (D-17);
- **Campania publicada (Fase 13, D-02).** En la Fase 12 fue el tercer borrador, con su marca de
  control `CAMPANIA-CENTINELA-12A`. Desde la Fase 13 las comprobaciones son POSITIVAS: existen
  `trips/campania/index.html` y `trips/campania/_payload.json` y los dos contienen «Baia di
  Sorgeto» (los datos viajan prerenderizados en el payload, como los de Roma), y los dumps
  decodificados `trip` y `monument` llevan `trips/campania/` y «Baia di Sorgeto». Dos `it` fuera
  del `skipIf` comprueban siempre que su trip.yml ya no lleva `draft: true` y que ningún YAML de
  `content/trips/campania/` lleva la marca de control. La marca ya no está en el escaneo de
  ficheros publicados (13-REVIEW IN-06): la fuente es lo único que podría devolverla a la build.
  El aislamiento de borradores sigue sin ser vacuo gracias a prueba y forma;
- **Fase 12 (D-17), escaneo de clases del HTML publicado** (mitad de build del guardián de
  `tripshapes.css`, §5.8): ningún token de `NEW_CLASSES` aparece como clase en el HTML
  publicado de Roma ni de la portada (se recorre todo `*.html` de `.output/public` salvo el
  de `trips/<slug>/` de otro viaje), con control positivo (Roma sí lleva `tl-transport` y
  `day-stats-item`);
- el payload `__NUXT_DATA__` usa claves de estado sufijadas (`"$space:roma"`,
  `"$scardNav:stack:roma"`, `"$ssearch:query:roma"`) y ninguna `"$space"` global;
- **escaneo de `.output/public` entero con los dumps DECODIFICADOS** (Fase 11, D-16): los
  `__nuxt_content/<colección>/sql_dump.txt` de las 6 colecciones son base64 + gzip, así que
  un `grep` sobre el fichero no vería nada; `decodeDump` los descomprime y el spec comprueba
  que ningún fichero publicado contiene un centinela de borrador, con un control positivo
  (los dumps decodificados llevan Roma y, desde la Fase 13, Campania). Cierra **CR-01** (filas de borradores en los dumps
  públicos).

Sin build (`.output/public/index.html` ausente) los bloques post-build **se
saltan**, no fallan en falso; los centinelas de los propios `trip.yml` se comprueban siempre.
Ninguno de estos specs vive en `tests/parity/`: no cuentan en §4.

> Medido el 2026-11-22 en esta rama (cierre de la Fase 13, plan 13-08, `pnpm exec playwright
> test -c playwright.trips.config.ts --list`): `Total: 46 tests in 4 files`. Al cierre de la
> Fase 11 eran 19 en 3; la Fase 12 suma `campania.spec.ts` (24) y la trampa de campania en
> `shape.spec.ts` (1), 44 en 4; la Fase 13 suma dos tests a `campania.spec.ts` (Gastronomía en
> 13-02 y Reservas/Práctica en 13-07), 46 en 4.

### 5.6 Forma y chrome desde datos (Fase 10)

La Fase 10 hace que la **forma** de la guía (qué secciones y pastillas hay, cuántos días)
y su **chrome** (marca de cabecera, leyenda del mapa, pie y título de la pestaña) salgan
de los datos de cada viaje. Roma tiene que seguir idéntica (§1-§4: la puerta —80 tests al
cierre de la Fase 10— y los 56 goldens no cambian); lo nuevo se defiende con estas piezas:

- **El viaje dev-only `content/trips/forma/`** (fixture, no un viaje real): 10 días con
  slugs con fecha (`sabado-19` … `lunes-28`, `order` 1..10) que repiten día de la semana
  (dos sábados, con `pill` propia: «Sáb 19», «Sáb 26»…), 2 monumentos con coordenadas
  (el mapa siempre tiene marcadores) y 1 ficha de comida. **No** tiene Arte,
  Arquitectura, Reservas ni Práctica: sus secciones y pastillas no deben aparecer. Define
  todo su chrome (`pageTitle`, `brand`, `mapLegend`, `footer`). Como prueba, solo se ve en
  dev (`/trips/forma`), no se prerenderiza y es `draft: true` desde la Fase 11 (§5.2).
  **Centinela `FORMA-CENTINELA-10A`** (en su howTo): `tests/data/build-isolation.spec.ts`
  comprueba que no aparece en `index.html` ni en `_payload.json` de la build (§5.5).
  `content/trips/prueba/` **no se toca**: se queda sin campos de chrome a propósito, para
  probar el respaldo neutro.
- **`tests/trips/shape.spec.ts`** (`test:trips`, FUERA de `verify`, §5.1): forma y prueba
  en el navegador (bloques `forma:`/`prueba:`), el test-trampa (`trampa:`), el chrome
  (`chrome:`) y la pestaña (`título:`). Valores esperados: forma → pestaña «Forma · diez
  días de ensayo», marca «Forma ✦ diez días de ensayo» con `.brand-dot`, leyenda
  «✦ Rojos · paradas con ficha ✦», pie de 3 líneas (2 `<br>`, «comprobar» en `<em>`);
  prueba → marca y pestaña «Dos días de Prueba», sin `.brand-dot`, sin `<footer>` y sin
  `p.map-legend` (el `.flourish` se queda).
- **`tests/data/romaChrome.spec.ts`** (`test:data`, dentro de `verify`): el chrome de Roma
  en su `trip.yml` es **verbatim** el del `index.html` heredado (leído con cheerio, solo
  lectura), y un bloque **post-build** comprueba que marca, leyenda, pie y un único
  `<title>` están en `.output/public/index.html` (render de servidor, no isla de
  cliente). Sin build, ese bloque se salta.
- **`tests/unit/tripLayout.spec.ts`** (`test:unit`): `buildTripLayout` (orden fijo,
  presencia solo por datos, etiqueta de día = `pill` o `dayLabel(eyebrow)`, 0/1/N días),
  `dayPillLabel` e `inlineMdToPlain`; el caso Roma lee sus YAML reales y espera las 12
  pastillas de la paridad.
- **`tests/unit/romaLeaks.spec.ts`** (`test:unit`): los dientes del matcher de la trampa
  (`tests/trips/romaLeaks.ts`, ver abajo): «aroma», «Romaña», «romano», «guiaRoma»,
  «payment» no casan; «Roma», «ROMA», «ROYAL COURT», «Royal Court» partido por un salto de línea sí.
- **`tests/unit/romaChromeGuard.spec.ts`** (`test:unit`, guardián **D-17**): escanea el
  fichero ENTERO de cada `app/**/*.{vue,ts}` (incluidos `app/app.vue` y `app/pages/`),
  sin comentarios, y falla si reaparece un literal de chrome de Roma
  (`ROMA_CHROME_LITERALS`: `giugno MMXXVI`, `concierto Einaudi`, `19—23 giugno 2026`,
  `dos colegas`). Con sus propios dientes en memoria.
- **Reglas nuevas de la puerta de datos** (§5.3, `tests/data/trips.ts`): `day-order`
  (`order` de los días único y contiguo 1..N, sin límite de días), `day-pill` (etiquetas
  de pastilla únicas en el viaje, calculadas igual que en la UI); `anchor` valida contra
  los slugs de entidad más las secciones que el viaje **tiene** según `buildTripLayout`
  (un `#reservas` en un viaje sin reservas falla); `cross-trip-link` pasa a **lista
  blanca**: en la prosa solo `#id` o `http(s)://` (nada de `/…`, `../…`, `javascript:`).

**La lista trampa (D-16).** `ROMA_MARKERS` = «Roma», «Einaudi», «giugno», «MMXXVI», «Pay»,
«Fellini», «Royal Court». El test-trampa recorre **todos** los viajes de `content/trips`
salvo `roma` y busca esas palabras (límites de palabra Unicode, sin distinguir
mayúsculas) en `document.title`, en el texto visible del `body` y en el `textContent` de
un clon del `body` sin `script`/`style`/`noscript`/`template`. Antes de escanear comprueba
que la página se renderizó (h1 de `#inicio` = título del viaje, ≥ 3 pastillas, pestaña no
vacía), y un control positivo comprueba que en Roma el mismo matcher SÍ encuentra «Roma»
y «giugno»: la trampa no puede pasar en vacío.

> **Regla de oro:** si la trampa salta, se arregla el **código** de `app/` o los **datos**
> del viaje afectado. **Nunca** se quita una palabra de la lista, ni se excluye un viaje o
> una parte del `body` para que pase.

### 5.7 Portada y rutas multi-viaje (Fase 11)

La Fase 11 convierte `/guiaRoma/` en la **portada** («Guías de viaje») y mueve cada guía a
**`/guiaRoma/trips/<slug>/`**. Roma sigue idéntica (56 goldens sin re-baseline, la suite de
Roma en `ROMA_URL`); lo nuevo se defiende con estas piezas:

- **La portada** — `app/pages/index.vue` (`<title>` «Guías de viaje» + `<TripIndex />`) y
  `app/components/TripIndex.vue`: una tarjeta `a.trip-index-card` por viaje publicado
  (título plano, línea meta, resumen MDC), enlace de documento completo a
  `${baseURL}trips/<slug>/`, sin `id` en ningún elemento, sin chrome de viaje y sin tocar
  `localStorage`. Sus datos se resuelven en prerender: la portada **no descarga** el
  `sql_dump` ni el WASM de Nuxt Content (ROUTE-04).
- **`scripts/tripManifest.mjs`** (+ `tripManifest.d.mts`): manifiesto de viajes leído en
  tiempo de config — `readTripManifest()` (`{ slug, draft }` por carpeta con `trip.yml`,
  fail-closed ante nombres o `draft` inválidos), `draftExcludes()` (excluye los borradores
  de las 6 colecciones fuera de dev, §5.2) y `prerenderRoutes()` (`['/', '/trips/<slug>/']`
  de los publicados → `nitro.prerender.routes`). Añadir un viaje = añadir su carpeta.
  Probado en `tests/unit/tripManifest.spec.ts`.
- **`app/utils/tripDates.ts`**: `formatTripDates`, `tripMetaLine` («19–23 de junio de 2026 ·
  Roma»), `sortTrips` (por `startDate` descendente) y `listedTrips` (quita borradores; `null`
  mientras no hay datos). Probado en `tests/unit/tripDates.spec.ts`.
- **`app/assets/css/multitrip.css`** + guardián **`tests/unit/multitripCss.spec.ts`**
  (`test:unit`, D-21): todas las reglas de la portada van bajo `.trip-index` y el fichero se
  carga el último, detrás de los cuatro CSS congelados (que no cambian).
- **Reglas nuevas de la puerta de datos** (§5.3): `trip-dates` (`endDate` no anterior a
  `startDate`) y `trip-summary-link` (el `summary` no lleva enlaces: la tarjeta ya es un
  `<a>`).
- **Redirección de enlaces antiguos** — script inline `legacy-hash-redirect` en el `<head>`
  de la portada: `/guiaRoma/#ancla` (y `/guiaRoma/index.html#ancla`) hace `location.replace`
  a `/guiaRoma/trips/roma/#ancla` antes del primer pintado, solo si el hash cumple
  `^#[a-z0-9-]+$`. Lo prueba `tests/parity/legacy-redirect.spec.ts` (7 tests).
- **«← Todos los viajes»** — `TripView.vue` termina el `<footer>` de **toda** guía con
  `p.trip-back` → enlace de documento completo a la portada, fuera de `.container` (el
  locator `footer .container p` de la puerta sigue siendo único). Sin CSS nuevo.
- **`tests/parity/portada.spec.ts`** (7 tests × mobile + desktop, en la puerta), por
  prefijo `portada:` sobre la build servida con `_pagesServer.ts`: tarjetas = publicados
  del manifiesto con los textos del UI-SPEC y clic a Roma como documento nuevo (ROUTE-01);
  ni la portada ni Roma piden `__nuxt_content/`, `sql_dump` ni `.wasm`, con control de no
  vacuidad (ROUTE-04); el pie de Roma vuelve a la portada (ROUTE-06); pulsar pastillas no
  remonta la guía (D-13, clave de página por slug en `app/pages/trips/[slug].vue`); cada
  borrador del manifiesto da 404 (ROUTE-05, lista no vacía); backstops de tema guardado
  (`roma-theme`, sin claves nuevas) y de textos largos a 375 px.
- **`tests/parity/shell.spec.ts`**: la build emite `trips/roma/` y ningún borrador, y «la
  portada vive en / y ROMA_URL sirve Roma».
- **`tests/trips/portada.spec.ts`** (dev, §5.1): la portada en dev no lista borradores
  aunque estén cargados.

### 5.8 Formas nuevas de viaje (Fase 12)

La Fase 12 añade las formas que necesita un viaje como Campania y que Roma nunca tuvo:
alternativas dentro de un día (`choice`), «Dormís en …», cinco transportes nuevos, lugares de
naturaleza, mapa de varias ciudades, ruta del día por modo y la caja «Con niños». Roma no
cambia (la puerta de §4 sigue en 110 / 13 y los 56 goldens sin `--update-snapshots`); lo nuevo
se defiende con estas piezas:

- **`app/assets/css/tripshapes.css`**: todos los estilos nuevos, **exactamente** el bloque de
  12-UI-SPEC §«tripshapes.css — reglas exactas» (orden y valores). Va **la última** en
  `css[]` de `nuxt.config.ts`, detrás de los cuatro CSS congelados y de `multitrip.css`, que
  no cambian. **Cada selector exige una clase de `NEW_CLASSES`** (`tests/unit/cssSelectors.ts`:
  `tl-choice*`, `day-stay`, `day-stay-name`, `family-box`, `ferry`, `car`, `bus`, `bike`,
  `plane`), que nunca aparece en el DOM de Roma: ninguna regla puede alcanzar a Roma.
  - Guardián estático **`tests/unit/tripShapesCss.spec.ts`** (`test:unit`): cada selector
    (también dentro de `@media`) lleva un token de `NEW_CLASSES` comparado por token completo
    (`car` no casa con `card`); prohíbe `:not(`/`:is(`/`:where(`/`:has(`, selectores de
    atributo, `:root`, `html` y `body`; comprueba que tripshapes.css es la última en `css[]`.
    Tiene sus propios dientes en memoria.
  - Mitad de build: el escaneo de clases del HTML publicado de §5.5.
- **`tests/unit/enumStyles.spec.ts`** (`test:unit`): cada valor de los enums nuevos tiene su
  regla. `TransportVariant` → banda y glifo `.tl-transport.<v>` en tripshapes.css, con **una
  única exención, `train`** (`PARITY_EXEMPT_TRANSPORT = ['train']`: el martes de Roma usa el
  estilo base, y ningún CSS puede tener `.tl-transport.train`); `StatVariant` → glifo de
  `.day-stats-item.<v>::before`; `Motif` → `SVG_MOTIFS`; `PlaceType` → `MARKER_STYLE`.
- **`content/trips/campania/`**: en la Fase 12 fue un borrador (`draft: true`, D-16), el
  esqueleto del primer viaje real después de Roma, solo en dev, con cinco días, cuatro bases
  (`stays`: Nápoles, Procida, Ischia, Salerno), fichas de esqueleto y heros en
  `example.invalid` (D-15). **En la Fase 13 se convirtió en la guía real de Campania 2027**:
  diez días (19-28 de junio), 24 fichas con heros de Wikimedia Commons, Gastronomía, Reservas y
  Práctica, con los datos aún no publicados marcados `**⚠ por confirmar**`. Al cierre de la
  Fase 13 (13-08, D-02) se publicó: sin `draft`, se prerenderiza en `/guiaRoma/trips/campania/`
  y la portada la lista primero (`startDate` descendente). Las comprobaciones de build están en
  §5.5 y las de contenido en `tests/data/campania-content.spec.ts` (§5.3).
- **`tests/trips/campania.spec.ts`** (`test:trips`, FUERA de `verify`, §5.1; 26 tests con
  prefijo `campania:` desde la Fase 13). Lo esperado sale de los YAML del viaje, no de listas escritas a mano:
  - **EXT-01** (alternativas, D-02, D-03, D-05): el jueves 24 apila las opciones con
    «— o bien —» entre filas comunes; opciones en orden y opciones−1 separadores, sin fundir
    dos `choice` seguidos; «Elige una» por defecto o el `heading` del dato; las opciones
    siguen visibles con cualquier ritmo, «Caminar menos» y resumen; una ficha citada solo
    dentro de una opción es una ficha normal del día; a 375 px parten línea sin desbordar.
  - **EXT-02** («Dormís en», D-06…D-08): el jueves 24 dice «Dormís en Salerno» entre título y
    subtítulo, también en resumen; cada día dice dónde se duerme; un viaje sin `stays` (forma)
    no pinta la línea.
  - **EXT-03** (transportes, D-09): ferry y bici del domingo 20 con banda y glifo propios;
    los cinco tramos nuevos con banda y glifo distintos entre sí y del dorado base; un tramo
    sin variante conserva el estilo base y dos tramos seguidos no mezclan bandas; ferry y
    autobús legibles en claro y en oscuro.
  - **EXT-04** (naturaleza, D-10, D-11): Baia di Sorgeto cae a su dibujo de reserva y tiene
    marcador verde agua; lo mismo cada ficha `nature`.
  - **EXT-05** (mapa multi-ciudad, D-13): los marcadores de Nápoles, Procida, Ischia y
    Salerno quedan a la vez dentro de la caja del mapa, repartidos (sin amontonarse), con un
    marcador por ficha y sin clustering. En `nuxi dev` el contenedor montado pierde
    `id="leaflet-map"` (y con él su altura de base.css; la build lo conserva), así que el
    test le devuelve en la página los 520 px de base.css antes de que monte el mapa.
  - **EXT-06** (ruta del día por modo, D-04, D-14): el viernes 25 abre la ruta en coche; el
    domingo 20, día de ferry, no ofrece ruta; la ruta del jueves 24 cuenta solo las paradas
    comunes.
  - **EXT-07** («Con niños», D-12): Baia di Sorgeto tiene una única caja `.family-box` entre
    `.maps-link` y `.notes-area`, tantas cajas en la página como fichas con `family`, y la
    etiqueta se lee en claro y en oscuro; a 375 px la caja y una «Dormís en» con nombre largo
    parten línea sin desbordar.
  - D-03: los días aparecen en orden con su pastilla (diez desde la Fase 13); la
    portada de dev lista Campania una vez y primero (publicada en la Fase 13, D-02).
  - Fase 13: Gastronomía en sus grupos (13-02) y Reservas/Práctica con sus propios títulos,
    nunca los de Roma (13-07).
- **Unitarios de la Fase 12** (`test:unit`, dentro de `verify`): `tripStays.spec.ts`
  (`stayFor`), `timelineRows.spec.ts` (`flattenRows`, `optionOnlyRefs`,
  `hasTransportVariant` sobre Roma y Campania reales), `dayRoute.spec.ts` (Roma byte a byte,
  modos y precedencia de visibilidad), `mapMarkers.spec.ts` y `svgMotifs.spec.ts` (marcador
  `nature`, motivos nuevos), `searchIndex.spec.ts` (la nota familiar entra en el haystack;
  Roma, sin `family`, no cambia). En `test:data`: `schema.spec.ts` (D-18: Roma valida igual
  con el esquema ampliado y no usa las claves nuevas; dientes de `choice`, `stays`, `route` y
  `family`) e `invariants.spec.ts` (reglas `stay-ref`, `stay-dup` y `ref` dentro de opciones).

### 5.9 Títulos de Reservas por viaje (Fase 12.1)

Habilitador de CAMP-04: Campania reserva vuelos, barcos, coche, camas y conciertos, y con los
encabezados fijos de Roma heredaría «3 comensales» y la cabecera de restaurantes.

- **Esquema (D-01).** `reservas.yml` acepta un `headings { mesas, visitas, table }` opcional y
  ESTRICTO (`z.strictObject`: una clave mal escrita falla con `Unrecognized key` en vez de
  descartarse en silencio). Vive en `ReservasSchema` y, con la MISMA constante, en el superconjunto
  `ReferenceRowSchema`: sin él, Content materializa la columna como null y la regla `unknown-key`
  de la puerta de datos la rechaza. Los valores son texto plano interpolado con `{{ }}`.
- **Defaults (D-02).** Cada clave ausente cae al texto de Roma, definido UNA sola vez en
  `app/utils/reservasHeadings.ts` (`RESERVAS_HEADINGS_DEFAULT`, `resolveReservasHeadings`,
  `confirmedGroup`). Roma no declara `headings`.
- **Grupos vacíos (D-03).** Un grupo de confirmados sin entradas no pinta su encabezado ni su
  lista, y con los dos vacíos no aparece el bloque `.reservas-confirmadas`. Cada `v-if` va en su
  propio elemento (un `<template>` envoltorio añadiría comentarios de fragmento en SSR).
- **`group` (D-04).** `mesas` / `visitas` siguen siendo los dos valores: son el primer y el
  segundo bloque de confirmados, y cada viaje los titula con `headings`.
- **Tests nuevos:**
  - `tests/data/schema.spec.ts` (`test:data`): dientes de `headings` (completo, parcial y `{}`
    aceptados; clave mal escrita, vacía, solo de espacios o de otro tipo rechazada; misma rigidez en
    `ReferenceRowSchema`; `group: vuelos` no valida; el reservas.yml de Roma valida sin
    `headings`). La mutación `z.strictObject` → `z.object` pone el spec en rojo.
  - `tests/unit/reservasHeadings.spec.ts` (`test:unit`): helpers (defaults, personalizados,
    parcial, `null`/`''`/solo espacios, grupos vacíos, Roma real) y el cableado estático de
    ReservasSection.vue (`wiringProblems`) con dientes en memoria. Además, cada `h4`/`ul` de
    `.reservas-confirmadas` se lee como elemento (`bindingProblems`): su `v-if` es el de SU grupo,
    el mismo que su `headings.<grupo>` o su `v-for`. `renderConfirmed` evalúa los `v-if` de la
    plantilla real con `confirmedGroup` (D-03): solo visitas → un `h4` y un `ul` de visitas;
    `confirmed: []` → sin bloque. Dientes: la plantilla real mutada en memoria (`v-if` de los
    `h4` cruzados, `v-for` del otro grupo, bloque con la condición de un solo grupo).
  - `tests/data/invariants.spec.ts` (`test:data`): regla `reservas-headings` de la puerta de
    datos (`tests/data/trips.ts`). Un viaje que no es Roma y tiene `reservas.yml` debe declarar
    `headings.table` y el `headings.<grupo>` de cada grupo de `confirmed` con entradas, con texto
    visible; si no, el fallo nombra su `reservas.yml` («falta headings.table: heredaría el texto
    de Roma …»). Dientes en memoria: los dos grupos sin títulos, solo `table` olvidado, `null` o
    solo espacios, grupo vacío no exigido, Roma exenta.
  - `tests/data/romaReservas.spec.ts` (`test:data`): siempre, los textos por defecto contra
    `index.html` sin normalizar; con build, la `<section id="reservas">` de Roma BYTE A BYTE
    contra `tests/data/fixtures/roma-reservas.html`. El fixture se capturó de la build anterior
    al cambio (en un commit que no toca plantilla ni esquema); nunca se regenera para que el
    spec pase y solo se recaptura ante un cambio de Roma aprobado por el usuario.

> **Nota para la Fase 13 (cerrada).** Campania declara sus tres `headings` en su
> `reservas.yml` (13-07): «✈️ Vuelos», «🎟️ Entradas confirmadas» y su propia cabecera de tabla.
> La regla `reservas-headings` de la puerta de datos los exige (si faltara un título de un
> bloque que se pinta, `test:data` se pondría en rojo y la UI caería a los textos de Roma,
> D-02), y `tests/trips/campania.spec.ts` comprueba en el navegador que Reservas y Práctica
> llevan sus propios títulos.
>
> **Hueco conocido:** Campania llena los dos grupos de confirmados, así que el render de un grupo
> VACÍO (D-03: sin `h4` ni `ul`, y sin bloque si faltan los dos) no lo cubre ningún e2e. Solo lo
> cubren `reservasHeadings.spec.ts` (`renderConfirmed` sobre la plantilla real) y la regla
> `reservas-headings` de la puerta de datos.

---

## 6. Verificación del milestone (Fase 14)

La Fase 14 no toca código de la app ni contenido: añade **dos specs de paridad** (dentro de
`test:parity`, +16 tests, ver §4) y **un test de datos** (dentro de `test:data`). Con ellos
queda probado que la v1.1 se puede publicar sobre la guía viva sin que nadie pierda nada.

### 6.1 `tests/parity/upgrade-from-main.spec.ts` — upgrade desde la guía viva (PAR-03, D-03/D-04)

- **Qué prueba:** quien usa hoy la guía publicada (el `index.html` único de `main`) abre la build
  nueva **en el mismo origen** y encuentra en `/guiaRoma/trips/roma/`, en la **primera carga**,
  todo lo que tenía guardado: sin importar nada, sin paso de migración y sin recargar.
- **La guía viva sale de git en tiempo de test:** `git show main:index.html` se escribe en un
  directorio temporal nuevo de `os.tmpdir()` (`guiaroma-upgrade-*`) y se borra en `afterAll`.
  **Nunca** se versiona una copia bajo `tests/` (derivaría de `main` sin que nadie lo note).
  **Necesita la rama local `main`**: sin ella, el spec falla en voz alta (nunca se salta).
- **Mismo origen, dos servidores, un contexto:** localStorage es por origen (esquema + host +
  puerto). La guía vieja se sirve en `/guiaRoma/index.html` con su propio `startPagesServer` en
  `127.0.0.1:PUERTO`; ese servidor se cierra y la build nueva (`.output/public` bajo
  `/guiaRoma/`) se levanta en el **mismo** `127.0.0.1:PUERTO`, con el mismo contexto de
  navegador de principio a fin. Puerto base **6600** + `TEST_WORKER_INDEX`.
- **Oráculo, no valores escritos a mano:** el estado esperado es lo que **la propia guía viva**
  restaura sobre el mismo almacenamiento, capturado en un contexto de navegador aparte.
- **Qué comprueba** (2 tests × mobile + desktop = 4): las notas de las **38** fichas (con
  comillas, acentos, euro y saltos de línea), el ritmo, «Caminar menos» (el borde «Neutra» +
  «Caminar menos» se restaura como Pesimista, igual que en la guía viva), el modo resumen y el
  tema oscuro sin primer pintado claro (probado en un contexto aparte con el almacenamiento del
  usuario y **todo `/_nuxt/` abortado**: sin JS de la app, el HTML publicado de la portada y de
  Roma ya pinta oscuro por el script inline de color-mode; control: sin `roma-theme` pinta
  claro); una **clave de nota huérfana** (de una ficha que ya no
  existe) sigue en el almacenamiento; **ninguna clave pierde su valor** (la única reescritura es
  la misma que hace la guía viva al restaurar); **sin migración**: abrir Roma y recargar son
  **una sola carga de documento** cada una (una recarga de migración sería la segunda) y no
  aparece **ninguna clave nueva** fuera de las del usuario y las que deja la propia guía viva al
  restaurar (única excepción, exacta: `roma-theme=system`, que @nuxtjs/color-mode persiste al
  arrancar si el usuario nunca tocó el tema; no copia ni transforma nada del usuario); recargar no cambia nada; la portada no escribe
  nada; y **Campania** arranca con sus valores por defecto y las notas vacías, sin tocar las
  claves de Roma (detrás de un **ancla positiva**: una nota sembrada solo para Campania debe
  aparecer antes de comprobar las ausencias, y `<body>` se mira tras dejar que unhead vuelque
  sus clases, así que las aserciones negativas no pasan sobre el HTML prerenderizado por
  defecto).

### 6.2 `tests/parity/cross-trip.spec.ts` — aislamiento entre viajes en la build publicada (D-05)

- **Ruta D-05:** portada → Roma → Campania → «Atrás» → «Atrás»: ninguna página publicada ni
  ningún paso de historial descarga la base de contenido de cliente (`__nuxt_content/`,
  `sql_dump`, WASM). Cada paso espera la URL, `networkidle`, la hidratación y un marcador propio
  de la página antes de comprobar nada.
- **Recorrido con clics:** tarjeta de la portada → Roma → pie «← Todos los viajes» → tarjeta de
  Campania → «Atrás» → «Atrás» → «Adelante» → «Adelante», también con cero descargas pesadas.
- **Control positivo:** la 404 de un borrador **sí** pide la base de contenido, así que el
  detector ve esas descargas cuando ocurren y los «cero» no pasan por ceguera.
- **Búsqueda, notas y modos por viaje:** «Pantheon» no da resultados en Campania ni «Sorgeto» en
  Roma (también tras «Atrás»); una nota de Roma no aparece en Campania ni al revés (con «Atrás»
  y «Adelante»); el ritmo, «Caminar menos» y el modo resumen de un viaje no cambian los del otro.
- Extiende a Campania la aserción D-15 de la Fase 11 (que solo cubría portada y Roma) y cierra
  el hallazgo **WR-06** de `13-REVIEW.md`. 6 tests × mobile + desktop = 12. Puerto base **6700**
  + `TEST_WORKER_INDEX`.

### 6.3 `tests/data/css-vs-main.spec.ts` — el CSS de la build es el de `main` (D-02)

- **Qué significa «sin diff respecto a main»:** `main` no tiene `base.css`; es un único
  `index.html` con dos bloques `<style>`. El criterio es, por tanto, que **el CSS global que
  publica la build es el CSS de `main:index.html`**, leído con `git show` (necesita la rama
  local `main`).
- **Particiones documentadas:** `leaflet.css` = el bloque `<style id="leaflet-inline-css">`;
  `tokens.css` + `base.css` (en ese orden) = el bloque editorial; `fonts.css` sustituye el
  `<link>` de Google Fonts por `@font-face` locales con las **mismas tres familias** y
  **exactamente las mismas 14 caras** (familia + estilo + peso, sacadas de `ital,wght@…` del
  `<link>`; cada una con el subconjunto latin), porque sin una cara el navegador sintetiza
  negrita o cursiva falsas;
  `multitrip.css` (Fase 11) y `tripshapes.css` (Fase 12) son hojas **aditivas** de la v1.1 que no
  existen en `main` (las guardan `tests/unit/multitripCss.spec.ts` y
  `tests/unit/tripShapesCss.spec.ts`) y no entran en la comparación.
- **Normalización:** solo comentarios y espacios. Nada más.
- **Única diferencia permitida:** la neutralización de 08-06 (commit `cc74f79`): en `main`, dos
  reglas van detrás de un `}` sobrante y el navegador las descarta (`.tl-meta-item{…}` y
  `.tl-transport-mode.recommended{…}`); `base.css` las deja fuera, y cada una debe casar
  exactamente una vez. Cualquier otra diferencia es un hallazgo: se informa, nunca se edita el
  CSS congelado. 9 tests (con dientes en memoria).

### 6.4 Cierre del hito

- **La puerta, en orden** (D-01, Node 22, nunca dos a la vez):
  1. `rm -rf .data .nuxt .output && pnpm verify` (build + `test:unit` + `test:data` con
     `css-vs-main.spec.ts` + `test:parity` con los dos specs de §6.1 y §6.2);
  2. `pnpm typecheck && pnpm lint` (y `eslint --no-ignore` sobre los dos specs nuevos de
     `tests/parity/`, que `pnpm lint` ignora);
  3. solo cuando `verify` ha terminado: `rm -rf .data .nuxt && pnpm test:trips`.
- **Flakes conocidos** (no se arreglan en la Fase 14): `navigation.spec.ts` «SC#2» [mobile],
  que roza el timeout de 30 s, y `legacy-redirect.spec.ts` «/#pantheon» [desktop]. Si uno es el
  único fallo, se repite una vez con `--repeat-each 3` y se anota. Nunca se usa
  `--update-snapshots`.
- **Goldens:** los 56 PNG de `tests/parity/golden.spec.ts-snapshots` no cambian desde la etiqueta
  `v1.0` (`git diff --quiet v1.0 HEAD -- tests/parity/golden.spec.ts-snapshots` sale 0). La
  excepción de ROUTE-06 aprobada en la Fase 11 no llegó a usarse: ningún golden captura el pie.
- **Firma en un móvil real (PAR-04):** la hace una persona, no la puerta. La lista de
  comprobación está en `.planning/phases/14-verificacion-del-milestone/14-UAT.md`.
