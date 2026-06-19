import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parse as parseYaml } from 'yaml'
import {
  normalize,
  textMultiset,
  extractFromHtml,
  diffEntry,
  isEquivalent,
  yamlLinks,
  knownHtmlIds,
  hasYaml,
  resolveYamlPath,
} from '../../scripts/migration-diff'

/**
 * Puerta de fidelidad 1:1 del contenido (DATA-04 / D-08) — index.html ⇄ YAML migrado.
 *
 * Análoga en ETHOS al golden de paridad (tests/parity/golden.spec.ts): el `index.html` ACTUAL
 * es la FUENTE DE VERDAD inmutable. Donde el golden compara PÍXELES, esta puerta compara, por
 * id de ficha, el TEXTO VISIBLE y el CONJUNTO de ENLACES (Maps externos + anclas internas #id)
 * tras NORMALIZAR (espacios, entidades HTML, <strong>/<em> ↔ Markdown). El markup puede cambiar
 * (HTML → Markdown), pero no se pierde ni se añade texto ni enlace (D-08; NO byte-exacto).
 *
 * Es la red automática contra el Pitfall 4 (perder un href o cambiar una frase al transcribir
 * ~64 fichas densas), independiente del golden visual (Fase 8) y de la revisión manual
 * (02-VALIDATION.md 75-79: la lectura a ojo de 2-3 fichas es COMPLEMENTARIA, no esta puerta).
 *
 * SEMÁNTICA DE SKIP POR ID (OBLIGATORIA): Wave 3 migra el contenido en paralelo por colección.
 * Este spec se ejecuta de forma INCREMENTAL: para cada id con YAML presente, aserta equivalencia;
 * para cada id AÚN NO migrado, lo SKIPea (it.skip vía el helper de existencia del harness). Sin
 * esto, ejecutar el spec mientras un plan de Wave 3 ha migrado sólo una parte de los ids haría
 * fallar la suite por culpa de los ids que OTRO plan de Wave 3 aún no ha escrito (false-red entre
 * planes en paralelo).
 *
 * NUNCA verde vacuo: los casos del normalizador y el fixture negativo SIEMPRE corren,
 * independientemente de cuántos ids estén migrados.
 *
 * Node puro (readFileSync + parseYaml + cheerio en el harness). El index.html se lee SOLO-LECTURA.
 */

// ── Casos del normalizador (SIEMPRE corren) — prueban D-08 sin depender de datos ──
describe('normalize: reglas D-08 (espacios, entidades, strong/em → Markdown)', () => {
  it('decodifica entidades HTML comunes', () => {
    expect(normalize('Tom &amp; Jerry')).toBe('Tom & Jerry')
    expect(normalize('a &lt; b &gt; c')).toBe('a < b > c')
    expect(normalize('d&#39;Este &quot;x&quot;')).toBe('d\'Este "x"')
    expect(normalize('a&nbsp;b')).toBe('a b')
  })

  it('convierte <strong>/<b> a ** y <em>/<i> a _', () => {
    expect(normalize('un <strong>techo</strong> de cristal')).toBe('un **techo** de cristal')
    expect(normalize('the <b>x</b>')).toBe('the **x**')
    expect(normalize('en <em>La Grande Bellezza</em>')).toBe('en _La Grande Bellezza_')
    expect(normalize('the <i>y</i>')).toBe('the _y_')
  })

  it('colapsa cualquier espacio en blanco (incl. saltos de línea) a uno solo y recorta', () => {
    expect(normalize('  a   b\n\n   c  \t d ')).toBe('a b c d')
  })

  it('es idempotente sobre prosa ya en Markdown (no re-escapa)', () => {
    const md = 'un **techo** y _Pudica_'
    expect(normalize(md)).toBe(md)
  })

  it('textMultiset ignora marcadores de énfasis y la sintaxis de enlace (sólo texto visible)', () => {
    const ms = textMultiset(normalize('un **techo** de [Trevi](#fontana-trevi) y _luz_'))
    // 'fontana-trevi' (de la URL) NO debe aparecer; sí 'techo', 'trevi', 'luz'.
    expect(ms.has('fontana-trevi')).toBe(false)
    expect(ms.get('techo')).toBe(1)
    expect(ms.get('trevi')).toBe(1)
    expect(ms.get('luz')).toBe(1)
  })
})

// ── Fixture negativo (SIEMPRE corre) — la puerta DETECTA pérdidas (Pitfall 4) ──
describe('puerta de fidelidad: detecta texto/enlaces perdidos (fixtures, siempre corren)', () => {
  // Usamos una ficha real del index.html (galleria-sciarra) como fuente, y construimos
  // versiones YAML degradadas. Esto prueba que diffEntry TIENE DIENTES sin depender de que
  // exista ningún .yml migrado.
  const ID = 'galleria-sciarra'
  const ext = extractFromHtml(ID)
  const fullProse = normalize(ext.text)

  it('un YAML FIEL (mismo texto + mapsQuery que reconstruye el enlace Maps) es equivalente', () => {
    const faithful = {
      slug: ID,
      trip: 'roma',
      motif: 'arch', // estructural → excluido del texto
      mapsQuery: 'Galleria Sciarra Roma', // reconstruye el href de Maps del HTML
      sections: [{ heading: 'contenido', body: fullProse }],
    }
    const d = diffEntry(ID, faithful)
    // 'contenido' es la única palabra inyectada por el heading de prueba.
    expect(d.missingWords, JSON.stringify(d.missingWords)).toEqual([])
    expect(d.extraWords.filter(w => w !== 'contenido'), JSON.stringify(d.extraWords)).toEqual([])
    expect(d.missingLinks, JSON.stringify(d.missingLinks)).toEqual([])
    expect(d.extraLinks, JSON.stringify(d.extraLinks)).toEqual([])
  })

  it('un YAML al que le FALTA el enlace de Maps → diffEntry reporta el href faltante', () => {
    const sinMaps = {
      slug: ID,
      sections: [{ heading: 'contenido', body: fullProse }],
      // sin mapsQuery → el href de Maps del HTML no se reconstruye
    }
    const d = diffEntry(ID, sinMaps)
    expect(d.missingLinks.length).toBeGreaterThan(0)
    expect(d.missingLinks.some(l => l.startsWith('https://www.google.com/maps/search/'))).toBe(true)
  })

  it('un YAML al que le FALTA una frase → diffEntry reporta palabras faltantes', () => {
    const truncado = {
      slug: ID,
      mapsQuery: 'Galleria Sciarra Roma',
      sections: [{ heading: 'contenido', body: fullProse.split(' ').slice(0, -6).join(' ') }],
    }
    const d = diffEntry(ID, truncado)
    expect(d.missingWords.length).toBe(6)
  })

  it('un YAML al que le FALTA una ancla interna (#arq-moderna) → reporta el enlace faltante', () => {
    // fontana-trevi enlaza a #arq-moderna en su prosa de cross-ref (card-arch).
    const ftId = 'fontana-trevi'
    const ftProse = normalize(extractFromHtml(ftId).text).replace('[Tardobarroco](#arq-moderna)', 'Tardobarroco')
    const sinAncla = {
      slug: ftId,
      mapsQuery: 'Fontana di Trevi Roma',
      sections: [{ heading: 'contenido', body: ftProse }],
    }
    const d = diffEntry(ftId, sinAncla)
    expect(d.missingLinks).toContain('#arq-moderna')
  })

  it('yamlLinks reconstruye el enlace de Maps desde mapsQuery igual que el href del HTML', () => {
    const links = yamlLinks({ mapsQuery: 'Galleria Sciarra Roma' })
    expect([...links]).toEqual([...ext.links].filter(l => l.startsWith('https://www.google.com/maps/search/')))
  })
})

// ── Diff por id: equivalencia normalizada DATA-04; SKIP de ids no migrados ──────
describe('diff index.html ⇄ YAML por id (DATA-04 / D-08)', () => {
  const ids = knownHtmlIds()

  it('hay ids de ficha en el index.html para diffear (la fuente existe)', () => {
    // 38 monumentos + 21 gastro con id + 13 artist-cards = 72 anclas en el index.html.
    // (5 gastro-cards sin id — Giolitti, Venchi, Sant'Eustachio, Pompi, Linari — no son
    //  direccionables por ancla; su fidelidad la cubre la revisión manual de D-08.)
    expect(ids.length).toBe(72)
  })

  for (const id of ids) {
    const yamlPath = resolveYamlPath(id)
    if (!hasYaml(id)) {
      // Wave 3 aún no ha migrado este id: SKIP explícito (no false-red entre planes paralelos).
      it.skip(`${id} — YAML aún no migrado (SKIP)`, () => {})
      continue
    }
    it(`${id} — texto y enlaces equivalentes (sin faltantes ni sobrantes)`, () => {
      const yamlObj = parseYaml(readFileSync(yamlPath as string, 'utf8')) as Record<string, unknown>
      const d = diffEntry(id, yamlObj)
      expect(d.missingWords, `texto faltante en ${id}: ${JSON.stringify(d.missingWords)}`).toEqual([])
      expect(d.extraWords, `texto sobrante en ${id}: ${JSON.stringify(d.extraWords)}`).toEqual([])
      expect(d.missingLinks, `enlaces faltantes en ${id}: ${JSON.stringify(d.missingLinks)}`).toEqual([])
      expect(d.extraLinks, `enlaces sobrantes en ${id}: ${JSON.stringify(d.extraLinks)}`).toEqual([])
      expect(isEquivalent(d)).toBe(true)
    })
  }
})
