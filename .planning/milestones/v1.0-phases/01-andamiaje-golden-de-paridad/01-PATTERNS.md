# Fase 1: Andamiaje + Golden de paridad — Mapa de patrones

**Mapeado:** 2026-06-18
**Ficheros analizados:** 17 (creados/extraídos) + `index.html` (intacto, fuente)
**Análogos encontrados:** 3 / 17 con análogo en-repo real (`index.html`) · 14 / 17 son scaffold Nuxt sin análogo en-repo → usar sketches de config

> **Naturaleza de esta fase (leer primero):** guiaRoma es **greenfield Nuxt 4**. El repo HOY contiene solo `index.html`, `favicon.svg`, `apple-touch-icon.svg`, `CLAUDE.md`, `.planning/` y `.git/` (verificado en RESEARCH.md §Sources/Entorno y por inspección directa). **No existe código Nuxt previo**, así que para los ficheros de scaffold (`nuxt.config.ts`, `package.json`, `app/app.vue`, `eslint.config.mjs`, `playwright.config.ts`, `tsconfig.json`) **no hay análogo en-repo** — el "patrón a copiar" es el **sketch de config verificado** en `01-RESEARCH.md` / `STACK.md` / `ARCHITECTURE.md`, citado con líneas exactas abajo.
>
> El **único análogo en-repo real y valioso es `index.html`**, del que se extrae VERBATIM: (1) el CSS editorial → `assets/css/*`; (2) el mecanismo de tema (`[data-theme]` + `localStorage('roma-theme')`) que el golden oscuro reutiliza; (3) las anclas de sección y los `id` de ficha que la captura golden debe localizar. Toda lectura de `index.html` es de **solo lectura** (D-02: permanece intacto).

---

## Clasificación de ficheros

> Roles adaptados al dominio de esta fase (no hay controllers/services/components de runtime — la fase es infraestructura). Roles usados: **config**, **global-CSS**, **test-harness**, **placeholder**, **asset**, **lockfile**.

| Fichero (creado/extraído) | Rol | Flujo de datos | Análogo más cercano | Calidad de match |
|---------------------------|-----|----------------|---------------------|------------------|
| `package.json` | config | build/tooling | sin análogo en-repo → sketch `01-RESEARCH.md:600-614` (scripts) + `STACK.md:135-149` (deps) | sketch-config |
| `nuxt.config.ts` | config | build (SSG/subpath/módulos) | sin análogo en-repo → sketch `01-RESEARCH.md:260-322` | sketch-config |
| `tsconfig.json` | config | typecheck | sin análogo en-repo → extiende `.nuxt/tsconfig`; `01-RESEARCH.md:582-587` | sketch-config |
| `eslint.config.mjs` | config | lint/format | sin análogo en-repo → generado por `nuxi module add eslint`; `01-RESEARCH.md:588-598` | sketch-config (autogenerado) |
| `.gitignore` | config | build (excluye artefactos) | sin análogo en-repo → generado por scaffold; **OJO Pitfall 2** (`01-RESEARCH.md:646-651`) | sketch-config (autogenerado) |
| `pnpm-lock.yaml` | lockfile | build (cadena suministro) | sin análogo en-repo → generado por `pnpm install` (D-03) | autogenerado |
| `app/app.vue` | placeholder | render (1 ruta) | sin análogo en-repo → mínimo `<NuxtLayout><NuxtPage/></NuxtLayout>`; `ARCHITECTURE.md:108`, `01-RESEARCH.md:230` | sketch-estructura |
| `app/assets/css/tokens.css` | global-CSS | CDN/static (cascada) | **`index.html:866-898`** (`:root` + `[data-theme="dark"]`) | **exacto (verbatim)** |
| `app/assets/css/base.css` | global-CSS | CDN/static (cascada) | **`index.html:900-2209`** (reset/tipografía/componentes) | **exacto (verbatim)** |
| `app/assets/css/leaflet.css` | global-CSS | CDN/static (cascada) | **`index.html:15-863`** (`<style id="leaflet-inline-css">`) + filtro dark `1208-1209` | **exacto (verbatim)** |
| `content.config.ts` | placeholder | datos (vacío en Fase 1) | sin análogo en-repo → esquema real es Fase 2; aquí mínimo/vacío; `ARCHITECTURE.md:167` | sketch-estructura |
| `server/api/README.md` | placeholder | API (backend dormido) | sin análogo en-repo → texto sugerido `01-RESEARCH.md:499-505` | sketch-texto |
| `public/.nojekyll` | asset | CDN/static (Pages) | sin análogo en-repo → fichero vacío; `01-RESEARCH.md:456` | sketch-config |
| `public/favicon.svg` | asset | CDN/static | **`favicon.svg` (raíz)** — copiar a `public/` (no mover; A4) | copia directa |
| `public/apple-touch-icon.svg` | asset | CDN/static | **`apple-touch-icon.svg` (raíz)** — copiar a `public/` (A4) | copia directa |
| `playwright.config.ts` | test-harness | test (golden) | sin análogo en-repo → sketch `01-RESEARCH.md:328-359` | sketch-config |
| `tests/parity/golden.spec.ts` | test-harness | test (snapshot) | sin análogo en-repo → sketch `01-RESEARCH.md:685-716`; anclas/ids de **`index.html`** | sketch + anclas reales |

---

## Asignaciones de patrón

### `app/assets/css/tokens.css` (global-CSS, verbatim) — análogo EXACTO

**Análogo:** `index.html` líneas **866-898** (dentro del `<style>` editorial que abre en 865).

**`<read_first>` para el planner:** `index.html:865-902`

**Qué copiar (VERBATIM, sin tocar valores):** el bloque `:root { … }` (tokens claros) + el bloque `[data-theme="dark"] { … }` (overrides oscuros). Estas custom properties **SON** el sistema de design tokens del proyecto (CLAUDE.md decisión #5). Copiar literal = paridad por construcción.

```css
/* index.html:866-881 → tokens.css (VERBATIM) */
:root {
  --bg: #f5f0e8;
  --bg-elev: #fbf7f0;
  --bg-soft: #ede5d7;
  --ink: #2a2520;
  --ink-soft: #5c534a;
  --ink-faint: #8a8074;
  --accent: #8b3a3a;
  --accent-soft: #b85c5c;
  --gold: #a07c4a;
  --gold-soft: #c4a373;
  --line: #d4c8b3;
  --line-soft: #e5dccb;
  --shadow: 0 1px 3px rgba(60,40,20,.08), 0 12px 32px rgba(60,40,20,.06);
  --shadow-elev: 0 2px 8px rgba(60,40,20,.12), 0 24px 48px rgba(60,40,20,.10);
}

/* index.html:883-898 */
[data-theme="dark"] {
  --bg: #1a1612;
  /* … resto de overrides oscuros, líneas 884-897 … */
}
```

**Regla de cascada (crítica, `01-RESEARCH.md:410-413` / Pitfall 4):** `tokens.css` se carga **ANTES** que `base.css` en `css:[]` (las reglas de `base.css` consumen estas variables). **NO** envolver en `@layer` (cambia prioridad de cascada → drift visual). **NO** `<style scoped>`. CSS plano y global.

---

### `app/assets/css/base.css` (global-CSS, verbatim) — análogo EXACTO

**Análogo:** `index.html` líneas **900-2209** (todo el `<style>` editorial salvo el bloque de tokens 866-898; el `<style>` cierra en `2210`).

**`<read_first>` para el planner:** `index.html:900-2210` (es ~1.310 líneas; leer en tramos si hace falta, pero es un único bloque cohesionado).

**Qué copiar (VERBATIM):** reset (`* { box-sizing… }` línea 900), `html`/`body`/tipografía (902-...), y TODAS las reglas de componentes globales (`.card`, `.timeline`, `.gastro-card`, `.artist-card`, `.tl-*`, `.day-*`, `.theme-btn`, `.facts`, `.sorrentino-box`, `.culture-box`, `.detail-photo`, media queries, `@keyframes`, etc.).

**Excerpts load-bearing (deben quedar idénticos):**

```css
/* index.html:900-902 — reset + scroll (conservar VERBATIM; scroll-padding-top relevante en Fase 5) */
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; scroll-padding-top: 124px; }

/* index.html:2121-2125 — animación de entrada de fichas.
   FUENTE DE FLAKINESS del golden: el golden la NEUTRALIZA con animations:'disabled' (ver test-harness),
   pero en base.css se copia VERBATIM (la app real la conserva). */
@keyframes fadeIn { /* … */ }
.card { animation: fadeIn .5s ease backwards; }
```

**Decisión de frontera tokens↔base (discreción D-04, `01-RESEARCH.md:401-408`):** el corte sugerido es: `tokens.css` = 866-898; `base.css` = 900-2209. La línea 899 está en blanco. El planner puede ajustar el corte exacto, pero **el contenido combinado debe ser textualmente igual** al `<style>` editorial del `index.html` (verificación V4: diff textual).

**Selectores cruzados a preservar (Pitfall 4 — por esto va GLOBAL, no scoped):** `body.light-mode …`, `body.modo-resumen …`, `[data-theme="dark"] .card-hero` (1634), `[data-theme="dark"] .detail-photo img` (1743), `[data-theme="light"] .theme-btn .moon/.sun` (957-960). Con `<style scoped>` los `data-v-*` romperían estos selectores que cruzan el árbol.

---

### `app/assets/css/leaflet.css` (global-CSS, verbatim) — análogo EXACTO

**Análogo:** `index.html` líneas **15-863** (contenido de `<style id="leaflet-inline-css">`, que abre en línea **14** y cierra en **864**).

**`<read_first>` para el planner:** `index.html:14-40` (cabecera del bloque; el resto es CSS estándar de Leaflet 1.9.4, copiar el rango completo 15-863).

**Qué copiar (VERBATIM):** todo el CSS de Leaflet inline (`.leaflet-pane`, `.leaflet-tile`, `.leaflet-marker-icon`, `.leaflet-container`, controles, popups, zoom…).

**MÁS — regla load-bearing que vive FUERA del bloque Leaflet** (`01-RESEARCH.md:406` confirma esto): el filtro dark de los tiles está en el `<style>` **editorial**, no en el de Leaflet:

```css
/* index.html:1208-1209 — está en el bloque EDITORIAL (866-2210), no en el de Leaflet.
   Moverla a leaflet.css O dejarla en base.css es indiferente; lo importante: que se cargue. */
[data-theme="dark"] .leaflet-tile { filter: brightness(.7) contrast(1.1) saturate(.8); }
[data-theme="dark"] .leaflet-container { background: #1a1612 !important; }
```

**Por qué se extrae el CSS de Leaflet en Fase 1 pero NO el JS** (`01-RESEARCH.md:436-439`): el CSS es parte del CSS global verbatim (gratis ahora). El **JS de Leaflet y el componente `TripMap.client.vue` son Fase 7** (tocan `window`, van en `onMounted`). En Fase 1 Leaflet solo se **instala** (`leaflet@1.9.4`) para que cuando se use se importe de `node_modules`, **nunca de CDN** (offline, BUILD-02).

---

### `nuxt.config.ts` (config) — SIN análogo en-repo → sketch de RESEARCH

**Análogo:** **no existe en-repo** (greenfield). Patrón a copiar: sketch verificado en **`01-RESEARCH.md:260-322`** (Pattern 1, con `[VERIFIED]` contra docs Nuxt 4 esta sesión). También `STACK.md:84-115`.

**`<read_first>` para el planner:** `01-RESEARCH.md:258-324` + `STACK.md:84-115` + `CLAUDE.md §8` (config exacta color-mode).

**Bloques load-bearing del sketch (copiar tal cual, son decisiones bloqueadas):**

```ts
// 01-RESEARCH.md:267 — módulos registrados desde Fase 1 (uso real en fases posteriores salvo fonts/eslint)
modules: ['@nuxt/content', '@nuxtjs/color-mode', '@nuxt/fonts', '@nuxt/eslint'],

// 01-RESEARCH.md:272-274 — subpath de producción (BUILD-01/03). Fijar en config (sin env) para que `generate` local ya lo aplique.
app: { baseURL: '/guiaRoma/' },

// 01-RESEARCH.md:276-284 — SSG GitHub Pages; SSR-EN-BUILD ON (NO ssr:false → Anti-Pattern, 01-RESEARCH.md:378)
nitro: {
  preset: 'github_pages',
  prerender: { crawlLinks: true, routes: ['/'], failOnError: true },
},

// 01-RESEARCH.md:287-291 — CSS editorial VERBATIM, orden tokens→base→leaflet (PLAT-04)
css: ['~/assets/css/tokens.css', '~/assets/css/base.css', '~/assets/css/leaflet.css'],

// 01-RESEARCH.md:309-315 — tema: config EXACTA de CLAUDE.md §8 (registrar en Fase 1; ThemeToggle es Fase 3)
colorMode: {
  preference: 'system', fallback: 'light',
  dataValue: 'theme',        // => <html data-theme="dark"> (mismo selector del CSS del index.html)
  storageKey: 'roma-theme',  // MISMA clave del index.html (línea 6256/6263)
  classSuffix: '',
},

// 01-RESEARCH.md:317-320 — TS estricto (PLAT-02); typeCheck en comando separado (A3)
typescript: { strict: true, typeCheck: false },
```

**Config de fuentes (`@nuxt/fonts`)** — `01-RESEARCH.md:295-304` + valores derivados de **`index.html:13`** (URL Google Fonts, leída verbatim):

```ts
// Pesos/itálicas EXACTOS de index.html:13 — Cormorant 0,400;0,500;0,600;0,700;1,400;1,500;1,600 · Lora 0,400;0,500;0,600;1,400;1,500 · JetBrains 400;500
fonts: { families: [
  { name: 'Cormorant Garamond', provider: 'google', weights: [400,500,600,700], styles: ['normal','italic'], subsets: ['latin','latin-ext'] },
  { name: 'Lora', provider: 'google', weights: [400,500,600], styles: ['normal','italic'], subsets: ['latin','latin-ext'] },
  { name: 'JetBrains Mono', provider: 'google', weights: [400,500], styles: ['normal'], subsets: ['latin','latin-ext'] },
] },
```

> **Acción asociada (BUILD-02, `01-RESEARCH.md:434`):** NO portar el `<link>` a Google Fonts del `index.html:11-13` al flujo Nuxt; las fuentes las inyecta `@nuxt/fonts`. El `index.html` conserva su `<link>` (intacto, D-02).

---

### `package.json` (config) — SIN análogo en-repo → sketch de RESEARCH

**Análogo:** no existe en-repo. Scripts: **`01-RESEARCH.md:600-614`**. Dependencias + versiones verificadas: **`STACK.md:135-149`** y tabla **`01-RESEARCH.md:98-117`**.

**`<read_first>` para el planner:** `01-RESEARCH.md:135-149, 600-614` + `STACK.md:527-537` (Version Compatibility).

**Scripts load-bearing (verificación V2/V3/V8):**

```jsonc
// 01-RESEARCH.md:600-613 — pnpm (D-03)
"scripts": {
  "dev": "nuxi dev", "build": "nuxi build", "generate": "nuxi generate", "preview": "nuxi preview",
  "typecheck": "nuxi typecheck",
  "lint": "eslint .", "lint:fix": "eslint . --fix",
  "test:golden": "playwright test", "test:golden:update": "playwright test --update-snapshots"
}
```

**Versiones exactas (de `STACK.md` / `01-RESEARCH.md:98-117`, re-verificadas npm 2026-06-18 — ver Patrones Compartidos §Versiones):** nuxt 4.4.8 · @nuxt/content 3.14.0 · zod 4.4.3 · @nuxtjs/color-mode 4.0.1 · @nuxt/fonts 0.14.0 · @nuxt/eslint 1.16.0 · eslint 10.5.0 · prettier 3.8.4 · leaflet 1.9.4 · @types/leaflet 1.9.21 (dev) · @playwright/test 1.61.0 (dev) · minisearch 7.2.0.

---

### `playwright.config.ts` (test-harness) — SIN análogo en-repo → sketch de RESEARCH

**Análogo:** no existe en-repo. Patrón: **`01-RESEARCH.md:328-359`** (Pattern 2, `webServer` sirve el `index.html` in situ).

**`<read_first>` para el planner:** `01-RESEARCH.md:326-359` + `01-RESEARCH.md:543-572` (determinismo: animaciones/fuentes/heros).

**Bloques load-bearing:**

```ts
// 01-RESEARCH.md:336-340 — webServer = static server sobre la RAÍZ del repo (sirve index.html, D-05)
webServer: { command: 'pnpm dlx serve -l 4173 .', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI },

// 01-RESEARCH.md:345-351 — determinismo de screenshots (neutraliza fadeIn/transitions/scroll-smooth)
expect: { toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.01 } },

// 01-RESEARCH.md:352-355 — viewports D-04: móvil ~390 + desktop ~1280
projects: [
  { name: 'mobile',  use: { ...devices['iPhone 12'] } },
  { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
],
```

> **Decisión abierta que el planner DEBE fijar (A5, `01-RESEARCH.md:555-563, 883-886`):** tratamiento de las imágenes hero de terceros (Wikimedia/turismoroma con `onerror`→SVG, no deterministas por red). 3 opciones defendibles: (1) esperar carga real + tolerancia; (2) `page.route(...).abort()` → fuerza fallback SVG (reproducible + estado offline); (3) `mask`. Recomendación research: opción 1 por defecto, `mask` como escape si hay flakiness. Documentar en VALIDATION.md.
>
> **Plataforma de snapshots (A8, `01-RESEARCH.md:359, 567`):** Playwright sufija `-{platform}` (aquí `-linux`). Como el golden se compara en Fase 8, fijar `snapshotPathTemplate` sin plataforma O documentar la plataforma de captura.

---

### `tests/parity/golden.spec.ts` (test-harness) — sketch + anclas REALES de `index.html`

**Análogo:** esqueleto en **`01-RESEARCH.md:685-716`**; las **anclas y `id` de ficha son datos reales de `index.html`** (verificados esta sesión — ver tabla abajo).

**`<read_first>` para el planner:** `01-RESEARCH.md:683-716` + `01-RESEARCH.md:515-536` (tabla de capturas D-04).

**Mecanismo de tema oscuro determinista** (`01-RESEARCH.md:365-372`) — reutiliza el contrato del `index.html`:

```ts
// 01-RESEARCH.md:367-368 — el script inline del index.html (línea 6263) lee localStorage['roma-theme'] y pinta dark en el primer paint
if (theme === 'dark') await page.addInitScript(() => localStorage.setItem('roma-theme', 'dark'))
await page.goto('/index.html')
```

**Anclas/ids EXACTOS a capturar (verificados en `index.html` esta sesión — resuelve Open Question #1):**

| Captura (nombre snapshot) | Selector | Línea en `index.html` | Notas |
|---------------------------|----------|----------------------|-------|
| `inicio` | `#inicio` | 2283 | `<section id="inicio">` |
| `dia-viernes` | `#viernes` | 2375 | |
| `dia-sabado` | `#sabado` | 2840 | |
| `dia-domingo` | `#domingo` | 3445 | |
| `dia-lunes` | `#lunes` | 4002 | |
| `dia-martes` | `#martes` | 4736 | |
| `ref-reservas` | `#reservas` | 5260 | |
| `ref-gastronomia` | `#gastronomia` | 5335 | |
| `ref-practica` | `#practica` | 5825 | |
| `ref-arte` | `#arte` | 5941 | |
| `ref-arquitectura` | `#arquitectura` | 6104 | |
| `card-monumento` (tipo `card`) | `#galleria-sciarra` | 2450 | `<article class="card" id="galleria-sciarra">` |
| `card-guided` (Vaticano) | `#vaticano` | **2920** | **Ver hallazgo crítico abajo** |
| `card-concert` (Auditorium) | `#auditorium` | 3381 | `card-roman` = `♪` (línea 3383) |

> **HALLAZGO CRÍTICO — resuelve Open Question #1 (`01-RESEARCH.md:536, 878-881`):** el `index.html` **NO usa clases CSS `guided`/`concert` en los `<article>`**. TODAS las fichas son `<article class="card" id="…">` (verificado: grep de `<article class="card"` devuelve las 38 fichas; no hay `class="card guided"` ni `class="...concert"`). Los tipos `card`/`guided`/`concert` son un concepto del **modelo de datos futuro** (esquema zod, `ARCHITECTURE.md:328`), no una clase del DOM actual. Para el golden: la ficha "guiada" representativa es **`#vaticano`** (línea 2920, `<h3>Vaticano · preparar la visita guiada</h3>` línea 2924); la "concert" es **`#auditorium`** (3381, romano `♪`). No buscar clases de tipo — usar estos `id`.

**Naming + cota de PNGs (`01-RESEARCH.md:565-570`):** 14 vistas × 2 temas × 2 viewports = **56 PNGs** (cota superior). Carpeta sugerida `tests/parity/golden.spec.ts-snapshots/` (default) o `tests/parity/__screenshots__/`. **DEBEN versionarse** (Pitfall 2: que el `.gitignore` del scaffold no los excluya — `git ls-files tests/parity` debe listarlos).

---

### `app/app.vue` (placeholder) — SIN análogo en-repo → estructura mínima

**Análogo:** no existe en-repo. Patrón: `ARCHITECTURE.md:108` / `01-RESEARCH.md:230`.

**`<action>` para el planner:** placeholder mínimo. Suficiente para que `nuxt generate` produzca 1 ruta (`/`) con HTML real (no SPA shell). El render de contenido real (TripView, páginas) es Fase 2+.

```vue
<!-- Mínimo Fase 1 — basta para PLAT-01/BUILD-01. Composición real = fases posteriores. -->
<template><NuxtLayout><NuxtPage /></NuxtLayout></template>
<!-- o incluso <template><div>guiaRoma — scaffold</div></template> si no hay pages/ todavía -->
```

---

### `server/api/README.md` (placeholder) — SIN análogo en-repo → texto sugerido

**Análogo:** no existe en-repo. Texto sugerido: **`01-RESEARCH.md:499-505`**.

**`<read_first>` para el planner:** `01-RESEARCH.md:489-507` + `ARCHITECTURE.md:650-661` (backend dormido).

**`<action>`:** crear `server/api/README.md` (ÚNICO contenido bajo `server/`). **NINGÚN `*.ts`/`*.js`** bajo `server/` (ARCH-03: un fichero de servidor activaría una ruta → rompería el "dormido"). Texto:

```md
# server/api — Backend Nitro (DORMIDO)
Hueco reservado para el backend de v2 (auth, subida de media, API).
En la 1.0 NO hay endpoints activos: el sitio se genera 100% estático (preset github_pages).
Añadir un `*.ts` aquí activaría una ruta — NO hacerlo en la 1.0.
```

---

### `public/.nojekyll` + `public/favicon.svg` + `public/apple-touch-icon.svg` (asset)

- **`public/.nojekyll`** — fichero **vacío** (cinturón-y-tirantes para que Pages no ignore `/_nuxt/`; `01-RESEARCH.md:456`, Pitfall 3). Verificación: `test -f .output/public/.nojekyll` tras `generate`.
- **`public/favicon.svg` / `public/apple-touch-icon.svg`** — **COPIAR** (no mover) los de la raíz a `public/` para que resuelvan bajo `/guiaRoma/` en la app Nuxt (A4, `01-RESEARCH.md:482-485`). Los de la raíz son del `index.html` (D-02, líneas 9-10) y **permanecen intactos**. Referenciar en `nuxt.config.ts` `app.head.link` si hace falta.

---

### `content.config.ts` + `tsconfig.json` + `eslint.config.mjs` + `.gitignore` (config/placeholder, autogenerados)

- **`content.config.ts`** — presente **mínimo/vacío** en Fase 1 (el esquema zod de las 6 colecciones es **Fase 2**, `ARCHITECTURE.md:184-431`). Registrar el módulo `@nuxt/content` ya en `nuxt.config.ts`, sin colecciones reales.
- **`tsconfig.json`** — extiende `.nuxt/tsconfig.json` (estricto, generado por Nuxt). Reforzar con `typescript.strict: true` en `nuxt.config.ts` (`01-RESEARCH.md:584`).
- **`eslint.config.mjs`** — **autogenerado** por `pnpm dlx nuxi module add eslint` (flat config consciente de Nuxt; `01-RESEARCH.md:590`). Formateo: activar `stylistic` vía `nuxt.config.ts` `eslint: { config: { stylistic: true } }` (`01-RESEARCH.md:593-595`) — elegir UNA vía (stylistic O Prettier, no mezclar).
- **`.gitignore`** — autogenerado por scaffold; **verificar Pitfall 2**: que no excluya los golden PNGs en `tests/parity/`.

---

## Patrones compartidos

### Tema (`[data-theme]` + `localStorage('roma-theme')`) — contrato que une `index.html`, golden y app Nuxt
**Fuente:** `index.html:6251-6266` (init de tema) + `index.html:2` (`<html lang="es" data-theme="light">`).
**Aplica a:** `nuxt.config.ts` (colorMode), `tests/parity/golden.spec.ts` (golden oscuro).
```js
// index.html:6255-6256 — escribe atributo + persiste
document.documentElement.setAttribute('data-theme', t);
try { localStorage.setItem('roma-theme', t); } catch(e){}
// index.html:6263 — lee al cargar
const saved = localStorage.getItem('roma-theme');
```
El módulo `@nuxtjs/color-mode` con `dataValue:'theme'` + `storageKey:'roma-theme'` + `fallback:'light'` **reproduce exactamente** este contrato (mismo atributo `data-theme`, misma clave). El golden lo reutiliza vía `addInitScript(localStorage.setItem('roma-theme','dark'))`. Tres consumidores, un contrato.

### CSS verbatim sin regresión — reglas de cascada
**Fuente:** `01-RESEARCH.md:410-418` (CSS Extraction Strategy) / Pitfall 4 (`01-RESEARCH.md:659-663`).
**Aplica a:** los 3 ficheros `assets/css/*`.
- Orden en `css:[]`: **tokens → base → leaflet** (base consume las custom properties de tokens).
- **NO `@layer`** en Fase 1 (cambia prioridad de cascada → drift).
- **NO `<style scoped>`** (los `data-v-*` rompen selectores cruzados `body.modo-resumen …`, `[data-theme="dark"] .leaflet-tile`).
- **NO** SCSS/PostCSS extra — el CSS usa `color-mix(in srgb, …)` nativo (`STACK.md:408`).
- Verificación V4 (`01-RESEARCH.md:418`): **diff textual** contenido combinado vs `<style>` del `index.html` = sin alteraciones.

### Subpath de producción `/guiaRoma/` — sin 404 de `/_nuxt/*`
**Fuente:** `01-RESEARCH.md:448-480` (Base-Path Correctness) + Pitfall 3.
**Aplica a:** `nuxt.config.ts` (`app.baseURL` + `nitro.preset` + `failOnError`), `public/.nojekyll`.
- `app.baseURL: '/guiaRoma/'` + `nitro.preset: 'github_pages'` + `public/.nojekyll` + `failOnError: true` + **cero rutas absolutas hardcodeadas** (usar `~/assets`).
- Verificación V5 (`01-RESEARCH.md:464-480, 718-727`): copiar `.output/public` a subcarpeta `guiaRoma/`, servir, y assertar 0 respuestas con status ≥400 para `/_nuxt/*` (programable con Playwright `page.on('response')`).

### Backend Nitro dormido — SSR-en-build ON, sin `ssr:false`
**Fuente:** `ARCHITECTURE.md:650-661` + `01-RESEARCH.md:489-507` (Anti-Pattern `01-RESEARCH.md:378, 671-675`).
**Aplica a:** `server/api/README.md`, `nuxt.config.ts`.
- `server/` presente; **único contenido** `server/api/README.md`; **ningún `*.ts`/`*.js`**.
- **NUNCA `ssr: false`** (produce SPA shell sin HTML → rompe paridad). Estático = preset + prerender con SSR-en-build ON.

### Versiones de dependencias — verificadas npm 2026-06-18
**Fuente:** `STACK.md:31-58, 527-537` + `01-RESEARCH.md:98-117, 157-179` (Package Legitimacy Audit).
**Aplica a:** `package.json`, `pnpm-lock.yaml`.
Todas las 12 deps de Fase 1 son paquetes oficiales (org Nuxt / librerías canónicas) y `latest` al 2026-06-18. slopcheck no estaba disponible → un **único `checkpoint:human-verify` ligero** recomendado antes de instalar (`01-RESEARCH.md:179`), no 12 separados. **`import { z } from 'zod'`** (NUNCA desde `@nuxt/content` — re-export deprecado).

---

## Sin análogo encontrado (usar sketches de RESEARCH/STACK/ARCHITECTURE)

> Greenfield: la mayoría de ficheros de scaffold no tienen análogo en-repo. El "patrón a copiar" es el sketch de config citado. Esto es **esperado y correcto** para Fase 1.

| Fichero | Rol | Flujo | Razón / dónde está el patrón |
|---------|-----|-------|------------------------------|
| `nuxt.config.ts` | config | build | No hay Nuxt previo → `01-RESEARCH.md:260-322` (Pattern 1, verificado) |
| `package.json` | config | tooling | No hay Nuxt previo → `01-RESEARCH.md:600-614` + `STACK.md:135-149` |
| `playwright.config.ts` | test-harness | test | No hay tests previos → `01-RESEARCH.md:328-359` |
| `tests/parity/golden.spec.ts` | test-harness | test | Esqueleto `01-RESEARCH.md:685-716` (anclas reales de `index.html`) |
| `app/app.vue` | placeholder | render | No hay Vue previo → mínimo, `ARCHITECTURE.md:108` |
| `content.config.ts` | placeholder | datos | Vacío en Fase 1 (esquema = Fase 2) |
| `server/api/README.md` | placeholder | API | Texto `01-RESEARCH.md:499-505` |
| `tsconfig.json` | config | typecheck | Extiende `.nuxt/tsconfig` (autogen) |
| `eslint.config.mjs` | config | lint | Autogenerado por `nuxi module add eslint` |
| `.gitignore` / `pnpm-lock.yaml` | config/lockfile | build | Autogenerados por scaffold/`pnpm install` |

---

## Metadatos

**Ámbito de búsqueda de análogos:** raíz del repo (`/home/vcompanyb/guiaRoma`). El repo solo contiene `index.html`, `favicon.svg`, `apple-touch-icon.svg`, `CLAUDE.md`, `.planning/`, `.git/` — confirmado por inspección y RESEARCH.md §Entorno.
**Ficheros escaneados:** `index.html` (6.665 líneas, leído en tramos load-bearing: 1-40, 866-905) + greps dirigidos (style boundaries, tokens, anclas de sección, clases `card`/`card-roman`, init de tema, `localStorage`, `<script>`). Docs: `01-CONTEXT.md`, `01-RESEARCH.md` (990 líneas, completo), `STACK.md`, `ARCHITECTURE.md`.
**Único análogo en-repo:** `index.html` (CSS verbatim + contrato de tema + anclas/ids del golden). Todo lo demás: sketch de config.
**Verificaciones nuevas de esta sesión (no en RESEARCH):** confirmado que NO existe clase CSS `guided`/`concert` en los `<article>` (todas `class="card"`); `#vaticano` está en línea 2920; `:root` 866-881 y `[data-theme="dark"]` 883-898; `<style>` editorial cierra en 2210; filtro dark de tiles en 1208-1209 (bloque editorial).
**Fecha de extracción:** 2026-06-18
