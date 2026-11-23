import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'
import { describe, it, expect } from 'vitest'
import {
  STRUCTURAL_LABELS,
  STRUCTURAL_SECTION_IDS,
  buildTripLayout,
  dayPillLabel,
  inlineMdToPlain,
  type LayoutDayInput,
  type TripPresence,
} from '../../app/utils/tripLayout'

/**
 * Cobertura unitaria del layout puro del viaje (Fase 10, SHAPE-01 / SHAPE-02).
 *
 * `buildTripLayout` es la ÚNICA fuente de la forma de la guía (D-06): con su lista TripView monta
 * las `<section>` de `<main>` y NavPills pinta las pastillas. Aquí se fija:
 *
 *   · D-07: orden fijo — Inicio, Mapa, los días (en el orden recibido), Reservas, Gastronomía,
 *     Pratica, Arte, Arquitectura.
 *   · D-08: presencia solo por datos — Inicio y Mapa siempre; el resto solo si hay datos.
 *   · D-03: la etiqueta de un día es su `pill` si existe y, si no, `dayLabel(eyebrow)`.
 *   · Edge SHAPE-01 empty: 0 días → ninguna entrada de día; 1 día → exactamente una.
 *
 * El caso Roma lee los YAML reales de `content/trips/roma/days/`. La lista esperada de 12 pastillas
 * se COPIA literal (es la de la paridad); nunca se importa nada de `tests/parity/`. Vitest plano:
 * import relativo, sin runtime Nuxt.
 */

const ROMA_DAYS_DIR = join(process.cwd(), 'content', 'trips', 'roma', 'days')

interface RomaDay extends LayoutDayInput {
  order: number
}

function readRomaDays(): RomaDay[] {
  return readdirSync(ROMA_DAYS_DIR)
    .filter(f => f.endsWith('.yml'))
    .map((f) => {
      const raw = parse(readFileSync(join(ROMA_DAYS_DIR, f), 'utf8')) as { slug: string, eyebrow: string, order: number }
      return { slug: raw.slug, eyebrow: raw.eyebrow, order: raw.order }
    })
    .sort((a, b) => a.order - b.order)
}

const EMPTY: Omit<TripPresence, 'days'> = {
  hasReservas: false,
  hasPractica: false,
  foodCount: 0,
  artistKinds: new Set<string>(),
}

const FULL: Omit<TripPresence, 'days'> = {
  hasReservas: true,
  hasPractica: true,
  foodCount: 26,
  artistKinds: new Set(['artist', 'arquitectura', 'glossary']),
}

describe('buildTripLayout — Roma real (D-06/D-07)', () => {
  it('devuelve las 12 pastillas de Roma en el orden bloqueado', () => {
    const layout = buildTripLayout({ ...FULL, days: readRomaDays() })
    expect(layout.map(e => e.label)).toEqual([
      'Inicio', 'Mapa',
      'Venerdì', 'Sabato', 'Domenica', 'Lunedì', 'Martedì',
      'Reservas', 'Gastronomía', 'Pratica', 'Arte', 'Arquitectura',
    ])
    expect(layout.map(e => e.id)).toEqual([
      'inicio', 'mapa',
      'viernes', 'sabado', 'domingo', 'lunes', 'martes',
      'reservas', 'gastronomia', 'practica', 'arte', 'arquitectura',
    ])
  })

  it('las constantes estructurales conservan ids y etiquetas verbatim', () => {
    expect([...STRUCTURAL_SECTION_IDS]).toEqual(['inicio', 'mapa', 'reservas', 'gastronomia', 'practica', 'arte', 'arquitectura'])
    expect(STRUCTURAL_LABELS).toEqual({
      inicio: 'Inicio',
      mapa: 'Mapa',
      reservas: 'Reservas',
      gastronomia: 'Gastronomía',
      practica: 'Pratica',
      arte: 'Arte',
      arquitectura: 'Arquitectura',
    })
  })
})

describe('buildTripLayout — días (SHAPE-01)', () => {
  it('10 días con dos sábados → 10 entradas de día únicas, en el orden dado y con su day', () => {
    const days: LayoutDayInput[] = [
      { slug: 'viernes', eyebrow: 'viernes · 18 de septiembre' },
      { slug: 'sabado-19', eyebrow: 'sábado · 19 de septiembre', pill: 'Sáb 19' },
      { slug: 'domingo', eyebrow: 'domingo · 20 de septiembre' },
      { slug: 'lunes', eyebrow: 'lunes · 21 de septiembre' },
      { slug: 'martes', eyebrow: 'martes · 22 de septiembre' },
      { slug: 'miercoles', eyebrow: 'miércoles · 23 de septiembre' },
      { slug: 'jueves', eyebrow: 'jueves · 24 de septiembre' },
      { slug: 'viernes-25', eyebrow: 'víspera · 25 de septiembre' },
      { slug: 'sabado-26', eyebrow: 'sábado · 26 de septiembre', pill: 'Sáb 26' },
      { slug: 'regreso', eyebrow: 'regreso · 27 de septiembre' },
    ]
    const layout = buildTripLayout({ ...FULL, days })
    const dayEntries = layout.filter(e => e.kind === 'day')
    expect(dayEntries).toHaveLength(10)
    expect(dayEntries.map(e => e.id)).toEqual(days.map(d => d.slug))
    expect(new Set(dayEntries.map(e => e.id)).size).toBe(10)
    expect(new Set(dayEntries.map(e => e.label)).size).toBe(10)
    expect(dayEntries[1]?.label).toBe('Sáb 19')
    expect(dayEntries[8]?.label).toBe('Sáb 26')
    dayEntries.forEach((e, i) => expect(e.day).toBe(days[i]))
  })

  it('0 días → ninguna entrada de día; empieza por Inicio y Mapa (edge SHAPE-01 empty)', () => {
    const layout = buildTripLayout({ ...FULL, days: [] })
    expect(layout.some(e => e.kind === 'day')).toBe(false)
    expect(layout.slice(0, 2).map(e => e.id)).toEqual(['inicio', 'mapa'])
  })

  it('1 día → exactamente una entrada de día, entre Mapa y la siguiente sección presente', () => {
    const layout = buildTripLayout({ ...FULL, days: [{ slug: 'unico', eyebrow: 'lunedì · 1 marzo' }] })
    expect(layout.filter(e => e.kind === 'day')).toHaveLength(1)
    expect(layout.slice(0, 4).map(e => e.id)).toEqual(['inicio', 'mapa', 'unico', 'reservas'])
    expect(layout[2]?.label).toBe('Lunedì')
  })
})

describe('buildTripLayout — presencia por datos (SHAPE-02, D-08)', () => {
  const days: LayoutDayInput[] = [{ slug: 'uno', eyebrow: 'sabato · 1 maggio' }]

  it('sin reservas, práctica, comida ni artistas → solo Inicio, Mapa y los días', () => {
    const layout = buildTripLayout({ ...EMPTY, days })
    expect(layout.map(e => e.id)).toEqual(['inicio', 'mapa', 'uno'])
  })

  it('solo glossary → Arquitectura presente y Arte ausente', () => {
    const ids = buildTripLayout({ ...EMPTY, days, artistKinds: new Set(['glossary']) }).map(e => e.id)
    expect(ids).toContain('arquitectura')
    expect(ids).not.toContain('arte')
  })

  it('solo artist → Arte presente y Arquitectura ausente; foodCount 0 → sin Gastronomía', () => {
    const ids = buildTripLayout({ ...EMPTY, days, artistKinds: new Set(['artist']) }).map(e => e.id)
    expect(ids).toContain('arte')
    expect(ids).not.toContain('arquitectura')
    expect(ids).not.toContain('gastronomia')
  })

  it('cada referencia y la comida activan solo su sección, en el orden D-07', () => {
    expect(buildTripLayout({ ...EMPTY, days, hasReservas: true }).map(e => e.id)).toEqual(['inicio', 'mapa', 'uno', 'reservas'])
    expect(buildTripLayout({ ...EMPTY, days, hasPractica: true }).map(e => e.id)).toEqual(['inicio', 'mapa', 'uno', 'practica'])
    expect(buildTripLayout({ ...EMPTY, days, foodCount: 1 }).map(e => e.id)).toEqual(['inicio', 'mapa', 'uno', 'gastronomia'])
  })
})

describe('dayPillLabel (D-03)', () => {
  it('usa pill si existe', () => {
    expect(dayPillLabel({ slug: 's', eyebrow: 'sabato · 20 giugno', pill: 'Sáb 20' })).toBe('Sáb 20')
  })

  it('con pill null, undefined o vacío cae a dayLabel(eyebrow)', () => {
    expect(dayPillLabel({ slug: 's', eyebrow: 'venerdì · 19 giugno', pill: null })).toBe('Venerdì')
    expect(dayPillLabel({ slug: 's', eyebrow: 'venerdì · 19 giugno', pill: undefined })).toBe('Venerdì')
    expect(dayPillLabel({ slug: 's', eyebrow: 'venerdì · 19 giugno', pill: '' })).toBe('Venerdì')
    expect(dayPillLabel({ slug: 's', eyebrow: 'martedì · 23 giugno' })).toBe('Martedì')
  })
})

describe('inlineMdToPlain (respaldo neutro D-14)', () => {
  it('quita el énfasis de un título', () => {
    expect(inlineMdToPlain('Cinque giorni a _Roma_')).toBe('Cinque giorni a Roma')
    expect(inlineMdToPlain('Dos días de _Prueba_')).toBe('Dos días de Prueba')
  })

  it('quita negritas y enlaces', () => {
    expect(inlineMdToPlain('**Negrita** y [enlace](#x)')).toBe('Negrita y enlace')
  })

  it('deja intacto el texto plano (con trim)', () => {
    expect(inlineMdToPlain('Roma · 19—23 giugno 2026')).toBe('Roma · 19—23 giugno 2026')
    expect(inlineMdToPlain('  hola  ')).toBe('hola')
  })
})
