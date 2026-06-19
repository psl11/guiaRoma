// Esquema zod del modelo de viaje — FUENTE ÚNICA DE VERDAD.
//
// Este módulo vive en `shared/` (no inline en content.config.ts) PORQUE lo importan DOS
// consumidores que deben compartir exactamente el mismo contrato:
//   1. content.config.ts  → genera los tipos TS + columnas SQL de las 6 colecciones.
//   2. tests/data/*.spec   → la VERDADERA puerta de validación (DATA-05): Content v3 NO
//      valida los `type:'data'` contra zod en build (nuxt/content#3351), así que un test
//      Node-puro ejecuta `Schema.safeParse` por fichero y rompe CI ante un dato inválido.
// Si el esquema viviera en dos sitios, podrían divergir; aquí hay una sola definición.
//
// Derivado 1:1 de index.html (RESEARCH §Code Examples 282-491). Los nombres de campo, enums
// y shapes reproducen lo que las clases CSS de la Fase 1 esperan (paridad).
//
// REGLAS DURAS:
//  - `import { z } from 'zod'` — NUNCA el re-export de '@nuxt/content' (deprecado; CLAUDE.md).
//  - NADA de `.refine()`/`.superRefine()` para cross-refs entre ficheros: se pierden al
//    convertir a JSON-Schema Draft-07 y no ven las otras colecciones. Esas validaciones
//    viven en tests/data/invariants.spec.ts (única capa con visión global).
//  - El ancla estable es `slug` (= id del index.html, = basename del fichero), NUNCA `id`
//    (campo reservado que Content sobrescribe).
import { z } from 'zod'

// ── Sub-esquemas reutilizables (RESEARCH 286-298) ────────────────────────────
export const Coords = z.object({ lat: z.number(), lng: z.number() })
export const Fact = z.object({ label: z.string(), value: z.string() }) // .facts-row
export const Md = z.string() // Markdown-inline (render con <MDC> en Fase 4)
export const Link = z.object({ ref: z.string(), label: Md, note: Md.optional() }) // #id + texto (+nota)

// 19 motifs (CARD_TO_MOTIF, index.html línea 2213, verbatim). Un motif fuera del enum =
// test rojo (DATA-05). Orden = primera aparición en el mapa.
export const Motif = z.enum([
  'dome', 'pantheon', 'arch', 'fountain', 'obelisk', 'statue', 'painting', 'church',
  'fortress', 'temple', 'garden', 'keyhole', 'mask', 'monument', 'rooftops', 'library',
  'tower', 'stairs', 'coffee',
])
export const Pace = z.enum(['all', 'medium', 'slow-only']) // data-pace por fila (DATA-02)
export const PlaceType = z.enum(['card', 'guided', 'concert']) // de places[] (★/♪/romano)

// Sección de prosa (D-01): array ORDENADO {heading libre, body Markdown}. NUNCA campos
// fijos por sección — los encabezados varían por ficha ("Qué es"/"Historia"/"Anécdotas"…).
const Section = z.object({ heading: z.string(), body: Md })

// ── Monument (.card) — RESEARCH 305-327 ──────────────────────────────────────
// Incluye los DOS cross-refs multi-enlace que el sketch previo omitía (Pitfall 2):
// `artists` (→ #art-*) Y `arch` (→ #arq-*). Ambos arrays opcionales de Link.
export const MonumentSchema = z.object({
  slug: z.string(), // 'galleria-sciarra' (= ancla #id = nombre fichero). NO usar `id`.
  trip: z.string(), // 'roma'
  roman: z.string(), // 'I' | '★' | '♪' (card-roman; de places[].n)
  name: z.string(), // 'Galleria Sciarra'
  italian: z.string(), // 'Galleria Sciarra · Rione Trevi' (card-italian)
  day: z.string(), // 'Viernes' | 'Viernes / Sábado' (texto popup; de places[].day)
  coords: Coords, // de places[]
  type: PlaceType, // de places[] (no había clase CSS; solo vivía en el JS `places`)
  motif: Motif, // de CARD_TO_MOTIF (fallback SVG)
  badge: z.string().optional(), // card-badge: 'Sorrentino' | 'Caravaggio' | 'guiado' | …
  artists: z.array(Link).optional(), // card-artists → #art-* (MÚLTIPLES; ej. Bernini+Borromini)
  arch: z.array(Link).optional(), // card-arch → #arq-* (MÚLTIPLES; ej. Renacimiento+Barroco)
  hero: z.object({ src: z.string(), alt: z.string() }), // src = URL de tercero (Wikimedia) → string, NO .url()
  sections: z.array(Section), // D-01: orden EXACTO del DOM; :detail-photo/detail-list embebidos en body (D-02)
  facts: z.array(Fact), // .facts
  mapsQuery: z.string(), // texto del query de .maps-link (Google Maps search)
  sorrentino: z.object({ label: z.string(), text: Md }).optional(), // .sorrentino-box (label + prosa)
  culture: z.array(z.object({ title: z.string(), text: Md })).optional(), // .culture-box (ref-title + prosa)
})

// ── Day (.section del día) — timeline discriminado + cards ordenado (RESEARCH 330-396) ──
export const TransportMode = z.object({ // .tl-transport-mode
  icon: z.string(), // '🚕' '🚆' 'Ⓜ️' '🚶'
  recommended: z.boolean().default(false), // .recommended
  desc: Md, // con <strong>/<em>
  tag: z.string().optional(), // .tl-transport-mode-tag 'recomendado'
  meta: Md.optional(), // .tl-transport-mode-meta '⏱ 45-55 min · 💶 €55'
})
export const FoodEntry = z.object({ // .tl-food-item
  ref: z.string().optional(), // id ficha gastro ('g-roscioli') → ancla
  href: z.string().optional(), // o URL Maps si no hay ficha (cafés sueltos)
  name: z.string(),
  reserved: z.boolean().default(false), // .tl-food-item.reserved
  badge: z.string().optional(), // .tl-resv-badge '✓ reservado 22:30'
  time: z.string().optional(), // .tl-food-time '🚶 3 min'
  desc: Md,
})
// 5 kinds de fila del timeline (DATA-02). `pace` por fila donde aplica.
export const TimelineRow = z.discriminatedUnion('kind', [
  z.object({ // .tl-item
    kind: z.literal('stop'),
    pace: Pace.default('all'),
    time: z.string(),
    title: z.string(),
    ref: z.string().optional(), // a.tl-title href="#id"
    disabled: z.boolean().default(false), // .tl-title.disabled (llegada/check-in)
    reservedEvent: z.boolean().default(false), // .tl-item.reserved-event (cena)
    tag: z.string().optional(), // .tl-tag 'Sorrentino'|'reservado'|'opcional'|…
    note: Md.optional(), // .tl-note
  }),
  z.object({ // .tl-transport [taxi|walk|train]
    kind: z.literal('transport'),
    pace: Pace.default('all'),
    variant: z.enum(['taxi', 'walk', 'train']).optional(),
    header: z.string(),
    modes: z.array(TransportMode),
    footnote: Md.optional(),
  }),
  z.object({ // .tl-meta (sin data-pace → visible salvo en resumen)
    kind: z.literal('meta'),
    items: z.array(z.object({
      level: z.enum(['ok', 'warn', 'plain']).default('plain'), // .tl-meta-item.ok/.warn
      text: Md,
    })),
  }),
  z.object({ // .tl-food
    kind: z.literal('food'),
    pace: Pace.default('all'),
    header: z.string(),
    entries: z.array(FoodEntry),
    footnote: Md.optional(),
  }),
  z.object({ // .tl-resv-meta (banda verde)
    kind: z.literal('reservation'),
    text: Md,
  }),
])
export const DaySchema = z.object({
  slug: z.string(), // 'viernes'
  trip: z.string(),
  order: z.number(), // 1..5
  roman: z.string(), // 'I' (day-number)
  eyebrow: z.string(), // 'venerdì · 19 giugno' (section-eyebrow del día)
  title: z.string(), // 'Centro Storico nocturno'
  subtitle: z.string(), // .day-subtitle
  stats: z.array(z.object({ // .day-stats-item walk|train|taxi
    variant: z.enum(['walk', 'train', 'taxi', 'metro']),
    text: Md,
  })),
  light: z.object({ // .dia-ligera (Versión ligera)
    title: z.string(),
    items: z.array(z.object({
      kind: z.enum(['see', 'move', 'skip', 'rest']), // lg-see/lg-move/lg-skip/lg-rest
      text: Md,
    })),
  }).optional(),
  timeline: z.array(TimelineRow), // ORDEN EXPLÍCITO (DATA-02)
  cards: z.array(z.string()), // ORDEN EXPLÍCITO de ids de monumento (DATA-03) — orden del DOM, no de places
})

// ── Food (.gastro-card) — RESEARCH 402-415 ───────────────────────────────────
// Discreción (D, CONTEXT 55): `group` como CAMPO por ficha (no secciones ordenadas):
// es el texto del gastro-section-title contenedor y ORDENA la sección en render; un
// campo por ficha mantiene "1 fichero = 1 entidad" (D-05) y deja el agrupado al consumidor.
// `groupIntro` (gastro-intro de algunos grupos) opcional. Las 5 cards sin id (Giolitti,
// Venchi, Sant'Eustachio, Pompi, Linari) reciben slug estable en la migración (Wave 2).
export const FoodSchema = z.object({
  slug: z.string(), // 'g-felice'
  trip: z.string(),
  group: z.string(), // gastro-section-title (ORDENA la sección)
  groupIntro: Md.optional(), // gastro-intro de algunos grupos (quinto quarto, ghetto)
  badge: z.string(), // texto libre del badge ('trattoria' | 'quinto quarto' | …)
  badgeKind: z.enum(['trattoria', 'deli', 'quinto', 'ghetto', 'pizza', 'gelato', 'caffe', 'pasticceria']), // clase CSS badge-*
  name: z.string(),
  address: z.string(),
  desc: Md, // gastro-card-desc
  plato: Md.optional(), // gastro-plato 'Plato estrella: …'
  footer: z.string(), // horario + precio (texto del span del footer)
  itineraryTag: z.string().optional(), // gastro-itinerary-tag 'cerca Campo de' Fiori'
  mapsQuery: z.string(), // query del gastro-maps-link
})

// ── Artist + Arquitectura + Glosario unificados por `kind` (D-04) — RESEARCH 419-446 ──
// Discreción (D, RESEARCH 186): el glosario entra como TERCER valor del discriminador
// (`glossary`) → el discriminatedUnion queda exhaustivo. `archLink` (Barroco→#art-bernini)
// va INLINE en el body de la prosa (RESEARCH Open Q 673-676): el invariants.spec escanea
// los (#…) de los campos Md, así que no se modela como campo aparte salvo en arquitectura
// donde el sketch lo dejaba opcional (se conserva opcional para no perder el dato si se extrae).
export const ArtistSchema = z.discriminatedUnion('kind', [
  z.object({ // .artist-card art-*
    kind: z.literal('artist'),
    slug: z.string(), // 'art-bernini'
    trip: z.string(),
    avatar: z.string(), // .artist-avatar 'B'
    name: z.string(),
    dates: z.string(), // 'Nápoles 1598 – Roma 1680 · escultor · arquitecto'
    epithet: z.string(), // .artist-epithet «…»
    sections: z.array(Section), // Quién fue/Su estilo/Obras maestras/… (orden DOM)
    seenIn: z.array(Link), // .artist-trip ✦ 'Lo verás en este viaje' → #monumento
  }),
  z.object({ // .artist-card arq-* (edades)
    kind: z.literal('arquitectura'),
    slug: z.string(), // 'arq-barroco'
    trip: z.string(),
    avatar: z.string(), // 'IV'
    name: z.string(), // 'Barroco'
    dates: z.string(), // 's. XVII · …' (reusa artist-dates)
    epithet: z.string(),
    sections: z.array(Section), // Qué la define/En qué fijarse/Por qué importa
    seenIn: z.array(Link), // ✦ 'Dónde la verás' → #monumento
    archLink: z.array(Link).optional(), // enlaces a #art-* (también escaneados inline en body)
  }),
  z.object({ // .artist-card arq-glosario (especial)
    kind: z.literal('glossary'),
    slug: z.literal('arq-glosario'),
    trip: z.string(),
    avatar: z.string(), // '?'
    name: z.string(), // 'Glosario · leer un edificio'
    dates: z.string(),
    epithet: z.string(),
    terms: z.array(z.object({ term: z.string(), def: Md })), // 10 arch-term: <b>término</b><span>def</span>
  }),
])

// ── Reference — solo reservas + practica (D-03/D-04) — RESEARCH 450-479 ───────
export const ReservasSchema = z.object({
  slug: z.literal('reservas'),
  trip: z.string(),
  order: z.number(),
  title: z.string(),
  eyebrow: z.string(), // section-eyebrow
  intro: Md, // gastro-intro
  confirmed: z.array(z.object({ // reservas-confirmadas (mesas + visitas)
    group: z.enum(['mesas', 'visitas']),
    when: z.string(), // rc-when 'Vie 19 · 22:30'
    text: Md, // resto del <li> con <a>/<em>/<strong>
  })),
  table: z.array(z.object({ // reservas-table 'cuándo reservar'
    ref: z.string().optional(), // a #g-* | #galleria-borghese (algunas filas sin ref)
    name: z.string(), // texto del enlace o título
    badge: z.string(), // reservas-badge texto 'semanas antes'|'✓ reservado · …'|…
    badgeKind: z.enum(['urgent', 'done', 'rec']), // badge-urgent | badge-done | badge-rec
    isDone: z.boolean().default(false), // tr.is-done
    desc: Md, // 2ª celda
  })),
})
export const PracticaSchema = z.object({
  slug: z.literal('practica'),
  trip: z.string(),
  order: z.number(),
  title: z.string(),
  eyebrow: z.string(),
  intro: Md,
  sections: z.array(Section), // h4 + (p | detail-list) → body Markdown
  media: z.array(z.object({ // 'Lecturas y visionados'
    category: z.enum(['libros', 'peliculas', 'series', 'playlist']),
    items: z.array(Md), // cada <li> como Markdown-inline
  })),
})
// Unión por slug discriminado (D-03): 2 ficheros con shapes muy distintos. NO un `blocks`
// genérico. discriminatedUnion('slug') aprovecha que slug es z.literal en ambos.
export const ReferenceSchema = z.discriminatedUnion('slug', [ReservasSchema, PracticaSchema])

// ── Trip — RESEARCH 482-491 ──────────────────────────────────────────────────
export const TripSchema = z.object({
  slug: z.string(), // 'roma'
  title: z.string(), // 'Cinque giorni a Roma' (con <em> en h1)
  decoration: z.string(), // hero-decoration '·  ROMA AETERNA  ·'
  meta: z.string(), // hero-meta '19 — 23 giugno 2026 · Hotel Royal Court'
  quote: z.string(),
  quoteAttr: z.string(), // hero-quote + attr '— FEDERICO FELLINI'
  infoCards: z.array(z.object({ label: z.string(), value: Md })), // info-grid (label + value)
  howTo: z.array(Md), // 'Cómo usar esta guía' (párrafos)
  map: z.object({ center: Coords, zoom: z.number() }), // setView([41.8989,12.477],14)
})

// ── Tipos TS derivados (gratis, una sola fuente de verdad) ────────────────────
export type Monument = z.infer<typeof MonumentSchema>
export type Day = z.infer<typeof DaySchema>
export type Food = z.infer<typeof FoodSchema>
export type Artist = z.infer<typeof ArtistSchema>
export type Reference = z.infer<typeof ReferenceSchema>
export type Trip = z.infer<typeof TripSchema>
