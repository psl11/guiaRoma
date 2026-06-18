// nuxt.config.ts — Fase 1 (scaffold + CSS verbatim + módulos del stack)
// El subpath de producción, el preset github_pages y el backend dormido se afinan en el Plan 03.
// compatibilityVersion 4 es el DEFAULT en Nuxt 4 — NO hace falta future.compatibilityVersion.
export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxtjs/color-mode', '@nuxt/fonts', '@nuxt/eslint'],

  // Subpath de producción (BUILD-01/03). Declararlo ya es correcto; se afina en el Plan 03.
  app: {
    baseURL: '/guiaRoma/',
  },

  // CSS editorial VERBATIM, cargado UNA sola vez. ORDEN crítico: base consume las variables de tokens.
  css: [
    '~/assets/css/tokens.css',
    '~/assets/css/base.css',
    '~/assets/css/leaflet.css',
  ],

  // Self-host de las 3 familias (BUILD-02 offline). Pesos/itálicas EXACTOS de index.html línea 13.
  fonts: {
    families: [
      {
        name: 'Cormorant Garamond',
        provider: 'google',
        weights: [400, 500, 600, 700],
        styles: ['normal', 'italic'],
        subsets: ['latin', 'latin-ext'],
      },
      {
        name: 'Lora',
        provider: 'google',
        weights: [400, 500, 600],
        styles: ['normal', 'italic'],
        subsets: ['latin', 'latin-ext'],
      },
      {
        name: 'JetBrains Mono',
        provider: 'google',
        weights: [400, 500],
        styles: ['normal'],
        subsets: ['latin', 'latin-ext'],
      },
    ],
  },

  // Tema: registrar el módulo en Fase 1 (el ThemeToggle/uso es Fase 3).
  // Reproduce el contrato del index.html: <html data-theme="dark"> + localStorage['roma-theme'].
  colorMode: {
    preference: 'system',
    fallback: 'light',
    dataValue: 'theme',
    storageKey: 'roma-theme',
    classSuffix: '',
  },

  // TypeScript estricto (PLAT-02); typeCheck en comando separado (`pnpm typecheck`).
  typescript: {
    strict: true,
    typeCheck: false,
  },

  // Formateo vía @nuxt/eslint (stylistic) — una sola herramienta, sin mezclar con Prettier.
  eslint: {
    config: {
      stylistic: true,
    },
  },
})
