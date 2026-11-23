import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYaml } from 'yaml'
import {
  normalize,
  textMultiset,
  extractFromHtml,
  extractSectionMeta,
  extractGroupIntro,
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

// ── Prosa de NIVEL SECCIÓN/GRUPO (DATA-04 / SC#3) — cierra el hueco del diff per-card ──
//
// El diff per-card de arriba es estructuralmente CIEGO a la prosa que vive fuera de las cards:
// el `section-eyebrow` + el párrafo intro de cada sección-página (gastronomía/arte/arquitectura)
// y los `gastro-intro` de NIVEL GRUPO (Quinto quarto, Ghetto). En la verificación de Fase 2 se
// dejaron caer 8 de estos textos sin que ningún test fallara (02-VERIFICATION gap). Este bloque
// los diffea 1:1 contra los campos YAML (trip.sections.* y food.groupIntro) con las MISMAS reglas
// D-08 (multiset de palabras normalizado + conjunto de enlaces): si falta o se altera cualquiera
// de estos textos de sección, la suite FALLA. Esto no sustituye al diff per-card: lo complementa
// en el plano que aquél no puede ver.
const ROMA_ROOT = join(process.cwd(), 'content', 'trips', 'roma')

/** Compara dos textos por las reglas D-08: multiset de palabras visibles + conjunto de href. */
function diffProse(htmlText: string, yamlText: string) {
  const htmlWords = textMultiset(normalize(htmlText))
  const yamlWords = textMultiset(normalize(yamlText))
  const htmlLinks = yamlLinks({ _: htmlText }) // anclas/URLs embebidas en el texto (si las hubiera)
  const yLinks = yamlLinks({ _: yamlText })
  const deficit = (a: Map<string, number>, b: Map<string, number>): string[] => {
    const out: string[] = []
    for (const [k, n] of a) for (let i = 0; i < n - (b.get(k) ?? 0); i++) out.push(k)
    return out
  }
  return {
    missingWords: deficit(htmlWords, yamlWords),
    extraWords: deficit(yamlWords, htmlWords),
    missingLinks: [...htmlLinks].filter(l => !yLinks.has(l)),
    extraLinks: [...yLinks].filter(l => !htmlLinks.has(l)),
  }
}

function expectEquivalentProse(label: string, htmlText: string, yamlText: string) {
  const d = diffProse(htmlText, yamlText)
  expect(d.missingWords, `texto faltante en ${label}: ${JSON.stringify(d.missingWords)}`).toEqual([])
  expect(d.extraWords, `texto sobrante en ${label}: ${JSON.stringify(d.extraWords)}`).toEqual([])
  expect(d.missingLinks, `enlaces faltantes en ${label}: ${JSON.stringify(d.missingLinks)}`).toEqual([])
  expect(d.extraLinks, `enlaces sobrantes en ${label}: ${JSON.stringify(d.extraLinks)}`).toEqual([])
}

describe('prosa de nivel sección: trip.sections eyebrow/intro ⇄ index.html (DATA-04 / SC#3)', () => {
  const trip = parseYaml(readFileSync(join(ROMA_ROOT, 'trip.yml'), 'utf8')) as {
    sections?: Record<string, { eyebrow?: string, intro?: string } | undefined>
  }

  const SECTIONS = ['gastronomia', 'arte', 'arquitectura'] as const

  it('trip.yml declara las 3 secciones-página con eyebrow + intro', () => {
    for (const id of SECTIONS) {
      const s = trip.sections?.[id]
      expect(s, `falta trip.sections.${id}`).toBeDefined()
      expect(typeof s?.eyebrow, `falta eyebrow en sección ${id}`).toBe('string')
      expect(typeof s?.intro, `falta intro en sección ${id}`).toBe('string')
    }
  })

  for (const id of SECTIONS) {
    it(`${id} — eyebrow equivalente al .section-eyebrow del index.html`, () => {
      const html = extractSectionMeta(id)
      const yaml = trip.sections?.[id]?.eyebrow ?? ''
      expectEquivalentProse(`sección ${id} (eyebrow)`, html.eyebrow, yaml)
    })

    it(`${id} — intro equivalente al párrafo de sección del index.html`, () => {
      const html = extractSectionMeta(id)
      const yaml = trip.sections?.[id]?.intro ?? ''
      expectEquivalentProse(`sección ${id} (intro)`, html.intro, yaml)
    })
  }
})

describe('prosa de nivel grupo: food.groupIntro ⇄ gastro-intro del index.html (DATA-04 / SC#3)', () => {
  // El gastro-intro de cada grupo se ancla a la ficha REPRESENTATIVA del grupo (la primera del
  // grupo en el DOM). Sólo dos grupos tienen intro en el index.html: Quinto quarto y Ghetto.
  const GROUP_INTRO_CARDS = ['g-checchino', 'g-giggetto'] as const

  for (const slug of GROUP_INTRO_CARDS) {
    it(`${slug} — groupIntro presente y equivalente al gastro-intro de su grupo`, () => {
      const card = parseYaml(readFileSync(join(ROMA_ROOT, 'food', `${slug}.yml`), 'utf8')) as {
        group: string
        groupIntro?: string
      }
      expect(typeof card.groupIntro, `falta groupIntro en ${slug}`).toBe('string')
      const htmlIntro = extractGroupIntro(card.group)
      expect(htmlIntro, `el grupo "${card.group}" no tiene gastro-intro en index.html`).not.toBeNull()
      expectEquivalentProse(`groupIntro de ${slug}`, htmlIntro as string, card.groupIntro as string)
    })
  }
})

// ── Fixtures negativos de nivel sección (SIEMPRE corren) — la puerta TIENE DIENTES ──
// Análogo a los fixtures per-card de arriba: prueban que el diff de sección DETECTA una pérdida
// o alteración, sin depender de que el YAML esté bien (si el YAML regresara, los tests de arriba
// fallarían; estos garantizan que el COMPARADOR sí distingue equivalente de no-equivalente).
describe('puerta de fidelidad de sección: detecta pérdidas/alteraciones (fixtures, siempre corren)', () => {
  it('un intro de sección FIEL es equivalente (sin faltantes ni sobrantes)', () => {
    const { intro } = extractSectionMeta('arquitectura')
    const d = diffProse(intro, normalize(intro))
    expect(d.missingWords).toEqual([])
    expect(d.extraWords).toEqual([])
    expect(d.missingLinks).toEqual([])
    expect(d.extraLinks).toEqual([])
  })

  it('si al intro YAML le FALTA una frase → reporta palabras faltantes', () => {
    const { intro } = extractSectionMeta('gastronomia')
    const truncado = normalize(intro).split(' ').slice(0, -5).join(' ')
    const d = diffProse(intro, truncado)
    expect(d.missingWords.length).toBe(5)
  })

  it('si el intro YAML AÑADE texto que no está en el HTML → reporta palabras sobrantes', () => {
    const { intro } = extractSectionMeta('arte')
    const d = diffProse(intro, `${normalize(intro)} palabrainventadaquenoexiste`)
    expect(d.extraWords).toContain('palabrainventadaquenoexiste')
  })

  it('extractGroupIntro devuelve null para un grupo sin gastro-intro (p.ej. Pizza)', () => {
    expect(extractGroupIntro('Pizza')).toBeNull()
  })

  it('extractSectionMeta lanza para una sección inexistente', () => {
    // @ts-expect-error — id fuera del literal: comprobamos el guard en runtime.
    expect(() => extractSectionMeta('no-existe')).toThrow()
  })
})
