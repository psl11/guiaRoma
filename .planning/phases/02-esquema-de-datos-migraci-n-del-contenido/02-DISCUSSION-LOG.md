# Phase 2: Esquema de datos + migración del contenido - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-19
**Phase:** 2-Esquema de datos + migración del contenido
**Areas discussed:** Prosa de fichas, Colección reference, Ficheros y cross-refs, Fidelidad 1:1

---

## Prosa de fichas

### Q1 · ¿Cómo modelamos la prosa seccionada de monumentos/artistas?

| Option | Description | Selected |
|--------|-------------|----------|
| Array de secciones {heading, body} | Lista ordenada por ficha; heading libre + body Markdown-inline para <MDC>; preserva orden y encabezados variables 1:1 | ✓ |
| Un bloque Markdown con ### por sección | Toda la prosa en un campo; orden/encabezados dentro del texto; menos estructurado | |
| Campos fijos por sección | Campos nombrados fijos; se rompen porque los encabezados varían entre fichas | |

**User's choice:** Array de secciones {heading, body}

### Q2 · ¿Cómo entran los elementos embebidos (foto de detalle, listas, cajas especiales)?

| Option | Description | Selected |
|--------|-------------|----------|
| Híbrido: prosa MDC + datos fuera del flujo | Listas Markdown nativo + foto-de-detalle como componente MDC inline (posición exacta, reusa fallback→SVG); hero/facts/Maps/sorrentino-box/notas como campos estructurados | ✓ |
| Todo MDC inline | Foto/listas/cajas como componentes MDC dentro del Markdown | |
| Todo campos estructurados | Foto/lista/caja como campos tipados; un solo ImageWithFallback, pero la posición la fija el esquema | |

**User's choice:** Híbrido: prosa MDC + datos fuera del flujo
**Notes:** En "En qué fijarse" la foto va antes de la lista → la foto-de-detalle como MDC inline preserva esa posición exacta.

---

## Colección reference

### Q1 · ¿Qué grado de estructura para `reference` (secciones muy dispares)?

| Option | Description | Selected |
|--------|-------------|----------|
| Bespoke por sección | reservas como datos tipados (bookings + tabla con estado/badges/enlaces); práctica como prosa Markdown/MDC + listas curadas tipadas | ✓ |
| Genérico flexible (bloques) | Un esquema único con array de bloques discriminados (prose/list/table/cardgrid); validación más laxa | |
| Markdown casi-libre | Frontmatter ligero + cuerpo Markdown/MDC; pierde los datos estructurados de reservas | |

**User's choice:** Bespoke por sección
**Notes:** `food` (gastronomía) y `artist` (arte) ya son colecciones propias → `reference` se queda con reservas + práctica.

### Q2 · ¿Dónde vive `arquitectura`?

| Option | Description | Selected |
|--------|-------------|----------|
| En `artist`, unificada con arte | Mismo shape artist-card; discriminador kind: artist\|arquitectura; archLink y seenIn intra-colección; glosario como entrada especial | ✓ |
| En `reference`, sección propia | Separada de arte; duplica el shape de tarjeta y parte archLink entre dos colecciones | |

**User's choice:** En `artist`, unificada con arte
**Notes:** Evidencia del index.html: arquitectura usa el mismo `artist-card` que arte; la edad Barroco enlaza a `#art-bernini`/`#art-borromini` (= el `archLink`).

---

## Ficheros y cross-refs

### Q1 · ¿Granularidad de los ficheros de contenido?

| Option | Description | Selected |
|--------|-------------|----------|
| Un fichero por entidad | trips/roma/monuments/<id>.yml…; diffs por ficha, idiomático Content v3 (1 fichero = 1 documento); ~85 ficheros; encaja con SC#1 | ✓ |
| Un fichero por dominio | monuments.yml con las 38 (~1.500 líneas); pocos ficheros pero PRs/merges pesados; cada fichero = 1 doc con array | |
| Híbrido por tamaño | Grandes por entidad; pequeñas por dominio; dos convenciones a recordar | |

**User's choice:** Un fichero por entidad

### Q2 · ¿Cómo validamos que las cross-refs resuelven?

| Option | Description | Selected |
|--------|-------------|----------|
| Test de invariantes (Vitest) como puerta | zod cubre tipos+enums (rompe build) + test que carga colecciones y verifica ids únicos + resolución de cross-refs en CI; alineado con SC#4 | ✓ |
| Hook de Content en build (afterParse) | Validación en el prerender; más integrado pero acoplado a internals y difícil de testear aislado | |
| Ambos (defensa en profundidad) | zod + invariantes + hook; máxima red pero duplica lógica de resolución | |

**User's choice:** Test de invariantes (Vitest) como puerta

---

## Fidelidad 1:1

### Q1 · ¿Cómo garantizamos la migración 1:1 (sin perder texto ni enlaces)?

| Option | Description | Selected |
|--------|-------------|----------|
| Harness automático extracción + diff | Extrae prosa/enlaces del index.html por id y compara con datos; puede bootstrapear y verificar; repetible, riesgo≈0 | ✓ |
| Revisión manual por ficha | Sin tooling pero alto riesgo de error humano con ~80 fichas; no repetible | |
| Apoyo en el golden visual (Fase 8) | Cero tooling pero compara píxeles de vistas representativas (no las 38 fichas) y llega tarde | |

**User's choice:** Harness automático extracción + diff

### Q2 · ¿Qué cuenta como coincidencia 1:1 para el harness?

| Option | Description | Selected |
|--------|-------------|----------|
| Texto y enlaces equivalentes (normalizado) | Texto visible + conjunto de hrefs coinciden tras normalizar; el markup puede cambiar a Markdown; sin pérdida/adición | ✓ |
| Byte-exacto del texto | Carácter a carácter; frágil, inviable con la conversión a Markdown | |
| Equivalencia visual (vía golden) | Basta que se vea igual; laxo para el texto | |

**User's choice:** Texto y enlaces equivalentes (normalizado)

---

## Claude's Discretion

- Shape exacto del `timeline` del día (unión por `kind` + `pace` por fila + versión ligera `dia-ligera` + `day-stats`).
- Modelado de las agrupaciones de gastronomía (`gastro-section-title`).
- Ubicación de los intros/eyebrows de sección (a nivel trip/colección o por sección).
- Nombres exactos de campos zod, claves del discriminador, y ubicación del script del harness y del test de invariantes.
- Migración del campo `type` (card/guided/concert) desde el array JS `places` al dato del monumento.

## Deferred Ideas

None — la discusión se mantuvo dentro del alcance de la Fase 2.
