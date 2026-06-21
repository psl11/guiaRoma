# Phase 6: Derivados de datos — búsqueda y ruta del día - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-21
**Phase:** 6-Derivados de datos — búsqueda y ruta del día
**Areas discussed:** Calidad de coincidencia, Alcance del índice + navegación, UX del dropdown, Ubicación de los controles

---

## Calidad de coincidencia de la búsqueda

| Option | Description | Selected |
|--------|-------------|----------|
| Prefijo + ranking | MiniSearch con prefijo + ranking por campo (nombre>prosa) + tolerancia a erratas suave; supera el includes() sin ruido | ✓ |
| Paridad estricta | Replica el filtro includes() 1:1, sin prefijo/fuzzy/ranking | |
| Fuzzy agresivo | Máxima tolerancia a erratas, a costa de posible ruido | |

**User's choice:** Prefijo + ranking
**Notes:** Mejora sancionada por SC#1 ("al menos lo de hoy") y por la razón por la que CLAUDE.md eligió MiniSearch. Es la única desviación de la paridad estricta en esta fase. Fuzzy conservador (no agresivo) para no introducir ruido.

---

## Alcance del índice + navegación de resultados

| Option | Description | Selected |
|--------|-------------|----------|
| Mismo alcance que el original | Indexar solo monumentos; encaja con monById + useCardNavigation (F5) sin tocar el índice | ✓ |
| Ampliar a todas las tarjetas | Indexar también gastro/artistas/referencia; requiere índice id→ficha más amplio que monById y quizá extender F5 | |

**User's choice:** Mismo alcance que el original (solo monumentos)
**Notes:** Paridad. Todos los resultados quedan en monById → navegación scroll-suave de F5 funciona sin cambios. Ampliar quedó como idea diferida.

---

## UX del dropdown

| Option | Description | Selected |
|--------|-------------|----------|
| Solo paridad | Replicar el dropdown del original tal cual: clic → navegar | ✓ |
| Paridad + teclado | Añadir navegación por teclado (↑↓/enter/esc) además del clic | |
| Paridad + filas enriquecidas | Mostrar día/tipo y resaltar el término en cada fila | |

**User's choice:** Solo paridad
**Notes:** Sin añadidos sobre el original. Teclado y filas enriquecidas quedaron como ideas diferidas.

---

## Ubicación de los controles

| Option | Description | Selected |
|--------|-------------|----------|
| Solo paridad | Caja de búsqueda y botón ruta del día donde estaban en el original; disparo por clic | ✓ |
| Añadir atajo de teclado | Atajo ('/' o ⌘K) para enfocar la búsqueda | |

**User's choice:** Solo paridad
**Notes:** Posición/markup = research mapea del index.html. Atajo de teclado quedó como idea diferida.

---

## Claude's Discretion

- Config exacta de MiniSearch (campos, pesos de boost, umbral fuzzy conservador, prefijo/tokenización).
- Forma de los composables (`useSearch`/`useDayRoute`): singleton `useState` vs ref de módulo; dónde se montan.
- Construcción del `haystack` por monumento desde las colecciones tipadas.
- Mecánica fina del dropdown (debounce, cierre al clicar fuera, foco) replicando el original.
- Ubicación/markup exactos de la caja de búsqueda y del botón ruta del día (del index.html).

## Deferred Ideas

- Ampliar la búsqueda a gastro/artistas/secciones de referencia (paridad = monuments-only).
- Atajo de teclado para enfocar la búsqueda ('/' o ⌘K).
- Navegación por teclado del dropdown (↑↓/enter/esc) y filas enriquecidas (día/tipo/resaltado).
- (De otras fases: mapa → F7; fallback de imagen/notas → F7; pixel-diff total → F8.)
