import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { gunzipSync } from 'node:zlib'
import { NEW_CLASSES, htmlClassTokens } from '../unit/cssSelectors'

/**
 * Centinela de build: la página estática de Roma no lleva nada de los viajes de desarrollo
 * (Fase 9: `prueba`; Fase 10: `forma`).
 *
 *  - D-13 (Fase 11): Roma vive en su ruta de viaje, `.output/public/trips/roma/index.html` (con su
 *    `_payload.json` al lado); «/» pasará a ser la portada. Los ficheros `index.html` y
 *    `_payload.json` de abajo son SIEMPRE los de `trips/roma/`.
 *  - D-02: el viaje ficticio `prueba` es solo de dev. No se prerenderiza (no existe
 *    `.output/public/trips/prueba`) ni se cuela en la página de Roma: el centinela
 *    `PRUEBA-CENTINELA-9F3`, que solo vive en `content/trips/prueba/` (howTo de `trip.yml` y la
 *    ficha `fontana-pruebas`), no puede aparecer en `index.html` ni en `_payload.json`.
 *  - D-15 (Fase 10): el viaje ficticio `forma` también es solo de dev. Su centinela
 *    `FORMA-CENTINELA-10A` (howTo de `content/trips/forma/trip.yml`) tampoco puede aparecer en
 *    `index.html` ni en `_payload.json`. Un `it` FUERA del `skipIf` comprueba que el centinela
 *    sigue en el trip.yml de forma, para que la ausencia en la build nunca se afirme en vacío.
 *  - CR-01 (cerrado en la Fase 11, D-16/D-17): `prueba` y `forma` llevan `draft: true` en su
 *    trip.yml y content.config.ts los excluye de las 6 colecciones fuera de `nuxi dev`, así que
 *    la build de producción no lleva ni una fila suya. Hay que comprobarlo DECODIFICANDO cada
 *    `__nuxt_content/<colección>/sql_dump.txt`: es base64(gzip(JSON con el SQL)), de modo que un
 *    grep plano sobre `.output/public` no encuentra los centinelas ni cuando SÍ están (falso
 *    negativo). El recorrido de abajo decodifica los dumps y lee el resto como `latin1`; un
 *    control positivo (Roma SÍ está en los dumps) impide que la ausencia se afirme en vacío.
 *  - D-08: las claves `useState` van sufijadas por viaje y son visibles en claro en el payload
 *    `__NUXT_DATA__` de `trips/roma/index.html` (`"$space:roma"`, `"$scardNav:stack:roma"`,
 *    `"$ssearch:query:roma"`). Una clave sin sufijo (`"$space"`) indicaría estado global
 *    compartido entre viajes.
 *
 * Fase 12 (formas nuevas de viaje):
 *  - D-16: `campania` fue el tercer borrador de la Fase 12. Desde la Fase 13 (D-02) está
 *    PUBLICADO: su trip.yml ya no lleva `draft` y ningún YAML de `content/trips/campania/` lleva
 *    la marca de control `CAMPANIA-CENTINELA-12A` (un `it` FUERA del `skipIf` lo comprueba sobre
 *    la fuente, que es lo único que podría volver a meterla en la build; por eso ya no está en el
 *    escaneo de ficheros publicados, 13-REVIEW IN-06). `trips/campania/index.html` y su
 *    `_payload.json` existen con contenido real («Baia di Sorgeto») y los dumps `trip` y
 *    `monument` lo llevan. El aislamiento de borradores sigue sin ser vacuo gracias a prueba y
 *    forma (sus centinelas fuera del `skipIf` y «no existen trips/prueba ni trips/forma»).
 *  - D-17 (mitad de build del guardián de tripshapes.css; la mitad estática es
 *    tests/unit/tripShapesCss.spec.ts): ningún token de `NEW_CLASSES` aparece como clase en el
 *    HTML publicado de Roma ni de la portada. Se recorre todo el `*.html` de .output/public salvo
 *    el que cuelga de `trips/<slug>/` de otro viaje (cuando la Fase 13 publique Campania, su HTML
 *    no cuenta). Control positivo: Roma sí lleva `tl-transport` y `day-stats-item`.
 *
 * Corre dentro de `pnpm verify` porque `generate` va antes de `test:data`, así que lee la build
 * recién generada desde cachés limpias. Node puro (`node:fs`), sin runtime Nuxt.
 *
 * Sin build (`.output/public/index.html` ausente, p. ej. un `vitest run tests/data` suelto) los
 * describe se SALTAN en vez de fallar en falso. Con build, el bloque de Roma NO se salta aunque
 * falte su página: su primer `it` afirma que existe `trips/roma/index.html` (D-17, vacuidad), así
 * que una build sin Roma FALLA. La aserción de «Galleria Sciarra» evita que el spec pase en vacío
 * sobre una build que no renderice Roma en `trips/roma/`.
 */

const OUT = join(process.cwd(), '.output', 'public')
const INDEX = join(OUT, 'trips', 'roma', 'index.html')
const PAYLOAD = join(OUT, 'trips', 'roma', '_payload.json')
const SENTINEL = 'PRUEBA-CENTINELA-9F3'
const FORMA_SENTINEL = 'FORMA-CENTINELA-10A'
const FORMA_TRIP = join(process.cwd(), 'content', 'trips', 'forma', 'trip.yml')
const PRUEBA_TRIP = join(process.cwd(), 'content', 'trips', 'prueba', 'trip.yml')
const CAMPANIA_SENTINEL = 'CAMPANIA-CENTINELA-12A'
const CAMPANIA_DIR = join(process.cwd(), 'content', 'trips', 'campania')
const CAMPANIA_TRIP = join(CAMPANIA_DIR, 'trip.yml')
const CAMPANIA_INDEX = join(OUT, 'trips', 'campania', 'index.html')
const CAMPANIA_PAYLOAD = join(OUT, 'trips', 'campania', '_payload.json')
const BUILD_INDEX = join(OUT, 'index.html')
const COLLECTIONS = ['trip', 'day', 'monument', 'food', 'artist', 'reference'] as const
const dumpPath = (col: string) => join(OUT, '__nuxt_content', col, 'sql_dump.txt')

/** `sql_dump.txt` = base64(gzip(JSON)); devuelve el JSON en claro. */
const decodeDump = (txt: string) => gunzipSync(Buffer.from(txt, 'base64')).toString('utf8')

/** Texto de cada fichero publicado: los `sql_dump.txt` decodificados, el resto en `latin1`. */
function publishedTexts(dir: string = OUT): Array<{ file: string, text: string }> {
  const out: Array<{ file: string, text: string }> = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...publishedTexts(full))
    }
    else if (entry.isFile()) {
      const text = entry.name === 'sql_dump.txt'
        ? decodeDump(readFileSync(full, 'utf8'))
        : readFileSync(full, 'latin1')
      out.push({ file: relative(OUT, full), text })
    }
  }
  return out
}

// Fuera del skipIf: corre siempre (con o sin build) para que el centinela de forma no pueda
// desaparecer del contenido y dejar vacua la aserción de ausencia de abajo.
describe('centinela del viaje forma (D-15)', () => {
  it(`content/trips/forma/trip.yml contiene ${FORMA_SENTINEL}`, () => {
    expect(readFileSync(FORMA_TRIP, 'utf8')).toContain(FORMA_SENTINEL)
  })
})

// Gemelo del de forma, también FUERA del skipIf (D-16): el centinela de prueba tiene que seguir
// en su trip.yml para que su ausencia en la build no se afirme en vacío.
describe('centinela del viaje prueba (D-16)', () => {
  it(`content/trips/prueba/trip.yml contiene ${SENTINEL}`, () => {
    expect(readFileSync(PRUEBA_TRIP, 'utf8')).toContain(SENTINEL)
  })
})

/** Rutas de todos los `*.yml` bajo `dir`, recursivo. */
function ymlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return ymlFiles(full)
    return entry.isFile() && entry.name.endsWith('.yml') ? [full] : []
  })
}

// Campania publicada (Fase 13, D-02), también FUERA del skipIf: su trip.yml ya no lleva
// `draft: true`, así que se prerenderiza y la portada la lista, y ningún YAML suyo lleva la marca
// de control de la Fase 12. Mirar la fuente basta: la build solo publica lo que hay en ella.
describe('campania publicada (D-02, Fase 13)', () => {
  it('content/trips/campania/trip.yml no lleva draft: true', () => {
    expect(readFileSync(CAMPANIA_TRIP, 'utf8')).not.toMatch(/^draft: true$/m)
  })

  it(`ningún YAML de content/trips/campania contiene ${CAMPANIA_SENTINEL}`, () => {
    const files = ymlFiles(CAMPANIA_DIR)
    expect(files, 'trip.yml está en el recorrido (no es vacuo)').toContain(CAMPANIA_TRIP)
    const offenders = files.filter(f => readFileSync(f, 'utf8').includes(CAMPANIA_SENTINEL)).map(f => relative(process.cwd(), f))
    expect(offenders).toEqual([])
  })
})

describe.skipIf(!existsSync(BUILD_INDEX))('build estática: Roma sin datos de prueba ni de forma (D-02, D-08, D-13, D-15)', () => {
  const html = () => readFileSync(INDEX, 'utf8')

  it('existe trips/roma/index.html: Roma se prerenderiza en su URL (D-13)', () => {
    expect(existsSync(INDEX), '.output/public/trips/roma/index.html debe existir').toBe(true)
  })

  it('trips/roma/index.html es la guía de Roma (contiene «Galleria Sciarra»; el spec no es vacuo)', () => {
    expect(html()).toContain('Galleria Sciarra')
  })

  it(`el centinela ${SENTINEL} no aparece en index.html ni en _payload.json`, () => {
    expect(html(), 'index.html lleva datos del viaje prueba').not.toContain(SENTINEL)
    if (existsSync(PAYLOAD)) {
      expect(readFileSync(PAYLOAD, 'utf8'), '_payload.json lleva datos del viaje prueba').not.toContain(SENTINEL)
    }
  })

  it(`el centinela ${FORMA_SENTINEL} no aparece en index.html ni en _payload.json`, () => {
    expect(html(), 'index.html lleva datos del viaje forma').not.toContain(FORMA_SENTINEL)
    if (existsSync(PAYLOAD)) {
      expect(readFileSync(PAYLOAD, 'utf8'), '_payload.json lleva datos del viaje forma').not.toContain(FORMA_SENTINEL)
    }
  })

  it('no existen trips/prueba ni trips/forma: los borradores no se prerenderizan (D-17)', () => {
    expect(existsSync(join(OUT, 'trips', 'prueba')), '.output/public/trips/prueba NO debe existir').toBe(false)
    expect(existsSync(join(OUT, 'trips', 'forma')), '.output/public/trips/forma NO debe existir').toBe(false)
  })

  it('existe trips/campania/index.html y es la guía de Campania (contiene «Baia di Sorgeto»; D-02, Fase 13)', () => {
    expect(existsSync(CAMPANIA_INDEX), '.output/public/trips/campania/index.html debe existir').toBe(true)
    expect(readFileSync(CAMPANIA_INDEX, 'utf8')).toContain('Baia di Sorgeto')
  })

  it('existe trips/campania/_payload.json con contenido real: los datos viajan prerenderizados (D-02, D-18)', () => {
    expect(existsSync(CAMPANIA_PAYLOAD), '.output/public/trips/campania/_payload.json debe existir').toBe(true)
    expect(readFileSync(CAMPANIA_PAYLOAD, 'utf8')).toContain('Baia di Sorgeto')
  })

  it('el payload usa claves de estado sufijadas por viaje y ninguna "$space" global', () => {
    const page = html()
    for (const key of ['"$space:roma"', '"$scardNav:stack:roma"', '"$ssearch:query:roma"']) {
      expect(page, `falta la clave de estado ${key}`).toContain(key)
    }
    expect(page, 'clave de estado sin sufijo de viaje "$space"').not.toContain('"$space"')
  })
})

describe.skipIf(!existsSync(BUILD_INDEX))('build estática: ningún fichero publicado lleva datos de un borrador (D-16, D-17)', () => {
  it('existen los sql_dump de las 6 colecciones (trip, day, monument, food, artist, reference)', () => {
    for (const col of COLLECTIONS) {
      expect(existsSync(dumpPath(col)), `falta __nuxt_content/${col}/sql_dump.txt`).toBe(true)
    }
  })

  it('control positivo: los dumps decodificados llevan Roma y Campania, ya publicada (el escaneo no es vacuo)', () => {
    const monument = decodeDump(readFileSync(dumpPath('monument'), 'utf8'))
    const trip = decodeDump(readFileSync(dumpPath('trip'), 'utf8'))
    expect(monument).toContain('Galleria Sciarra')
    expect(trip).toContain('trips/roma/')
    expect(trip, 'el dump trip lleva Campania (D-02, Fase 13)').toContain('trips/campania/')
    expect(monument, 'el dump monument lleva las fichas de Campania (D-02, Fase 13)').toContain('Baia di Sorgeto')
  })

  it(`ningún fichero de .output/public contiene ${SENTINEL} ni ${FORMA_SENTINEL} (dumps decodificados)`, () => {
    // Lista de culpables (fichero + centinela) en vez de un expect por fichero: el diff de un
    // dump decodificado entero sería ilegible; así el fallo nombra directamente cada fichero.
    // Solo los borradores vivos: la marca de Campania ya no existe en la fuente (lo vigila el
    // `it` de arriba, fuera del skipIf), así que buscarla en la build no guardaba nada.
    const offenders = publishedTexts().flatMap(({ file, text }) =>
      [SENTINEL, FORMA_SENTINEL].filter(s => text.includes(s)).map(s => `${file} lleva ${s}`))
    expect(offenders, 'ficheros publicados con datos de un borrador').toEqual([])
  })
})

/** Ficheros `*.html` de .output/public (rutas POSIX relativas), salvo los de `trips/<slug>/` de otros viajes. */
function publishedHtmlOutsideOtherTrips(dir: string = OUT): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...publishedHtmlOutsideOtherTrips(full))
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(relative(OUT, full).split(sep).join('/'))
  }
  return out.filter((f) => {
    const m = /^trips\/([^/]+)\//.exec(f)
    return m === null || m[1] === 'roma'
  })
}

describe.skipIf(!existsSync(BUILD_INDEX))('D-17: ninguna clase de tripshapes.css en el HTML publicado de Roma ni de la portada (Fase 12)', () => {
  const files = () => publishedHtmlOutsideOtherTrips()

  it('el escaneo incluye la portada (index.html) y Roma (trips/roma/index.html)', () => {
    expect(files()).toEqual(expect.arrayContaining(['index.html', 'trips/roma/index.html']))
  })

  it('control positivo: Roma lleva las clases tl-transport y day-stats-item (el escaneo no es vacuo)', () => {
    const tokens = new Set(htmlClassTokens(readFileSync(INDEX, 'utf8')))
    expect(tokens.has('tl-transport'), 'Roma sin tl-transport').toBe(true)
    expect(tokens.has('day-stats-item'), 'Roma sin day-stats-item').toBe(true)
  })

  it('ningún token de NEW_CLASSES aparece como clase en ese HTML', () => {
    const banned = new Set<string>(NEW_CLASSES)
    // Lista de culpables `fichero: clase` (una por pareja), esperada vacía.
    const offenders = files().flatMap((file) => {
      const found = new Set(htmlClassTokens(readFileSync(join(OUT, file), 'utf8')).filter(c => banned.has(c)))
      return [...found].map(c => `${file}: ${c}`)
    })
    expect(offenders, 'clases nuevas (Fase 12) en el HTML publicado de Roma o de la portada').toEqual([])
  })
})
