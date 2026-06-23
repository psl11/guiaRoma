// nuxt.config.ts — Fase 1 (scaffold + CSS verbatim + módulos del stack + subpath de producción)
// Plan 02: modules / app.baseURL / css / colorMode / typescript / eslint / fonts.
// Plan 03 (AÑADIDO): nitro.preset github_pages + prerender (failOnError), favicons bajo el subpath.
// compatibilityVersion 4 es el DEFAULT en Nuxt 4 — NO hace falta future.compatibilityVersion.
export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxtjs/color-mode', '@nuxt/fonts', '@nuxt/eslint'],

  // Subpath de producción (BUILD-01/03): el sitio vive en usuario.github.io/guiaRoma/.
  // baseURL del Plan 02. Los favicons (Plan 03) se declaran en app/app.vue con useHead +
  // useRuntimeConfig().app.baseURL: Nuxt NO antepone baseURL a los href de app.head.link,
  // así que un `/favicon.svg` estático daría 404 bajo el subpath. public/ sirve las copias
  // (A4, D-02) en /guiaRoma/favicon.svg.
  app: {
    baseURL: '/guiaRoma/',
  },

  // CSS editorial VERBATIM, cargado UNA sola vez. ORDEN crítico: base consume las variables de tokens.
  // fonts.css PRIMERO: declara las @font-face vendorizadas (woff2 EXACTOS del golden) antes de que
  // base.css las use en `font-family` (F8 / 08-06 — paridad-pixel del wrap, Blocker B).
  css: [
    '~/assets/css/fonts.css',
    '~/assets/css/tokens.css',
    '~/assets/css/base.css',
    '~/assets/css/leaflet.css',
  ],

  // Tema: registrar el módulo en Fase 1 (el ThemeToggle/uso es Fase 3).
  // Reproduce el contrato del index.html: <html data-theme="dark"> + localStorage['roma-theme'].
  colorMode: {
    preference: 'system',
    fallback: 'light',
    dataValue: 'theme',
    storageKey: 'roma-theme',
    classSuffix: '',
  },

  // Salida 100% estática para GitHub Pages (BUILD-01/03). SSR-en-build ON (NUNCA SPA shell):
  // el preset github_pages prerenderiza a .output/public con la estructura de Pages
  // (incl. .nojekyll); failOnError convierte un enlace interno roto en fallo de build
  // (parity guard). El routing es history (default) — las anclas #id son fragmentos, no rutas.
  nitro: {
    preset: 'github_pages',
    prerender: {
      crawlLinks: true,
      routes: ['/'],
      failOnError: true,
    },
  },

  // TypeScript estricto (PLAT-02); typeCheck en comando separado (`pnpm typecheck`).
  typescript: {
    strict: true,
    typeCheck: false,
  },

  // Formateo vía @nuxt/eslint (stylistic) — una sola herramienta, sin mezclar con Prettier.
  // typescript: true → incluye el parser/reglas de typescript-eslint para los .ts FUERA del
  // grafo Vue (shared/, tests/data/, *.config.ts). Por defecto @nuxt/eslint lo deja en false
  // y esos ficheros caerían a espree (que no entiende `: tipo`/`export type`). Fase 2 es la
  // primera con código fuente TS tipado lintado, de ahí que haga falta activarlo ahora.
  eslint: {
    config: {
      stylistic: true,
      typescript: true,
    },
  },

  // FUENTES — VENDORIZADAS, self-host EXACTO del golden (BUILD-02 offline + PARIDAD-PIXEL F8/08-06).
  //
  // GROUND TRUTH (medido en el Playwright Chromium que captura el golden): el index.html vivo carga
  // de Google las instancias VARIABLES de Lora (woff2 normal-latin = 37792 B, italic-latin = 40648 B,
  // v37) y renderiza la prosa a 388px (cadena de prueba) → el golden tiene ESA métrica. El intento
  // previo (provider 'fontsource', estático) servía una Lora DISTINTA y más ESTRECHA (374px) → cada
  // párrafo con italica/upright mezclados (`<em>in situ</em>`) caía a 9 líneas vs 10 del golden
  // (#inicio móvil 2174 vs 2200; toHaveScreenshot falla por DIMENSIÓN, no absorbible por
  // maxDiffPixelRatio). La clasificación previa invirtió el signo (creyó la variable "más ancha de más"
  // y que fontsource == Google; AMBAS premisas eran falsas — los woff2 difieren en bytes Y en ~3.6% de
  // avance). CORRECCIÓN: se vendorizan los woff2 EXACTOS que Google sirve a Chromium (subsets latin +
  // latin-ext, los únicos que el contenido es/it usa) en app/assets/fonts/, declarados en
  // app/assets/css/fonts.css. Vite los empaqueta y los sirve self-hosted bajo /guiaRoma/_nuxt/ → CERO
  // petición a fonts.gstatic.com/googleapis.com en RUNTIME (offline preservado), y byte-idénticos al
  // golden por construcción → el wrap cuadra al píxel.
  //
  // @nuxt/fonts queda registrado (otros usos futuros) pero con las 3 familias en `provider: 'none'`:
  // NO debe resolver ni inyectar @font-face/caras-fallback propias para Lora/Cormorant/JetBrains (eso
  // reintroduciría la fuente equivocada y las caras métricas "X Fallback:" que el original no tiene).
  // Las @font-face vivas son SOLO las de fonts.css.
  fonts: {
    families: [
      { name: 'Cormorant Garamond', provider: 'none' },
      { name: 'Lora', provider: 'none' },
      { name: 'JetBrains Mono', provider: 'none' },
    ],
  },
})
