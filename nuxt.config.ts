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
  css: [
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

  // Self-host de las 3 familias (BUILD-02 offline). Pesos/itálicas EXACTOS de index.html línea 13.
  //
  // PARIDAD (F8 / 08-06): provider 'fontsource', NO 'google'. El golden (index.html vivo)
  // carga de Google las instancias ESTÁTICAS de Lora/Cormorant/JetBrains; el provider 'google'
  // de @nuxt/fonts servía en cambio una Lora VARIABLE (sfnt 76160, con fvar/gvar/HVAR) ~3.8%
  // más ancha → cada vista reflowaba y rompía la paridad-pixel (toHaveScreenshot falla en deltas
  // de dimensión, no absorbibles por maxDiffPixelRatio). El provider 'fontsource' con PESOS
  // DISCRETOS (no rangos) resuelve la rama ESTÁTICA de unifont (variants[weight][style][subset],
  // NO la :vf), sirviendo las MISMAS masters estáticas de Google que usa el golden
  // (lora-latin-400-normal.woff2 = 21148 B / sfnt 47652, byte-equivalente al estático del golden).
  // Sigue 100% self-hosted/offline: @nuxt/fonts descarga los woff2 en BUILD y los sirve bajo
  // /guiaRoma/_fonts/ — sin petición a fonts.gstatic.com NI a fontsource en RUNTIME. Los paquetes
  // @fontsource/* (devDependencies) fijan las versiones estáticas en el árbol y documentan la fuente.
  fonts: {
    provider: 'fontsource',
    families: [
      {
        name: 'Cormorant Garamond',
        provider: 'fontsource',
        weights: [400, 500, 600, 700],
        styles: ['normal', 'italic'],
        subsets: ['latin', 'latin-ext'],
      },
      {
        name: 'Lora',
        provider: 'fontsource',
        weights: [400, 500, 600],
        styles: ['normal', 'italic'],
        subsets: ['latin', 'latin-ext'],
      },
      {
        name: 'JetBrains Mono',
        provider: 'fontsource',
        weights: [400, 500],
        styles: ['normal'],
        subsets: ['latin', 'latin-ext'],
      },
    ],
  },
})
