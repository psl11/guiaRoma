---
phase: 01-andamiaje-golden-de-paridad
reviewed: 2026-06-19T00:00:00Z
depth: standard
files_reviewed: 10
files_reviewed_list:
  - nuxt.config.ts
  - app/app.vue
  - app/assets/css/tokens.css
  - app/assets/css/base.css
  - app/assets/css/leaflet.css
  - content.config.ts
  - eslint.config.mjs
  - server/api/README.md
  - tests/parity/golden.spec.ts
  - tests/parity/subpath.spec.ts
  - package.json
  - .gitignore
findings:
  critical: 1
  warning: 2
  info: 1
  total: 4
status: resolved
resolved: 2026-06-19T00:00:00Z
resolution:
  CR-01: fixed
  WR-01: fixed
  WR-02: fixed
  IN-01: acknowledged-intentional
---

# Fase 01: Informe de Revisión de Código

**Revisado:** 2026-06-19
**Profundidad:** standard
**Archivos revisados:** 12
**Estado:** resolved (ver "Resolución" al final — CR-01/WR-01/WR-02 corregidos; IN-01 reconocido como intencional)

---

## Resumen

Se revisaron todos los archivos fuente de la Fase 01 (andamiaje + CSS verbatim + golden de paridad + verificación de subpath). La configuración de Nuxt (`nuxt.config.ts`) es correcta en todos los puntos críticos: no hay `ssr: false`, el preset `github_pages` está bien establecido, el contrato `colorMode` (`storageKey: 'roma-theme'`, `dataValue: 'theme'`) es el correcto, y el orden CSS (tokens → base → leaflet) es el adecuado. La extracción verbatim del CSS está bien hecha: los tres archivos suman 2190 líneas, los bloques de llaves están balanceados en los tres, y el contenido coincide byte a byte con las secciones correspondientes del `index.html`.

El problema material está en el harness del golden de paridad (`tests/parity/golden.spec.ts`): el bloqueo de imágenes remotas tiene dos lagunas (mayúsculas `.JPG` y URLs con parámetros `?width=N`) que dejan sin bloquear imágenes en 4 vistas del golden, comprometiendo el determinismo que es el objetivo declarado del propio mecanismo. La verificación de subpath tiene un riesgo de proceso huérfano en el cleanup.

---

## Hallazgos Críticos (BLOCKER)

### CR-01: Bloqueo de imágenes en golden.spec.ts es sensible a mayúsculas — 4 imágenes sin bloquear

**Archivo:** `tests/parity/golden.spec.ts:78`

**Descripción:** El patrón glob `'**/*.{jpg,jpeg,png,webp,avif,gif}'` es sensible a mayúsculas/minúsculas en el motor de matching de Playwright (minimatch). Existen 4 imágenes en `index.html` con extensión en mayúsculas (`.JPG`) que **no son interceptadas** por el route handler:

- `fontana-trevi` — `Fontana_di_Trevi_di_notte.JPG` (línea 2522, sección `#viernes`)
- `campo-fiori` — `Il_Valle_delle_Rose_....JPG` (línea 2780, sección `#viernes`)
- `giardino-aranci` — `Giardino_degli_Aranci.JPG` (línea 3576, sección `#domingo`)
- `ghetto` — `P-Octavia1.JPG` (línea 3752, sección `#domingo`)

Estas imágenes se **intentarán cargar desde la red** durante las capturas del golden. Si la red está disponible en el momento de la captura (lo habitual en local), la imagen real (foto Wikimedia) se carga en lugar del SVG de fallback, haciendo que el golden capture un estado **no determinista** para las vistas `dia-viernes`, `dia-domingo` y posiblemente `dia-sabado` (que contiene la cascada visual de la sección).

El objetivo declarado del golden es capturar el estado de fallback SVG offline como línea base inmutable. Con estas imágenes sin bloquear, ese objetivo está comprometido para al menos 3 de las 14 vistas.

**Corrección:**

```typescript
// Reemplazar el patrón sensible a mayúsculas por un interceptor basado en Content-Type
// o ampliar el glob con variantes en mayúsculas:
await page.route('**/*.{jpg,jpeg,png,webp,avif,gif,JPG,JPEG,PNG,WEBP,AVIF,GIF}', (route) => route.abort())

// Alternativa más robusta: interceptar por dominio externo (captura cualquier extensión y
// cualquier imagen sin extensión como Special:FilePath...?width=N):
await page.route(/^https?:\/\/(?!localhost)/, (route) => {
  const url = route.request().url()
  const resourceType = route.request().resourceType()
  if (resourceType === 'image') return route.abort()
  return route.continue()
})
```

La variante por `resourceType` es la más robusta porque no depende de la extensión de la URL.

---

## Advertencias (WARNING)

### WR-01: URLs con parámetros de consulta (?width=N) no son bloqueadas por el glob de imágenes

**Archivo:** `tests/parity/golden.spec.ts:78`

**Descripción:** Hay 9+ imágenes cuyas URLs terminan en `.jpg?width=900` (o variantes), no en `.jpg`. El glob `**/*.{jpg,...}` requiere que la URL **termine** en la extensión; la presencia de un query string (`?width=900`) rompe el match. Imágenes afectadas (entre otras):

- `vaticano` — `Special:FilePath/Basilique...Vatican.jpg?width=900` (línea 2931, en `#sabado`)
- `castel-santangelo` — `...Castel_Sant%27Angelo.jpg?width=900` (línea 3124)
- `minerva`, `san-luigi`, `palazzo-barberini` — también con `?width=N`

La vista `card-guided` (#vaticano) toma una captura del elemento `article#vaticano` directamente, que contiene esta imagen. Si la red está disponible, la foto real de San Pedro cargaría en lugar del SVG de la iglesia, haciendo el golden para esa vista no reproducible entre entornos.

Esta es la misma categoría de defecto que CR-01 (bloqueo incompleto) aplicada a URLs con query strings. Se recomienda corregir ambos en la misma pasada con la solución por `resourceType` descrita en CR-01.

**Corrección:** Ver fix de CR-01 (solución por `resourceType` resuelve tanto .JPG como `?width=N`).

---

### WR-02: Proceso hijo de `pnpm dlx serve` puede quedar huérfano tras SIGTERM

**Archivo:** `tests/parity/subpath.spec.ts:83-84`

**Descripción:**

```typescript
// afterAll (línea 83):
if (server && !server.killed) {
  server.kill('SIGTERM')
}
```

`spawn('pnpm', ['dlx', 'serve', ...])` crea un árbol de procesos: `playwright-worker → pnpm → node serve` (el servidor HTTP real). `server.kill('SIGTERM')` envía SIGTERM **únicamente al proceso `pnpm`** (el hijo directo). En Linux, cuando `pnpm` recibe SIGTERM y termina, su proceso hijo `serve` queda **re-parentado a PID 1** (init/systemd), que no lo mata automáticamente.

Consecuencias:
1. El proceso `serve` sigue ocupando el puerto `5000` (o `5001`).
2. El directorio temporal es borrado por `rmSync`, pero el server sigue vivo respondiendo desde rutas inexistentes.
3. Si se vuelve a ejecutar `pnpm test:subpath` en el mismo entorno (frecuente en desarrollo local), `waitForServer` recibirá una respuesta del zombie (el antiguo server en el mismo puerto), procederá, y el test fallará con mensajes de error confusos sobre assets 404 o contenido incorrecto.

En CI (una sola ejecución por job) el impacto es menor, pero en desarrollo local es un vector de fallos de test intermitentes.

**Corrección:**

```typescript
// Opción A: usar shell:true para que kill al shell propague a todos los descendientes
server = spawn('pnpm dlx serve -l ' + String(PORT) + ' ' + previewRoot, {
  stdio: 'ignore',
  shell: true,  // el kill al shell SIGTERM propaga a todo el grupo
})

// Opción B (más limpia): configurar el proceso como lider de grupo de procesos y matarlo por grupo
server = spawn('pnpm', ['dlx', 'serve', '-l', String(PORT), previewRoot], {
  stdio: 'ignore',
  shell: false,
  detached: true,  // crea un nuevo grupo de procesos
})
// En afterAll:
if (server.pid) process.kill(-server.pid, 'SIGTERM')  // -pid = todo el grupo

// Opción C: usar `serve` directamente como devDependency y evitar pnpm dlx
// Añadir 'serve' a devDependencies; spawn('node_modules/.bin/serve', ...) es un único proceso.
```

La Opción C es la más robusta para un test suite (evita el download en runtime y los procesos intermedios).

---

## Info (LOW)

### IN-01: `app.baseURL` hardcodeado en nuxt.config.ts — env var de CI sería redundante

**Archivo:** `nuxt.config.ts:14`

**Descripción:**

```typescript
app: {
  baseURL: '/guiaRoma/',
},
```

`CLAUDE.md` y la documentación del stack indican usar `NUXT_APP_BASE_URL=/guiaRoma/` como variable de entorno en CI. Con el valor ya hardcodeado en `nuxt.config.ts`, la variable de entorno es **redundante** (Nuxt prioriza el config sobre la variable de entorno para `app.baseURL` cuando está definida en el config). Esto no causa ningún bug, pero puede confundir: si algún día se quisiera cambiar el subpath sin tocar el código (propósito original del env var), hay que recordar actualizar también el `nuxt.config.ts`.

**Sugerencia:** Documentar en un comentario que la variable de entorno `NUXT_APP_BASE_URL` **no sobreescribe** este valor cuando está definido en config, o eliminar el valor hardcoded y leer exclusivamente de la variable de entorno usando `process.env.NUXT_APP_BASE_URL ?? '/guiaRoma/'`.

---

## Verificaciones que pasaron

Los siguientes puntos de la revisión se confirmaron correctos:

- **Sin `ssr: false`** en `nuxt.config.ts` — confirmado.
- **Preset `github_pages`** en `nitro.preset` — correcto.
- **`failOnError: true`** en prerender — correcto; los enlaces rotos fallan el build.
- **`colorMode`**: `storageKey: 'roma-theme'` y `dataValue: 'theme'` — contrato correcto con el `index.html`.
- **CSS verbatim**: braces balanceadas (tokens 2/2, base 292/292, leaflet 169/169), contenido coincide con las líneas correspondientes del `index.html`.
- **Sin `@layer` wrappers** en los tres archivos CSS — correcto, la cascada no queda envuelta.
- **Sin endpoints activos en `server/api/`** — solo el README.md, ningún `.ts`/`.js`.
- **`.gitignore`** no excluye `tests/parity/` ni los snapshots del golden — correcto.
- **`fonts.provider: 'google'` con `@nuxt/fonts`** — las fuentes se descargan en build-time y se auto-hostean bajo `/_nuxt/`; correcto para el objetivo offline.
- **`content.config.ts` stub vacío** — correcto para Fase 1; el esquema zod real es Fase 2.
- **`eslint.config.mjs` ignores** — `app/assets/css/**` protege el CSS verbatim; `tests/parity/**` excluye el harness Playwright (tiene su propio tsconfig implícito). Correcto.
- **`app/app.vue` favicon baseURL** — la normalización de trailing slash (`endsWith('/')`) es correcta.
- **`package.json` scripts** — `test:golden` y `test:subpath` son independientes y apropiados.
- **`snapshotPathTemplate`** en `playwright.config.ts` — elimina el sufijo de plataforma (`-linux`/`-darwin`), habilitando comparación cross-OS en Fase 8. Correcto per spec.
- **`settle()` en golden.spec.ts** — la secuencia `networkidle` → espera de `img.complete` → `fonts.ready` → doble `requestAnimationFrame` es correcta y robusta para el determinismo de screenshots. El `await page.evaluate(() => ... fonts?.ready)` es correcto: Playwright sí espera Promises devueltas desde el callback del `evaluate`.

---

_Revisado: 2026-06-19_
_Revisor: Claude (gsd-code-reviewer)_
_Profundidad: standard_

---

## Resolución (2026-06-19)

Hallazgos atendidos en una pasada de gap-closure sobre la rama `release/nuxt-4`:

### CR-01 + WR-01 — RESUELTOS (commit `5bca7a5`)

`tests/parity/golden.spec.ts` ya **no** bloquea por glob de extensiones. El interceptor pasa a ser por tipo de recurso, la variante robusta que el propio informe recomendaba:

```typescript
await page.route('**/*', (route) =>
  route.request().resourceType() === 'image' ? route.abort() : route.continue(),
)
```

Esto captura TODA imagen sin depender de la extensión: las 4 URLs en mayúsculas `.JPG` (CR-01) y las 9+ con query string `?width=N`/`?w=N` (WR-01) que antes se filtraban. Las peticiones no-imagen se `route.continue()` (crítico: el `index.html` local, su CSS/JS y fuentes deben seguir cargando; abortar todo colgaría la página). El resto de la lógica de `settle()` (carga ansiosa + espera de resolución de toda `<img>` + `fonts.ready` + doble rAF) queda intacta.

**Golden regenerado** (commit `1d15c1a`): cambiaron 8 PNGs — `dia-lunes` y `dia-martes` (× claro/oscuro × móvil/desktop). En la captura original (red parcial) esas dos secciones tenían heros con query string que SÍ resolvían a fotos reales de Wikimedia (San Luigi dei Francesi/Caravaggio, Elefantino-Minerva, etc.); ahora muestran el SVG de fallback por motif — el estado offline-determinista que A5 pretendía. Las vistas que el informe señalaba por análisis estático (`dia-viernes`, `dia-domingo`, `card-guided`) ya estaban en fallback SVG en el golden original (su red no resolvió en su momento), por eso sus PNGs no cambiaron; el bloqueo por `resourceType` las hace deterministas igualmente con independencia de la red. **Cuenta de PNGs intacta: 56** (14×2×2; sin altas ni bajas). **Determinismo confirmado:** 2ª ejecución de `pnpm test:golden` sin `--update` → 6 passed, exit 0.

### WR-02 — RESUELTO (commit `5bca7a5`)

`tests/parity/subpath.spec.ts` arranca ahora el static server con `spawn(..., { detached: true })` (líder de su propio grupo de procesos) y lo derriba en `afterAll` con `process.kill(-server.pid, 'SIGTERM')` (pid negativo → todo el grupo: `pnpm dlx` + el `serve` HTTP real). Verificado: tras `pnpm exec playwright test tests/parity/subpath.spec.ts` (2 passed, exit 0) **no queda ningún proceso escuchando** en los puertos 5000/5001 ni ningún `pnpm dlx serve` huérfano.

### IN-01 — RECONOCIDO COMO INTENCIONAL (sin cambio de código)

`app.baseURL: '/guiaRoma/'` hardcodeado en `nuxt.config.ts` es deliberado: el sitio vive permanentemente en `usuario.github.io/guiaRoma/`, así el subpath es correcto también en `pnpm generate` local (sin depender de que CI exporte `NUXT_APP_BASE_URL`). No es un bug (el propio informe lo clasifica LOW/sin bug). No se toca en esta pasada.

_Resolución: 2026-06-19 — Claude (gsd-plan-executor)_
