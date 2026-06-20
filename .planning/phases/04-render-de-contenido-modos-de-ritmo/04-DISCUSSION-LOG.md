# Phase 4: Render de contenido + modos de ritmo - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-20
**Phase:** 4-Render de contenido + modos de ritmo
**Areas discussed:** Frontera imágenes/notas, Mecanismo de los 3 modos, Verificación de paridad F4, Granularidad de componentes

---

## Frontera de imágenes/notas (F4 ↔ F7)

### Imágenes (hero + detail-photo)

| Option | Description | Selected |
|--------|-------------|----------|
| Plano ahora, fallback en F7 | `<img>` con src/alt/loading exactos, sin `@error`→SVG; el fallback por motif (UI-05) y modos hero/detail llegan en F7. Respeta el roadmap; con imagen cargada se ve igual que hoy; pixel-diff con imágenes bloqueadas → F8. | ✓ |
| Adelantar UI-05 a F4 | Implementar ya la imagen-con-fallback completa para que la ficha quede 100% y el pixel-diff pase en F4. Re-secuencia UI-05 de F7→F4 (editaría el roadmap). | |
| Tú decides | Que lo resuelva el planner. | |

**User's choice:** Plano ahora, fallback en F7
**Notes:** F4 sí crea el componente `DetailPhoto` (MDC inline), que en F4 renderiza img+caption; F7 le añade el fallback.

### Notas (textarea por ficha)

| Option | Description | Selected |
|--------|-------------|----------|
| Montar el shell ahora | `.notes-area` + textarea con markup exacto pero sin persistencia (precedente F3). La ficha mantiene altura/layout de hoy; persistencia `roma-note-<id>` → F7. | ✓ |
| Omitir notas hasta F7 | No renderizar el área de notas; ficha más corta hasta F7. Frontera más limpia, pero layout difiere de hoy en F4–F7. | |
| Tú decides | Que lo resuelva el planner. | |

**User's choice:** Montar el shell ahora
**Notes:** Emerge el principio transversal "shell visual ahora, comportamiento en su fase dueña" (igual que F3 con los controles).

---

## Mecanismo de los 3 modos (ritmo / caminar menos / resumen)

| Option | Description | Selected |
|--------|-------------|----------|
| Composable reactivo, misma CSS | `useTripModes`-style guarda pace/light/resumen; init desde localStorage en `onMounted` (SSR=default → sin mismatch; estado aplicado 1 frame después → preserva micro-flash). Conduce las mismas clases CSS (.tl-hidden, body.light-mode, body.modo-resumen). Idiomático Vue; comparte estado entre TheHero y el timeline. | ✓ |
| Port imperativo 1:1 | Portar funciones globales: toggle de clases en `<body>` y `.tl-hidden` vía querySelectorAll en handlers (onMounted). Máxima literalidad, pero DOM imperativo cross-componente, frágil con hidratación y contra el espíritu data-driven. | |
| Tú decides | Que el planner elija respetando SC#4 (micro-flash). | |

**User's choice:** Composable reactivo, misma CSS
**Notes:** TheHero consume el composable para cablear sus controles ya montados sin reestructurar el DOM del #inicio.

---

## Verificación de paridad F4 (intermedia)

| Option | Description | Selected |
|--------|-------------|----------|
| Como F3 + E2E de modos | Specs autocontenidos DOM/texto/estructura + E2E del comportamiento de los 3 modos + sign-off humano con imágenes reales. Pixel-diff total (golden bloquea imágenes) → F8, tras F7. Menos overhead, coherente con F3. | ✓ |
| Añadir pixel-diff intermedio | Lo anterior MÁS pixel-diff ya en F4 contra el golden de las secciones SIN imagen (gastronomía/arte/arquitectura/reservas/práctica). Feedback más temprano; coste: baseline/exclusiones que mantener. | |
| Tú decides | Que el planner fije la estrategia. | |

**User's choice:** Como F3 + E2E de modos
**Notes:** El golden no se rebaselina; el pixel-diff total queda como puerta de F8.

---

## Granularidad de componentes

| Option | Description | Selected |
|--------|-------------|----------|
| Un componente por kind | `Timeline.vue` despacha a TimelineStop/Transport/Meta/Food/Reservation (1:1 con el discriminatedUnion). Cada uno pequeño y verbatim; diffs/PRs enfocados. Sigue el patrón de F3. | ✓ |
| Dispatch interno en un Timeline | Un solo `Timeline.vue` con v-if por row.kind. Menos ficheros; componente más grande que mezcla responsabilidades. | |
| Tú decides | Que el planner fije la granularidad. | |

**User's choice:** Un componente por kind
**Notes:** El resto sale uno por familia (MonumentCard, GastroCard, ArtistCard que unifica artist/arquitectura/glosario, ReservasSection, PracticaSection), con `DaySection` como contenedor del día y `DetailPhoto` como componente MDC.

---

## Claude's Discretion

- Nombres exactos y ubicación de componentes/composable.
- Mecánica de registro de componentes MDC (`DetailPhoto`) en Content v3 — a verificar en research.
- Forma del estado del composable (`useState` vs `ref`) y cómo aplica las clases de `<body>` (watcher vs `bodyAttrs`).
- Inyección de fichas en `cards-list` desde `day.cards[]`; agrupado de gastronomía desde `food.group`.
- Markup fino verbatim (variantes de transport, fixed/reserved-event, badges).

## Deferred Ideas

None — la discusión se mantuvo dentro del alcance de la Fase 4. Los diferidos que pertenecen a otras fases quedan ubicados en CONTEXT.md (UI-05/FEAT-04→F7, FEAT-05→F5, búsqueda/ruta del día→F6, PARITY-02→F8).
