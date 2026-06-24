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
  // ORDEN del par .culture-box / .notes-area dentro de la ficha (F8 Plan 06, paridad de orden).
  // El index.html NO es uniforme: la mayoría de las 18 fichas con culture renderiza culture→notes,
  // pero 4 (piazza-navona, campo-fiori, ghetto, laterano) renderiza notes→culture. MonumentCard.vue
  // emite culture→notes por defecto; este campo OPCIONAL invierte ese orden SÓLO en esas 4 fichas.
  // Default ausente = 'culture-first' (orden por defecto del componente). Verificado contra el DOM
  // del index.html por id de ficha (notes-area antes/después de culture-box dentro del mismo <article>).
  boxOrder: z.enum(['culture-first', 'notes-first']).optional(),
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
  stats: z.array(z.object({ // .day-stats-item walk|train|taxi|metro|ticket (CSS 1285-1289)
    variant: z.enum(['walk', 'train', 'taxi', 'metro', 'ticket']),
    text: Md,
  })),
  light: z.object({ // .dia-ligera (Versión ligera)
    title: z.string(),
    items: z.array(z.object({
      kind: z.enum(['see', 'move', 'skip', 'care', 'rest']), // lg-see/lg-move/lg-skip/lg-care/lg-rest (✅🚕⏭️⚠️🪑)
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

// ── ArtistRowSchema — SUPERSET plano SOLO para materializar columnas SQL (D1/D-04-D) ──
// Content v3 NO sabe expandir un `z.discriminatedUnion` a columnas SQL: las colecciones
// unión devuelven el conteo de filas correcto pero TODOS los campos del esquema salen null
// (solo existen las columnas base id/extension/meta/stem/__hash__) → `.where('trip',…)` no
// alcanza nada y #arte/#arquitectura quedan VACÍAS. Este `z.object` PLANO es la unión de
// las 3 ramas Artist (campos comunes + cada campo específico `.optional()`) para que Content
// genere columnas reales. NO es la validación ni el tipo público: la VERDAD estricta sigue
// siendo `ArtistSchema` (discriminatedUnion), que valida los datos en tests/data y tipa
// `Artist`. Se usa EXCLUSIVAMENTE como `schema:` de la colección `artist` en content.config.ts.
export const ArtistRowSchema = z.object({
  // Comunes a las 3 ramas (artist | arquitectura | glossary)
  kind: z.enum(['artist', 'arquitectura', 'glossary']),
  slug: z.string(), // el literal 'arq-glosario' se estrecha en ArtistSchema, no aquí
  trip: z.string(),
  avatar: z.string(),
  name: z.string(),
  dates: z.string(),
  epithet: z.string(),
  // Específicos de rama → opcionales en el superset (los reusa Section/Link verbatim)
  sections: z.array(Section).optional(), // artist | arquitectura
  seenIn: z.array(Link).optional(), // artist | arquitectura
  archLink: z.array(Link).optional(), // solo arquitectura
  terms: z.array(z.object({ term: z.string(), def: Md })).optional(), // solo glossary
})

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
    badge: z.string().optional(), // reservas-badge texto 'semanas antes'|'✓ reservado · …' (la fila "Sin reserva (hacer cola)" no lleva badge)
    badgeKind: z.enum(['urgent', 'done', 'rec']).optional(), // badge-urgent | badge-done | badge-rec (ausente en la fila sin badge)
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

// ── ReferenceRowSchema — SUPERSET plano SOLO para materializar columnas SQL (D1/D-04-D) ──
// Mismo motivo que ArtistRowSchema: Content v3 no materializa `z.discriminatedUnion` a
// columnas (reservas/practica salían con todos los campos null → #reservas/#practica
// vacías). Este `z.object` PLANO une ReservasSchema + PracticaSchema (comunes + específicos
// `.optional()`) para que Content genere columnas reales. La validación estricta y el tipo
// público `Reference` siguen saliendo de `ReferenceSchema` (la unión); este superset se usa
// EXCLUSIVAMENTE como `schema:` de la colección `reference` en content.config.ts.
export const ReferenceRowSchema = z.object({
  // Comunes a reservas + practica
  slug: z.string(), // los literales 'reservas'/'practica' se estrechan en ReferenceSchema
  trip: z.string(),
  order: z.number(),
  title: z.string(),
  eyebrow: z.string(),
  intro: Md,
  // Específicos de reservas → opcionales (shapes verbatim de ReservasSchema)
  confirmed: z.array(z.object({
    group: z.enum(['mesas', 'visitas']),
    when: z.string(),
    text: Md,
  })).optional(),
  table: z.array(z.object({
    ref: z.string().optional(),
    name: z.string(),
    badge: z.string().optional(),
    badgeKind: z.enum(['urgent', 'done', 'rec']).optional(),
    isDone: z.boolean().default(false),
    desc: Md,
  })).optional(),
  // Específicos de practica → opcionales (shapes verbatim de PracticaSchema)
  sections: z.array(Section).optional(),
  media: z.array(z.object({
    category: z.enum(['libros', 'peliculas', 'series', 'playlist']),
    items: z.array(Md),
  })).optional(),
})

// Metadatos editoriales de las secciones-página (gastronomia / arte / arquitectura): el
// `section-eyebrow` + el párrafo introductorio (`gastro-intro` / `art-intro`) que el index.html
// renderiza FUERA de cualquier card (entre el <h2> y la rejilla de fichas). No pertenecen a
// ninguna entidad (monument/food/artist) → viven a nivel `trip`. `eyebrow` es texto plano
// (no enlaces); `intro` es Markdown-inline (la de arquitectura lleva **negritas**). Verbatim
// de index.html (gastronomia 5337/5340, arte 5943/5945, arquitectura 6106/6108).
const SectionMeta = z.object({ eyebrow: z.string(), intro: Md })

// ── Trip — RESEARCH 482-491 ──────────────────────────────────────────────────
export const TripSchema = z.object({
  slug: z.string(), // 'roma'
  title: z.string(), // 'Cinque giorni a Roma' (con <em> en h1)
  decoration: z.string(), // hero-decoration '·  ROMA AETERNA  ·'
  heroMeta: z.string(), // hero-meta '19 — 23 giugno 2026 · Hotel Royal Court' — NO usar 'meta': es nombre RESERVADO de Content v3 (se sobrescribe → '[object Object]', CR-01), igual que 'id'
  quote: z.string(),
  quoteAttr: z.string(), // hero-quote + attr '— FEDERICO FELLINI'
  infoCards: z.array(z.object({ label: z.string(), value: Md })), // info-grid (label + value)
  howTo: z.array(Md), // 'Cómo usar esta guía' (párrafos)
  map: z.object({ center: Coords, zoom: z.number() }), // setView([41.8989,12.477],14)
  // Marcadores extra del mapa SIN ficha propia (D-01): el ÚNICO es el Coliseo (★), que el
  // index.html tenía en `places[]` (línea 6292) pero NO como `.card`. Sin él, derivar los
  // marcadores SOLO de los monumentos daría 38 pines en vez de 39 (regresión de paridad).
  // Reusa `Coords` (:24) y `PlaceType` (:37); NO lleva `slug`/`id` (no hay ficha que anclar).
  mapExtras: z.array(z.object({
    roman: z.string(), // '★' (= places[].n del Coliseo)
    name: z.string(), // 'Coliseo + Foro + Palatino (guiado)'
    day: z.string(), // 'Domingo'
    coords: Coords, // de places[]
    type: PlaceType, // 'guided'
  })).optional(),
  // Eyebrow + intro de las secciones-página, keyed por id de sección (= ancla #gastronomia/
  // #arte/#arquitectura del index.html). Opcional a nivel esquema (un viaje futuro podría no
  // tener estas secciones) pero Roma DEBE poblar las tres (paridad: prosa visible en el HTML).
  sections: z.object({
    gastronomia: SectionMeta.optional(),
    arte: SectionMeta.optional(),
    arquitectura: SectionMeta.optional(),
  }).optional(),
})

// ── Tipos TS derivados (gratis, una sola fuente de verdad) ────────────────────
export type Motif = z.infer<typeof Motif> // los 19 motivos (clave de svgMotifs.ts)
export type Monument = z.infer<typeof MonumentSchema>
export type Day = z.infer<typeof DaySchema>
export type Food = z.infer<typeof FoodSchema>
export type Artist = z.infer<typeof ArtistSchema>
export type Reference = z.infer<typeof ReferenceSchema>
export type Trip = z.infer<typeof TripSchema>
