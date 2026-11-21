---
phase: "12"
slug: "formas-nuevas-de-viaje"
status: approved
reviewed_at: "2026-11-21"
shadcn_initialized: false
preset: none
created: "2026-11-21"
---

# Phase 12 — UI Design Contract

> Contrato visual y de interacción de las **formas nuevas** que necesita un viaje como Campania y que Roma nunca tuvo: bloque de alternativas (`choice`), línea «Dormís en…», cinco transportes nuevos, lugares de naturaleza (marcador + 4 dibujos de reserva), caja «Con niños» y ruta del día por modo. Todo se prueba con el esqueleto `campania` (`draft: true`). **Roma no cambia ni un píxel**: 56 goldens sin `--update-snapshots`.
>
> Generado en modo `--auto` (usuario de viaje, sin preguntas). Fuentes: CONTEXT.md D-01…D-19, RESEARCH.md (Patterns 3-8, Pitfalls 1, 5, 8, 15) y el CSS existente (`tokens.css`, `base.css` y `leaflet.css` solo como referencia, `multitrip.css`, `svgMotifs.ts`). Las decisiones propias de este documento van marcadas **[auto]** y se confirman en `/gsd-verify-work 12`.

**Reglas duras de esta fase (aplican a todo lo que sigue):**
1. **`app/assets/css/{tokens,base,fonts,leaflet}.css` no se tocan** (D-17). Tampoco `multitrip.css`, salvo que no hace falta: su guardián `.trip-index` sigue igual.
2. **Todo el CSS nuevo vive en `app/assets/css/tripshapes.css`**, añadido **el último** en `css[]` de `nuxt.config.ts` (después de `multitrip.css`). **Cada** selector de ese fichero contiene al menos una clase de la lista `NEW_CLASSES` (ver abajo). Prohibidos `[data-theme…]`, `:root`, `html`, `body`, `:not(`, `:is(`, `:where(`, `:has(`. El tema oscuro llega solo por los tokens y por `color-mix(…, var(--ink))`.
3. **Nada de `<style scoped>`, `style=""` en plantillas Vue ni `v-html` nuevo.** La única excepción preexistente es el `v-html` de `motifSvg` (constante de confianza) y el `style` inline de los popups/`divIcon` de Leaflet, que se generan en `mapMarkers.ts` como hasta ahora.
4. **Ningún `<section>` en el markup nuevo** (el scrollspy toma todas las `<section>`, H25). Raíces `<div>`.
5. **Sin `@click` en anclas de navegación** (`<a href="#slug">` del popup `nature`, enlaces Markdown dentro de opciones): ancla plana (aprendizaje CR-01).
6. **`.tl-transport.train` no recibe regla** (Pitfall 1: el `martes` de Roma lo pinta con el estilo base por diseño).

`NEW_CLASSES` (lista cerrada; un test comprueba que ninguna aparece como token de `class` en ningún HTML de `.output/public`, y que cada selector de `tripshapes.css` contiene una):
`tl-choice`, `tl-choice-heading`, `tl-choice-option`, `tl-choice-label`, `tl-choice-title`, `tl-choice-sep`, `day-stay`, `day-stay-name`, `family-box`, `ferry`, `car`, `bus`, `bike`, `plane`.
La comparación es por token completo (`car` ≠ `card`).

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (CSS a mano; las custom properties de `app/assets/css/tokens.css` son el sistema de tokens) |
| Preset | not applicable |
| Component library | none (componentes Vue propios en `app/components/`) |
| Icon library | none. Glifos emoji como en el resto de la guía (`.day-stats-item::before`, `.day-route-btn::before`): ⛴️ 🚗 🚌 🚲 ✈️ 🛏️; tipográficos `—` U+2014, `→` U+2192 |
| Font | Cormorant Garamond (titulares, etiquetas, cursivas de cabecera) + Lora (cuerpo) + JetBrains Mono (tramos de transporte, heredado); self-hosted en `fonts.css`. Pila exacta a repetir en `tripshapes.css`: `'Cormorant Garamond', 'Garamond', 'Hoefler Text', 'Times New Roman', serif` |

shadcn gate: no aplica. El proyecto es Vue/Nuxt, no React, y CLAUDE.md prohíbe Tailwind, UnoCSS y cualquier sistema que reescriba el CSS. `components.json` no existe (comprobado con `ls components.json` el 2026-11-21: no such file). Las secciones Component Inventory y Registry se omiten por `Tool: none`, igual que en la Fase 11.

### Componentes de la fase

| Componente / fichero | Cambio | Lo que NO cambia |
|----------------------|--------|------------------|
| `app/components/TimelineChoice.vue` (nuevo) **[auto: nombre]** | Pinta una fila `kind: 'choice'` (ver Contrato de DOM). Raíz `div.tl-choice`. Reutiliza `<Timeline :rows="opt.rows" />` para las filas de cada opción | — |
| `app/components/Timeline.vue` | Solo una entrada nueva en `COMPONENT_BY_KIND`: `choice: resolveComponent('TimelineChoice')` | Envoltorio `div.timeline`, iteración, `:key`, sin filtro por ritmo |
| `app/components/DaySection.vue` | Prop opcional `stay`; línea `div.day-stay`; botón de ruta con `routeCards`/`routeVisible`/`buildDirUrl(…, mode)`/`routeTitle(mode)` | Texto del botón (`routeLabel`), glifo 🗺️, `target`/`rel`, cabecera y stats de Roma |
| `app/components/TripView.vue` | Pasa `:stay="stayFor(e.day, trip?.stays)"` | Todo lo demás |
| `app/components/MonumentCard.vue` | Caja `div.culture-box.family-box` si `monument.family` | Orden y marcado de todas las fichas sin `family` (todas las de Roma) |
| `app/utils/mapMarkers.ts` | `MARKER_STYLE: Record<PlaceType, { bg }>` + `markerPopupHtml(m)`; entrada `nature` | Colores y las tres plantillas de popup de Roma, byte a byte |
| `app/components/LeafletMap.client.vue` | Lee color y popup de `mapMarkers.ts` | `setView` + `fitBounds(...).pad(0.1)`, `divIcon` 32×32 |
| `app/utils/svgMotifs.ts` | 4 SVG nuevos: `sea`, `thermal`, `river`, `trail` | Los 19 SVG existentes, verbatim |
| `app/assets/css/tripshapes.css` (nuevo) | Todas las reglas de esta fase (ver «tripshapes.css — reglas exactas») | — |

---

## Spacing Scale

Valores **nuevos** (solo en `tripshapes.css`, todos múltiplos de 4; base 1rem = 16px). Mobile-first; un único punto de corte `@media (min-width: 640px)`, el mismo de `.card` y de la portada.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Separación etiqueta → título de opción; padding inferior del bloque `choice` (el último `.tl-item` interior ya aporta ~30px) |
| sm | 8px | Margen superior del bloque `choice`; padding lateral del bloque en móvil; margen bajo el encabezado «Elige una»; margen superior del `div.timeline` anidado; padding horizontal de la píldora de etiqueta; `margin-right` de los glifos (`.day-stay::before`, glifo de cabecera de transporte) |
| md | 16px | Padding superior del bloque `choice` (todas las anchuras) y lateral ≥640px; margen vertical del separador «— o bien —»; `top` del punto del bloque en la línea del timeline |
| lg | 24px | No se usa en esta fase |
| xl | 32px | Margen inferior del bloque `choice` (igual que el ritmo de `.tl-item` + `.tl-transport` de Roma) |
| 2xl | 48px | No se usa en esta fase |
| 3xl | 64px | No se usa en esta fase |

Todo valor de espaciado nuevo pertenece al conjunto estándar (4, 8, 16, 32). No hay valores intermedios.

Exceptions (geometría heredada de Roma, no son espaciado nuevo):
- `.tl-choice::before` (el punto del bloque sobre la línea vertical del timeline) reutiliza la geometría congelada de `.tl-item::before`: `left: calc(-1.55rem - 1px)`, `width/height: 9px`, `border: 2px`. El `- 1px` compensa el borde de 1px del bloque para que el punto caiga exactamente donde caen los de las paradas.
- El `div.timeline` anidado conserva `padding-left: 1.75rem` de `base.css` (no se sobrescribe): la posición de los puntos de las paradas interiores depende de ese valor.
- Bandas de transporte nuevas, caja «Con niños» y línea «Dormís en»: **sin** espaciado nuevo; heredan márgenes y paddings de `.tl-transport`, `.culture-box` y `h2` + `.day-subtitle`.
- `border-radius`: 6px el bloque `choice` (igual que `.card`), 99px la píldora de etiqueta (igual que `.tl-tag` y `.day-route-btn`).

---

## Typography

Tres tamaños nuevos y dos pesos, los tres **ya presentes** en la escala de Roma (no se inventa ninguno). El cuerpo (`body`: Lora 17px, `line-height: 1.65`) y los textos de transporte, caja de cultura y stats se heredan de `base.css`.

| Role | Size | Weight | Line Height | Dónde |
|------|------|--------|-------------|-------|
| Label | 13.6px (.85rem) | 600 (Cormorant Garamond) | 1.5 | `div.tl-choice-heading` «ELIGE UNA» (versalitas por `text-transform: uppercase`, `letter-spacing: .2em`, como `.section-eyebrow`); `div.tl-choice-label` «Opción A» (cursiva, `letter-spacing: .05em`, como `.culture-box .label`); `span.label` «Con niños» (heredado de `.culture-box .label`) |
| Secondary | 16.8px (1.05rem) | 400 cursiva (Cormorant Garamond) | 1.5 | `div.day-stay` «Dormís en …» (mismo tamaño y estilo que `.day-subtitle`); `div.tl-choice-sep` «— o bien —» |
| Heading | 19.2px (1.2rem) | 600 (Cormorant Garamond) | 1.3 | `div.tl-choice-title` (igual que `.tl-title` de una parada: la opción se lee como una parada «grande») |
| Body | 17px (16px ≤540px, heredado) | 400 (Lora) | 1.65 | Texto de las filas interiores y cuerpo de la caja «Con niños» (`.culture-box`: 15.6px, heredado) |

Pesos usados en lo nuevo: **400** (cursiva secundaria, cuerpo) y **600** (etiquetas, título de opción, nombre de la base en `span.day-stay-name`). Ningún 500 ni 700 nuevos.

Por qué Secondary (16.8px) y Body (17px) no se fusionan:
- Los dos tamaños vienen de Roma: 16.8px es `.day-subtitle` (base.css) y 17px es `body`. Esta fase solo los reutiliza.
- No hacen el mismo papel. Secondary es Cormorant Garamond cursiva, que a igual tamaño en px se ve bastante más pequeña que Lora redonda. Body es Lora.
- `.day-stay` va pegada a `.day-subtitle` en la cabecera del día. Si se fusionara con Body (17px, 16px ≤540px), las dos líneas cursivas contiguas tendrían tamaños distintos.

Tamaños heredados que la fase no declara ni toca: 15.6px (`.92rem`) del cuerpo de `.culture-box`, que hereda la caja «Con niños»; 12.5px (`.78rem`) JetBrains Mono de `.tl-transport`; 14.7px (`.92rem`) de `.tl-transport-header` y `.day-stats`. Son medidas de Roma en `base.css` y no forman parte de la escala nueva.

---

## Color

Tokens de `tokens.css` (claro / oscuro vía `[data-theme="dark"]`, que aplica `@nuxtjs/color-mode`). Los tonos nuevos de transporte salen de **hex que ya existen** en `base.css`/`leaflet.css`/`svgMotifs.ts`; el borde se mezcla un 25% con `var(--ink)` para que gane contraste en los dos temas sin selector `[data-theme]` **[auto]**.

| Role | Value (claro / oscuro) | Usage |
|------|------------------------|-------|
| Dominant (60%) | `--bg` #f5f0e8 / #1a1612 | Fondo de la página y del bloque `choice` (sin relleno propio: transparente) |
| Secondary (30%) | `--bg-elev` #fbf7f0 / #221d18 · `--bg-soft` | Fichas (heredado), banda de stats (heredado) |
| Accent (10%) | `--accent` #8b3a3a / #c4665a | Ver lista reservada |
| Texto | `--ink` #2a2520 / #e8dfd0 | `div.tl-choice-title`, `span.day-stay-name` |
| Texto secundario | `--ink-soft` #5c534a / #b8aa95 | `div.day-stay`, `div.tl-choice-sep`, `div.tl-choice-label` |
| Ornamento | `--gold` #a07c4a / #c4a373 · `--gold-soft` | Píldora de etiqueta (`--gold` 14%), punto del bloque (`--gold`), borde discontinuo del bloque (`--gold-soft`) |
| Destructive | none | La fase no tiene acciones destructivas |

Accent reserved for (lista cerrada; lo que ya era acento en Roma sigue igual):
1. Texto del encabezado `div.tl-choice-heading` («ELIGE UNA» o el `heading` del dato).
2. Fondo del botón «Ver ruta del día» (regla existente `.day-route-btn`, sin cambios).
3. Color de los puntos de las paradas interiores (regla existente `.tl-item::before`, sin cambios).

Nada más de lo nuevo usa `--accent`: ni las bandas de transporte (el coche **no** usa acento, para no confundirlo con `.tl-food`, que ya usa `--accent-soft`), ni la caja «Con niños», ni la línea «Dormís en».

### Transportes nuevos (EXT-03, D-09) **[auto: tonos y glifos]**

Fondo = `color-mix(in srgb, TONO 10%, transparent)` (8% para `plane`). Borde izquierdo (2px, heredado) = `color-mix(in srgb, TONO 75%, var(--ink))`. Glifo = `::before` en `.tl-transport-header` y en `.day-stats-item`.

| Variante | Tono (origen) | Glifo | Borde claro → contraste con `--bg` | Borde oscuro → contraste con `--bg` | `--ink-soft` sobre la banda (claro / oscuro) |
|----------|---------------|-------|------------------|------------------|------------------|
| `ferry` | #2c5aa0 (azul de `.tl-transport.metro-b`) | ⛴️ | #2c4d80 → 7,49:1 | #5b7bac → 4,19:1 | 5,75 / 7,42 |
| `car` | #8b6c43 (tierra de los motifs, `st_*`) | 🚗 | #735a3a → 5,68:1 | #a28966 → 5,40:1 | 5,90 / 7,18 |
| `bus` | #d4801a (naranja de `.tl-transport.metro`) | 🚌 | #aa691c → 3,90:1 | #d99848 → 7,30:1 | 6,05 / 6,92 |
| `bike` | #2e7d4f (verde de `body.light-mode`) | 🚲 | #2d6743 → 5,91:1 | #5d966f → 5,16:1 | 5,86 / 7,25 |
| `plane` | `var(--ink-faint)` (gris neutro, «cielo») | ✈️ | #72695f → 4,73:1 | #968b7b → 5,37:1 | 6,12 / 7,34 |

Todos los bordes superan 3:1 (componente no textual, WCAG 1.4.11) en los dos temas; el texto de la banda supera 4,5:1. Las cinco bandas tienen tonos distintos entre sí y del verde oliva `#5a7a3a` de `taxi`. El glifo de la cabecera duplica la información del color (nunca solo color).

**Regla de autoría** (para Fase 13): en un tramo con `variant` nuevo, `header` **no** empieza por el mismo emoji; el CSS ya lo antepone.

### Marcador `nature` (EXT-04, D-11) **[auto]**

| Pieza | Valor |
|-------|-------|
| `MARKER_STYLE.nature.bg` | `#2f6f73` (verde agua). Numeral `#fbf7f0` sobre él: 5,40:1 (los de Roma: card 7,11, concert 4,59, guided 3,59) |
| `divIcon` | Idéntico a los demás (32×32, borde `#fbf7f0` 2px, Cormorant 600 .85rem, numeral = `roman` del dato) |
| Popup | `<strong>${name}</strong><br><em style="color:#2f6f73">${day}</em><br><a href="#${id}" style="color:#2f6f73">Abrir ficha →</a>` — misma forma que `concert` con su propio color; `#2f6f73` sobre el blanco del popup de Leaflet: 5,77:1. Ancla plana, **sin** handler |
| Roma | Los tres colores (`#8b3a3a`, `#a07c4a`, `#5a7a3a`) y las tres plantillas de popup quedan fijados byte a byte en `tests/unit/mapMarkers.spec.ts` |

`#2f6f73` es el mismo tono «agua profunda» de los cuatro dibujos nuevos (ver Motifs), de modo que marcador y dibujo de reserva de un lugar de naturaleza comparten color.

### Caja «Con niños» (EXT-07, D-12) **[auto]**

Clases `culture-box family-box`: hereda caja, padding, radio, tamaño y `.label` de `.culture-box`; `tripshapes.css` solo cambia el tono a verde oliva `#5a7a3a` (el de `.tl-meta-item.ok`: «apto, sin problema»).

| Pieza | Valor | Contraste (claro / oscuro) |
|-------|-------|----------------------------|
| Fondo | `color-mix(in srgb, #5a7a3a 7%, transparent)` | — |
| Borde izquierdo (3px, heredado) | `color-mix(in srgb, #5a7a3a 75%, var(--ink))` | — |
| `.label` «Con niños» | `color-mix(in srgb, #5a7a3a 75%, var(--ink))` → #4e6534 / #7e9360 | 5,60 / 4,64 |
| Cuerpo | `--ink-soft` (heredado) | 6,47 / 6,86 |

### Bloque `choice` y «Dormís en» — contraste

| Pieza | Contraste (claro / oscuro) |
|-------|----------------------------|
| `div.tl-choice-heading` `--accent` sobre `--bg` | 6,70 / 4,62 |
| `div.tl-choice-label` `--ink-soft` sobre píldora (`--gold` 14%) | 5,74 / 6,22 |
| `div.tl-choice-title` y `span.day-stay-name` `--ink` sobre `--bg` | 13,38 / 13,62 |
| `div.tl-choice-sep` y `div.day-stay` `--ink-soft` sobre `--bg` | 6,63 / 7,90 |
| Borde discontinuo `--gold-soft` | decorativo (la estructura la dan encabezado, etiquetas y separador, no el borde) |

Calculado con la fórmula de luminancia relativa de WCAG (script en el scratchpad de la sesión, 2026-11-21).

---

## tripshapes.css — reglas exactas

El ejecutor implementa exactamente esto (orden y valores). Cada selector contiene una clase de `NEW_CLASSES`.

```css
/* Formas nuevas de viaje (Fase 12, D-17). Cada selector exige una clase de NEW_CLASSES, que
   nunca aparece en el DOM de Roma. Tema oscuro solo vía tokens: sin [data-theme], :root, html, body. */

/* EXT-03 — tramos nuevos: banda (fondo + borde izquierdo) */
.tl-transport.ferry { background: color-mix(in srgb, #2c5aa0 10%, transparent); border-left-color: color-mix(in srgb, #2c5aa0 75%, var(--ink)); }
.tl-transport.car   { background: color-mix(in srgb, #8b6c43 10%, transparent); border-left-color: color-mix(in srgb, #8b6c43 75%, var(--ink)); }
.tl-transport.bus   { background: color-mix(in srgb, #d4801a 10%, transparent); border-left-color: color-mix(in srgb, #d4801a 75%, var(--ink)); }
.tl-transport.bike  { background: color-mix(in srgb, #2e7d4f 10%, transparent); border-left-color: color-mix(in srgb, #2e7d4f 75%, var(--ink)); }
.tl-transport.plane { background: color-mix(in srgb, var(--ink-faint) 8%, transparent); border-left-color: color-mix(in srgb, var(--ink-faint) 75%, var(--ink)); }

/* EXT-03 — glifo en la cabecera del tramo */
.tl-transport.ferry .tl-transport-header::before { content: "⛴️"; }
.tl-transport.car .tl-transport-header::before   { content: "🚗"; }
.tl-transport.bus .tl-transport-header::before   { content: "🚌"; }
.tl-transport.bike .tl-transport-header::before  { content: "🚲"; }
.tl-transport.plane .tl-transport-header::before { content: "✈️"; }
.tl-transport.ferry .tl-transport-header::before,
.tl-transport.car .tl-transport-header::before,
.tl-transport.bus .tl-transport-header::before,
.tl-transport.bike .tl-transport-header::before,
.tl-transport.plane .tl-transport-header::before { font-style: normal; margin-right: 8px; }

/* EXT-03 — glifo de la banda de stats (tamaño heredado de .day-stats-item::before) */
.day-stats-item.ferry::before { content: "⛴️"; }
.day-stats-item.car::before   { content: "🚗"; }
.day-stats-item.bus::before   { content: "🚌"; }
.day-stats-item.bike::before  { content: "🚲"; }
.day-stats-item.plane::before { content: "✈️"; }

/* EXT-02 — «Dormís en …» (fuera de .day-subtitle: visible en modo resumen) */
.day-stay {
  font-family: 'Cormorant Garamond', 'Garamond', 'Hoefler Text', 'Times New Roman', serif;
  font-style: italic;
  font-size: 1.05rem;
  line-height: 1.5;
  color: var(--ink-soft);
  margin: 0;
}
.day-stay::before { content: "🛏️"; font-style: normal; margin-right: 8px; }
.day-stay .day-stay-name { color: var(--ink); font-weight: 600; }

/* EXT-01 — bloque de alternativas */
.tl-choice {
  position: relative;
  margin: 8px 0 32px;
  padding: 16px 8px 4px;
  border: 1px dashed var(--gold-soft);
  border-radius: 6px;
  overflow-wrap: break-word;
}
.tl-choice::before {
  content: "";
  position: absolute;
  left: calc(-1.55rem - 1px); top: 16px;
  width: 9px; height: 9px;
  border-radius: 50%;
  background: var(--bg);
  border: 2px solid var(--gold);
}
.tl-choice .tl-choice-heading {
  font-family: 'Cormorant Garamond', 'Garamond', 'Hoefler Text', 'Times New Roman', serif;
  font-size: .85rem; font-weight: 600; line-height: 1.5;
  letter-spacing: .2em; text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 8px;
}
.tl-choice .tl-choice-label {
  display: inline-block;
  font-family: 'Cormorant Garamond', 'Garamond', 'Hoefler Text', 'Times New Roman', serif;
  font-style: italic; font-size: .85rem; font-weight: 600; line-height: 1.5;
  letter-spacing: .05em;
  color: var(--ink-soft);
  background: color-mix(in srgb, var(--gold) 14%, transparent);
  padding: 0 8px;
  border-radius: 99px;
}
.tl-choice .tl-choice-title {
  font-family: 'Cormorant Garamond', 'Garamond', 'Hoefler Text', 'Times New Roman', serif;
  font-size: 1.2rem; font-weight: 600; line-height: 1.3;
  color: var(--ink);
  margin-top: 4px;
}
.tl-choice .tl-choice-sep {
  font-family: 'Cormorant Garamond', 'Garamond', 'Hoefler Text', 'Times New Roman', serif;
  font-style: italic; font-size: 1.05rem; line-height: 1.5;
  color: var(--ink-soft);
  text-align: center;
  margin: 16px 0;
}
.tl-choice .timeline { margin-top: 8px; }
@media (min-width: 640px) {
  .tl-choice { padding: 16px 16px 4px; }
}

/* EXT-07 — «Con niños», derivada de .culture-box (especificidad 0,2,0 / 0,3,0 > base) */
.culture-box.family-box {
  background: color-mix(in srgb, #5a7a3a 7%, transparent);
  border-left-color: color-mix(in srgb, #5a7a3a 75%, var(--ink));
}
.culture-box.family-box .label { color: color-mix(in srgb, #5a7a3a 75%, var(--ink)); }
```

Por qué cada anulación:
- `.tl-choice .timeline { margin-top: 8px }`: el `margin-top: 2rem` global de `.timeline` separaría demasiado el título de opción de su primera parada.
- `.day-stay { margin: 0 }`: el ritmo ya lo dan `h2 { margin-bottom: .5rem }` y `.day-subtitle { margin-top: .5rem }`, así que queda 8px por encima y 8px por debajo.
- `.culture-box.family-box`: 0,2,0 vence a `.culture-box` 0,1,0, y `.culture-box.family-box .label` 0,3,0 vence a `.culture-box .label` 0,2,0. No depende del orden de carga.
- Ninguna regla usa `!important`. El modo resumen y el ritmo siguen mandando sobre las filas interiores con sus `!important` existentes.

---

## Contrato de DOM

### Bloque de alternativas (`TimelineChoice.vue`, EXT-01, D-01…D-05)

```html
<!-- dentro de div.timeline del día, en la posición de la fila en day.timeline -->
<div class="tl-choice" role="group" aria-label="Elige una">
  <div class="tl-choice-heading">Elige una</div>              <!-- o <MDC :value="row.heading"> -->
  <div class="tl-choice-option">
    <div class="tl-choice-label">Opción A</div>              <!-- {{ opt.label }}, texto plano -->
    <div class="tl-choice-title"><!-- <MDC :value="opt.title" :tag="false" unwrap="p" /> --></div>
    <div class="timeline"><!-- <Timeline :rows="opt.rows" />: filas normales --></div>
  </div>
  <div class="tl-choice-sep">— o bien —</div>                 <!-- solo ENTRE opciones (i > 0) -->
  <div class="tl-choice-option">
    <div class="tl-choice-label">Opción B</div>
    <div class="tl-choice-title">…</div>
    <div class="timeline">…</div>
  </div>
</div>
```

| Regla | Detalle |
|-------|---------|
| Raíz | `<div class="tl-choice">`, **nunca** `<section>` (D-02, H25). Ningún `<section>`, `<h2>`/`<h3>` ni `id` dentro |
| Encabezado | Sin `heading` en el dato → texto fijo `Elige una`. Con `heading` → `<MDC :value="row.heading" :tag="false" unwrap="p" />`. Se ve en versalitas por CSS; el `textContent` conserva la caja del dato («Elige una») |
| `aria-label` | `row.heading ? inlineMdToPlain(row.heading) : 'Elige una'` (helper existente de `app/utils/tripLayout.ts`). `role="group"` agrupa las opciones para el lector de pantalla |
| Orden | Opciones en el orden del dato; `div.tl-choice-sep` entre cada par: 2 opciones → 1 separador, 3 opciones → 2 separadores. Nunca antes de la primera ni después de la última |
| Etiqueta | `{{ opt.label }}`: interpolación de texto plano, sin Markdown, sin `v-html` |
| Filas | `<Timeline :rows="opt.rows" />`, el mismo despachador. Cada fila interior conserva su `pace`, su `.tl-hidden` y su comportamiento en modo resumen (D-03) |
| Visibilidad | El bloque, el encabezado, las etiquetas, los títulos y los separadores son **siempre visibles**: con cualquier ritmo, con «Caminar menos» y en modo resumen. Ninguna regla de ocultación los nombra |
| Opción vacía por ritmo | Si el ritmo oculta todas las filas de una opción, su etiqueta y su título siguen visibles. El `div.timeline` interior queda vacío (8px de margen) y **no** hay texto de relleno |
| Sin interacción | Ningún botón, pestaña ni selector: las dos opciones se leen apiladas (el selector con memoria es TRIP-02, aplazado). Los enlaces `#ficha` de las filas interiores funcionan igual que en una fila normal (ancla plana) |
| Fichas en opciones | Una ficha citada dentro de una opción conserva su marcador, su numeral y su lugar en la lista de fichas del día (D-05). Sin marca visual de «opción A/B» en la ficha |

**Jerarquía visual de un día con `choice`** **[auto]**:
1. **Foco principal: el `h2` del día.** Es el titular más grande (Cormorant 500, `clamp(1.8rem, 4.5vw, 2.4rem)`) y no cambia. Ningún elemento nuevo compite con él en tamaño.
2. **Foco secundario: el encabezado «ELIGE UNA».** Es el único texto en acento dentro del timeline del día, en versalitas espaciadas, y lo enmarca el borde discontinuo dorado. Marca el punto donde el recorrido se bifurca.
3. **Terciario: los títulos de opción** (19.2px 600, el mismo peso visual que una parada). Todas las opciones tienen el mismo tratamiento: ninguna se destaca sobre la otra, porque la guía no recomienda una.

### Línea «Dormís en…» (`DaySection.vue`, EXT-02, D-06…D-08)

```html
<div class="day-header">
  <div class="day-number">II</div>
  <div>
    <h2>…</h2>
    <div class="day-stay">Dormís en <span class="day-stay-name"><!-- <MDC :value="stay.name" :tag="false" unwrap="p" /> --></span></div>
    <div class="day-subtitle">…</div>
  </div>
</div>
```

| Regla | Detalle |
|-------|---------|
| Posición **[auto]** | Dentro del `<div>` interior de `.day-header`, **después** del `<h2>` y **antes** de `.day-subtitle` |
| Texto | `Dormís en` + un espacio U+0020 + el `name` de la base (Markdown inline). Sin punto final. El glifo 🛏️ lo pone el CSS (`::before`): no está en el `textContent` |
| Campos que no se pintan | `stays[].area`, `stays[].note` y `stays[].coords` se guardan pero **no** se muestran en esta fase (D-08) |
| Sin `stay` | El día no muestra nada: ni el `div`, ni texto de relleno («—», «Sin alojamiento»). Roma no define `stays`, así que su DOM solo gana el comentario vacío `<!---->` de Vue, que no se pinta |
| Modo resumen **[auto]** | **Visible.** Clase propia, fuera de `.day-subtitle` (que el resumen oculta, Pitfall 15): saber dónde se duerme es información de índice |

### Tramos de transporte (EXT-03)

Sin cambio de componente: `TimelineTransport.vue` ya pone `row.variant` como clase, y `DaySection.vue` ya pone `s.variant`. El contrato es solo CSS (arriba) más los enums `TransportVariant`/`StatVariant`. Un tramo `ferry` dentro de una opción se pinta igual que uno de primer nivel.

### Botón «Ver ruta del día» (EXT-06, D-04, D-14)

| Caso | Resultado |
|------|-----------|
| Día sin `route` y sin ferry (Roma, todos los días) | Igual que hoy: `travelmode=walking`, mismo `href`, `title="Abre Google Maps con el recorrido del día a pie"`, mismo texto |
| `route.mode: driving` | `travelmode=driving`; `title="Abre Google Maps con el recorrido del día en coche"` |
| `route.mode: transit` | `travelmode=transit`; `title="Abre Google Maps con el recorrido del día en transporte público"` |
| Algún tramo `ferry` (también dentro de una opción) y sin `route.enabled: true` | **No se renderiza** el `<a>`. Sin mensaje sustituto ni hueco: la banda de stats fluye igual que un día con menos de 2 paradas |
| `route.enabled: false` | No se renderiza |
| `route.enabled: true` con un ferry | Se renderiza, si hay ≥ 2 paradas |
| < 2 paradas compartidas | No se renderiza, haya o no `enabled: true` |
| Día con `choice` | Las paradas que solo están dentro de opciones **no** cuentan. El texto `Ver ruta del día (N paradas)` usa N = paradas compartidas |
| Texto, glifo, forma | Sin cambios: `routeLabel(n)` (con tope de 10), `::before` 🗺️, píldora de acento, `target="_blank" rel="noopener"`. El modo solo cambia `href` y `title` **[auto]**: el texto visible no nombra el modo |

### Caja «Con niños» (`MonumentCard.vue`, EXT-07)

```html
<a class="maps-link" …>Ver en Google Maps</a>
<div class="sorrentino-box">…</div>                     <!-- si existe -->
<div class="culture-box family-box">                    <!-- NUEVO, solo si monument.family -->
  <span class="label">Con niños</span>
  <!-- <MDC :value="monument.family" :tag="false" unwrap="p" /> -->
</div>
<!-- después, la pareja culture-box / notes-area en su orden de boxOrder, sin cambios -->
```

| Regla | Detalle |
|-------|---------|
| Posición **[auto]** | Siempre en el mismo sitio: después del bloque `.sorrentino-box` (o de `.maps-link` si no lo hay) y antes de la pareja `culture-box`/`notes-area`. Fuera de las dos ramas de `boxOrder`, así que no se duplica |
| Sin `family` | Ningún `div` (todas las fichas de Roma: DOM idéntico) |
| Fichas que la usan | Cualquier tipo (`card`, `nature`…). No depende de `PlaceType` |

### Fichas `nature` (EXT-04)

Una ficha `type: nature` es una `MonumentCard` normal: misma cabecera, hero, enlace a Google Maps y notas. Cuando el `hero.src` falla, `@error` pinta `motifSvg(monument.motif)` con uno de los motivos nuevos (o cualquiera de los 19 existentes). En la ficha no se añade ninguna marca visual de «naturaleza»: el tipo solo se ve en el color del marcador.

### Mapa multi-ciudad (EXT-05)

Sin cambio visual ni de código en el encuadre: `setView(trip.map.center, zoom)` + `fitBounds(todos los marcadores).pad(0.1)`. Contrato observable: en Campania, los marcadores de Nápoles, Procida, Ischia y Salerno quedan dentro de la caja de `#leaflet-map` a la vez. Roma conserva su vista (39 marcadores, goldens). Sin clustering, sin marcadores de alojamiento, sin líneas de ferry (aplazados).

---

## Motifs nuevos (EXT-04, D-10) **[auto: composición]**

Mismo lenguaje que los 19 existentes, que son **formas planas rellenas**, no trazos (la palabra «stroke» de D-10 se interpreta como «mismo estilo visual»; RESEARCH lo verificó):

| Regla | Valor |
|-------|-------|
| Lienzo | `<svg viewBox="0 0 800 280" preserveAspectRatio="xMidYMid slice">`, sin `width`/`height`, sin `<style>`, sin `<text>`, sin `<image>`, sin `xlink` externo |
| Cielo | `<linearGradient>` vertical `#f5edd9 → #e8d8b5` + `<rect width="800" height="280">` |
| Grupo | Todo el dibujo dentro de `<g opacity=".9">` |
| Paleta tierra (existente) | `#c4a373 #8b6c43 #5a4226 #a07c4a #d4c4a0 #fbf7f0`; vegetación `#5a7a3a` |
| Paleta agua (nueva, solo en estos 4) | `#8fa9a3` (agua clara), `#5f8582` (agua media), `#2f6f73` (agua profunda = color del marcador `nature`) |
| Trazos | Solo detalles (olas, vapor, sendero): `stroke="#fbf7f0"` u otro color de la paleta, `stroke-width` 2–4, `fill="none"`, `opacity` .5–.7 (como el chorro de `fountain`) |
| Encuadre | El motivo principal entre x 200 y 600 (el `slice` recorta los lados en móvil, 220px de alto) |
| Ids | Únicos en toda la tabla: `sk_se`, `wa_se` (sea) · `sk_th`, `wa_th` (thermal) · `sk_rv`, `wa_rv` (river) · `sk_tr`, `st_tr` (trail). Test: ningún `id="…"` se repite en `SVG_MOTIFS` |
| Tamaño | ≤ 1.600 caracteres por SVG (los existentes miden 852–1.481) |
| Tema oscuro | Nada específico: `[data-theme="dark"] .card-hero { filter: brightness(.7) saturate(.85) }` ya los oscurece |

| Motivo | Composición |
|--------|-------------|
| `sea` | Cielo; franja de mar `#5f8582` desde y≈150 con 3–4 olas en trazo `#fbf7f0` (opacidad .6); acantilado o promontorio `#c4a373`/`#8b6c43` entrando por un lado; cala de arena `#d4c4a0` en primer plano con 3–5 guijarros `#a07c4a` |
| `thermal` | Cielo; rocas oscuras `#5a4226`/`#8b6c43` cerrando una poza elíptica centrada (`#8fa9a3` sobre `#2f6f73`); 3 volutas de vapor en trazo `#fbf7f0` (opacidad .6) que suben desde el agua |
| `river` | Cielo; dos orillas `#d4c4a0`/`#5a7a3a`; banda de río `#5f8582` con 2 reflejos en trazo; puente de piedra de un arco `#c4a373` con el hueco `#5a4226` (vocabulario de `arch`) |
| `trail` | Cielo; dos o tres capas de montaña `#c4a373`/`#a07c4a`/`#8b6c43` (la de delante más oscura); sendero en zigzag en trazo `#fbf7f0` subiendo desde abajo; un hito de piedras `#5a4226` y una mata `#5a7a3a` |

Verificación visual (manual, en `/gsd-verify-work 12`): los cuatro motivos a 220px (móvil) y 280px (≥640px) de alto, en tema claro y oscuro, junto a dos motivos existentes. Deben leerse como de la misma familia.

---

## Copywriting Contract

Caracteres exactos: `—` U+2014 (EM DASH), `→` U+2192, `·` U+00B7. Texto fijo de UI en español (chrome compartido, no viene del `trip.yml`).

| Element | Copy |
|---------|------|
| Primary CTA | `Ver ruta del día (N paradas)` / `Ver ruta del día (10 de N paradas)`, **sin cambios** (`routeLabel`). N = paradas compartidas en días con `choice` |
| `title` del botón de ruta | `Abre Google Maps con el recorrido del día a pie` (walking, verbatim de hoy) · `Abre Google Maps con el recorrido del día en coche` (driving) · `Abre Google Maps con el recorrido del día en transporte público` (transit) |
| Encabezado del bloque por defecto | `Elige una` (D-02) |
| Separador entre opciones | `— o bien —`: EM DASH, espacio, `o bien`, espacio, EM DASH (D-02) |
| Etiqueta de opción | Del dato (`Opción A`, `Opción 1`…), texto plano |
| Alojamiento | `Dormís en {name}`, con `name` del dato (D-07) |
| Título de la caja familiar | `Con niños` (D-12) |
| Popup `nature` | `{name}` · `{day}` · `Abrir ficha →` (igual que card/concert) |
| Empty state heading | Ninguno. No hay listas nuevas que puedan quedar vacías |
| Empty state body | Ninguno, a propósito: día sin `stay` → no hay línea; opción con todas sus filas ocultas por el ritmo → solo etiqueta y título; día sin ruta (ferry, `enabled: false`, < 2 paradas) → no hay botón. Nunca texto de relleno |
| Error state (runtime) | Ninguno: todo es HTML prerenderizado. Una imagen que no carga cae en el motif (mecanismo existente) |
| Error state (build, `pnpm test:data`, nombra el fichero culpable) | `stay "{slug}" no existe en trip.yml stays` (regla `stay-ref`, también si el viaje no tiene `stays`) · `stay "{slug}" duplicado en stays` (regla `stay-dup`) · `ref` roto dentro de una opción → mismo mensaje que la regla `ref` de hoy · zod: `Unrecognized key: "pace"` (choice con ritmo, verificado en RESEARCH). Con 1 opción, con 4 o con un `choice` anidado, zod rechaza con su propio mensaje: el test comprueba que el fichero falla, no el texto exacto |
| Destructive confirmation | none: la fase no tiene acciones destructivas |

### Esqueleto Campania (`content/trips/campania/`, D-15) — textos visibles exigidos **[auto]**

Texto provisional en español con nombres reales. **Prohibido** cualquier marcador de Roma (`Roma`, `Einaudi`, `giugno`, `MMXXVI`, `Pay`, `Fellini`, `Royal Court`: lo vigila `tests/trips/romaLeaks.ts`). Cejas en español (`domingo · 20 de junio`), nunca en italiano.

| Pieza | Texto |
|-------|-------|
| `stays[].name` | `Nápoles`, `Procida`, `Ischia`, `Salerno` |
| Domingo 20 | `Dormís en Procida`; tramos `ferry` y `bike`; stats `ferry` y `bike`; sin botón de ruta (≥ 2 paradas, ocultado por el ferry) |
| Jueves 24 | `Dormís en Salerno`; filas comunes antes y después + `choice` con `Opción A` y `Opción B` (sin `heading` → «Elige una»); botón con N = paradas compartidas |
| Viernes 25 | Tramo `car`; `route.mode: driving` → `title` «… en coche» |
| `mapLegend` | `✦  Rojos · paradas con ficha · Verde agua · naturaleza ✦` (mismo formato que Roma y `forma`) |
| Ficha `nature` con `family` | p. ej. Baia di Sorgeto, `motif: thermal`, `hero.src: https://example.invalid/campania/<slug>.jpg` (fuerza el dibujo de reserva) |

---

## Accesibilidad

| Aspecto | Contrato |
|---------|----------|
| Jerarquía de titulares | Nada nuevo es `h*`: el encabezado del bloque, las etiquetas y los títulos de opción son `div` (el `h2` del día y los `h3` de las fichas no cambian, así que no hay saltos de nivel) |
| Agrupación | `div.tl-choice` con `role="group"` y `aria-label` en texto plano (ver Contrato de DOM). El separador «— o bien —» es texto legible (no `aria-hidden`): el lector anuncia «o bien» entre opciones |
| Glifos | Todos los glifos nuevos (⛴️ 🚗 🚌 🚲 ✈️ 🛏️) van en `::before`. Son decorativos y redundantes con el texto («Dormís en», cabecera del tramo, texto de la stat) |
| Color no exclusivo | Cada banda de transporte lleva glifo además del color; el marcador `nature` se distingue por color, igual que los tres tipos de Roma, y la leyenda del mapa lo nombra («Verde agua · naturaleza») |
| Contraste | Ver Color: todo texto nuevo ≥ 4,5:1 y todo borde de banda ≥ 3:1, en los dos temas |
| Foco | Sin elementos interactivos nuevos. El botón de ruta y los enlaces `#ficha` conservan su foco actual |
| Movimiento | Sin transiciones ni animaciones nuevas |
| Sin JavaScript | Bloque `choice`, «Dormís en», bandas y caja familiar son HTML prerenderizado. Solo el mapa (preexistente) necesita JS |

---

## UI Considerations

Applicable state considerations resolved: 13 covered, 3 backstop, 0 unresolved (probe `ui-consideration-probe` 2026-11-21, modo `--auto`). Elementos:
- E1, bloque `choice` [list-collection + static-content];
- E2, línea «Dormís en» [static-content];
- E3, bandas y stats de transporte [static-content];
- E4, botón de ruta [nav];
- E5, ficha `nature`, marcador y motif [static-content + media];
- E6, caja «Con niños» [static-content];
- E7, mapa multi-ciudad [media].

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| populated | E1 jueves 24 de Campania | ✅ covered | `div.tl-choice` (no `section`) contiene `div.tl-choice-heading` con texto «Elige una», dos `div.tl-choice-option` con etiquetas «Opción A» y «Opción B» y un único `div.tl-choice-sep` con texto exacto «— o bien —» entre ellas; las filas comunes quedan antes y después del bloque dentro del mismo `div.timeline` |
| zero-one-many | E1 con 2 y 3 opciones | ✅ covered | Con N opciones hay exactamente N−1 separadores, nunca antes de la primera ni tras la última; el esquema rechaza 1 y 4 opciones y un `choice` anidado (tests de esquema) |
| partial | E1 sin `heading` / con `heading` | ✅ covered | Sin `heading` el encabezado es «Elige una» y `aria-label="Elige una"`; con `heading` se pinta su Markdown y `aria-label` es su texto plano |
| empty | E1 opción con todas sus filas ocultas por el ritmo | ✅ covered | Con ritmo optimista, neutro y pesimista, con «Caminar menos» y en modo resumen, las dos etiquetas y los dos títulos de opción siguen visibles; las filas interiores siguen su propio `pace`, y en resumen se ocultan sus `.tl-transport`/`.tl-meta` igual que las de primer nivel |
| populated | E2 domingo 20 y jueves 24 | ✅ covered | `div.day-stay` con `textContent` «Dormís en Procida» / «Dormís en Salerno», situado entre el `h2` y `.day-subtitle`, visible también en modo resumen |
| empty | E2 día sin `stay` y Roma | ✅ covered | Un día sin `stay` no tiene `div.day-stay`; ninguna página de Roma contiene `.day-stay` (guard de build: ningún token de `NEW_CLASSES` en `.output/public/**/*.html`) |
| populated | E3 cinco variantes | ✅ covered | Cada `.tl-transport.{ferry,car,bus,bike,plane}` tiene `border-left-color` calculado distinto del dorado base y distinto entre sí, y su `.tl-transport-header::before` tiene el glifo de la tabla; cada `.day-stats-item.{…}::before` tiene su glifo; test unitario «cada valor de enum tiene regla» con `train` como única exención |
| theme | E3/E6 en tema oscuro | 🧪 backstop | Con `data-theme="dark"`, el borde de `.tl-transport.ferry` es `rgb(91, 123, 172)` (#5b7bac) y el de `.tl-transport.bus` `rgb(217, 152, 72)` (#d99848); la etiqueta «Con niños» `rgb(126, 147, 96)` (#7e9360); con tema claro #2c4d80, #aa691c y #4e6534 (valores de `color-mix`, puede variar ±1 por redondeo del navegador) |
| populated | E4 viernes 25 / día de ferry / jueves 24 | ✅ covered | Viernes 25: `href` contiene `travelmode=driving` y `title` «Abre Google Maps con el recorrido del día en coche»; domingo 20: no hay `a.day-route-btn`; jueves 24: el texto es «Ver ruta del día (N paradas)» con N = paradas compartidas (excluye las de solo-opción) |
| populated | E4 Roma (no regresión) | ✅ covered | Las URLs de ruta de Roma son byte-idénticas a las de hoy (`buildDirUrl(p)` === `buildDirUrl(p, 'walking')`, test unitario + `search-route.spec.ts` de paridad) y el `title` sigue siendo «… a pie» |
| error | E5 hero que no carga | ✅ covered | La ficha `nature` con `hero.src` en `example.invalid` muestra en `.card-hero` el SVG de su motif nuevo (empieza por `<svg viewBox="0 0 800 280"`); los 23 valores de `Motif` tienen SVG y ningún `id` de SVG se repite |
| populated | E5 marcador `nature` | ✅ covered | El `divIcon` de la ficha `nature` tiene fondo `#2f6f73` y su popup termina en `<a href="#slug" style="color:#2f6f73">Abrir ficha →</a>` sin handler; los colores y popups de card/guided/concert de Roma quedan fijados byte a byte |
| populated | E6 Sorgeto / ficha sin `family` | ✅ covered | La ficha con `family` tiene un único `div.culture-box.family-box` con `span.label` «Con niños», situado antes de la pareja culture/notes; ninguna ficha de Roma contiene `.family-box` |
| overflow | E1/E2/E6 a 375px | 🧪 backstop | A 375px de ancho, un bloque `choice` con 3 opciones, títulos de 80 caracteres y una parada interior con nota, una base con nombre largo y una caja «Con niños» de 3 frases parten líneas sin recorte, y `document.documentElement.scrollWidth` ≤ ancho de la ventana |
| overflow | E7 Campania | ✅ covered | Los marcadores de Nápoles, Procida, Ischia y Salerno quedan dentro de la caja de `#leaflet-map` a la vez tras el `fitBounds`; Roma mantiene 39 marcadores y su vista (goldens) |
| long-text | E5 cuatro motifs nuevos | 🧪 backstop | Revisión visual humana: `sea`, `thermal`, `river` y `trail` a 220px y 280px de alto, en tema claro y oscuro, junto a `garden` y `fountain`, se leen como la misma familia y el sujeto no queda recortado en móvil |
| loading | E5 hero / E7 mapa | 🧪 backstop | Sin estados de carga nuevos: la guía es SSG sin datos asíncronos; la imagen hero y las teselas del mapa reutilizan el comportamiento de Roma (fallback SVG por `error`, banner «sin conexión» por `tileerror`), que no cambia en esta fase |

**Re-run del probe tras la aprobación del checker (orquestador, 2026-11-21, `--auto`):** el motor propone 40 pares elemento×categoría sobre E1–E7; las filas anteriores los cubren por categoría (populated, zero-one-many, partial, empty, error, overflow, long-text, theme, loading). Los pares no listados explícitamente quedan en el suelo `autoResolve` (`verification: backstop`), sin descartes ni `unclassified` — en verificación cada uno sin evidencia cableada va a `human_needed`, nunca a un pase silencioso.

Notas para los tests: aseverar texto con `textContent`/`toHaveText` (no `innerText`, que aplica `text-transform: uppercase` al encabezado); los E2E de Campania corren en `pnpm test:trips` sobre `nuxi dev` (borrador), nunca a la vez que `generate`/`verify`.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| none | — | not applicable (`Tool: none`, sin shadcn ni registros de terceros; la fase no instala paquetes) |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS
- [x] Dimension 7 Inventory Provenance: PASS

**Approval:** approved 2026-11-21 (gsd-ui-checker, revision 1 — Dimension 5 block fixed)
