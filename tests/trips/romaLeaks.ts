/**
 * MATCHER DEL TEST-TRAMPA (Fase 10, D-16 / SHAPE-05).
 *
 * `ROMA_MARKERS` es la lista mínima de D-16: textos que solo pertenecen a la guía de Roma (su
 * título, su marca, su pie, sus fichas). Si alguno aparece en la guía de otro viaje, es que un
 * literal o un respaldo de Roma se ha colado en el código compartido. Regla de oro: si la trampa
 * salta, se arregla el código o los datos del viaje afectado; NUNCA se quita una palabra de esta
 * lista.
 *
 * Cada marca se busca como PALABRA, sin distinguir mayúsculas, con límites Unicode: lookbehind y
 * lookahead negativos de letra o número Unicode (`\p{L}`/`\p{N}`, flags `iu`). El `\b` de las
 * RegExp de JS no vale porque es ASCII: para él «ñ» o «à» no son letras, así que `\bRoma\b`
 * casaría dentro de «Romaña» o «Romà» (falso positivo). Con los lookarounds Unicode, «aroma»,
 * «Romaña», «romano» y «guiaRoma» no casan, y «Roma», «ROMA» o «ROYAL COURT» sí. «Royal Court»
 * es una frase: el espacio casa con cualquier blanco (`\s+`), también un salto de línea.
 *
 * Puro y sin imports: lo usan tests/trips/shape.spec.ts (Playwright, en el proceso de Node, sobre
 * el texto recogido en el navegador) y tests/unit/romaLeaks.spec.ts (los dientes, en Vitest). No
 * es un spec: Playwright solo ejecuta `*.spec.ts`.
 */

export const ROMA_MARKERS = ['Roma', 'Einaudi', 'giugno', 'MMXXVI', 'Pay', 'Fellini', 'Royal Court'] as const

export type RomaMarker = (typeof ROMA_MARKERS)[number]

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const MARKER_PATTERNS: ReadonlyArray<{ marker: RomaMarker, re: RegExp }> = ROMA_MARKERS.map(marker => ({
  marker,
  re: new RegExp(
    `(?<![\\p{L}\\p{N}])${escapeRegExp(marker).replace(/ /g, '\\s+')}(?![\\p{L}\\p{N}])`,
    'iu',
  ),
}))

/** Marcas de Roma presentes en `text`, en el orden de `ROMA_MARKERS` y en su forma canónica. */
export function findRomaLeaks(text: string): string[] {
  return MARKER_PATTERNS.filter(({ re }) => re.test(text)).map(({ marker }) => marker)
}
