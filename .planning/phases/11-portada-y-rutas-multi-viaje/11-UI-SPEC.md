---
phase: "11"
slug: "portada-y-rutas-multi-viaje"
status: approved
reviewed_at: 2026-11-20
shadcn_initialized: false
preset: none
created: "2026-11-20"
---

# Phase 11 — UI Design Contract

> Contrato de una superficie **nueva** (la portada `/guiaRoma/`) dentro del lenguaje visual existente de Roma, más dos contratos mínimos: el enlace de vuelta en el pie de cada guía y el formato de fechas en español. Roma no cambia de aspecto: 56 goldens sin `--update-snapshots`. Generado en modo `--auto` (usuario de viaje, sin preguntas): todo sale de CONTEXT.md D-01…D-23, RESEARCH.md (Patterns 1, 3, 5 y fechas) y del CSS existente. Las decisiones propias de este documento van marcadas **[auto]** y se confirman en `/gsd-verify-work 11`.

**Reglas duras de esta fase (aplican a todo lo que sigue):**
1. **`app/assets/css/{tokens,base,fonts,leaflet}.css` no se tocan** (D-21). Nada de `<style scoped>`, nada de `style=""`, nada de `v-html`.
2. **Todo CSS nuevo vive en `app/assets/css/multitrip.css`**, añadido **al final** de `css[]` en `nuxt.config.ts`. **Cada** selector de ese fichero empieza por `.trip-index` (también dentro de `@media`). Prohibido `[data-theme="dark"] …`, `:root`, `html`, `body` o cualquier selector de elemento suelto en ese fichero: el tema oscuro llega solo por los tokens.
3. **Cero CSS para Roma.** El enlace de vuelta del pie (`.trip-back`) no tiene regla en ningún fichero: se pinta con `footer p` + `a` existentes. `.trip-back` no aparece en `multitrip.css`.
4. **Ningún atributo `id` en el markup de la portada** (D-12). Esto incluye los `h2` de las tarjetas (por eso no se usa `aria-labelledby`).
5. **Navegación de documento completo** (D-04): `<a href>` plano, nunca `NuxtLink`, nunca `@click` en esos enlaces.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (CSS a mano; las custom properties de `app/assets/css/tokens.css` son el sistema de tokens) |
| Preset | not applicable |
| Component library | none (componentes Vue propios en `app/components/`) |
| Icon library | none (glifos tipográficos: `←` U+2190, `·` U+00B7, `–` U+2013, `✦` U+2726) |
| Font | Cormorant Garamond (titulares, línea de fechas/destinos, estado vacío, pie) + Lora (cuerpo, resumen); self-hosted en `app/assets/css/fonts.css`. Pila exacta a repetir en `multitrip.css`: `'Cormorant Garamond', 'Garamond', 'Hoefler Text', 'Times New Roman', serif` |

shadcn gate: no aplica (proyecto Vue/Nuxt, no React; CLAUDE.md prohíbe Tailwind/UnoCSS y cualquier sistema que reescriba el CSS). `components.json` no existe (comprobado `ls components.json` → no such file). Component Inventory y Registry: omitidos por `Tool: none`.

### Componentes de la fase

| Componente / fichero | Cambio | Lo que NO cambia |
|----------------------|--------|------------------|
| `app/pages/index.vue` | Reescrito: portada. `useHead({ title: 'Guías de viaje', script: [legacy-hash-redirect] })` (D-11, D-14) + `<TripIndex>` | `app.vue` sigue aportando `lang="es"`, favicons y los dos `theme-color` |
| `app/components/TripIndex.vue` (nuevo) **[auto: nombre]** | Markup de la portada bajo `.trip-index` (ver Contrato de DOM). Una sola tarjeta por viaje publicado, sin subcomponente `TripCard` (≤ 25 líneas de plantilla, no compensa) | — |
| `app/utils/tripDates.ts` (nuevo, puro) | `formatTripDates(start, end)`, `tripMetaLine(trip)`, `sortTrips(trips)` | Sin `Date`/`Intl`/locale (D-09) |
| `app/components/TripView.vue` | `<footer>` siempre presente; `.container` solo si hay `trip.footer`; `<p class="trip-back">` hijo directo de `<footer>` tras `.container` | Orden de hermanos `header → main → BackButton → div.flourish → footer`; el `<p>` de `trip.footer` idéntico byte a byte. TripView **no** pinta `startDate`/`endDate`/`destinations`/`summary` |
| `app/assets/css/multitrip.css` (nuevo) | Reglas de la portada (ver Spacing/Typography/Color) | — |

---

## Spacing Scale

Valores **nuevos** (solo en `multitrip.css`, todos múltiplos de 4; base 1rem = 16px). Mobile-first; un único punto de corte `@media (min-width: 640px)` (el mismo que usa `.card` de Roma).

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | `outline-offset` del foco de la tarjeta |
| sm | 8px | `gap` interno de la tarjeta (título → meta → resumen) |
| md | 16px | Margen lateral de la portada en móvil (`.trip-index` padding-inline) |
| lg | 24px | Padding de la tarjeta y separación entre tarjetas en móvil; margen lateral ≥640px |
| xl | 32px | Padding de la tarjeta y separación entre tarjetas ≥640px; padding inferior de la cabecera en móvil |
| 2xl | 48px | Padding superior de la cabecera en móvil; padding inferior de la cabecera ≥640px; padding inferior de la portada en móvil |
| 3xl | 64px | Padding superior de la cabecera ≥640px; padding inferior de la portada ≥640px |

Ancho máximo de la portada: **760px** (el mismo que `.container` de Roma), centrado con `margin: 0 auto`.

Exceptions (heredadas, no se declaran en `multitrip.css`):
- `.flourish` de cierre: `margin: 3rem 0` (48px) — regla global existente, reutilizada tal cual.
- Pie de guía (enlace de vuelta): `footer { padding: 3rem 0; margin-top: 2rem }`, `p { margin-bottom: 1rem }` — congelado; la separación entre el `<p>` de `trip.footer` y `p.trip-back` es 16px (margen inferior del primero). Altura del pie de Roma medida en research: 229px (escritorio y móvil).
- `border-radius: 6px` de la tarjeta (igual que `.card` de Roma; no es espaciado).

---

## Typography

Tres tamaños y dos pesos en la portada. El cuerpo (`body`: Lora 17px, 16px ≤540px, `line-height: 1.65`) y los titulares (`h1, h2`: Cormorant Garamond 500, `line-height: 1.15`) se heredan de `base.css`; `multitrip.css` solo fija el tamaño del `h2` de tarjeta y la familia/estilo de la línea meta.

| Role | Size | Weight | Line Height | Dónde |
|------|------|--------|-------------|-------|
| Display | `clamp(2.5rem, 7vw, 4rem)` = 40px→64px | 500 (Cormorant Garamond) | 1.15 | `h1` «Guías de viaje» — regla global `h1`, **sin** CSS nuevo salvo `margin-bottom: 0` |
| Heading | 28px (1.75rem) | 500 (Cormorant Garamond) | 1.15 | `h2.trip-index-title` (sobrescribe el `clamp` global del `h2`, demasiado grande para una tarjeta de 760px) |
| Body | 17px (16px ≤540px, heredado) | 400 (Lora) | 1.65 | `p.trip-index-summary` |
| Meta / estado vacío | 17px = `1em` del cuerpo (16px ≤540px) | 400 **itálica** (Cormorant Garamond) | 1.65 | `p.trip-index-meta`, `p.trip-index-empty` (eco de `.hero-meta` de Roma: título y debajo línea itálica en `--ink-soft`) |

Pesos usados en la portada: **400** (cuerpo, meta) y **500** (`h1`, `h2`). Ningún 600. Ningún `text-transform`. Énfasis Markdown del resumen: `em` itálica en `--ink-soft`, `strong` 600 — reglas globales existentes, solo si el resumen las usa (Roma no las usa).

Enlace de vuelta del pie (no es tipografía nueva): `footer p` = Cormorant Garamond itálica 15.2px (.95rem) 400, heredado y congelado.

---

## Color

Tokens de `app/assets/css/tokens.css` (claro / oscuro vía `[data-theme="dark"]`, que aplica `@nuxtjs/color-mode` desde `roma-theme`). Sin colores nuevos, sin hex en `multitrip.css`.

| Role | Value (claro / oscuro) | Usage |
|------|------------------------|-------|
| Dominant (60%) | `--bg` #f5f0e8 / #1a1612 | Fondo de página (regla global `body`, con sus degradados) |
| Secondary (30%) | `--bg-elev` #fbf7f0 / #221d18 · borde `--line-soft` #e5dccb / #2e2820 | Superficie y borde de `a.trip-index-card` en reposo |
| Accent (10%) | `--accent` #8b3a3a / #c4665a | Ver lista reservada |
| Texto | `--ink` #2a2520 / #e8dfd0 | `h1`, `h2.trip-index-title` en reposo, resumen |
| Texto secundario | `--ink-soft` #5c534a / #b8aa95 | `p.trip-index-meta`, `p.trip-index-empty` |
| Ornamento | `--gold` #a07c4a / #c4a373 | `.flourish` de cierre (regla global) |
| Sombra | `--shadow` | Tarjeta en `:hover` |
| Destructive | none | La fase no tiene acciones destructivas |

Accent reserved for (lista cerrada):
1. Borde de `a.trip-index-card:hover` (los 4 lados).
2. Color de `h2.trip-index-title` mientras su tarjeta está en `:hover`.
3. Anillo de foco `a.trip-index-card:focus-visible` (`outline: 2px solid var(--accent)`).
4. Texto del enlace «← Todos los viajes» del pie (regla global `a`, sin CSS nuevo) y su subrayado en `:hover` (`a:hover`).

La tarjeta en reposo **no** lleva acento: el color de texto de la tarjeta se fija a `var(--ink)` para anular el `a { color: var(--accent) }` global, y su borde se fija entero a `1px solid var(--line-soft)` para anular el `border-bottom: 1px solid var(--line)` global.

Contraste (WCAG, calculado con la fórmula de luminancia relativa): `--ink-soft` sobre `--bg-elev` 7,05:1 (claro) / 7,34:1 (oscuro); `--accent` sobre `--bg` 6,70:1 / 4,62:1; `--accent` sobre `--bg-elev` (título en `:hover`) 7,11:1 / 4,29:1 — el título en hover es texto grande (28px), umbral 3:1; el anillo de foco supera 3:1 en ambos temas.

---

## multitrip.css — reglas exactas

El ejecutor implementa exactamente esto (orden y valores). Cada selector empieza por `.trip-index`.

```css
/* Portada (Fase 11). TODO selector bajo .trip-index (D-21); tema oscuro solo vía tokens. */
.trip-index { max-width: 760px; margin: 0 auto; padding: 0 16px 48px; }
.trip-index .trip-index-header { text-align: center; padding: 48px 0 32px; }
.trip-index .trip-index-header h1 { margin-bottom: 0; }
.trip-index .trip-index-list { list-style: none; display: flex; flex-direction: column; gap: 24px; }
.trip-index .trip-index-card {
  display: flex; flex-direction: column; gap: 8px;
  padding: 24px;
  background: var(--bg-elev);
  border: 1px solid var(--line-soft);
  border-radius: 6px;
  color: var(--ink);
  overflow-wrap: break-word;
  transition: border-color .2s ease, box-shadow .2s ease;
}
.trip-index .trip-index-card:hover { border-color: var(--accent); box-shadow: var(--shadow); }
.trip-index .trip-index-card:focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; }
.trip-index .trip-index-title { font-size: 1.75rem; margin-bottom: 0; transition: color .2s ease; }
.trip-index .trip-index-card:hover .trip-index-title { color: var(--accent); }
.trip-index .trip-index-card p { margin-bottom: 0; text-indent: 0; }
.trip-index .trip-index-meta,
.trip-index .trip-index-empty {
  font-family: 'Cormorant Garamond', 'Garamond', 'Hoefler Text', 'Times New Roman', serif;
  font-style: italic;
  color: var(--ink-soft);
}
.trip-index .trip-index-empty { text-align: center; }
@media (min-width: 640px) {
  .trip-index { padding: 0 24px 64px; }
  .trip-index .trip-index-header { padding: 64px 0 48px; }
  .trip-index .trip-index-list { gap: 32px; }
  .trip-index .trip-index-card { padding: 32px; }
}
@media (prefers-reduced-motion: reduce) {
  .trip-index .trip-index-card,
  .trip-index .trip-index-title { transition: none; }
}
```

Por qué cada anulación: `p + p { text-indent: 1.5em }` global sangraría el resumen; `p { margin-bottom: 1rem }` y `h2 { margin-bottom: .5rem }` romperían el `gap` de 8px; `a { color; border-bottom }` global teñiría la tarjeta. Especificidad de `.trip-index .x` (0,2,0) > `a`/`a:hover`/`p + p` globales.

---

## Copywriting Contract

Caracteres exactos: `←` U+2190, `–` U+2013 (EN DASH), `·` U+00B7. Texto fijo de UI en español (no viene de `trip.yml`).

| Element | Copy |
|---------|------|
| `<title>` de la portada | `Guías de viaje` (D-11) |
| `<h1>` de la portada | `Guías de viaje` (D-11), texto plano, sin `<em>` |
| Primary CTA | La tarjeta entera es el enlace (D-07): sin botón ni etiqueta «Ver guía». Nombre accesible = su texto en orden DOM: título, línea meta, resumen |
| Enlace de vuelta (pie de toda guía) | `← Todos los viajes` — `←`, **un** espacio U+0020, `Todos los viajes` (D-01) |
| Empty state heading | Ninguno: el `h1` «Guías de viaje» se mantiene; no se añade otro titular |
| Empty state body | `Todavía no hay viajes publicados.` (D-11). Sin «siguiente paso»: el lector no puede hacer nada (publicar es trabajo de autor), así que no se inventa una acción |
| Error state (runtime) | Ninguno: la portada es HTML prerenderizado sin acciones. Un borrador en producción cae en el 404 por defecto de Nuxt (preexistente, fuera de alcance) |
| Error state (build, `pnpm test:data`, nombra el `trip.yml` culpable) **[auto]** | `fecha inexistente: «2026-02-30»` (refine del esquema) · `endDate (2026-06-18) anterior a startDate (2026-06-19)` · `summary con enlace: la tarjeta de la portada ya es un enlace; quita [texto](destino)` · `destinations vacío o con un elemento vacío` |
| Destructive confirmation | none |

### Datos de Roma (`content/trips/roma/trip.yml`, D-08) **[auto: resumen]**

```yaml
startDate: '2026-06-19'
endDate: '2026-06-23'
destinations:
  - Roma
summary: >-
  Cinco días a pie por Roma, del viernes por la tarde al martes por la noche: una
  ficha para cada parada, el mapa del viaje y dónde comer como los romanos.
```

Fechas entre comillas (strings, D-23). El resumen no lleva enlaces (invariante) ni Markdown; está anclado a hechos de la guía (llegada viernes 18:00, vuelo martes 21:50, fichas, mapa, sección Gastronomía). El usuario puede reescribirlo en la verificación sin tocar código.

### Tarjeta de Roma — salida exigida

| Pieza | Texto (textContent) |
|-------|---------------------|
| `h2.trip-index-title` | `Cinque giorni a Roma` (`inlineMdToPlain('Cinque giorni a _Roma_')`, D-07) |
| `p.trip-index-meta` | `19–23 de junio de 2026 · Roma` |
| `p.trip-index-summary` | el `summary` de arriba, en una línea |
| `href` | `/guiaRoma/trips/roma/` (con barra final) |

---

## Formato de fechas (D-09) — `formatTripDates(start, end)`

Pura, determinista, sin `Date`/`Intl`/`toLocaleDateString`: `split('-')` + tabla de meses `enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre, diciembre` (minúsculas). Día sin cero a la izquierda (`2`, no `02`; `1`, no `1.º`). Año con 4 cifras.

| Caso | Regla | Entrada → Salida |
|------|-------|------------------|
| Mismo mes y año | `{d1}–{d2} de {mes} de {año}`, EN DASH **sin** espacios (rango de números simples) | `2026-06-19`, `2026-06-23` → `19–23 de junio de 2026` |
| Mismo mes, día 1 | igual | `2027-05-01`, `2027-05-10` → `1–10 de mayo de 2027` |
| Cruza mes (mismo año) | Ambas fechas completas (lectura literal de D-09 «ambos completos»), unidas por ` – ` (espacio, EN DASH, espacio) | `2026-06-30`, `2026-07-02` → `30 de junio de 2026 – 2 de julio de 2026` |
| Cruza año | Ambas fechas completas, ` – ` | `2026-12-28`, `2027-01-03` → `28 de diciembre de 2026 – 3 de enero de 2027` |
| Solo inicio | Fecha completa | `2026-06-19`, — → `19 de junio de 2026` |
| Inicio = fin | Fecha completa (no `19–19`) | `2026-06-19`, `2026-06-19` → `19 de junio de 2026` |
| Sin inicio (con o sin fin) | `null` → la tarjeta no muestra fechas | —, `2026-06-23` → `null` |
| `end < start` | No llega nunca: la puerta de datos lo rechaza (invariante en `checkTrip`) | — |

**[auto]** Se descartó la forma «30 de junio – 2 de julio de 2026» (año una sola vez) porque contradice la letra de D-09; si el usuario la prefiere en la verificación, es un cambio de una línea en `formatTripDates` + su test.

### Línea meta — `tripMetaLine(trip)` (pura, en `tripDates.ts`)

`[formatTripDates(startDate, endDate), destinations?.join(' · ')]` filtrado de vacíos y unido con ` · ` (espacio, U+00B7, espacio). Devuelve `null` si no queda nada → no se renderiza `p.trip-index-meta`.

| Datos | Línea meta |
|-------|-----------|
| fechas + `['Roma']` | `19–23 de junio de 2026 · Roma` |
| fechas + `['Nápoles', 'Procida', 'Ischia']` | `… de 2027 · Nápoles · Procida · Ischia` |
| solo fechas | `19–23 de junio de 2026` |
| solo destinos | `Roma` |
| nada | (sin `<p>`) |

### Orden — `sortTrips` (D-10)

`startDate` descendente (comparación de strings ISO); viajes sin `startDate` al final; empate o sin fecha → título plano (`inlineMdToPlain`) con `localeCompare(…, 'es')`. Drafts filtrados **antes** (`!t.draft`), también en dev.

---

## Contrato de DOM

### Portada (`/guiaRoma/`, `.output/public/index.html`)

```html
<head>
  <title>Guías de viaje</title>
  <script data-hid="legacy-hash-redirect">…</script>   <!-- D-14, tagPriority 'critical': ANTES del <link rel=stylesheet> -->
</head>
<body>
  <div id="__nuxt">                                  <!-- contenedor de Nuxt; no es markup de la portada -->
    <div class="trip-index">
      <header class="trip-index-header">
        <h1>Guías de viaje</h1>
      </header>
      <main class="trip-index-main">
        <ul class="trip-index-list">
          <li>
            <a class="trip-index-card" href="/guiaRoma/trips/roma/">
              <h2 class="trip-index-title">Cinque giorni a Roma</h2>
              <p class="trip-index-meta">19–23 de junio de 2026 · Roma</p>
              <p class="trip-index-summary"><!-- <MDC :value="summary" :tag="false" unwrap="p" /> --></p>
            </a>
          </li>
        </ul>
        <!-- en lugar del <ul>, si no hay viajes publicados Y los datos ya están cargados: -->
        <p class="trip-index-empty">Todavía no hay viajes publicados.</p>
      </main>
      <div class="flourish" aria-hidden="true">·  ·  ·  ✦  ·  ·  ·</div>
    </div>
  </div>
</body>
```

| Regla | Detalle |
|-------|---------|
| Sin chrome de viaje | Ni `Topbar`, ni `NavPills`, ni `SearchBox`, ni mapa, ni `BackButton`, ni `<footer>`, ni `ThemeToggle` (D-11). Ningún elemento `<section>` ni `<footer>` (las reglas globales `section`/`footer` les darían padding y bordes) |
| Sin `id` | Ningún `id` dentro de `.trip-index` (D-12). Un test: `document.querySelectorAll('.trip-index [id]').length === 0` |
| `href` | `${base}trips/${slug}/` con `base` = `useRuntimeConfig().app.baseURL` normalizado con barra final (idioma de `app.vue:9`); **siempre** barra final; nunca `/guiaRoma/` literal |
| Título | `{{ inlineMdToPlain(t.title) }}` — interpolación, nunca `v-html` |
| Meta | `{{ tripMetaLine(t) }}` dentro de `<p class="trip-index-meta" v-if>` |
| Resumen | `<p class="trip-index-summary" v-if="t.summary"><MDC :value="t.summary" :tag="false" unwrap="p" /></p>` (mismo idioma que el pie de Phase 10). Sin enlaces (invariante de datos), así que nunca hay `<a>` dentro de `<a>` |
| Campos ausentes | Sin texto de relleno: falta título → imposible (obligatorio en el esquema); falta meta → sin `<p>` meta; falta resumen → sin `<p>` resumen (D-07) |
| Estado vacío | `v-if="data !== null && trips.length === 0"`: el mensaje solo aparece con los datos cargados y la lista vacía; nunca durante la hidratación |
| Tema | Sin conmutador; `<html data-theme>` lo pone el script anti-FOUC de color-mode con `roma-theme` (D-11, D-20). No se escribe ninguna clave de `localStorage` |
| Idioma | `<html lang="es">` desde `app.vue` (sin cambios) |

### Pie de toda guía (`TripView.vue`, D-01…D-05)

```html
<!-- Roma (con trip.footer) -->
<footer>
  <div class="container"><p>Itinerario preparado para <em>Pay</em> y dos colegas<br>Roma · 19—23 giugno 2026<br>"Roma no se cuenta, se camina."</p></div>
  <p class="trip-back"><a href="/guiaRoma/">← Todos los viajes</a></p>
</footer>

<!-- Viaje sin trip.footer (p. ej. prueba en dev) -->
<footer>
  <p class="trip-back"><a href="/guiaRoma/">← Todos los viajes</a></p>
</footer>
```

| Regla | Detalle |
|-------|---------|
| Posición | `p.trip-back` es **hijo directo** de `<footer>`, **después** de `.container` (no dentro: rompería el locator estricto de `shell.spec.ts:158`) |
| `<footer>` | Siempre presente (se quita su `v-if`); el `v-if="footerLines.length > 0"` pasa al `div.container` |
| `href` | `useRuntimeConfig().app.baseURL` normalizado con barra final → `/guiaRoma/` |
| Estilo | **Ningún CSS nuevo.** Resultado verificado en research: Cormorant Garamond itálica 15.2px (`footer p`), centrado (`footer { text-align: center }`), color `--accent` y subrayado `1px solid var(--line)` (regla `a`), subrayado `--accent` en `:hover` (`a:hover`) |
| Foco | Anillo por defecto del navegador (no hay regla de foco global en el proyecto; no se añade ninguna para no tocar Roma) |
| Paridad | El pie no está en ninguna de las 56 goldens: pasan sin `--update-snapshots` (D-02, verificado en research) |
| Sin `@click` | `<a href>` plano de documento completo (D-04) |

---

## Accesibilidad

| Aspecto | Contrato |
|---------|----------|
| Idioma | `lang="es"` en `<html>` (heredado) |
| Jerarquía de titulares | Un único `h1` («Guías de viaje»); un `h2` por tarjeta; ningún `h3`. Sin saltos |
| Landmarks | `<header class="trip-index-header">` (banner) y `<main class="trip-index-main">` (main), uno de cada |
| Lista | Las tarjetas van en `ul > li`: el lector anuncia «lista, N elementos» |
| Nombre accesible de la tarjeta | Su contenido en orden DOM: título → línea meta → resumen (el título va primero en DOM **y** en pantalla). Sin `aria-label` ni `title` (el nombre visible ya es el accesible; WCAG 2.5.3). Sin `aria-labelledby` (no hay `id`, D-12) |
| `h2` dentro de `<a>` | Válido en HTML5 (contenido de flujo sin descendientes interactivos); la invariante «summary sin enlaces» garantiza que no haya interactivos anidados |
| Foco visible | Tarjeta: `outline: 2px solid var(--accent); outline-offset: 4px` en `:focus-visible`. Enlace del pie: anillo por defecto del navegador |
| Objetivo táctil | La tarjeta entera (≥ 24px de padding en cada lado) |
| Movimiento | Transiciones de 0,2s solo en color/borde/sombra; desactivadas con `prefers-reduced-motion: reduce` |
| Sin JavaScript | La portada es HTML con enlaces planos: funciona sin hidratar |
| Decoración | `.flourish` con `aria-hidden="true"` |
| Contraste | Ver Color: texto secundario ≥ 7:1; acento ≥ 4,29:1 (solo en texto grande o en el enlace del pie, mismo par que Roma hoy) en ambos temas |

---

## UI Considerations

Applicable state considerations resolved: 9 covered, 2 backstop, 0 unresolved (probe `ui-consideration-probe` 2026-11-20, modo `--auto`; elementos: E1 lista de tarjetas de la portada [list-collection], E2 tarjeta [static-content + nav], E3 estado vacío [list-collection], E4 enlace de vuelta del pie [nav], E5 línea de fechas [static-content])

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| populated | E1 portada con Roma | ✅ covered | `/guiaRoma/` muestra exactamente una `a.trip-index-card` con `href` `/guiaRoma/trips/roma/`, `h2` «Cinque giorni a Roma», meta «19–23 de junio de 2026 · Roma» y el resumen de Roma; `<title>` y `h1` son «Guías de viaje» |
| empty | E3 sin viajes publicados | ✅ covered | Con la lista de viajes cargada y vacía, `TripIndex` pinta `p.trip-index-empty` «Todavía no hay viajes publicados.» y ningún `ul.trip-index-list` (test de componente con datos simulados; la build real siempre tiene Roma) |
| loading | E1/E3 durante la hidratación | ✅ covered | La portada es HTML prerenderizado con las tarjetas ya dentro; el estado vacío exige `data !== null`, así que nunca aparece mientras los datos aún no han llegado |
| error | E1 | ✅ covered | No hay estado de error en runtime: los datos inválidos (fecha inexistente, `endDate < startDate`, `summary` con enlace, `destinations` vacío) hacen fallar `pnpm test:data` nombrando el `trip.yml`; la portada y Roma no piden `sql_dump` ni `.wasm` (D-15) |
| partial | E2 tarjeta con campos opcionales ausentes | ✅ covered | `tripMetaLine` devuelve solo fechas, solo destinos o `null` según los datos, y la tarjeta omite `p.trip-index-meta`/`p.trip-index-summary` cuando faltan, sin texto de relleno (tests unitarios de `tripMetaLine` + `formatTripDates`) |
| zero-one-many | E1 | ✅ covered | 0 viajes → estado vacío; 1 → una tarjeta; N → columna única apilada a todo ancho con `gap` 24px (32px ≥640px), ordenada por `startDate` descendente y sin fecha al final por título (`sortTrips`, test unitario); sin texto de conteo, así que no hay singular/plural |
| zero-one-many (drafts) | E1 en dev y en producción | ✅ covered | Ni en `pnpm dev` ni en la build aparece una tarjeta de `prueba` o `forma` (`draft: true`); en la build no existe `trips/prueba` ni `trips/forma` |
| long-text | E2 título/resumen/destinos largos | 🧪 backstop | A 375px, una tarjeta con título de 80 caracteres, 6 destinos y resumen de 3 frases parte líneas (`overflow-wrap: break-word`), sin elipsis ni recorte, y `document.documentElement.scrollWidth` ≤ ancho de la ventana |
| long-text | E5 fechas que cruzan mes/año | ✅ covered | `formatTripDates` devuelve exactamente las salidas de la tabla «Formato de fechas» (mismo mes, día 1, cruce de mes, cruce de año, solo inicio, inicio = fin, sin inicio) |
| overflow | E4 pie con y sin `trip.footer` | ✅ covered | En Roma el pie contiene `div.container > p` (texto de `trip.footer` sin cambios) seguido de `p.trip-back > a[href="/guiaRoma/"]` «← Todos los viajes»; en un viaje sin `footer` el pie solo contiene `p.trip-back`; `footer .container p` sigue resolviendo a un único elemento en Roma |
| theme | E1/E2 con tema oscuro guardado | 🧪 backstop | Con `localStorage['roma-theme'] = 'dark'`, la portada carga con `<html data-theme="dark">` antes del primer paint y la tarjeta tiene fondo `rgb(34, 29, 24)` (`--bg-elev` oscuro); con el tema claro, `rgb(251, 247, 240)` |

Notas para los tests: aseverar texto con `textContent`/`toHaveText` (no `innerText`); no navegar portada → `#x` en el mismo documento (la redirección solo corre en carga de documento, RESEARCH Pattern 3).

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| none | — | not applicable (`Tool: none`, sin shadcn ni registros de terceros) |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS
- [x] Dimension 7 Inventory Provenance: PASS

**Approval:** pending
