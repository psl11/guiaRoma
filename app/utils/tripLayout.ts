/**
 * Layout puro del viaje — la FORMA de la guía sale de los datos (Fase 10, SHAPE-01 / SHAPE-02).
 *
 * D-06 — una sola lista: `buildTripLayout` devuelve las entradas ordenadas `{ id, kind, label, day? }`.
 * TripView la calcula UNA vez y con ESA MISMA lista monta las `<section>` de `<main>` y se la pasa a
 * Topbar → NavPills para las pastillas; la puerta de datos (tests/data) la reutiliza para validar
 * anclas y pastillas. Nunca hay dos listas de secciones que puedan desincronizarse.
 *
 * D-07 — orden fijo para todo viaje: Inicio, Mapa, los días (en el orden recibido, que useTrip ya
 * ordena por `order`), Reservas, Gastronomía, Práctica, Arte, Arquitectura. No existe ningún campo
 * para reordenar.
 *
 * D-08 — presencia solo por datos (sin lista de secciones en trip.yml): Inicio y Mapa siempre;
 * Reservas si existe la referencia `reservas`; Gastronomía si hay al menos una ficha de comida;
 * Práctica si existe la referencia `practica`; Arte si hay algún artista `kind: artist`;
 * Arquitectura si hay `kind: arquitectura` o `glossary`. Una sección ausente no tiene ni
 * `<section>` ni pastilla.
 *
 * D-09 — las etiquetas estructurales son chrome compartido verbatim, no configurable por viaje
 * (grafías del index.html, incluida la italiana «Pratica», sin tilde).
 *
 * D-03 — la etiqueta de la pastilla de un día es su `pill` si existe y no está vacío y, si no,
 * `dayLabel(eyebrow)`. En runtime Content entrega `null` para opcionales ausentes, así que
 * `null`/`undefined`/`''` se tratan igual (ausente).
 *
 * PURO: sin imports de Nuxt ni alias de valor. El único import de valor es el relativo `./dayLabel`,
 * porque este módulo también lo importa Vitest plano (sin alias) desde tests/unit y tests/data.
 */
import { dayLabel } from './dayLabel'

/** Ids de las secciones estructurales, en el orden D-07 (los días van entre `mapa` y `reservas`). */
export const STRUCTURAL_SECTION_IDS = ['inicio', 'mapa', 'reservas', 'gastronomia', 'practica', 'arte', 'arquitectura'] as const

export type StructuralSectionId = typeof STRUCTURAL_SECTION_IDS[number]

/** Etiquetas verbatim de las pastillas estructurales (D-09). */
export const STRUCTURAL_LABELS: Readonly<Record<StructuralSectionId, string>> = {
  inicio: 'Inicio',
  mapa: 'Mapa',
  reservas: 'Reservas',
  gastronomia: 'Gastronomía',
  practica: 'Pratica',
  arte: 'Arte',
  arquitectura: 'Arquitectura',
}

export type SectionKind = StructuralSectionId | 'day'

/** Lo mínimo que el layout necesita de un día. */
export interface LayoutDayInput {
  slug: string
  eyebrow: string
  pill?: string | null
}

/** Presencia ya calculada a partir de los datos del viaje (D-08). */
export interface TripPresence<D extends LayoutDayInput = LayoutDayInput> {
  /** YA ordenados por `order` (useTrip consulta con `.order('order', 'ASC')`). */
  days: readonly D[]
  hasReservas: boolean
  hasPractica: boolean
  foodCount: number
  /** Kinds de artista presentes: `artist` | `arquitectura` | `glossary`. */
  artistKinds: ReadonlySet<string>
}

export interface LayoutEntry<D extends LayoutDayInput = LayoutDayInput> {
  id: string
  kind: SectionKind
  label: string
  /** Solo en las entradas `kind: 'day'`. */
  day?: D
}

/** Etiqueta de la pastilla de un día (D-03): `pill` si es un string no vacío; si no, `dayLabel(eyebrow)`. */
export function dayPillLabel(d: LayoutDayInput): string {
  return typeof d.pill === 'string' && d.pill.length > 0 ? d.pill : dayLabel(d.eyebrow)
}

function structural<D extends LayoutDayInput>(id: StructuralSectionId): LayoutEntry<D> {
  return { id, kind: id, label: STRUCTURAL_LABELS[id] }
}

/** Lista ordenada de secciones/pastillas del viaje (D-06, D-07, D-08). No reordena los días. */
export function buildTripLayout<D extends LayoutDayInput>(p: TripPresence<D>): LayoutEntry<D>[] {
  const out: LayoutEntry<D>[] = [structural<D>('inicio'), structural<D>('mapa')]
  for (const d of p.days) out.push({ id: d.slug, kind: 'day', label: dayPillLabel(d), day: d })
  if (p.hasReservas) out.push(structural<D>('reservas'))
  if (p.foodCount > 0) out.push(structural<D>('gastronomia'))
  if (p.hasPractica) out.push(structural<D>('practica'))
  if (p.artistKinds.has('artist')) out.push(structural<D>('arte'))
  if (p.artistKinds.has('arquitectura') || p.artistKinds.has('glossary')) out.push(structural<D>('arquitectura'))
  return out
}

/**
 * Markdown-inline → texto plano: quita enlaces (`[t](x)` → `t`) y énfasis `**`/`__`/`*`/`_`, y hace
 * trim. `Cinque giorni a _Roma_` → `Cinque giorni a Roma` (respaldo neutro D-14).
 */
export function inlineMdToPlain(md: string): string {
  return md
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|\*|_)(.+?)\1/g, '$2')
    .trim()
}
