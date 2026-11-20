---
phase: "10"
slug: "forma-y-chrome-desde-datos"
status: approved
reviewed_at: "2026-11-20"
shadcn_initialized: false
preset: none
created: "2026-11-20"
---

# Phase 10 — UI Design Contract

> Contrato de **conservación**, no de diseño nuevo. Esta fase no añade ningún aspecto visual: mueve los textos de chrome de Roma a `content/trips/roma/trip.yml` (verbatim), monta días/secciones/pastillas desde datos y oculta lo que no tiene datos. Roma debe salir idéntica: 56 goldens sin re-baseline, `tests/parity/` sin cambios (D-18). Generado en modo `--auto` (sin preguntas al usuario): todas las respuestas salen de CONTEXT.md D-01…D-19, RESEARCH.md y del CSS existente.

**Reglas duras de esta fase (aplican a todo lo que sigue):**
1. **Cero CSS nuevo.** `app/assets/css/{tokens,base,fonts,leaflet}.css` no se tocan. Nada de `<style scoped>` (los `data-v-*` rompen los selectores globales). Nada de `style=""` nuevo.
2. **Cero clases nuevas.** Los viajes nuevos reutilizan exactamente las clases actuales (`.brand`, `.brand-dot`, `.nav-pills`, `.nav-pill`, `.map-legend`, `footer p`, `.flourish`, `section`).
3. **Nunca `v-html`.** Texto plano interpolado (`{{ }}`) o Markdown-inline vía `<MDC :value :tag="false" unwrap="p" />`.
4. **Nunca un literal de Roma como respaldo** (D-14). Un campo ausente cae al `title` del viaje sin Markdown o no se renderiza.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (CSS a mano verbatim del `index.html`; las custom properties de `app/assets/css/tokens.css` son el sistema de tokens) |
| Preset | not applicable |
| Component library | none (componentes Vue propios en `app/components/`) |
| Icon library | none (glifos tipográficos: `✦` U+2726, `·` U+00B7, `—` U+2014) |
| Font | Cormorant Garamond (chrome: marca, pastillas, leyenda, pie, títulos) + Lora (cuerpo) + JetBrains Mono; self-hosted en `app/assets/css/fonts.css` |

shadcn gate: no aplica (proyecto Vue/Nuxt, no React; CLAUDE.md prohíbe Tailwind/UnoCSS y cualquier sistema que reescriba el CSS). Sin `components.json`. Component Inventory y Registry: omitidos por `Tool: none`.

### Componentes existentes afectados (no se crean componentes visuales nuevos)

| Componente | Cambio de esta fase | Lo que NO cambia |
|------------|---------------------|------------------|
| `app/components/Topbar.vue` | `.brand` desde `trip.brand` o respaldo neutro; recibe el layout en vez de `days` | `header.topbar > div.topbar-inner > (.brand + ThemeToggle)` + `NavPills` hermano |
| `app/components/NavPills.vue` | `v-for` sobre `buildTripLayout(...)` (una sola lista, D-06) | `nav#nav-pills.nav-pills > a.nav-pill[href="#id"]`, binding `:class="{ active }"` |
| `app/components/TripView.vue` | `<template v-for>` sobre el layout; leyenda y pie desde datos; `useHead({ title })` | Orden de hermanos `header → main → BackButton → div.flourish → footer`; chrome estático de `#mapa` |
| `app/app.vue` | Se quita solo `title` | `lang="es"`, los 2 `theme-color`, favicons |
| `app/utils/tripLayout.ts` (nuevo, puro) | `buildTripLayout`, `dayPillLabel`, `inlineMdToPlain` | — (sin markup) |

---

## Spacing Scale

Valores **heredados y congelados** del CSS existente. Esta fase no declara ni usa ningún valor nuevo. Tabla limitada a las piezas que toca la fase (base 1rem = 16px):

| Token (efectivo) | Value | Usage (regla existente) |
|------------------|-------|-------------------------|
| sm | 8px (.5rem) | Padding vertical de `.nav-pills` (`base.css` `.nav-pills { padding: .5rem 1.25rem }`) |
| md | 16px | `p { margin-bottom: 1rem }` (párrafo del pie) |
| xl | 32px (2rem) | `footer { margin-top: 2rem }` |
| 2xl | 48px (3rem) | `section { padding: 3rem 0 }`, `footer { padding: 3rem 0 }`, `.flourish { margin: 3rem 0 }` |

Exceptions (heredadas del `index.html`, congeladas por paridad, no se corrigen):
- `.topbar-inner` padding `.75rem 1.25rem` (12px / 20px) y `.nav-pills` padding horizontal 20px.
- `.nav-pills` gap `.35rem` (5.6px); `.nav-pill` padding `.35rem .85rem` (5.6px / 13.6px).
- `.brand-dot` margin `0 .35em` (relativo a la fuente de la marca).
- `.map-legend` margin-top `.75rem` (12px).

Regla de espacio en blanco de la marca (Pitfall 1): exactamente **un** espacio entre `before` y `<span class="brand-dot">` y otro entre el span y `after`. El aire visual lo pone `.brand-dot { margin: 0 .35em }`; un espacio de más o de menos mueve píxeles.

---

## Typography

Valores **heredados y congelados** (`app/assets/css/base.css`). Esta fase no declara tamaños ni pesos nuevos. Roles que la fase renderiza desde datos:

| Role | Size | Weight | Line Height | Regla |
|------|------|--------|-------------|-------|
| Body (cuerpo, prosa de días) | 17px | 400 (Lora) | 1.65 | `body` |
| Label (pastilla `.nav-pill`) | 15.2px (.95rem) | 500 (Cormorant Garamond) | 1.65 (heredada) | `.nav-pill`, `letter-spacing: .02em` |
| Chrome itálico (`.map-legend`, `footer p`) | 15.2px (.95rem) | 400, itálica (Cormorant Garamond) | 1.65 (heredada) | `.map-legend`, `footer p` |
| Brand (`.brand`) | 19.2px (1.2rem) | 600, itálica (Cormorant Garamond) | 1.65 (heredada) | `.brand`, `letter-spacing: .01em` |

Nota de pesos: el CSS congelado usa 400/500/600; esta fase no añade ninguno y no puede reducirlos sin romper los goldens. Títulos de sección (`h2`, `.section-eyebrow`) siguen como hoy (D-09: chrome compartido fijo).

---

## Color

Tokens de `app/assets/css/tokens.css` (claro / oscuro vía `[data-theme="dark"]`). Sin colores nuevos.

| Role | Value (claro / oscuro) | Usage |
|------|------------------------|-------|
| Dominant (60%) | `--bg` #f5f0e8 / #1a1612 | Fondo de página, fondo de `.nav-pills`, topbar (`color-mix` 92%) |
| Secondary (30%) | `--bg-elev` #fbf7f0 / #221d18 · `--bg-soft` #ede5d7 / #2a241e | Pastilla activa, cards, botón de tema |
| Accent (10%) | `--accent` #8b3a3a / #c4665a | Ver lista reservada |
| Ornamento | `--gold` #a07c4a / #c4a373 | `.brand-dot` (✦), `.flourish` |
| Texto secundario | `--ink-soft` #5c534a / #b8aa95 · `--ink-faint` #8a8074 / #7a6f5e | Pastilla inactiva y `.map-legend` (`--ink-soft`); `footer p` (`--ink-faint`) |
| Destructive | none | La fase no tiene acciones destructivas |

Accent reserved for (sin cambios): texto de `.brand`; texto + borde de `.nav-pill:hover` y `.nav-pill.active`; enlaces `a`; `.section-eyebrow`; `h1 em`. Las pastillas de día nuevas (`pill`) usan el mismo `.nav-pill` y por tanto el mismo tratamiento; no hay ningún acento nuevo.

---

## Copywriting Contract

### Roma — textos movidos verbatim a `trip.yml` (no se reescriben)

Caracteres exactos: `·` U+00B7, `—` U+2014 (EM-DASH), `✦` U+2726, comillas **rectas** `"`. Fuente: `index.html` líneas 8, 2259, 2370, 6236-6240 (contrastado por `tests/data/romaChrome.spec.ts`).

| Campo `trip.yml` | Valor de Roma | DOM resultante (debe ser idéntico al actual) |
|------------------|---------------|----------------------------------------------|
| `pageTitle` | `'Roma · 19—23 giugno 2026'` | `<title>Roma · 19—23 giugno 2026</title>` |
| `brand` | `{ before: 'Roma', after: 'giugno MMXXVI' }` | `<div class="brand"> Roma <span class="brand-dot">✦</span> giugno MMXXVI </div>` |
| `mapLegend` | `'✦  Rojos · paradas con ficha · Dorados · eventos guiados · Verde · concierto Einaudi ✦'` | `<p class="map-legend">…</p>` (texto plano, interpolado) |
| `footer` | `- 'Itinerario preparado para _Pay_ y dos colegas'`<br>`- 'Roma · 19—23 giugno 2026'`<br>`- '"Roma no se cuenta, se camina."'` | `<footer><div class="container"><p>Itinerario preparado para <em>Pay</em> y dos colegas<br>Roma · 19—23 giugno 2026<br>"Roma no se cuenta, se camina."</p></div></footer>` |

Formato YAML del pie: cada línea es un escalar entre comillas simples, **nunca** bloque `|`/`>` (un `\n` final se convertiría en texto). Una sola `<p>`; líneas unidas con `<br>` sin espacio antes ni después; cada línea vía `<MDC :tag="false" unwrap="p">` (comentarios de fragmento `<!--[-->` aceptados, no se pintan).

### Respaldos neutros (D-14) — viaje sin campo de chrome

| Campo ausente | Comportamiento | Ejemplo con `prueba` (`title: Dos días de _Prueba_`) |
|---------------|----------------|------------------------------------------------------|
| `pageTitle` | `<title>` = `inlineMdToPlain(trip.title)` | `Dos días de Prueba` |
| `brand` | `.brand` = `inlineMdToPlain(trip.title)`, **sin** `.brand-dot` | `<div class="brand">Dos días de Prueba</div>` |
| `footer` | No se renderiza el elemento `<footer>` (ni su borde superior). `.flourish` se queda | — |
| `mapLegend` | No se renderiza `p.map-legend`; el resto de `#mapa` igual | — |

Prohibido: `brand ?? 'Roma'`, `title` fijo en `app.vue`, cualquier literal de la lista trampa (D-16: «Roma», «Einaudi», «giugno», «MMXXVI», «Pay», «Fellini», «Royal Court») en `app/**` o como valor por defecto.

### Etiquetas de pastilla de día (D-03)

| Caso | Regla | Ejemplo |
|------|-------|---------|
| Día sin `pill` | `dayLabel(eyebrow)`: primer tramo antes de `·`, primera letra en mayúscula (`it`) | Roma: `Venerdì`, `Sabato`, `Domenica`, `Lunedì`, `Martedì` (sin `pill`, idénticas) |
| Día con `pill` | Se usa tal cual | `Sáb 19` |
| Día de la semana repetido | `pill` obligatoria en los días que colisionan; la puerta (`day-pill`) falla si dos etiquetas finales son iguales (comparación exacta, misma función `dayPillLabel` que la UI) | `sabado-19` → `Sáb 19`; `sabado-26` → `Sáb 26` |
| Formato recomendado de `pill` | `<abreviatura de 3 letras con mayúscula inicial> <día del mes>`, en el idioma del viaje; sin espacios al principio/final; ≤ 12 caracteres (recomendación estética, no bloqueante) | `Sáb 19`, `Dom 20` |
| Viaje real con colisiones (Campania, Fase 13) | Recomendado dar `pill` a **todos** sus días con el mismo formato, para que la barra sea homogénea | — |

Etiquetas estructurales: fijas y verbatim (D-09): `Inicio`, `Mapa`, `Reservas`, `Gastronomía`, `Pratica` (italiano, sin tilde), `Arte`, `Arquitectura`. Orden fijo (D-07): Inicio, Mapa, días…, Reservas, Gastronomía, Pratica, Arte, Arquitectura. Roma: exactamente `Inicio, Mapa, Venerdì, Sabato, Domenica, Lunedì, Martedì, Reservas, Gastronomía, Pratica, Arte, Arquitectura`.

### Viaje `forma` (dev-only, D-15) — copy propuesto

Sin ninguna palabra de la lista trampa (comprobado: «Forma» no contiene «Roma» como palabra). Discreción del planner; si se cambia, debe seguir libre de palabras trampa.

| Campo | Copy |
|-------|------|
| `title` | `Diez días de _Forma_` |
| `pageTitle` | `Forma · diez días de ensayo` |
| `brand` | `{ before: 'Forma', after: 'diez días de ensayo' }` |
| `mapLegend` | `'✦  Rojos · paradas con ficha ✦'` |
| `footer` | `- 'Guía de ensayo para _comprobar_ la forma'`<br>`- 'Forma · diez días de prueba'`<br>`- '"Toda guía se mide por sus días."'` |
| Pastillas de día | Dos sábados con `pill` explícita (`Sáb 19`, `Sáb 26`); el resto **sin** `pill` (ejercita también el respaldo `dayLabel`), con eyebrows de días distintos para que no colisionen |

### Elementos estándar del contrato

| Element | Copy |
|---------|------|
| Primary CTA | No aplica: la fase no añade acciones. La interacción es navegación por pastillas (`a.nav-pill` → `#id`), sin cambios |
| Empty state heading | No aplica por diseño (D-08): una sección sin datos **no se renderiza** (ni `<section>` ni pastilla). No hay mensaje de «sin datos» |
| Empty state body | No aplica (ídem) |
| Error state | Runtime: ninguno nuevo. Build (puerta `pnpm test:data`, nombra el fichero culpable): `order N ≠ M (1..N contiguo, D-04)` · `pastilla «Sábado» repetida (D-03)` · `enlace no admitido (D-05): "<destino>"` · ancla a sección ausente → regla `anchor` |
| Destructive confirmation | none |

---

## Contrato de DOM (shell)

Para Roma, el HTML prerenderizado debe ser idéntico al actual salvo comentarios de fragmento de Vue (`<!--[-->`/`<!--]-->`), que no se pintan.

| Pieza | Forma exigida |
|-------|---------------|
| Cabecera | `header.topbar > div.topbar-inner > div.brand + button.theme-btn`; `nav#nav-pills.nav-pills` hermano de `.topbar-inner` dentro de `header` |
| Pastillas | `a.nav-pill` con `href="#<id>"`, una por entrada de `buildTripLayout`, en el orden de D-07; `.active` según `activeSection` (scrollspy existente) |
| `<main>` | Las `<section>` son **hijas directas** de `<main>`, sin envoltorio (la regla `section + section { border-top }` depende de ello). `#inicio` lo aporta `TheHero`; días `<section :id="day.slug">` + `DaySection`; `#mapa` con su chrome estático verbatim (`cartografia`, `El mapa del viaje`, intro, `.map-wrapper`, banner offline) |
| Secciones opcionales | `#reservas` si hay referencia `reservas`; `#gastronomia` si hay comida; `#practica` si hay referencia `practica`; `#arte` si hay `kind: artist`; `#arquitectura` si hay `arquitectura` o `glossary`. Ausente → ni `<section>` ni pastilla |
| Cola de página | `BackButton` → `div.flourish` (`·  ·  ·  ✦  ·  ·  ·`, compartido, siempre) → `footer` (solo si hay `footer`) |
| `<head>` | `<title>` lo pone la página del viaje (`useHead` en TripView); `app.vue` conserva `lang="es"` y los dos `theme-color` |
| Ids de día | Convención para viajes nuevos: slug con fecha que empieza por letra (`sabado-19`), regex `^[a-z0-9-]+$`; tests usan `[id="…"]`, no `#…` |

---

## UI Considerations

Applicable state considerations resolved: 9 covered, 1 backstop, 1 unresolved (probe `ui-consideration-probe` 2026-11-20 sobre E1–E7: 31 aplicables + 1 sin clasificar; `--auto`: Claude asignó a E3 «secciones opcionales» los tipos `empty`/`partial` y resolvió cada categoría en las filas de abajo)

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| populated | Roma `/` (12 pastillas, 5 días, chrome completo) | ✅ covered | Roma renderiza las 12 pastillas en el orden bloqueado y marca, pie, leyenda y `<title>` idénticos; la puerta de 56 goldens + `shell.spec.ts` pasa sin re-baseline |
| partial | Viaje sin secciones opcionales (`forma`: sin Arte, Arquitectura ni Reservas) | ✅ covered | En `/trips/forma` no existen `[id="arte"]`, `[id="arquitectura"]`, `[id="reservas"]` ni sus pastillas |
| empty | Viaje sin campos de chrome (`prueba`) | ✅ covered | En `/trips/prueba` la marca y el `<title>` son «Dos días de Prueba», sin `.brand-dot`, sin `<footer>` y sin `.map-legend` |
| zero-one-many | Días: 2 (`prueba`), 5 (Roma), 10 (`forma`) | ✅ covered | `/trips/forma` muestra 10 `section` de día y 10 pastillas de día con etiquetas distintas, y cada `href` lleva a una `section[id]` existente |
| many (repetición) | Dos sábados en un viaje | ✅ covered | Las pastillas `Sáb 19` y `Sáb 26` son distintas; un viaje con dos etiquetas iguales hace fallar `pnpm test:data` con la regla `day-pill` |
| leak | Texto de Roma en otro viaje | ✅ covered | Ni `document.title` ni el texto del `body` de `prueba`/`forma` contienen palabras de la lista trampa; el mismo matcher sobre Roma sí encuentra «Roma» (control positivo) |
| long-text | Pie de varias líneas, marca y leyenda con espacios dobles | ✅ covered | `.brand`, `.map-legend` y `footer p` no fijan `white-space`; el texto de Roma extraído de `trip.yml` coincide con `index.html` tras normalizar espacios |
| loading | E1–E7 (pastillas, días, secciones, marca, pie, leyenda, título) | ✅ covered | Sitio estático prerenderizado: no hay estado de carga visible. Durante la ventana de hidratación (`useAsyncData` con `.data = null`) cada sección/campo opcional va tras `v-if`/`??` y no se monta vacío ni lanza; el `<title>` y el chrome de Roma ya están en el HTML prerenderizado de `/` |
| error | E1–E7 | ✅ covered | Los errores de datos son de build: un YAML inválido (orden no contiguo, `pill` duplicada, slug de día reservado, enlace fuera de la lista blanca) hace fallar `pnpm verify` nombrando el fichero; en runtime no hay estado de error visible |
| short-page | Scrollspy en viajes con días mínimos | 🧪 backstop | En `forma` la navegación se comprueba por `href` + `section[id]` + `location.hash`, no por `.active` en los últimos días (la página corta no se desplaza hasta ellos, Pitfall 6) |
| overflow | Barra de pastillas con muchas entradas | ⚠ unresolved | Medido el 2026-11-20 sobre la build (Chromium): con `justify-content: center` (≥680px) y desbordamiento, las primeras pastillas quedan recortadas e inalcanzables. Roma ya lo sufre hoy a 768px y 1024px (comportamiento heredado, se conserva por paridad). `forma` (13 pastillas) cabe a 1280px (viewport de `test:trips`). Un viaje con 17 pastillas (10 días + 5 estructurales, forma de Campania) recorta «Inicio» incluso a 1280px. El arreglo exige CSS (p. ej. `justify-content: safe center`), prohibido en esta fase: se anota como supuesto para la Fase 12/13 y decisión del usuario |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| none | — | not applicable (`Tool: none`, sin shadcn ni registros de terceros) |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: FLAG (sin foco declarado; jerarquía heredada)
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: FLAG (3 pesos congelados por paridad, D-18)
- [x] Dimension 5 Spacing: FLAG (valores no múltiplos de 4 congelados por paridad)
- [x] Dimension 6 Registry Safety: PASS
- [x] Dimension 7 Inventory Provenance: PASS

**Approval:** approved 2026-11-20 (gsd-ui-checker: 4 PASS, 3 FLAG no bloqueantes)
