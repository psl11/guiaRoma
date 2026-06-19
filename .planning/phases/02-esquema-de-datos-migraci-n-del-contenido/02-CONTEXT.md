# Phase 2: Esquema de datos + migración del contenido - Context

**Gathered:** 2026-06-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Definir el **esquema de viaje tipado** (zod en colecciones de Nuxt Content v3) — la raíz de la que derivan búsqueda, ruta del día, mapa, ritmo y fallback — y **migrar todo el contenido de Roma a datos 1:1**, sin perder ni una palabra ni un enlace, con la validación zod actuando como puerta de calidad del build.

Cubre: **DATA-01..DATA-06**.

**Incluye:** las 6 colecciones (`trip`, `day`, `monument`, `food`, `artist`, `reference`) con `type:'data'` + esquema zod; `day.timeline` ordenado (con `kind` + `pace` por fila) y `day.cards: string[]` ordenado; migración de los ≈37 monumentos + ~26 fichas de gastronomía + arte/arquitectura + secciones de referencia (reservas, práctica), con la prosa en Markdown-inline lista para `<MDC>` y cada monumento con su `motif`; la validación que rompe el build + el test de invariantes (ids únicos y cross-refs que resuelven).

**No incluye** (otras fases): componentes/render de las fichas y timeline (Fases 3-4), `useTrip`/layout/tema (Fase 3), modos de ritmo (Fase 4), navegación (Fase 5), búsqueda y ruta del día como features (Fase 6 — aquí solo se entregan los DATOS de los que derivan), mapa/notas/imagen-con-fallback (Fase 7), suite de paridad (Fase 8). Aquí solo se modela y se migra el contenido a datos validados.

</domain>

<decisions>
## Implementation Decisions

### Heredado y BLOQUEADO por el research (no reabrir — ver `.planning/research/STACK.md` y CLAUDE.md)
- **Formato**: híbrido **YAML `type:'data'`** con la prosa como **campos string Markdown-inline** renderizados con `<MDC>`. No Markdown-por-ficha, no JSON crudo a mano.
- **Capa de datos**: **Nuxt Content v3** (`@nuxt/content` 3.14.0) con `defineCollection({ type:'data' })` + esquema **zod 4** (`import { z } from 'zod'`, NO el re-export de `@nuxt/content`).
- **6 colecciones**: `trip`, `day`, `monument`, `food`, `artist`, `reference`; glob `trips/*/…` para multi-viaje (añadir un viaje = añadir ficheros).
- **`day.cards: string[]` ordenado** (DATA-03) es la pieza crítica: de él se reproduce la "ruta del día" (hoy depende del orden del DOM, no del array `places`).
- **`pace` ∈ `all` | `medium` | `slow-only`** (DATA-02). **La validación zod rompe el build** ante dato inválido (DATA-05).

### Área 1 — Modelado de la prosa de las fichas
- **D-01:** La prosa de `monument` y `artist` se modela como **array ordenado de secciones `{ heading, body }`**, con `heading` libre (string) y `body` en **Markdown-inline para `<MDC>`**. Preserva 1:1 el orden y los encabezados variables del original (Qué es / Historia / Anécdotas / En qué fijarse / …), que **cambian de ficha a ficha**. No usar campos fijos por sección (se rompen) ni un único blob Markdown (pierde estructura/consulta).
- **D-02:** Los elementos embebidos se reparten **híbrido**:
  - **Dentro del flujo de prosa** (en el `body` MDC de la sección): las **listas** (`detail-list` → `<ul>`) como Markdown nativo, y la **foto de detalle** (`detail-photo`: img + caption + fallback SVG) como **componente MDC inline** (p.ej. `:detail-photo`) colocado en su **posición exacta** (en "En qué fijarse" la foto va ANTES de la lista) y reusando la lógica de fallback→SVG por `motif`.
  - **Fuera del flujo de prosa** (campos estructurados/tipados de la ficha): `hero` (img + alt), `facts` (filas label/value), enlace a Maps, **cajas especiales** (`sorrentino-box`: label + texto, a nivel de ficha tras el enlace Maps), y `notes` (área de notas, clave = id).

### Área 2 — Colección `reference` (la bandera abierta del research)
- **D-03:** `reference` se modela **bespoke por sección** (cada una con el shape que merece, no un esquema uniforme):
  - **reservas** → **datos tipados**: lista de reservas confirmadas (fecha, hora, sitio, comensales, enlace a ficha opcional, plataforma/fuente) **+ la tabla "cuándo reservar"** como filas tipadas (ref a ficha/nombre, badge de urgencia, **estado `is-done`**, descripción). La UI estiliza estado/badges/enlaces, así que son datos, no prosa.
  - **práctica** → **prosa Markdown/MDC** (manual: secciones h4 + párrafos + `detail-list`) **+ listas curadas tipadas** (libros / películas / series / playlist, con título/autor/año/descripción).
- **D-04:** **`arquitectura` vive en la colección `artist`**, unificada con arte mediante un **discriminador** (p.ej. `kind: 'artist' | 'arquitectura'`). Comparten EXACTAMENTE el shape `artist-card` (avatar, dates, epithet, secciones, "✦ dónde la verás" → `seenIn`). Esto deja `archLink` (arquitectura→artista, p.ej. Barroco→`art-bernini`/`art-borromini`) y `seenIn` (→monumentos) **intra-colección y uniformes**, y reusa un solo componente de render. El **glosario** (`arq-glosario`, lista término→definición `arch-term`) entra como **entrada/sub-shape especial** dentro de `artist`/arquitectura. → `reference` queda SOLO con reservas + práctica.

### Área 3 — Granularidad de ficheros y cross-refs
- **D-05:** **Un fichero por entidad** (zanja el conflicto de docs a favor del SC#1 "un fichero por entidad"):
  - `content/trips/roma/monuments/<id>.yml`, `food/<id>.yml`, `artists/<id>.yml` (una ficha = un fichero).
  - Los pequeños/únicos sueltos: `trip.yml`, `days/<dia>.yml` (5), `reference/<id>.yml` (reservas, practica).
  - ~85 ficheros pequeños → diffs por ficha minúsculos (añadir/editar una ficha = PR pequeño, sin conflictos de merge), e idiomático en Content v3 (1 fichero = 1 documento, consultable individual). El glob por colección los reúne (`trips/*/monuments/*.yml`).
  - **Verificar en research** la mecánica exacta de Content v3 para "1 fichero = 1 documento" por colección con globs anidados.
- **D-06:** Validación en **dos capas**: (1) **zod** valida forma + **enums** (`motif`, `pace`, `type` card/guided/concert, kinds de badge) y **rompe el build**; (2) un **test de invariantes (Vitest)** carga todas las colecciones y verifica **ids únicos** + que **cada cross-ref** (`day.cards[]`, `timeline.ref`, `artist.seenIn`, `archLink`) **resuelve** a una ficha existente. El test corre como **puerta en CI/pre-commit**. (No el hook de Content ni "ambos": evitar acoplamiento y lógica duplicada.) Alineado con SC#4.

### Área 4 — Fidelidad 1:1 de la migración
- **D-07:** **Harness automático de extracción + diff**: un script extrae la prosa y los enlaces del `index.html` **por id de ficha** y los compara (normalizados) contra los datos migrados, reportando texto/enlaces **que falten o sobren**. Puede además **bootstrapear** la migración (`index.html` → borrador YAML) y luego verificarla. Repetible (red contra regresiones). No depender solo de revisión manual ni del golden visual (Fase 8) para el texto.
- **D-08:** **Criterio de aceptación = equivalencia de texto + enlaces NORMALIZADA**: el texto visible y el conjunto de `href` (Maps externos + anclas `#id` internas) deben coincidir tras normalizar (espacios, entidades HTML, `<em>`/`<strong>` ↔ Markdown). El **markup puede cambiar** (HTML→Markdown), pero **no se pierde ni se añade** texto ni enlace. (No byte-exacto: inviable con la conversión a Markdown.)

### Claude's Discretion (research/planner deciden; no requieren al usuario)
- Shape exacto del **`timeline` del día**: unión discriminada por `kind` (`stop`/`transport`/`meta`/`food`/`reservation`) + `pace` por fila + la **"versión ligera"** (`dia-ligera`: lg-see/lg-move/lg-skip/lg-rest) + `day-stats` (walk/train/taxi). Modelarlo fiel a `index.html`.
- Cómo se modelan las **agrupaciones de gastronomía** (`gastro-section-title`, p.ej. "Pasta clásica · trattorias históricas") — campo `group`/`category` por food o secciones ordenadas.
- Dónde viven los **intros y eyebrows** de sección (`gastro-intro`, `art-intro`, `section-eyebrow`) — a nivel `trip`/colección o por sección.
- Nombres exactos de campos zod, claves del discriminador, y ubicación del script del harness (`scripts/` vs `tests/`).
- Migrar el campo **`type`** (card/guided/concert) desde el array JS `places` al dato del monumento (no existe clase CSS; hoy solo vive en JS).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Investigación del proyecto (decisiones de stack YA tomadas — leer ANTES de planificar)
- `.planning/research/STACK.md` — stack y versiones verificadas: Nuxt Content v3 (`type:'data'` YAML + `<MDC>`), zod 4 (`import { z } from 'zod'`), colecciones, MiniSearch, etc. Base de todo el modelado de la Fase 2.
- `.planning/research/SUMMARY.md` — síntesis + BUILD ORDER (por qué los datos van antes que página/render/derivados).
- `.planning/research/FEATURES.md` — mapeo de features → de qué datos derivan (búsqueda, ruta del día, ritmo, mapa, fallback). Clave para no olvidar campos que fases 4-7 necesitan.
- `.planning/research/ARCHITECTURE.md` — estructura de directorios (`content/` en raíz, `srcDir=app/`).
- `.planning/research/PITFALLS.md` — trampas (incluye contexto Content v3 / MDC).
- `CLAUDE.md` (raíz) — §"Formato de contenido", §"Capa de datos", §"Stack Patterns by Variant" (partición por dominio vs lo decidido aquí en D-05) y §"What NOT to Use".

### Planificación
- `.planning/PROJECT.md` — visión, Core Value (paridad 100%), constraints, Key Decisions.
- `.planning/REQUIREMENTS.md` — DATA-01..DATA-06 (esta fase) y dependencias (FEAT-03/09 ruta-día/búsqueda en Fase 6, FEAT-02/UI-05 mapa/fallback en Fase 7) que consumen estos datos.
- `.planning/ROADMAP.md` §Phase 2 — objetivo y los 4 success criteria (especialmente SC#1 fichero-por-entidad, SC#2 timeline+cards, SC#4 validación rompe build + invariantes).
- `.planning/phases/01-andamiaje-golden-de-paridad/01-CONTEXT.md` — patrones establecidos de la Fase 1: claves localStorage (`roma-note-*`, etc.), CSS verbatim como fuente del look, scaffold.

### Código actual (FUENTE DE VERDAD de la migración / golden)
- `index.html` — la guía actual; **fuente 1:1 de la migración**. Mapa de líneas:
  - CSS 14-2210 · librería SVG 2211-2253 (`SVG_MOTIFS` línea **2212**, `CARD_TO_MOTIF` línea **2213** — 19 motifs, 38 ids).
  - Array JS **`places` 6269-6314** (id · `n` romano · name · `day` · lat · lng · `type` card/guided/concert) — único origen de coords, nº romano y type.
  - Monumentos (`<article class="card" id>`): viernes §2375, sábado §2840, domingo §3445, lunes §4002, martes §4736; fichas de `galleria-sciarra` (2450) a `angeli` (5199). Ficha-ejemplo completa: 2450-2510.
  - Timeline por día dentro de cada `<section>` (ej. viernes 2403-2446): `tl-item`/`tl-transport`/`tl-meta`/`tl-food`/`reserved-event`, cada fila con `data-pace`.
  - reservas §**5260** (reservas-confirmadas + reservas-table) · gastronomía §**5335** (gastro-cards desde 5346, agrupadas por `gastro-section-title`) · práctica §**5825** (manual + libros/pelis/series) · arte §**5941** (`artist-card` `art-*`, ej. `art-bernini` 5948) · arquitectura §**6104** (`arq-*` 6111-6199 + glosario `arq-glosario` 6202).
  - JS de app 6251-6663 (búsqueda DOM, ruta del día, ritmo — referencia de la LÓGICA que Fases 4/6 re-derivarán de estos datos).
- `content.config.ts` (raíz) — **stub de Fase 1** (`collections: {}`); aquí se reemplaza por las 6 colecciones zod.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`index.html`** es el dataset a migrar (ver mapa de líneas arriba). **`SVG_MOTIFS` + `CARD_TO_MOTIF`** (líneas 2212-2213) son datos portables verbatim: el `motif` por monumento sale de `CARD_TO_MOTIF` (zod `enum` de los 19 motifs: dome, pantheon, arch, fountain, obelisk, statue, painting, church, fortress, temple, garden, keyhole, mask, monument, rooftops, library, tower, stairs, coffee).
- **`content.config.ts`** stub listo para rellenar; el módulo `@nuxt/content` ya está registrado en `nuxt.config.ts` (Fase 1).
- **Clases CSS de Fase 1** (card / gastro-card / artist-card / timeline / reservas / arch-glossary, ya verbatim en `app/assets/css/`) — definen la forma que los DATOS deben poder reproducir; útiles como checklist de campos.

### Established Patterns (modelo de datos observado — guía para el esquema zod)
- **`monument`** (38, `class="card"`): header (nº romano `n`, nombre, subtítulo italiano, `badge` opcional) · `hero` (img externa + `onerror`→fallback motif) · **secciones ordenadas** {heading h4, body} con `detail-photo`/`detail-list` embebidos · `facts` (filas label/value) · enlace Maps · `sorrentino-box` opcional · notas (clave=id). `type` (card/guided/concert) y coords vienen de `places`. **`pantheon` tiene `day: 'Viernes / Sábado'`** → un monumento puede aparecer en varios días; el orden por día lo fija `day.cards[]`.
- **`day`** (5): eyebrow, header (número, título, subtítulo), `day-stats`, `dia-ligera` (versión ligera), **`timeline`** (filas ordenadas, unión por `kind`, `pace` por fila, refs a monumento/food por id), **`cards: string[]`** (ids de monumento en orden).
- **`food`** (~26, `gastro-card`): `badge` (kind), nombre, dirección, `desc`, `gastro-plato` (plato estrella), footer (horario+precio, `itinerary-tag`, Maps). Agrupadas por `gastro-section-title`.
- **`artist`** (arte `art-*` + arquitectura `arq-*`): head (avatar, nombre, dates, epithet) · secciones {h4, p/ul} · `seenIn` ("✦ dónde la verás"→monumentos). arquitectura añade glosario (`arch-term` término→def) y `archLink`→artista.
- **`reference`** (reservas, práctica): reservas = bookings + tabla con estado/badges/links; práctica = prosa + listas curadas.
- **Cross-refs a validar (test de invariantes):** `day.cards[]`→monument · `timeline.ref`→monument|food · `artist.seenIn`→monument · `archLink`→artist. **Ids estables = los del `index.html`** (`#id` de anclas) para que los enlaces internos de la prosa sigan resolviendo.

### Integration Points
- `content.config.ts` — define las 6 colecciones (`defineCollection({ type:'data', source, schema })`).
- `content/trips/roma/**` — los ficheros YAML migrados (un fichero por entidad, D-05).
- **Consumidores aguas abajo** (no en esta fase, pero el esquema debe servirles): `useTrip(slug)` (Fase 3) agrega/inyecta; búsqueda MiniSearch + ruta del día (Fase 6) derivan de estos datos; mapa + imagen-con-fallback (Fase 7) usan coords/type/motif/hero.
- **Test de invariantes** (Vitest, vía `@nuxt/test-utils`) — ubicación a fijar (`tests/`), corre en CI/pre-commit.
- **Harness de migración 1:1** (D-07/D-08) — script de extracción+diff (ubicación a fijar, `scripts/` o `tests/`).
- **Componentes MDC** (`:detail-photo` y la intercepción de `a[href^="#"]`) se registran/implementan en Fases 4/5; aquí solo se decide que la prosa los habilita (la prosa se escribe MDC-ready).

</code_context>

<specifics>
## Specific Ideas

- **Ids = los del `index.html`** (anclas `#galleria-sciarra`, `#g-fortunata`, `#art-bernini`, `#arq-barroco`, …): obligatorio preservarlos para que los enlaces internos de la prosa (`[texto](#id)`) sigan resolviendo y para el golden/paridad.
- **`type` del monumento**: `card` | `guided` (Vaticano, Coliseo) | `concert` (Auditorium) — hoy SOLO en el array JS `places`; migrarlo al dato (lo usa el mapa para los marcadores `★`/`♪`/romano).
- **`pace`** literal `all` | `medium` | `slow-only` (matriz exacta la aplica Fase 4: `slow-only` solo en optimista, `medium` oculto solo en lento).
- **Multi-viaje**: estructura `content/trips/<slug>/…`; Roma es `trips/roma/`. Añadir Florencia = `trips/florencia/` con los mismos ficheros (cero cambios de código).
- El **glosario de arquitectura** y la **tabla de reservas** son los dos puntos donde "datos vs prosa" se inclina a datos estructurados (tienen estructura tabular/término-definición que la UI estiliza).

</specifics>

<deferred>
## Deferred Ideas

None — la discusión se mantuvo dentro del alcance de la Fase 2. (Los diferidos de producto — backend/PWA/segundo viaje real — siguen en `.planning/STATE.md` ▸ Deferred Items y `REQUIREMENTS.md` ▸ v2.)

</deferred>

---

*Phase: 2-Esquema de datos + migración del contenido*
*Context gathered: 2026-06-19*
