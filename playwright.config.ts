import { defineConfig, devices } from '@playwright/test'

// Harness del golden de paridad (PARITY-01).
// Sirve el index.html ACTUAL in situ con un static server sobre la raíz del repo
// (D-05): el golden se captura del fichero vivo, byte-idéntico a origin/main,
// ANTES de que exista cualquier código Nuxt que pueda divergir.
export default defineConfig({
  testDir: './tests/parity',

  // Static server sobre la raíz del repo → http://localhost:4173/index.html
  webServer: {
    command: 'pnpm dlx serve -l 4173 .',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },

  use: {
    baseURL: 'http://localhost:4173',
  },

  // Determinismo de screenshots: congela @keyframes fadeIn + transiciones de tema
  // (index.html:2121-2125 y transitions .4s) y oculta el caret de texto.
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.01,
    },
  },

  // Decisión A8: plantilla SIN el sufijo de plataforma (el segmento por defecto
  // que Playwright añadiría, p. ej. `-linux`/`-darwin`/`-win32`) para poder comparar
  // los golden entre SOs en la Fase 8 sin atarlos a un SO concreto. La captura se
  // realizó en linux (documentado en el SUMMARY).
  snapshotPathTemplate: '{testDir}/{testFileName}-snapshots/{arg}-{projectName}{ext}',

  projects: [
    // Viewport móvil ~390px (D-04). iPhone 12 aporta el viewport/DPR/UA móvil;
    // forzamos chromium (su defaultBrowserType es webkit) — chromium basta para un
    // visual-diff determinista y es el único navegador instalado.
    { name: 'mobile', use: { ...devices['iPhone 12'], browserName: 'chromium' } },
    // Viewport desktop 1280×800 (D-04)
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 }, browserName: 'chromium' } },
  ],
})
