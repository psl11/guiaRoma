# Phase 3: Capa de página, layout y tema - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-19
**Phase:** 3-Capa de página, layout y tema
**Areas discussed:** Routing multi-viaje, NavPills (shell vs datos), Frontera de contenido F3, Tema sin FOUC

---

## Routing multi-viaje

### Q1 — ¿Qué rutas debe GENERAR la salida estática de la 1.0?

| Option | Description | Selected |
|--------|-------------|----------|
| Solo `/` (Recomendado) | `index.vue`→`TripView slug="roma"`; `[slug].vue` existe como estructura lista pero sin prerender de `/trips/*`; cero duplicación/canonical | ✓ |
| `/` + `/trips/roma/` | Ambas generadas; Roma en dos URLs; necesita canonical | |
| `/trips/[slug]` único | `/` como alias/redirect; `/` deja de ser página propia (riesgo vs golden) | |

**User's choice:** Solo `/` (Recomendado)
**Notes:** El golden se capturó en `/`; mantenerla como única ruta prerenderizada evita divergencias.

### Q2 — ¿Cómo decide `pages/index.vue` qué viaje mostrar en `/`?

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcode 'roma' (Recomendado) | `slug="roma"` literal; `/` = "home de Roma"; viaje futuro en `/trips/<slug>` | ✓ |
| Primer trip de la colección | `/` muestra el primer trip; ambiguo con N viajes | |
| Config `defaultTripSlug` | Slug por defecto en config; pieza extra para algo trivial en 1.0 | |

**User's choice:** Hardcode 'roma' (Recomendado)
**Notes:** "Añadir viaje = añadir ficheros" se preserva en la ruta `[slug]`; el home se queda en Roma a propósito.

---

## NavPills (shell vs datos)

### Q1 — ¿Cómo se construye la lista de pastillas?

| Option | Description | Selected |
|--------|-------------|----------|
| Híbrido (Recomendado) | Pills estructurales en el componente; pills de DÍA derivados de `useTrip().days` (orden por `order`) | ✓ |
| Shell 100% fijo | Lista entera (incl. 5 días) verbatim; añadir un día obliga a editar el componente | |
| 100% derivado de datos | Incluso Inicio/Mapa/secciones de un registro de datos; sobre-ingeniería | |

**User's choice:** Híbrido (Recomendado)
**Notes:** Cumple ARCH-01 donde el contenido realmente varía (los días).

### Q2 — ¿De dónde sale la etiqueta italiana del pill de día?

| Option | Description | Selected |
|--------|-------------|----------|
| Derivar del eyebrow (Recomendado) | 1ª palabra del `eyebrow` capitalizada (venerdì→Venerdì); verificado 1:1; cero cambios de datos; `href='#'+slug` | ✓ |
| Campo explícito `day.navLabel` | Añadir campo + tocar esquema y 5 ficheros para algo derivable | |
| Tú decides | Dejar a research/planner | |

**User's choice:** Derivar del eyebrow (Recomendado)
**Notes:** El resaltado `.active`/scrollspy `+130` queda explícitamente para Fase 5.

---

## Frontera de contenido F3

### Q1 — ¿Qué profundidad de andamiaje monta `TripView` en F3?

| Option | Description | Selected |
|--------|-------------|----------|
| Secciones con anclas + placeholders (Recomendado) | Todas las secciones con `id`/anclas + contenido nivel-trip; fichas/timeline (F4), mapa (F7), referencia (F4) como placeholders | ✓ |
| Solo shell + hero | Sin secciones vacías; nav apunta a anclas inexistentes hasta F4/F7 | |
| Shell + todo el contenido | Invade F4/F7; rompe la secuencia del roadmap | |

**User's choice:** Secciones con anclas + placeholders (Recomendado)
**Notes:** TripView "posee" la estructura de página; F4/F7 enchufan dentro de los slots.

### Q2 — ¿Qué parte del #inicio entra en F3?

| Option | Description | Selected |
|--------|-------------|----------|
| #inicio completo en F3 (Recomendado) | Masthead + info-cards + "cómo usar"; todo es nivel-trip (`trip.yml`); F4 no lo reclama | ✓ |
| Solo masthead en F3 | Info-cards + howTo a F4; parte #inicio en dos fases | |

**User's choice:** #inicio completo en F3 (Recomendado)
**Notes:** Da una primera pantalla con contenido real y verificable ya en F3.

### Q3 — ¿El back-btn se monta en F3 o se difiere a F5?

| Option | Description | Selected |
|--------|-------------|----------|
| Shell visual oculto en F3 (Recomendado) | Markup exacto montado pero oculto (sin `.show`); comportamiento/pila en F5; paridad intacta | ✓ |
| Diferir entero a F5 | No se crea hasta F5; shell incompleto vs goal | |
| Tú decides | Dejar a research/planner | |

**User's choice:** Shell visual oculto en F3 (Recomendado)
**Notes:** El goal de F3 lista BackButton en el shell; en reposo es invisible (no afecta al golden).

---

## Tema sin FOUC

### Q1 — ¿Qué hace el `ThemeToggle`?

| Option | Description | Selected |
|--------|-------------|----------|
| 2 estados claro↔oscuro (Recomendado) | Invierte el tema resuelto (`$colorMode.value`), fija preference a light/dark, nunca 'system'; 1ª visita `preference:'system'`+`fallback:'light'`; clave `roma-theme`; replica `toggleTheme()`/`setTheme()` 1:1 | ✓ |
| 3 estados claro/oscuro/sistema | Añade estado 'sistema'; cambia el comportamiento de hoy → viola paridad | |

**User's choice:** 2 estados claro↔oscuro (Recomendado)
**Notes:** Un usuario con `roma-theme=dark` de la versión viva mantiene su tema.

### Q2 — ¿Qué replicamos del `<head>` en F3?

| Option | Description | Selected |
|--------|-------------|----------|
| Head de paridad completo (Recomendado) | `lang='es'` + `<title>` + los 2 `<meta theme-color>` (prefers-color-scheme) + script anti-FOUC de color-mode | ✓ |
| Solo lang + title | Omite `<meta theme-color>`; regresión sutil del color del chrome móvil | |
| Tú decides | Dejar a research/planner | |

**User's choice:** Head de paridad completo (Recomendado)
**Notes:** Los `<meta theme-color>` son independientes de color-mode (reflejan el esquema del SO).

---

## Claude's Discretion

- Forma exacta de retorno de `useTrip` (Maps/Records por id vs arrays + getters) — con la restricción dura de SC#1 (agrega las 6 colecciones + índices por id) y resolución en build/SSG.
- Estructura de componentes: `layouts/default.vue` (chrome) vs `app.vue` vs `TripView`; nombres de componentes/composables (UI-01).
- Aspecto/altura de los placeholders de #mapa y secciones (que no rompan scroll/layout).
- Mecánica exacta del transform `eyebrow → label` (split `·` + capitalizar inicial) y su ubicación (helper puro).
- Cableado de `pages/trips/[slug].vue` sin prerender (validación de slug, 404, no introducir rutas en el prerender).
- Markup verbatim de `ThemeToggle` e icono por CSS (bloqueado por SC#4, sin `v-if`).

## Deferred Ideas

None — la discusión se mantuvo dentro del alcance de la Fase 3. (El segundo viaje real, que ejercitaría `pages/trips/[slug].vue`, sigue diferido a v2 en STATE.md/REQUIREMENTS.md.)
