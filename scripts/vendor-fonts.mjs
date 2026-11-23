// vendor-fonts.mjs — Vendoriza las fuentes EXACTAS que carga index.html (el golden) desde Google
// Fonts, descargando los woff2 que Google sirve a CHROMIUM (UA de Chrome) y reescribiendo solo el
// `src` a ficheros locales. Garantiza PARIDAD-MÉTRICA con el golden (F8/08-06): el paso de vendor
// previo tomó una Lora ~3.7% más ANCHA (probe 762px vs 735px de Google v37) → reflow de línea en
// desktop. Esto reemplaza app/assets/fonts/* y app/assets/css/fonts.css de forma reproducible.
// Offline preservado (BUILD-02): self-hosted bajo /guiaRoma/_nuxt/, cero petición a Google en runtime.
import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

const CSS2_URL = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=JetBrains+Mono:wght@400;500&display=swap'
// UA de Chrome real → Google sirve los MISMOS woff2 que ve Chromium al capturar el golden.
const CHROME_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const FONTS_DIR = join(process.cwd(), 'app/assets/fonts')
const CSS_OUT = join(process.cwd(), 'app/assets/css/fonts.css')
// Subsets que el contenido (es/it) usa — los mismos que determinan las métricas de la prosa.
const KEEP_SUBSETS = new Set(['latin', 'latin-ext'])

const slug = s => s.toLowerCase().replace(/['"]/g, '').replace(/\s+/g, '-')

const css = await (await fetch(CSS2_URL, { headers: { 'User-Agent': CHROME_UA } })).text()

// Limpia woff2 Lora/Cormorant/JetBrains previos (re-vendor reproducible).
for (const f of readdirSync(FONTS_DIR)) if (f.endsWith('.woff2')) unlinkSync(join(FONTS_DIR, f))
mkdirSync(FONTS_DIR, { recursive: true })

// Cada bloque va precedido de un comentario /* subset */.
const blocks = css.split('/*').slice(1) // [ "subset */ @font-face{...}", ... ]
const out = ['/* fonts.css — GENERADO por scripts/vendor-fonts.mjs desde la MISMA URL css2 que carga',
  ' * index.html (el golden). woff2 = bytes EXACTOS que Google sirve a Chromium (UA Chrome) → paridad',
  ' * métrica con el golden (F8/08-06). Self-hosted bajo /guiaRoma/_nuxt/ por Vite (offline, BUILD-02):',
  ' * CERO petición a fonts.gstatic.com/googleapis.com en runtime. NO editar a mano; regenerar con el script. */', '']

let count = 0
for (const blk of blocks) {
  const subsetLabel = blk.slice(0, blk.indexOf('*/')).trim()
  if (!KEEP_SUBSETS.has(subsetLabel)) continue
  const face = blk.slice(blk.indexOf('*/') + 2)
  const family = (face.match(/font-family:\s*'([^']+)'/) || [])[1]
  const style = (face.match(/font-style:\s*(\w+)/) || [])[1]
  const weight = (face.match(/font-weight:\s*(\d+)/) || [])[1]
  const range = (face.match(/unicode-range:\s*([^;]+);/) || [])[1]
  const url = (face.match(/url\(([^)]+)\)\s*format\('woff2'\)/) || [])[1]
  if (!family || !url) continue
  const name = `${slug(family)}-${weight}-${style}-${subsetLabel}.woff2`
  const buf = Buffer.from(await (await fetch(url, { headers: { 'User-Agent': CHROME_UA } })).arrayBuffer())
  writeFileSync(join(FONTS_DIR, name), buf)
  out.push(`/* ${family} ${weight} ${style} ${subsetLabel} */`)
  out.push('@font-face {')
  out.push(`  font-family: '${family}';`)
  out.push(`  font-style: ${style};`)
  out.push(`  font-weight: ${weight};`)
  out.push('  font-display: swap;')
  out.push(`  src: url('~/assets/fonts/${name}') format('woff2');`)
  out.push(`  unicode-range: ${range.trim()};`)
  out.push('}')
  out.push('')
  count++
  console.log(`vendored ${name} (${buf.length} B)`)
}
writeFileSync(CSS_OUT, out.join('\n'))
console.log(`\n${count} @font-face vendored → ${CSS_OUT}`)
