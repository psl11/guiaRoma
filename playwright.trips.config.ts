import { defineConfig } from '@playwright/test'

// E2E de AISLAMIENTO POR VIAJE (Fase 9: PLAT-01/02/03 en un segundo viaje real).
//
// Corre contra `nuxi dev` y no contra la build estática: `/trips/prueba` es un viaje ficticio de
// desarrollo que no se prerenderiza hasta la Fase 11 (D-02), así que solo existe en dev.
//
// FUERA de `pnpm verify` y de la puerta de paridad (`playwright.gate.config.ts`, 80 tests / 11
// ficheros): el dev server es frágil (primera compilación lenta, lock rancio de `nuxi dev`,
// optimización de dependencias de Vite que recarga la página). Se lanza a demanda con
// `pnpm test:trips`. NO importa ni extiende las configs de paridad.
//
// Uso:
//   · Nunca a la vez que `nuxi generate` / `pnpm verify`: compiten por `.nuxt/` y `.data/`.
//   · Antes, `rm -rf .data .nuxt` para no heredar contenido rancio ni el lock de `nuxi dev`.
//   · El webServer hereda el PATH del shell: ejecútalo con Node 22 (con Node 24 `better-sqlite3`,
//     que usa Nuxt Content, no carga). P. ej. `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH"`.
//   · Playwright arranca y para el servidor (`reuseExistingServer: false`): no queda ningún proceso
//     escuchando en el puerto 5300 al terminar.
export default defineConfig({
  testDir: './tests/trips',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },

  webServer: {
    command: 'node_modules/.bin/nuxi dev --port 5300',
    url: 'http://localhost:5300/guiaRoma/',
    timeout: 180_000,
    reuseExistingServer: false,
    env: { NUXT_APP_BASE_URL: '/guiaRoma/' },
  },

  use: {
    baseURL: 'http://localhost:5300',
  },

  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 }, browserName: 'chromium' } },
  ],
})
