# Phase 5: Navegación transversal - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-21
**Phase:** 5-Navegación transversal
**Areas discussed:** Intercepción de enlaces MDC, Alcance + URL/hash, Fidelidad del scrollspy, API de useCardNavigation

---

## Intercepción de enlaces MDC

| Option | Description | Selected |
|--------|-------------|----------|
| Delegación de eventos | Un único listener de click en la raíz; `closest('a[href^="#"]')` + comprobación contra el índice de fichas → `navigateToCard`. Sin binding por enlace, idiomático, evita raspar el DOM. | ✓ |
| Port de bindCardLinks (DOM-scan) | Replica index.html literal: `querySelectorAll` + `dataset.bound` + listener por enlace en onMounted. Máxima fidelidad, pero imperativo y re-escanea. | |
| Override ProseA de MDC | Componente que sustituye los `<a>` de la prosa. Declarativo, pero un ProseA global afecta toda la prosa (no uniforme, visto en F4). | |

**User's choice:** Delegación de eventos (recomendado).
**Notes:** Un solo listener cubre a la vez prosa MDC (SC3), `tl-title` del timeline y, más adelante, los resultados de búsqueda (F6) y los popups del mapa (F7). La comprobación ficha-vs-sección usa `useTrip().monById`. Reemplaza al `bindCardLinks` DOM-scan del original (CLAUDE.md desaconseja raspar el DOM).

---

## Alcance + URL/hash

| Option | Description | Selected |
|--------|-------------|----------|
| Paridad exacta | Ir a ficha hace `preventDefault` → la URL NO cambia; solo las fichas reciben scroll-suave+resaltado+pila; las pastillas de sección son saltos nativos que sí cambian el hash. | ✓ |
| Reflejar la ficha en la URL | Actualizar el hash al navegar a una ficha (deep-links compartibles). Capacidad nueva. | |

**User's choice:** Paridad exacta (recomendado).
**Notes:** Los deep-links a ficha se anotan como idea diferida (capacidad nueva, no F5). La pila en memoria es el mecanismo de "volver", no el historial del navegador.

---

## Fidelidad del scrollspy / scroll

| Option | Description | Selected |
|--------|-------------|----------|
| Port exacto | Listener `scroll {passive:true}` que llama a `updateActivePill` directo (`scrollY+130`, última sección, toggle `.active`), igual que index.html. | ✓ |
| Envolver en requestAnimationFrame | Mismo +130 y punto de conmutación, pero coalesce los eventos de scroll en un rAF. Funcionalmente idéntico al ojo. | |

**User's choice:** Port exacto (recomendado).
**Notes:** SC2 ya bloquea la fórmula `scrollY+130 ≥ offsetTop` y prohíbe `IntersectionObserver`. El `+130` supera el `scroll-padding-top:124px` de la cabecera fija. Restauración del scroll en "volver": smooth, como hoy.

---

## API de useCardNavigation

| Option | Description | Selected |
|--------|-------------|----------|
| Diseñar para los 3 ya | Exponer `navigateToCard`/`goBack`/`activeSection`/`canGoBack` como singleton (`useState`), init en `onMounted`, para que F6 y F7 enchufen sin refactor. | ✓ |
| Mínimo para F5, ampliar luego | Solo lo que F5 necesita; F6/F7 amplían el composable al llegar. | |

**User's choice:** Diseñar para los 3 ya (recomendado).
**Notes:** Lo pide el goal ("construir una sola vez" para sus 3 consumidores: enlaces F5, búsqueda F6, mapa F7). Patrón singleton `useState` + `onMounted` heredado de `useTripModes` (F4).

---

## Claude's Discretion

- Nombre/ubicación exactos del composable y dónde se monta el listener delegado (raíz de la app vs `TripView`) y el de scroll.
- Forma interna del estado (`useState` singleton preferido) y cómo se expone la visibilidad del `BackButton` (computed sobre `navStack.length`).
- Timing exacto del cálculo inicial de `activeSection` (replicar el `init()` de index.html).
- Mecánica fina del binding reactivo de `.active`/`.show` en los shells de F3 sin tocar su DOM.

## Deferred Ideas

- **Deep-links / hash compartible a una ficha** — capacidad nueva (hoy la navegación a ficha no toca la URL); rompería la paridad de F5. Fase/milestone futuro.
