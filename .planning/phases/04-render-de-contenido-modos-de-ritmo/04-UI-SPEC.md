---
phase: 4
slug: render-de-contenido-modos-de-ritmo
status: draft
shadcn_initialized: false
preset: none
created: 2026-06-20
---

# Fase 4 — Contrato de diseño UI (Render de contenido + modos de ritmo)

> Contrato visual y de interacción para la Fase 4. Generado por gsd-ui-researcher, verificado por gsd-ui-checker.
>
> **ESTO ES UNA FASE DE PARIDAD 100 %, NO UN DISEÑO NUEVO.** El sistema de diseño YA EXISTE y está BLOQUEADO: la Fase 1 portó el CSS editorial escrito a mano **verbatim** a `app/assets/css/tokens.css` + `base.css` + `leaflet.css`. Las custom properties **SON** los tokens. Este documento **NO propone** spacing, tipografía ni color nuevos: **documenta el contrato visual e interactivo existente** que los componentes de F4 deben **reproducir 1:1**. La fuente de verdad es `index.html` (rangos de línea en CONTEXT.md ▸ canonical_refs) y el CSS ya portado. Es un **contrato de verificación** ("¿este componente coincide con `index.html`?"), no una hoja de propuestas.
>
> **Regla de oro (CLAUDE.md §"What NOT to Use"):** los componentes de F4 llevan **CERO CSS**, **sin `<style scoped>`** (un `data-v-*` rompería en silencio selectores globales descendientes como `.card-section p:first-of-type::first-letter`, `.detail-list li::before`, `body.modo-resumen .cards-list`). Solo reproducen **markup + clases** existentes → paridad por construcción. Prohibido Tailwind/UnoCSS y cualquier regla CSS nueva.

---

## Estado del sistema de diseño (detección)

| Comprobación | Resultado |
|--------------|-----------|
| `components.json` (shadcn) | **No existe** — shadcn no aplica |
| `tailwind.config.*` | **No existe** — sin Tailwind (prohibido por CLAUDE.md §5) |
| `postcss.config.*` | **No existe** |
| CSS del proyecto | `app/assets/css/tokens.css` (34 líneas, paleta light/dark), `base.css` (~1.150 líneas), `leaflet.css` (modos + mapa). **Portado VERBATIM en F1.** |
| Gate shadcn | **NO APLICABLE.** No es un init de app React/Next/Vite; es una migración con CSS a mano bloqueado. CLAUDE.md prohíbe explícitamente shadcn/Tailwind. `Tool: none`. |
| Componentes existentes (F3, no recrear) | `Topbar`, `NavPills`, `ThemeToggle`, `BackButton`, `TripView`, `TheHero` |
| Composables existentes (F3) | `useTrip.ts` (+ utils `dayLabel.ts`, `tripIndexes.ts`) |

---

## Design System

| Property | Value |
|----------|-------|
| Tool | **none** (CSS editorial a mano, verbatim de F1; las custom properties son los tokens) |
| Preset | not applicable |
| Component library | **none** (componentes Vue propios, markup+clases verbatim, cero CSS) |
| Icon library | **none** — los "iconos" son **emoji** vía `content` de CSS en `::before` (🚶🚇🚕🚆🎟️✅⏭️⚠️🪑) y glifos tipográficos (`✦`, `✓`). No se importa ninguna librería de iconos. |
| Render de prosa | `<MDC>` de `@nuxt/content` 3.14.0 (vía `@nuxtjs/mdc` 0.22.0) sobre `sections[].body` Markdown-inline |
| Font (display/headings) | **Cormorant Garamond** (fallback `Garamond, Hoefler Text, Times New Roman, serif`) — self-hosted vía `@nuxt/fonts` (F1) |
| Font (cuerpo) | **Lora** (fallback `Georgia, Times New Roman, serif`) |
| Font (monoespaciada) | **JetBrains Mono** (teléfonos de reserva: `.tl-resv-tel`) |

---

## Spacing Scale

> **NO es una escala de 8 puntos.** El sistema editorial bloqueado usa **`rem` (base 17px) y `em`**, con valores no múltiplos de 4px. Imponer un grid de 4px **rompería la paridad**. Esta tabla **documenta los valores reales** que el markup reproduce vía las clases existentes; los componentes **no fijan padding/margin propios** (todo viene del CSS global).

| Token efectivo | Valor | Uso (clase del CSS verbatim) |
|----------------|-------|------------------------------|
| Hilera de ficha | `2rem` gap | `.cards-list { gap: 2rem }` entre fichas |
| Sección de prosa | `1.25rem` margin-bottom | `.card-section` |
| Encabezado de sección | `1.4rem 0 .65rem` | `.card-section h4` |
| Item de lista detalle | `.55rem 0 .55rem 1.5rem` | `.detail-list li` |
| Foto embebida | `1rem auto 1.5rem`, `max-width:380px` | `.detail-photo` |
| Timeline (sangría) | `padding-left: 1.75rem`, `margin-top: 2rem` | `.timeline` |
| Fila de transporte | borde + `color-mix` por variante | `.tl-transport.*` |
| Sección de página | `3rem 0` | `section` (F3, ya presente) |
| Contenedor | `max-width: 760px`, `padding: 0 1.25rem` | `.container` |

**Excepciones / regla operativa:** el contrato de spacing **es** el CSS portado. Los componentes de F4 **no declaran spacing**: cualquier `padding`/`margin`/`gap` que se vea proviene de las clases existentes. **Cualquier valor de spacing nuevo es un fallo de paridad.**

---

## Typography

> Roles tipográficos **bloqueados** (de `base.css` 5-18, 110-120, 736-781; `tokens.css`). Sizes en `rem`/`clamp()` verbatim. Pesos: solo **400 (cuerpo)**, **500** y **600** (display). Los componentes **no fijan tipografía**; heredan de las clases.

| Rol | Family | Size | Weight | Line height | Dónde (clase) |
|-----|--------|------|--------|-------------|---------------|
| Cuerpo (prosa) | Lora serif | `17px` | 400 | `1.65` | `body` (heredado en `.card-section p`) |
| Nombre de ficha (h3) | Cormorant Garamond | `1.55rem` | 500 | `1.15` | `.card-title h3` |
| Nombre italiano | Cormorant Garamond italic | `.95rem` | (italic) | — | `.card-italian` |
| Encabezado de sección (h4) | Cormorant Garamond | `.8rem` | 600 | — | `.card-section h4` (uppercase, `letter-spacing:.22em`, color `--gold`) |
| Eyebrow de sección | Cormorant Garamond | `.85rem` | 600 | — | `.section-eyebrow` (uppercase, `letter-spacing:.25em`, color `--accent`) |
| Capitular (dropcap) | Cormorant Garamond italic | `3.4rem` | 500 | `.85` | `.card-section p:first-of-type::first-letter` (color `--accent`; **solo 1ª sección**) |
| Hora del timeline | (heredada) | `.7rem` aprox / mono donde aplica | — | — | `.tl-time` |
| Teléfono de reserva | **JetBrains Mono** | `.74rem` | — | — | `.tl-resv-meta .tl-resv-tel` |
| Caption de foto | Cormorant Garamond italic | `.88rem` | (italic) | `1.4` | `.detail-photo-caption` |
| Badge de ficha | (heredada) | pequeña | — | — | `.card-badge` |

**Regla operativa:** los componentes de F4 **no llevan estilos de tipografía**. Reproducen el elemento semántico correcto (`h3` para el nombre, `h4` para el encabezado de sección, `<p>` real para que el dropcap funcione) con su clase. **Ver Pitfall 2 (dropcap): la prosa de `sections[].body` se renderiza CON `<p>` (sin `unwrap`); las secciones 2..n llevan `.no-dropcap`.**

---

## Color

> Paleta editorial terracota/oro **bloqueada** (`tokens.css`). Tema claro y oscuro vía `[data-theme]` (gestionado por color-mode en F3). Los componentes **usan las custom properties existentes** vía las clases; **nunca** colores literales nuevos. El esquema 60/30/10 abajo es una **descripción del sistema existente**, no una propuesta.

| Rol | Valor (claro) | Valor (oscuro) | Uso |
|-----|---------------|----------------|-----|
| Dominante (~60 %) superficie | `--bg #f5f0e8` | `#1a1612` | Fondo de página (con dos radial-gradients sutiles) |
| Superficie elevada | `--bg-elev #fbf7f0` | `#221d18` | Fichas (`.card`), cajas |
| Superficie suave | `--bg-soft #ede5d7` | `#2a241e` | Fondos secundarios, placeholder de imagen |
| Tinta (texto) | `--ink #2a2520` | `#e8dfd0` | Texto principal |
| Tinta suave | `--ink-soft #5c534a` | `#b8aa95` | Texto secundario, captions, descripciones |
| Tinta tenue | `--ink-faint #8a8074` | `#7a6f5e` | Items deshabilitados, notas al pie |
| **Acento (~10 %)** | `--accent #8b3a3a` | `#c4665a` | Ver lista reservada abajo |
| Acento suave | `--accent-soft #b85c5c` | `#a04545` | Hover/variantes del acento |
| **Oro (segundo acento)** | `--gold #a07c4a` | `#c4a373` | Encabezados de sección (h4), bullets `✦`, números romanos, separadores |
| Oro suave | `--gold-soft #c4a373` | `#d4b88a` | Degradados de eyebrow, bordes de transporte walk |
| Línea / borde | `--line #d4c8b3` | `#3a3027` | Bordes de tabla, separadores |
| Línea suave | `--line-soft #e5dccb` | `#2e2820` | Divisores finos (`.detail-list li`, `.facts-row`) |

**Acento (`--accent`) reservado para** (lista explícita — nunca "todos los interactivos"): nombre romano de ficha (`.card-roman`), `.card-badge`, `.section-eyebrow`, capitular/dropcap, `.maps-link`, hover de `.tl-title`/`.nav-pill`/`.gastro-card-name`, marca del timeline en `fixed-event`, `--accent` del toggle Resumen activo, enlaces dentro de cajas (`.tl-food-foot a`, `.dia-ligera a`).

**Colores semánticos NO mapeados a las custom properties (literales bloqueados del original — reproducir verbatim, NO sustituir por tokens):**

| Color literal | Dónde | Significado |
|---------------|-------|-------------|
| `#2e7d4f` (verde) | `body.light-mode .light-toggle`, `.light-banner strong`, `.tl-resv-meta` (banda) | Estado "caminar menos" activo / reserva confirmada |
| `#5a7a3a` (verde oliva) | `.tl-meta-item.ok b`, `.tl-transport.taxi` | Meta "ok" / transporte taxi |
| `#c47a2a` (ámbar) | `.tl-meta-item.warn b` | Meta "atención" |
| `#d4801a` (naranja) | `.tl-transport.metro` | Línea de metro A |
| `#2c5aa0` (azul) | `.tl-transport.metro-b` | Línea de metro B |

> **No hay acción destructiva en F4.** Las notas son un `<textarea>` shell sin persistencia (F7). No hay "Destructive" en el sentido del template.

---

## Copywriting Contract

> En una migración de paridad **el copy es dato o literal del original**, no se inventa. Lo que sigue documenta los textos fijos que los componentes de F4 reproducen **verbatim** y de dónde sale el texto dinámico.

| Elemento | Copy (verbatim del `index.html`) / origen |
|----------|-------------------------------------------|
| CTA primaria de ficha | **"Ver en Google Maps"** (texto estático de `.maps-link`; el `href` se reconstruye con `encodeURIComponent(monument.mapsQuery)` — **verificar escaping idéntico**, A4) |
| Label de notas | **"Notas in situ"** (`.notes-area label`) |
| Placeholder de notas | **"Lo que quieras recordar de aquí…"** (`textarea` shell; **sin persistencia** en F4) |
| Banner "caminar menos" | Texto fijo del `.light-banner` (verde, oculto salvo `body.light-mode`) — transcribir verbatim de `index.html:2377` |
| Bloque `dia-ligera` | Items `lg-see`/`lg-move`/`lg-skip`/`lg-care`/`lg-rest` con su emoji por CSS — texto verbatim de `index.html:2393-2401` |
| Banda de reserva | `.tl-resv-meta` → "✅ **{…}** — {…}" (verbatim; el ✅ es literal en el markup) |
| Prosa de fichas / secciones | **Dato** (`sections[].body`, `desc`, `facts`, `groupIntro`, `trip.sections.*`) renderizado con `<MDC>` |
| Estado vacío | **No aplica** — el contenido está prerenderizado desde datos versionados (siempre hay datos; no hay fetch en runtime ni lista vacía posible) |
| Estado de error | **No aplica en F4** — sin formularios funcionales, sin red en runtime. (El fallback de imagen `@error`→SVG es **F7/UI-05**, no F4: en F4 la imagen es `<img>` plano.) |
| Confirmación destructiva | **No aplica** — sin acciones destructivas en F4 |

**Etiquetas accesibles (paridad de comportamiento, FEAT-06/07/08):**
- `#light-toggle` y `#resumen-toggle`: `aria-pressed` **reactivo** (`:aria-pressed="light"` / `:aria-pressed="resumen"`) — reproduce `setAttribute('aria-pressed', …)` del original.
- Los `.pace-btn` **NO** usan `aria-pressed` (el original usa `.active`): **no añadirlo**.

---

## Inventario de componentes (contrato de paridad por componente)

> Cada componente es una **transcripción 1:1** del markup del `index.html`. El implementador **DEBE leer el rango de línea** antes de escribirlo. Todos: cero CSS, sin `<style scoped>`. Granularidad fijada por CONTEXT D-09/D-10.

### Fichas y prosa

| Componente (NUEVO) | Clase raíz | `index.html` | Contrato de markup |
|--------------------|-----------|--------------|--------------------|
| `MonumentCard` | `.card` (`:id="slug"`) | 2450-2510 | `.card-header` (`.card-roman` + `.card-title`(`h3` + `.card-italian`) + `.card-badge`?) · `.card-artists`/`.card-arch` (links a `#art-*`/`#arq-*`) · `.card-hero > img` **plano** · `.card-section` ×n (1ª con dropcap, resto `.no-dropcap`) · `.facts`(`.facts-row` label/value) · `a.maps-link` · `.sorrentino-box`? · `.culture-box`? · `.notes-area` shell |
| `DetailPhoto` (**`.global.vue`**) | `.detail-photo` | 2479 (inline `:detail-photo{...}`) | `img` **plano** (`src`/`alt`/`loading="lazy"`) + `.detail-photo-caption`. **Componente MDC inline GLOBAL** (ver RESEARCH §Pattern 1: `<MDC>` lo resuelve por `resolveComponent('DetailPhoto')`; en Content v3 debe ser global). D-01: sin `@error`→SVG (eso es F7). |
| (override) `ProseUl`/`ProseLi` **`.global.vue`** | `.detail-list` | 2483 / CSS 799-818 | **Pitfall 1**: las listas "En qué fijarse" están como listas Markdown nativas en el dato; `<MDC>` las renderiza `<ul><li>` **sin** la clase `.detail-list` (✦ + bordes) → divergencia. Recomendación: `ProseUl.global.vue`/`ProseLi.global.vue` que reproduzcan `<ul class="detail-list">`. **El planner debe verificar (grep) que toda lista de prosa de ficha es `detail-list` y que práctica/artist no tienen listas que deban verse distinto.** |

> **Cajas opcionales de ficha:** `.sorrentino-box` (label + texto inline con `<MDC unwrap="p">`); `.culture-box` (`ref-item`/`ref-title`). `guided`/`concert` (Vaticano/Auditorium) **NO tienen CSS especial** → se renderizan como `.card` normal; el `type` solo afecta al marcador del mapa (F7).

### Timeline (despacho por `kind` — D-09, mapea el `discriminatedUnion`)

| Componente (NUEVO) | Clase raíz | `index.html` | Variantes / notas de markup |
|--------------------|-----------|--------------|------------------------------|
| `Timeline` | `.timeline` | 2403-2446 | Itera `day.timeline[]` (orden = dato) y despacha con `<component :is>` por `row.kind`. **Conservar `:data-pace="row.pace"`** por paridad de atributo. |
| `TimelineStop` | `.tl-item` | 2404 (+ `.disabled` 2406, `.fixed-event`, `.reserved-event` 2432) | `.tl-time` + (`a.tl-title[href=#ref]` o `span.tl-title.disabled`) + `.tl-tag`? + `.tl-note`?. **SE FILTRA por ritmo** (`.tl-hidden`). |
| `TimelineTransport` | `.tl-transport` | 2405 (taxi), 2411 (walk), train (1×), metro/metro-b | header + `.tl-transport-modes`(`.tl-transport-mode` con `.recommended`?, icon, desc+tag, meta) + `.tl-transport-footnote`?. **SE FILTRA por ritmo.** Variantes de clase: `taxi`/`walk`/`train`/`metro`/`metro-b` (cada una con su color de borde). |
| `TimelineMeta` | `.tl-meta` | 2407/2410/2413 | `.tl-meta-item` con `.ok`/`.warn`/(plain); 1-2 items. **NO se filtra por ritmo.** |
| `TimelineFood` | `.tl-food` | 2420-2426 / 2434-2444 | `.tl-food-header` + `.tl-food-list`(`.tl-food-item` con `.reserved`?, `a.tl-food-name`, `.tl-resv-badge`/`.tl-food-time`, `.tl-food-desc`) + `.tl-food-foot`. **NO se filtra por ritmo** (aunque el esquema lleve `pace` en `food`). |
| `TimelineReservation` | `.tl-resv-meta` | 2433 | banda verde "✅ **{…}** — {…}" (+ `.tl-resv-tel` mono si hay tel). **NO se filtra por ritmo.** |

### Contenedor de día + secciones de referencia

| Componente (NUEVO) | `index.html` | Contrato |
|--------------------|--------------|----------|
| `DaySection` | sección de día (ej. `#viernes` 2375) | `.light-banner` (CSS-hidden) + `.section-eyebrow` + `.day-header`(day-number + `h2` + `.day-subtitle`) + `.day-stats`(`.day-stats-item` por variant walk/train/taxi/metro/ticket, 355-390) + `.dia-ligera` (CSS-hidden, 812-833) + `Timeline` + `.cards-list`(`day.cards[]`→`monById`→`MonumentCard`, orden = dato, **nunca reordenar**) |
| `ReservasSection` | 5260-5333 | `.section-eyebrow` + `h2.section-title` + `p.gastro-intro` + `.reservas-box`(`.reservas-confirmadas` `h4`+`ul`×2 · `.reservas-box-header` · `.reservas-table`). Filas con `.is-done`? · `td` con `a` + `.reservas-badge.badge-urgent`/`.badge-done`/`.badge-rec` |
| `GastroCard` (+ sección `#gastronomia`) | 5335-5377+ (card 5346-5360) | sección: `.section-eyebrow` + `h2` + `.gastro-intro`(`trip.sections.gastronomia`) + **por grupo** `p.gastro-section-title` + (`groupIntro`?) + `.gastro-grid > GastroCard`. Card: header(`.gastro-card-badge.badge-*` + name + address) + `p.gastro-card-desc` + `.gastro-plato` + footer(span + `.gastro-maps-link`; `.gastro-itinerary-tag`?). **Agrupado por `food.group` preservando orden de aparición — verificar orden vs golden (Pitfall 6).** |
| `PracticaSection` | 5825 | `.section-eyebrow` + `h2` + intro + `sections`(`<MDC>`) + media por category |
| `ArtistCard` (unifica) | arte ~5941 (`art-*`), arquitectura ~6104 (`arq-*`), glosario ~6202 | **Un solo componente** que ramifica por `kind` (`artist`/`arquitectura`/`glossary`). `#arte`: eyebrow + intro(`trip.sections.arte`) + `ArtistCard(kind='artist')` ×n. `#arquitectura`: eyebrow + intro + `ArtistCard(kind='arquitectura')` ×n + `.arq-glosario` (`arch-term` ×10: `<b>término</b><span>def</span>`). |

### Composable + util (NUEVO)

| Pieza (NUEVA) | Contrato |
|---------------|----------|
| `useTripModes` (composable) | `pace`/`light`/`resumen` (vía `useState`, SSR-singleton) + `isVisible(itemPace)`. Aplica `body.light-mode`/`body.modo-resumen` vía `useHead({ bodyAttrs })`. Init desde localStorage **en `onMounted`** (micro-flash intencional, SC#4). `watch(light, on => { if (on) pace='slow' })`. Restaurar `light` **después** de `pace`. Persistir en `watch` **dentro de `onMounted`**. |
| `utils/pace.ts` (función pura) | `isVisible(itemPace, pace)` — extraído para test Vitest puro (9 casos). |
| `TheHero` (**MODIFICAR**) | Cablear los `.pace-btn`/`#light-toggle`/`#resumen-toggle` ya montados (binding `:class="{active}"`, `@click`, `:aria-pressed`) **sin reestructurar el DOM del #inicio**. Quitar el `active` literal del 1er `.pace-btn` y dejar solo el binding. |
| `TripView` (**MODIFICAR**) | Enchufar `DaySection`×5 + las 5 secciones de referencia en las 11 `<section>` vacías. Pasar `monById`/`days`/etc. por props (un solo `useTrip`). |

---

## Contrato del render de prosa — matriz `unwrap` de `<MDC>`

> `<MDC>` envuelve por defecto en `<p>`. `unwrap` (default `false`) quita los wrappers. **Regla:** si el dato va dentro de un contenedor que YA estiliza como bloque → `unwrap="p"`; si el dato ES el bloque de párrafos (prosa de ficha) → **sin unwrap** (lo exige el dropcap). El planner audita campo por campo contra el golden.

| Campo | `unwrap`? | Razón (paridad) |
|-------|-----------|-----------------|
| `monument.sections[].body` | **SIN unwrap** | Multi-párrafo dentro de `.card-section`; el dropcap necesita `<p>` reales (Pitfall 2) |
| `monument.sorrentino.text` | `unwrap="p"` | El original mete el texto directo en `.sorrentino-box` tras el label, sin `<p>` |
| `DetailPhoto` caption | `unwrap="p"` (seguro) o `{{ caption }}` si es texto plano | Caption inline dentro de `.detail-photo-caption` |
| `reservas.confirmed[].text`, `reservas.table[].desc` | `unwrap="p"` | Dentro de `<li>`/`<td>` |
| `gastro-card-desc`, `gastro-plato` | `unwrap="p"` (clase en el contenedor propio) | El contenedor lleva la clase; MDC va dentro sin `<p>` |
| `tl-note`, `tl-food-desc`, `tl-meta-item`, footnotes, modos-desc | `unwrap="p"` | Fragmentos inline dentro de spans/divs ya estilizados |

---

## Contrato de interacción — los 3 modos (FEAT-06/07/08)

> Lógica portada **1:1** de `index.html` (`setPace` 6505-6535, `setLightMode` 6546-6556, `setResumen` 6564-6572). Conducida por clases CSS verbatim vía binding reactivo (nunca `classList`/`querySelectorAll`). Claves localStorage **literales existentes**.

### Ritmo (FEAT-06) — matriz EXACTA (contraintuitiva, no "corregir")

| `pace` | `.tl-item`/`.tl-transport` con `data-pace="all"` | `…="medium"` | `…="slow-only"` |
|--------|:---:|:---:|:---:|
| `optimistic` (default, prerenderizado) | visible | visible | visible |
| `neutral` | visible | visible | **oculto** (`.tl-hidden`) |
| `slow` | visible | **oculto** | **oculto** |

- **Solo `.tl-item` y `.tl-transport` se filtran.** `.tl-meta`/`.tl-food`/`.tl-resv-meta` **NUNCA** se filtran por ritmo (Pitfall 4).
- Ocultar = clase `.tl-hidden` (`display:none !important`, leaflet.css:731) vía `:class="{ 'tl-hidden': !isVisible(row.pace) }"`.
- Persistencia: `roma-pace` (`'optimistic'|'neutral'|'slow'`).
- Control: los 3 `.pace-btn` (`data-pace=…`), estado visual con `.active` (no `aria-pressed`).

### Caminar menos (FEAT-07)

- Activar → `body.light-mode` **y** fuerza `pace='slow'` **y** muestra `.dia-ligera` + `.light-banner` (ambos `display:none` salvo `body.light-mode`).
- **Desactivar → NO revierte el ritmo** (se queda en slow). `watch(light, on => { if (on) pace='slow' })` — solo en `on===true` (Pitfall 5).
- `#light-toggle`: `:aria-pressed="light"` reactivo. Toggle visual del switch por CSS (`body.light-mode .light-toggle …`).
- Persistencia: `roma-light` (`'1'`/`'0'`).

### Resumen (FEAT-08)

- `body.modo-resumen` → el CSS oculta (leaflet.css:793-798): `.day-stats`, `.day-subtitle`, `.dia-ligera`, `.tl-meta`, `.tl-transport`, `.cards-list`. **Toda la lógica es CSS.**
- Mantiene visibles: `.tl-item`, `.tl-food`, `.tl-resv-meta` (vista índice de hora+lugar).
- `#resumen-toggle`: `:aria-pressed="resumen"` reactivo.
- Persistencia: `roma-resumen` (`'1'`/`'0'`).

### Micro-flash de 1 frame (SC#4 — INTENCIONAL, preservar)

- SSR/hidratación renderizan el **estado default** (`optimistic`/`false`/`false`) = HTML prerenderizado → cero mismatch.
- El estado guardado se aplica **1 frame tras montar** (en `onMounted`) → el flash de 1 frame que el original tiene **se conserva**. **No** añadir script inline para los modos (Pitfall 3).
- Tolerar el único error de hidratación esperado de color-mode (D2, heredado F3); fallar ante cualquier otro.

---

## Gotchas de paridad (riesgo real — el planner DEBE resolver)

| # | Riesgo | Mitigación |
|---|--------|------------|
| **Pitfall 1** | Listas de prosa pierden `.detail-list` (✦ + bordes) → bullets por defecto | `ProseUl.global.vue`/`ProseLi.global.vue` que reproduzcan `<ul class="detail-list">`; verificar con grep |
| **Pitfall 2** | Dropcap se pierde (con `unwrap`) o se duplica (sin `.no-dropcap` en secciones 2..n) | `sections[].body` **sin unwrap** + `:class="{ 'no-dropcap': i !== 0 }"` |
| **Pitfall 3** | Mismatch de hidratación / flash mal reproducido | default = prerenderizado; restaurar en `onMounted`; sin script inline para modos |
| **Pitfall 4** | Matriz de ritmo "corregida" o aplicada a filas equivocadas | copiar `isVisible` literal; aplicar SOLO en stop/transport |
| **Pitfall 5** | "Caminar menos" revierte ritmo al desactivar | `watch(light, on => { if (on) pace='slow' })` (sin else) |
| **Pitfall 6** | Orden de grupos de gastro / fichas ≠ golden | `day.cards` en orden de dato; verificar orden de grupos vs golden; ordenar explícito si difiere |
| `<style scoped>` | `data-v-*` rompe selectores globales descendientes | **CERO CSS, sin scoped** en todos los componentes |
| `maps-link` href | `encodeURIComponent` puede no reproducir el escaping exacto (apóstrofos/acentos) | verificar fichas con `'` (Sant'Eustachio) contra el original (A4) |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | ninguno | not applicable (shadcn no se usa) |
| third-party | ninguno | not applicable |

> shadcn/registries **no aplican**: este proyecto usa CSS a mano verbatim y componentes Vue propios. F4 **no instala ningún paquete** (todo el stack está en F1/F2). Gate de registro: no aplicable.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS — copy = literal del original / dato; CTA "Ver en Google Maps", "Notas in situ"; sin estados vacío/error/destructivo aplicables (justificado)
- [ ] Dimension 2 Visuals: PASS — componentes = markup+clases verbatim, cero CSS, sin scoped; emoji/glifos como en el original
- [ ] Dimension 3 Color: PASS — solo custom properties existentes + literales semánticos verbatim; acento con lista reservada explícita
- [ ] Dimension 4 Typography: PASS — roles tipográficos bloqueados (Lora/Cormorant/JetBrains Mono); dropcap con `<p>` real + `.no-dropcap`
- [ ] Dimension 5 Spacing: PASS — escala `rem`/`em` editorial bloqueada (NO 8-point); componentes no fijan spacing
- [ ] Dimension 6 Registry Safety: PASS — no aplicable (sin shadcn/registries/paquetes nuevos)

**Nota para el checker:** las dimensiones de "diseño nuevo" (escala de 8 puntos, 60/30/10 prescriptivo, registry shadcn) **no aplican literalmente** a una migración de paridad con CSS verbatim bloqueado. El criterio de PASS aquí es **"el contrato documenta fielmente el sistema existente y prohíbe drift"**, no "el contrato propone un diseño conforme a una rúbrica greenfield".

**Approval:** pending
