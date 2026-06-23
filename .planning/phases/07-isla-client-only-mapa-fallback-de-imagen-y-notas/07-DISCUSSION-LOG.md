# Phase 7: Isla client-only — mapa, fallback de imagen y notas - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-23
**Phase:** 7-Isla client-only — mapa, fallback de imagen y notas
**Areas discussed:** Marcadores del mapa, Placeholder del mapa, Notas y fallback de imagen, Fronteras / fuera de alcance

---

## Selección de áreas

El usuario marcó las **4** áreas propuestas (de un dominio que es ~90% port-verbatim por paridad).

---

## Marcadores del mapa

Contexto verificado antes de preguntar: el array `places` original tiene **39** pines, los monumentos son **38**, y la única diferencia es `coliseo` (pin guiado de domingo, sin ficha, no está en `/content`). Todo monumento tiene pin.

| Option | Description | Selected |
|--------|-------------|----------|
| Derivar 38 + 1 extra | Marcadores derivados de `monById` + el Coliseo como único extra en `trip.yml`. Una fuente para los 38, dato explícito para el huérfano. Respeta DATA-03; no puede tirar el Coliseo. | ✓ |
| places[] completo (39) | Port verbatim del array `places` (39 entradas en `trip.yml`). Duplica coords/roman/day/type que los monumentos ya guardan → desincronización. | |
| Solo 38 (sin Coliseo) | Derivar solo de `monById`, no pintar el Coliseo. Regresión de paridad. | |

**User's choice:** Derivar 38 + 1 extra
**Notes:** Forma exacta del campo extra = discreción del planner. Popups por tipo (card/concert → "Abrir ficha →" link; guided → solo texto) y colores de marcador quedan bloqueados por paridad.

---

## Placeholder del mapa

| Option | Description | Selected |
|--------|-------------|----------|
| Caja vacía mismo tamaño | Div vacío con las dimensiones de `#leaflet-map`, sin texto. Lo más fiel (el original sirve un div vacío que Leaflet rellena). Cero salto de layout, cero elemento nuevo. | ✓ |
| Pista 'Cargando mapa…' | Placeholder con texto/spinner. Mejor UX percibida pero elemento nuevo (divergencia; "mejora sancionada"). | |

**User's choice:** Caja vacía mismo tamaño
**Notes:** Paridad estricta del primer paint. El invariante es igualar dimensiones para no descuadrar el ritmo vertical.

---

## Notas y fallback de imagen

| Option | Description | Selected |
|--------|-------------|----------|
| Paridad estricta | Notas: guardar por tecla a `roma-note-<slug>`, leer en `onMounted`, solo monumentos. Fallback: `@error`→SVG por motif, hero+detail, alt/lazy exactos. Nada nuevo. | |
| Paridad + micro-mejoras invisibles | Igual, pero permitiendo mejoras internas SIN cambio visible ni funcional (p. ej. debounce del guardado). Sin UI nueva. | ✓ |
| Tengo una mejora concreta | Añadir algo específico (indicador, preview, otra imagen). | |

**User's choice:** Paridad + micro-mejoras invisibles
**Notes:** Condición dura — cero cambio visible/funcional, ninguna UI nueva (sin indicador "guardado"). El debounce del `localStorage.setItem` es el ejemplo canónico de mejora inocua permitida.

---

## Fronteras / fuera de alcance

| Option | Description | Selected |
|--------|-------------|----------|
| Sí, alcance bloqueado | Clustering/búsqueda mapa, export/sync/markdown notas, fallback en otras imágenes, deep-links/hash, caché offline de tiles (PWA=v2) → todo FUERA. F7 = las 3 piezas con paridad. | ✓ |
| Quiero revisar un punto | Reconsiderar si algo de la lista debería entrar. | |

**User's choice:** Sí, alcance bloqueado
**Notes:** Lo que surja fuera de las 3 piezas se captura como idea diferida, no se implementa.

---

## Claude's Discretion

- Forma/nombre del componente del mapa y su montaje en `#mapa` de `TripView`.
- Cómo enchufan los popups a `navigateToCard` sin disparar el landmine de F5 (listener delegado de captura con `<a href="#slug">` vs `data-card`).
- Cómo se le hace llegar el `motif` al `DetailPhoto.global.vue` inline (hoy solo recibe src/alt/caption).
- Forma/nombre del campo extra del Coliseo en `TripSchema`/`trip.yml`.
- Dónde viven las 19 cadenas `SVG_MOTIFS` y cómo se inyectan.
- Mecánica del guardado de notas (v-model vs listener; debounce inocuo).
- Estrategia de verificación (spec Playwright autocontenido; forzar tileerror y onerror con `page.route.abort`).

## Deferred Ideas

- Clustering / búsqueda dentro del mapa.
- Export / sync / markdown de notas, indicador "guardado".
- Fallback de imagen en imágenes que no sean hero/detail.
- Deep-links / hash compartible a ficha (ya diferido en F5).
- Caché offline real de tiles (= PWA = v2).
