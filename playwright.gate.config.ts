import { defineConfig } from '@playwright/test'
import base from './playwright.config'

// Config con alcance de PUERTA (D-03/D-04). Extiende la config base de paridad y
// la acota para el comando-puerta `pnpm verify`/`pnpm test:parity`. NO edita la base.
//
// D-04 exclusión #1 — golden.spec.ts EXCLUIDO a nivel de FICHERO (testIgnore):
//   golden.spec.ts re-renderiza el index.html VIEJO; es redundante una vez que existe
//   el spec Nuxt↔golden de Plan 02 (visual-diff.spec.ts) y resulta inestable bajo carga
//   paralela (los 4 fallos diferidos de pixel-diff del golden). Se excluye por fichero
//   (estable ante renombrados), no por título/línea frágil (Pitfall 4). golden.spec.ts y
//   test:golden / test:golden:update SIGUEN intactos como herramienta de captura F1 a demanda.
//
// D-04 exclusión #2 — el test de dev-routing ("reutiliza el MISMO TripView…", shell.spec.ts)
//   NO se excluye aquí (vive en shell.spec.ts, que debe seguir en la puerta por sus aserciones
//   estáticas). Se neutraliza con el grep-invert del script test:parity sobre su título estable
//   (cinturón a la bandera de entorno que añade Plan 04; ambos apuntan al MISMO test).
//
// D-01 invariante de baseline congelado — snapshotPathTemplate fija el dir de snapshots al
//   dir golden CONGELADO, desacoplándolo de {testFileName}. {arg} = `<vista>-<tema>`
//   (p. ej. inicio-light), {projectName} = mobile|desktop → resuelve el PNG congelado de F1
//   (tests/parity/golden.spec.ts-snapshots/inicio-light-desktop.png). Así el toHaveScreenshot
//   de visual-diff.spec.ts (Plan 02) lee los 56 PNGs existentes en vez de crear un baseline
//   Nuxt-contra-sí-mismo. NUNCA se pasa --update-snapshots por esta puerta; en mismatch los
//   *-actual.png/*-diff.png van a test-results/ y el baseline queda intacto (read-only).
//   La forma de path en array está PROHIBIDA (lanza si escapa del dir propio del fichero).
export default defineConfig({
  ...base,
  testIgnore: ['**/golden.spec.ts'],
  snapshotPathTemplate: 'tests/parity/golden.spec.ts-snapshots/{arg}-{projectName}{ext}',
})
