import { join } from 'node:path'

/**
 * Harness de la puerta de paridad (D-18): punto ÚNICO de la URL y del HTML construido de la
 * guía de Roma.
 *
 * - Los specs de Roma de `tests/parity/` nunca construyen su URL con la base del sitio escrita a
 *   mano ni leen `.output/public/index.html` directamente: toman la URL de `ROMA_URL` /
 *   `romaUrlAt(port)` y el HTML prerenderizado de `ROMA_HTML`.
 * - El movimiento de URL de la Fase 11 (Roma pasa a su ruta de viaje y la raíz del sitio a ser la
 *   portada) cambia SOLO la línea del valor de `ROMA_URL`; `ROMA_HTML` se deriva de ella.
 * - No es un spec: su nombre no casa con `*.spec.ts`, así que Playwright no lo ejecuta.
 */

/** Raíz del sitio publicado (subpath de GitHub Pages). */
export const SITE_BASE = '/guiaRoma/'

/** Ruta (con la base del sitio) en la que se sirve la guía de Roma. */
export const ROMA_URL = '/guiaRoma/'

/** Salida estática de `nuxi generate`. */
export const OUTPUT_DIR = join(process.cwd(), '.output', 'public')

/** HTML prerenderizado de la página de Roma, derivado de `ROMA_URL`. */
export const ROMA_HTML = join(OUTPUT_DIR, ROMA_URL.slice(SITE_BASE.length), 'index.html')

/** URL absoluta de Roma en un static server local que sirve el sitio en `port`. */
export const romaUrlAt = (port: number): string => `http://localhost:${port}${ROMA_URL}`
