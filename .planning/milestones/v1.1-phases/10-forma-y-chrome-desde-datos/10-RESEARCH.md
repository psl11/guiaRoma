# Phase 10: Forma y chrome desde datos - Research

**Researched:** 2026-11-20
**Domain:** Refactor data-driven de la plantilla de una guía Nuxt 4 + Nuxt Content v3 (secciones/pastillas/chrome desde `trip.yml`), con paridad píxel de Roma congelada
**Confidence:** HIGH (casi todo verificado leyendo el código, la build actual y ejecutando los tests de este repo)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Días desde datos (SHAPE-01)
- **D-01:** `TripView` deja de tener las 5 `<section id="viernes">…` fijas: monta una `<section :id="day.slug">` + `DaySection` por cada día del viaje, en orden de `order`. Roma conserva sus slugs `viernes…martes` (mismo DOM, mismo orden de hermanos entre `#mapa` y `#reservas`).
- **D-02:** Viajes nuevos usan slugs de día con fecha (`sabado-19`, `sabado-26`): así dos sábados nunca chocan. El esquema de día acepta `^[a-z0-9-]+$` (no se impone el formato con fecha; es convención documentada).
- **D-03:** Etiqueta de la pastilla de día: campo nuevo opcional `pill` en el YAML del día; si falta, se sigue derivando con `dayLabel(eyebrow)` (Roma no añade `pill` → «Venerdì»… idénticas). La puerta de datos exige **etiquetas de pastilla únicas dentro de un viaje** (ya derivadas o explícitas), para que «dos sábados» obliguen a desambiguar (p. ej. «Sáb 19» / «Sáb 26»).
- **D-04:** `order` único y contiguo `1..N` por viaje (invariante nuevo; se elimina el comentario «1..5»). Sin límite de número de días.
- **D-05:** Se cierran aquí WR-01 y WR-02 de la revisión de la Fase 9 (era la recomendación del UAT 09 punto 5): (a) los slugs de día de un viaje se tratan como anclas reservadas — ningún id de ficha/comida/artista puede coincidir con un slug de día del mismo viaje, ni un slug de día con un ancla de sección fija (`SECTION_ANCHORS`/`FIXED_DOM_IDS`); (b) `cross-trip-link` pasa a lista blanca: en la prosa solo se admiten enlaces internos con la forma exacta `#id` (o URLs absolutas `http(s)://` externas); `/#x`, `/guiaRoma/#x`, `../roma#x`, `/trips/...` rompen verify nombrando el fichero. Si el usuario decide otra cosa en `/gsd-verify-work 9`, se ajusta.

#### Secciones y pastillas según datos (SHAPE-02)
- **D-06:** Una función **pura** `buildTripLayout(...)` (en `app/utils/`, con test Vitest) devuelve la lista ordenada de secciones/pastillas del viaje; `TripView` y `NavPills` consumen esa misma lista (una sola fuente de verdad, no dos plantillas que puedan divergir).
- **D-07:** Orden fijo para todos los viajes: Inicio, Mapa, días…, Reservas, Gastronomía, Práctica, Arte, Arquitectura. No hay campo para reordenar.
- **D-08:** Se decide por **presencia de datos**, sin lista explícita en `trip.yml`: Inicio y Mapa siempre; Reservas si existe la referencia `reservas`; Gastronomía si hay fichas de comida; Práctica si existe la referencia `practica`; Arte si hay artistas `kind: artist`; Arquitectura si hay `arquitectura` o `glossary`. Si una sección no se muestra, tampoco su pastilla ni su `<section>`. Roma tiene todo → 12 pastillas en el mismo orden.
- **D-09:** Las etiquetas de las pastillas estructurales y los títulos fijos de sección (incluidas las grafías italianas «Pratica», «cartografia», «El mapa del viaje», intro del mapa) siguen siendo **chrome compartido fijo**, no configurable en esta fase: no son textos propios de Roma (Campania también es Italia) y moverlos multiplica el riesgo de píxel sin beneficio.

#### Chrome desde `trip.yml` (SHAPE-03, SHAPE-04)
- **D-10:** Campos nuevos, todos `.optional()` (esquema estrictamente aditivo): `brand` (cabecera), `footer` (pie), `mapLegend` (leyenda del mapa) y `pageTitle` (pestaña). Orden de trabajo obligatorio: primero un test que demuestre que el YAML de Roma **sin cambios** sigue validando con el esquema ampliado; después se añaden los valores de Roma verbatim.
- **D-11:** `brand` conserva el DOM exacto de la cabecera (`.brand` con `<span class="brand-dot">✦</span>` en medio): forma estructurada de dos textos alrededor del punto (p. ej. `brand: { before: 'Roma', after: 'giugno MMXXVI' }`), no HTML libre. El formato exacto es discreción del planner siempre que el DOM de Roma salga byte-idéntico.
- **D-12:** `footer` = lista de líneas Markdown-inline (la primera lleva `*Pay*` → `<em>`), unidas con `<br>` como hoy dentro del mismo `<p>`. Vigilar el espacio en blanco del render MDC (regresión de píxel en el pie, nota del roadmap).
- **D-13:** `pageTitle` sustituye al `<title>` fijo de `app.vue`: el título lo pone la página del viaje (`useHead` en `TripView` o la página). Roma: `Roma · 19—23 giugno 2026` (con EM-DASH). `app.vue` conserva `lang` y los dos `theme-color`.
- **D-14:** Si un viaje no define un campo de chrome, se usa un **respaldo neutro sin ningún texto de Roma**: pestaña y marca = el `title` del viaje sin Markdown; pie y leyenda = no se renderizan. Nunca se cae a un literal de Roma.

#### Test-trampa y viaje de forma (SHAPE-05)
- **D-15:** Se añade un **segundo viaje ficticio dev-only** (`content/trips/forma/` o nombre equivalente que cumpla `TRIP_SLUG_RE`) con 10 días mínimos que repiten día de la semana (dos sábados con slugs con fecha y `pill` distintas), **sin** Arte ni Arquitectura (y sin alguna otra sección opcional) y con su propio `brand`/`footer`/`mapLegend`/`pageTitle`. El viaje `prueba` de la Fase 9 **no se toca**, para que sus tests de aislamiento sigan estables.
- **D-16:** El test-trampa se ejecuta en Playwright contra `pnpm dev` (suite `test:trips`, porque la build no emite viajes de prueba): en la guía de cada viaje no-Roma, ni el texto visible del `body` ni `document.title` contienen ninguna marca de Roma (lista mínima: «Roma», «Einaudi», «giugno», «MMXXVI», «Pay», «Fellini», «Royal Court»; comparación por palabra, sin falsos positivos tipo «aroma»). Además un test que compruebe 10 secciones de día + 10 pastillas distintas y la ausencia de `#arte`/`#arquitectura` en el viaje de forma.
- **D-17:** Un guardián de código (estilo `tripCoupling.spec.ts`) falla si reaparecen en `app/` los literales de chrome de Roma movidos a datos («giugno MMXXVI», «concierto Einaudi», «19—23 giugno 2026», «dos colegas»).

#### Paridad y proceso
- **D-18:** La puerta de paridad de Roma en `/` sigue verde con `tests/parity/` sin cambios y los 56 goldens sin `--update-snapshots`. Cualquier diferencia de píxel se arregla en el código/datos, nunca en los goldens.
- **D-19:** Builds, Playwright y typecheck con Node 22 (`~/.nvm/versions/node/v22.20.0/bin` delante en `PATH`); `rm -rf .data .nuxt .output` antes de cada `generate`/puerta tras tocar YAML.

### Claude's Discretion
- Forma exacta de `brand`/`footer` en YAML y la firma de `buildTripLayout`, siempre que el DOM de Roma salga idéntico.
- Orden de agrupación de la gastronomía para viajes nuevos: `FOOD_GROUP_ORDER` es de Roma; un grupo que no esté en esa lista debe salir después, en orden de primera aparición, sin romper (comprobar el comportamiento actual de `groupFood`; un campo opcional de orden por viaje solo si hace falta).
- Nombre y contenido inventado del viaje de forma.
- Si `pill` de día se valida también contra longitud/espacios (estético).

### Deferred Ideas (OUT OF SCOPE)
- Etiquetas de pastillas/títulos de sección configurables por viaje (D-09) — solo si Campania lo pide en la Fase 13.
- IN-05 de la Fase 9 (YAML suelto en `content/trips/`, `.YML` en mayúsculas) — pendiente de la decisión del usuario en `/gsd-verify-work 9`.
- CR-01 de la Fase 9 (filas de viajes de prueba en `sql_dump` público) — se resuelve con `draft` en la Fase 11; el nuevo viaje de forma (D-15) queda en el mismo caso y debe marcarse `draft` también.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHAPE-01 | Una guía muestra tantos días como tenga su viaje, con sus nombres y fechas, aunque se repita el día de la semana (dos sábados en Campania) y con pastillas de navegación únicas | `useTrip` ya ordena los días por `order` numérico (columna SQL `INT`); `buildTripLayout` emite una entrada por día; `pill ?? dayLabel(eyebrow)`; reglas nuevas `day-order` y `day-pill` en `checkTrip`; scrollspy ya genérico (§Architecture, §Code Examples) |
| SHAPE-02 | Una guía solo muestra las secciones y pastillas para las que su viaje tiene datos | Predicados de presencia de D-08 sobre `refById`/`food`/`artists` (ya en `useTrip`); `section + section` ignora los comentarios de fragmento de Vue; la regla `anchor` debe usar la MISMA presencia (§Pitfall 4) |
| SHAPE-03 | La marca de la cabecera, el pie y la leyenda del mapa salen de los datos del viaje | DOM actual prerenderizado extraído de la build; `<MDC :tag="false" unwrap="p">` conserva comillas rectas y emite `<em>` simple (verificado en la build); `white-space: normal` en `.brand`/`.map-legend`/`footer p` (§Pitfall 1-2) |
| SHAPE-04 | La pestaña del navegador muestra el título propio de cada viaje | `useHead({ title: () => … })` en TripView tras el `await` de `useTrip`; Unhead: «With equal priorities, the most recently registered title takes precedence»; quitar `title` de `app.vue` (§Pattern 4) |
| SHAPE-05 | Ningún texto específico de Roma aparece en la guía de otro viaje (test-trampa con viaje fixture) | Viaje `forma` dev-only + spec Playwright en `tests/trips/` + matcher Unicode con «dientes» en Vitest + guardián estático D-17 (§Validation Architecture) |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- Stack fijo: Nuxt 4 + Nuxt Content v3 (`type: 'data'` YAML) + esquema zod 4; `import { z } from 'zod'`, nunca el re-export de `@nuxt/content`.
- **Paridad 100 %** con el `index.html`: listón innegociable; CSS escrito a mano verbatim, sin Tailwind/UnoCSS y **sin `<style scoped>`** (los `data-v-*` rompen selectores globales).
- Salida estática (`nuxt generate`, preset `github_pages`, `baseURL: '/guiaRoma/'`); sin servidor en 1.0. Prohibido enlazar `/trips/*` desde la app (crawlLinks lo prerenderizaría) hasta la Fase 11.
- Offline: nada desde CDN.
- Trabajo en la rama `release/nuxt-4`; `main` intacta.
- Flujo GSD obligatorio para editar ficheros (`/gsd-execute-phase`).
- Memoria del proyecto que afecta a esta fase: Node 22 para generate/Playwright/typecheck; `rm -rf .data .nuxt .output` antes de generar tras tocar YAML (si no, contenido rancio); `use_worktrees=false`; paridad pragmática (si un arreglo píxel es desproporcionado, avisar pronto con coste/beneficio); la puerta §13a busca los D-IDs en `must_haves.truths` de los planes.

## Summary

La fase es un refactor de plantilla, no de tecnología: no hace falta ninguna dependencia nueva. Todo lo necesario ya existe y lo he comprobado. `useTrip` devuelve los días ordenados por `order`, que es una columna SQL `INT`, así que un viaje de 10 días se ordena bien. El scrollspy lee todas las `<section>` del DOM en cada scroll, de modo que se adapta solo a secciones dinámicas. `groupFood` ya envía los grupos desconocidos al final, por orden de primera aparición, y tiene test. `<MDC :tag="false" unwrap="p">` ya renderiza prosa con comillas rectas y `<em>` simples en la build de Roma. El riesgo real está en tres puntos: (1) reproducir el DOM de Roma al pasar de plantilla fija a `v-for`; (2) que la puerta de datos (`tests/data/trips.ts`) y la plantilla decidan la presencia de secciones con la MISMA lógica; (3) que el test-trampa no tenga falsos positivos ni pase en vacío.

Hay una buena noticia para la paridad. **Ninguna de las 14 vistas de los 56 goldens captura la marca, el pie ni la leyenda del mapa**: las vistas son `#inicio`, los 5 días, las 5 referencias y 3 fichas, y `#mapa` está excluida a propósito. Esas zonas solo las comprueba `tests/parity/shell.spec.ts`, por texto (`toContainText('Roma')` en `.brand`, `toContainText('Roma · 19—23 giugno 2026')` en `footer .container p`, `toHaveTitle(TITLE)`) y por la lista exacta de 12 pastillas. Además `.brand`, `.map-legend` y `footer p` usan `white-space: normal`, así que los espacios iniciales y finales y los dobles espacios no cambian ni un píxel. La build actual ya los colapsa: `<div class="brand"> Roma <span class="brand-dot">✦</span> giugno MMXXVI </div>`.

**Primary recommendation:** Crear `app/utils/tripLayout.ts` (puro, sin imports de Nuxt) con `buildTripLayout` + `dayPillLabel` + `inlineMdToPlain`, consumido por `TripView` (`<template v-for>` con cadena `v-if/v-else-if` por `kind`), por `NavPills` y también por `tests/data/trips.ts` (reglas `day-order`, `day-pill`, `anchor` según la presencia, `cross-trip-link` como lista blanca). Ampliar `TripSchema`/`DaySchema` de forma aditiva y probarlo con el YAML de Roma sin tocar. Después mover a `trip.yml` los cuatro textos de Roma, verificados contra `index.html` con un test Node-puro. Por último, el viaje `forma`, `tests/trips/shape.spec.ts` (test-trampa) y el guardián estático D-17.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Modelo de chrome/forma (`brand`, `footer`, `mapLegend`, `pageTitle`, `day.pill`) | Database / Storage (YAML + zod en `shared/schemas.ts`) | — | Content v3 los materializa como columnas del dump SQLite de build; zod es la fuente de verdad. |
| Decisión de qué secciones/pastillas hay y en qué orden | Util puro compartido (`app/utils/tripLayout.ts`) | Puerta de datos (`tests/data/trips.ts`) la reutiliza | Una sola función para la plantilla y para la validación (D-06); evita anclas colgantes. |
| Render de secciones, pastillas, marca, pie, leyenda | Frontend Server (SSR/prerender en build) | Browser (hidratación) | Todo se prerenderiza en `/`; el cliente solo hidrata. |
| `<title>` de la pestaña | Frontend Server (Unhead en SSR) | Browser (Unhead reactivo) | `useHead` en TripView; sale en el `<head>` prerenderizado. |
| Scrollspy / pastilla activa | Browser | — | `useCardNavigationController` lee las `<section>` reales del DOM; no cambia. |
| Validación de invariantes (orden, pastillas únicas, anclas, enlaces) | Puerta Node-pura (Vitest `tests/data`) | — | Content v3 no valida `type:'data'` en build (#3351). |
| Test-trampa | Browser E2E (Playwright contra `nuxi dev`) | Vitest (dientes del matcher, guardián estático) | El viaje de prueba solo existe en dev (no se prerenderiza). |

## Standard Stack

### Core (sin cambios; todo ya instalado)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| nuxt | 4.4.8 | Framework | Ya en `package.json` [VERIFIED: package.json] |
| @nuxt/content | 3.14.0 | Colecciones `type:'data'`; `<MDC>` vía `@nuxtjs/mdc` 0.22.0 | Ya en uso [VERIFIED: package.json; node_modules/.pnpm/@nuxtjs+mdc@0.22.0] |
| zod | 4.4.3 | Esquema aditivo nuevo | Fuente de verdad de tipos y de la puerta [VERIFIED: package.json] |
| unhead / @unhead/vue | 2.1.15 | `useHead({ title })` | Transitiva de Nuxt [VERIFIED: node_modules/.pnpm/unhead@2.1.15] |

### Supporting (ya presentes, para tests)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | 4.1.9 | `tripLayout.spec.ts`, reglas nuevas de `checkTrip`, guardián D-17, dientes del matcher | Siempre (`test:unit`, `test:data`) |
| @playwright/test | 1.61.0 | `tests/trips/shape.spec.ts` (test-trampa + forma) | `pnpm test:trips` (fuera de `verify`) |
| cheerio | ^1.2.0 | Extraer de `index.html` los textos de chrome verbatim para el test de Roma | Test Node-puro de verbatim |
| yaml | ^2.9.0 | Leer `trip.yml` en tests Node-puros | Igual que `tests/data/trips.ts` |

**Installation:** ninguna. **No se instala ningún paquete en esta fase.**

## Package Legitimacy Audit

Esta fase no instala paquetes externos, así que no hay nada que auditar.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
content/trips/<slug>/{trip.yml, days/*.yml, food/, artists/, reference/, monuments/}
        │  (build: Content v3 → dump SQLite; campos ausentes = NULL)
        ▼
useTrip(slug) ──► trip, days (ORDER BY order ASC), food, artists, refById, monById
        │
        ▼
buildTripLayout({ days, hasReservas, hasPractica, foodCount, artistKinds })   ◄── MISMA función
        │   → [inicio, mapa, day×N, reservas?, gastronomia?, practica?, arte?, arquitectura?]      │
        ├──────────────► NavPills (v-for → a.nav-pill href="#id", label)                         │
        ├──────────────► TripView <main> (v-for → <section :id> + componente por kind)            │
        │                                                                                         │
trip.brand / footer / mapLegend / pageTitle                                                       │
        ├─ presente ──► Topbar .brand / footer <p> (MDC por línea + <br>) / p.map-legend / useHead │
        └─ ausente ───► respaldo neutro: inlineMdToPlain(trip.title) | no se renderiza            │
                                                                                                  │
tests/data/trips.ts checkTrip ── YAML crudo → presencia → buildTripLayout ─────────────────────────┘
        → day-order · day-pill · anchor (solo secciones presentes) · cross-trip-link (lista blanca)

Browser: scrollspy = querySelectorAll('section') → computeActiveSection → NavPills .active
```

### Recommended Project Structure (ficheros nuevos/afectados)
```
app/utils/tripLayout.ts          # NUEVO: buildTripLayout, dayPillLabel, inlineMdToPlain, STRUCTURAL_SECTIONS (puro)
app/components/TripView.vue      # v-for sobre el layout; leyenda/pie desde trip; useHead(title)
app/components/Topbar.vue        # props: layout + brand + fallbackTitle
app/components/NavPills.vue      # props: layout (sin días/literal estructural duplicado)
app/app.vue                      # quitar title (conserva lang + 2 theme-color + favicons)
shared/schemas.ts                # TripSchema + brand/footer/mapLegend/pageTitle; DaySchema + pill, slug regex
content/trips/roma/trip.yml      # + 4 campos verbatim (DESPUÉS del test de esquema)
content/trips/forma/**           # NUEVO viaje dev-only (10 días, 2 sábados, sin arte/arquitectura/reservas)
tests/data/trips.ts              # reglas day-order, day-pill; anchor según presencia; cross-trip-link lista blanca
tests/data/invariants.spec.ts    # fixtures con dientes de las reglas nuevas (+ invertir el control #reservas)
tests/data/schema.spec.ts        # esquema aditivo: Roma sin cambios valida; formas inválidas fallan
tests/data/romaChrome.spec.ts    # NUEVO: valores de chrome de Roma == index.html verbatim (cheerio)
tests/data/build-isolation.spec.ts # + centinela del viaje forma ausente de index.html/_payload.json
tests/unit/tripLayout.spec.ts    # NUEVO
tests/unit/romaChromeGuard.spec.ts # NUEVO guardián D-17 (plantillas + scripts, sin comentarios)
tests/unit/romaLeaks.spec.ts     # NUEVO dientes del matcher del test-trampa
tests/trips/romaLeaks.ts         # NUEVO matcher compartido (no es spec)
tests/trips/shape.spec.ts        # NUEVO E2E forma + trampa (prueba y forma)
tests/README.md                  # §5: documentar las suites nuevas
```

### Pattern 1: `buildTripLayout` puro y compartido
**What:** una función sin imports de Nuxt que recibe la presencia ya calculada y devuelve entradas ordenadas `{ id, kind, label, day? }`.
**When to use:** en TripView (secciones), NavPills (pastillas) y `checkTrip` (anclas presentes y pastillas únicas).
**Detalles verificados que debe respetar:**
- Etiquetas estructurales verbatim de NavPills [VERIFIED: app/components/NavPills.vue:36-79]: `Inicio`, `Mapa`, `Reservas`, `Gastronomía`, `Pratica`, `Arte`, `Arquitectura` (OJO: `Pratica`, en italiano, no «Práctica»).
- Orden esperado por la paridad [VERIFIED: tests/parity/shell.spec.ts:29-33]: `'Inicio', 'Mapa', 'Venerdì', 'Sabato', 'Domenica', 'Lunedì', 'Martedì', 'Reservas', 'Gastronomía', 'Pratica', 'Arte', 'Arquitectura'`.
- Anclas de sección actuales [VERIFIED: tests/data/trips.ts:51]: `export const SECTION_ANCHORS = ['inicio', 'mapa', 'reservas', 'gastronomia', 'practica', 'arte', 'arquitectura'] as const`.
- `dayLabel` es puro y sin imports [VERIFIED: app/utils/dayLabel.ts:99-106]: `const first = (eyebrow.split('·')[0] ?? '').trim()` / `return first.charAt(0).toLocaleUpperCase('it') + first.slice(1)`.
- Los utils de `app/utils/` ya se importan por ruta relativa desde Vitest (p. ej. `import { dayLabel } from '../../app/utils/dayLabel'`) [VERIFIED: tests/unit/dayLabel.spec.ts:2]. `vitest.config.ts` **no define alias** (`include: ['tests/data/**/*.spec.ts', 'tests/unit/**/*.spec.ts']`) [VERIFIED: vitest.config.ts], así que dentro de `tripLayout.ts` solo valen imports relativos o `import type` (que se borran al compilar). Un import de valor `~~/…` rompería `test:data`.

### Pattern 2: TripView con `<template v-for>` + cadena `v-if/v-else-if`
**What:** `<main>` recorre el layout; cada entrada emite exactamente el mismo bloque que hoy (TheHero para `inicio`, que ya trae su `<section id="inicio">` [VERIFIED: app/components/TheHero.vue:58]; el `#mapa` estático; `<section :id="e.id"><DaySection …/></section>`; etc.).
**Por qué es seguro para la paridad:** la única diferencia de DOM en Roma son los comentarios de fragmento de Vue (`<!--[-->`/`<!--]-->`). La única regla CSS que depende de hermanos es `section + section { border-top: 1px solid var(--line-soft); }` [VERIFIED: app/assets/css/base.css:94]. El combinador `+` solo mira hermanos elemento e ignora los comentarios [ASSUMED: semántica estándar de CSS Selectors; se confirma con la puerta]. No hay `nth-child`/`first-child` sobre secciones (grep de base.css: solo `.card-section`, `.search-result`, `.reservas-table`…).
**Regla:** sin elemento envoltorio: las `<section>` deben seguir siendo hijas directas de `<main>`. No poner `v-if` y `v-for` en el mismo elemento (`vue/no-use-v-if-with-v-for`); usar `<template v-for>`.

### Pattern 3: Chrome desde datos con respaldo neutro (D-11/12/14)
- `brand: { before: string, after: string }` → `{{ brand.before }} <span class="brand-dot">✦</span> {{ brand.after }}`. Sin `brand` → `<div class="brand">{{ inlineMdToPlain(trip.title) }}</div>` (sin punto).
- `footer: string[]` (Md por línea) → `<footer v-if="lines.length">…<p><template v-for="(l,i) in lines" :key="i"><br v-if="i > 0"><MDC :value="l" :tag="false" unwrap="p" /></template></p>…</footer>`. Sin `footer` → no hay `<footer>`.
- `mapLegend: string` (texto plano) → `<p v-if="…" class="map-legend">{{ … }}</p>`.
- `pageTitle: string` → `useHead({ title: () => trip.value?.pageTitle || inlineMdToPlain(trip.value?.title ?? '') })`.
- **Leer los opcionales con `??`/`||`, nunca con `=== undefined`.** En el dump de Content, un campo opcional ausente se guarda como `NULL` [VERIFIED: .output/public/__nuxt_content/trip/sql_dump.txt — `"mapExtras" TEXT NULL`, `"sections" TEXT NULL`, y la fila de prueba lleva `NULL` en esas columnas]. En runtime puede llegar `null` aunque el tipo zod diga `| undefined`.

### Pattern 4: `<title>` por viaje
- Hoy en app.vue [VERIFIED: app/app.vue:25-32]: `htmlAttrs: { lang: 'es' }`, `title: 'Roma · 19—23 giugno 2026'`, `{ name: 'theme-color', content: '#1a1612', media: '(prefers-color-scheme: dark)' }`, `{ name: 'theme-color', content: '#f5f0e8', media: '(prefers-color-scheme: light)' }`. Se quita solo la línea `title`.
- Unhead: «With equal priorities, the most recently registered title takes precedence» [CITED: unhead.unjs.io/docs/head/guides/core-concepts/titles]. Nuxt admite getters/computed reactivos en `useHead`, y no documenta ningún `titleTemplate` por defecto [CITED: nuxt.com/docs/4.x/getting-started/seo-meta]; tampoco hay `app.head` ni `titleTemplate` en `nuxt.config.ts` [VERIFIED: nuxt.config.ts].
- Llamar a `useHead` **después** del `await useTrip(...)` de TripView es seguro en `<script setup>`: el compilador lo envuelve en `withAsyncContext`. TripView ya llama a `await useCardNavigationController(props.slug)` tras otro `await` y funciona [VERIFIED: app/components/TripView.vue]. Mantener `provideTripSlug(props.slug)` como primera sentencia antes de cualquier `await` (lo exige `tests/unit/tripCoupling.spec.ts:144-152`).

### Anti-Patterns to Avoid
- **Dos listas de secciones** (una en NavPills y otra en TripView): justo lo que D-06 prohíbe. Además, `SECTION_ANCHORS` en `tests/data/trips.ts` debe derivarse de la constante exportada por `tripLayout.ts` o contrastarse con ella en un test.
- **HTML libre en YAML** para la marca o el pie (`v-html`): rompe D-11 y abre una vía de inyección. Usar texto estructurado + MDC.
- **Caer a un literal de Roma** como valor por defecto (`brand ?? 'Roma'`): D-14 lo prohíbe y el test-trampa lo detecta.
- **Aserción de pastilla activa en los últimos días** del viaje de forma: con días mínimos la página no se puede desplazar lo bastante (ver Pitfall 6).
- **`page.locator('#' + slug)`** con slugs que empiezan por dígito: un selector CSS no admite un id que empieza por número. La app usa `getElementById` [VERIFIED: app/composables/useCardNavigation.ts:75], pero los tests deben usar `[id="…"]` o slugs que empiecen por letra (convención `sabado-19`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown-inline del pie (`*Pay*` → `<em>`) | Un `replace(/\*(.+?)\*/)` + `v-html` | `<MDC :value :tag="false" unwrap="p">` (patrón ya usado en TripView/GastroSection) | Conserva las comillas rectas y emite `<em>` simple (verificado en la build); sin `v-html` |
| Orden de grupos de comida de un viaje nuevo | Campo nuevo `foodGroupOrder` | `groupFood` actual | Ya manda los grupos desconocidos al final por primera aparición, con test [VERIFIED: app/utils/foodGroups.ts:168-181; tests/unit/foodGroups.spec.ts:101] |
| Scrollspy para secciones dinámicas | Lista de ids en el composable | El `querySelectorAll('section')` existente | Ya es genérico [VERIFIED: app/composables/useCardNavigation.ts:164-168] |
| Etiqueta de pastilla de día | Nueva derivación | `dayLabel(eyebrow)` como respaldo de `pill` | Paridad de Roma garantizada (sin `pill` en Roma) |
| Extraer el texto de chrome de `index.html` en tests | Regex sobre HTML | `cheerio` (ya devDependency, lo usa `scripts/migration-diff.ts`) | Robusto ante atributos y espacios |

**Key insight:** casi todo el trabajo consiste en **eliminar** literales y duplicaciones, no en construir. Cuanto menos código nuevo haya en la plantilla, menos superficie de píxel.

## Runtime State Inventory

(La fase mueve strings de código a datos y cambia la forma de la plantilla.)

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Caché SQLite local de Content en `.data/content/contents.sqlite` [VERIFIED: ls .data/content]; guarda el esquema y las filas anteriores de `trip`/`day` | `rm -rf .data .nuxt .output` antes de cada `generate`/puerta/`test:trips` tras tocar el esquema o el YAML (si no, contenido rancio; memoria del proyecto) |
| Live service config | Ninguno: GitHub Pages no se despliega en esta fase; no hay servicios con estos textos | Ninguna |
| OS-registered state | Ninguno (no hay tareas ni servicios del SO) | Ninguna |
| Secrets/env vars | Ninguno. `NUXT_APP_BASE_URL=/guiaRoma/` lo usa `playwright.trips.config.ts:33` y no cambia | Ninguna |
| Build artifacts | `.nuxt/content/types.d.ts` (tipos generados de las colecciones) y `.output/public/__nuxt_content/*/sql_dump.txt`; se regeneran en build. Las claves `localStorage` (`roma-*`, `prueba-*`) no cambian; el viaje nuevo usará `forma-*` | Regenerar (incluido en `rm -rf` + `generate`) |

## Common Pitfalls

### Pitfall 1: Espacios en blanco de la marca, la leyenda y el pie
**What goes wrong:** temer (o «arreglar») diferencias de espacios que no afectan a los píxeles, o introducir un espacio visible entre el texto y el `✦`.
**Why it happens:** Vue (modo `condense`) y la interpolación generan nodos de texto distintos a los escritos a mano.
**Hechos verificados (build actual, `.output/public/index.html`):**
- `'<div class="brand"> Roma <span class="brand-dot">✦</span> giugno MMXXVI </div>'`
- `'<p class="map-legend"> ✦ Rojos · paradas con ficha · Dorados · eventos guiados · Verde · concierto Einaudi ✦ </p>'` (Vue ya colapsó el doble espacio del fuente)
- `'<footer><div class="container"><p>Itinerario preparado para <em>Pay</em> y dos colegas<br>Roma · 19—23 giugno 2026<br>&quot;Roma no se cuenta, se camina.&quot;</p></div></footer>'`
- CSS [VERIFIED: base.css:36-45, 311-318, 993-1003]: ninguna de las tres reglas fija `white-space` (los únicos `white-space: nowrap` de base.css están en otras clases) → espacios iniciales y finales colapsables.
**How to avoid:** conservar exactamente un espacio entre `before`/`after` y el `<span class="brand-dot">`. El margen visual lo pone `.brand-dot { margin: 0 .35em; }`; un espacio de más o de menos entre palabra y span sí movería píxeles. En el pie, nada de espacio entre línea y `<br>` (en una línea centrada un espacio final se elimina igualmente, pero mejor no depender de ello).
**Warning signs:** cambia `textContent` de `.brand` en el diff HTML entre builds (más allá de comentarios `<!--[-->`).

### Pitfall 2: MDC en el pie
**What goes wrong:** comillas tipográficas, `<p>` anidados o un componente `Prose*` con clase.
**Verificado:** el MDC actual conserva las comillas rectas: `edificio y &quot;leerlo&quot;.` en `#arquitectura`, con 190 `&quot;` y 0 `“` en toda la página. Emite `<em>` sin clase, envuelto en comentarios de fragmento (`<strong><!--[--><em><!--[-->Roma<!--]--></em><!--]--></strong>`). Con `:tag="false" unwrap="p"` no añade `<p>` (p. ej. `<p class="art-intro"><!--[--><!--[-->Roma no se entiende…`) [VERIFIED: .output/public/index.html].
**How to avoid:** cada línea del pie como escalar YAML entre comillas simples, **sin** bloque `|` (un `\n` final se convertiría en texto). Usar `_Pay_` o `*Pay*` (ambos → `<em>`); el repo prefiere `_…_`, igual que `title: Cinque giorni a _Roma_`.
**Warning signs:** un test de HTML estático debe quitar los comentarios (`/<!--[\s\S]*?-->/g`) antes de comparar con `index.html`.

### Pitfall 3: Caracteres «parecidos» al copiar los textos de Roma
**What goes wrong:** `·` (U+00B7) por `.` o `•`; `—` (U+2014) por `-`/`–`; `✦` (U+2726) por `✧`. El parity test de título (`toHaveTitle`) y el del pie (`toContainText('Roma · 19—23 giugno 2026')`) fallarían.
**How to avoid:** un test Node-puro (`tests/data/romaChrome.spec.ts`) que extraiga con cheerio de `index.html` (líneas 8, 2259, 2370 y el `<footer>` de 6236-6240 [VERIFIED: index.html]) y compare tras normalizar espacios con los valores de `content/trips/roma/trip.yml` (`brand.before + ' ✦ ' + brand.after`, `mapLegend`, `pageTitle`, y el pie renderizado con `_x_`→`<em>`).

### Pitfall 4: Anclas a secciones ausentes (`#reservas` sin reservas)
**What goes wrong:** con D-08, un viaje sin `reference/reservas.yml` ya no tiene `<section id="reservas">`, pero `checkTrip` sigue dando por buena la prosa `[x](#reservas)` porque `anchorable` incluye todo `SECTION_ANCHORS` [VERIFIED: tests/data/trips.ts:278]. Existe hoy un control negativo que afirma justo eso: `it('[x](#reservas) resuelve aunque el viaje no tenga ficheros reference'` [VERIFIED: tests/data/invariants.spec.ts:245-250].
**How to avoid:** `anchorable` = slugs de entidades + ids de `buildTripLayout(presencia del YAML)`. **Invertir** ese test (ahora debe dar `anchor`) y añadir el positivo (con `reference/reservas.yml` presente, resuelve). `tests/data/` se puede modificar; solo `tests/parity/` está congelado. Roma tiene 5 enlaces a anclas de sección y todas sus secciones están presentes [VERIFIED: grep content/trips/roma].
**Warning signs:** una sección que desaparece y la puerta de datos sigue en verde.

### Pitfall 5: `day-pill` derivado debe usar la misma función que la UI
**What goes wrong:** la puerta compara etiquetas con otra normalización (minúsculas, sin acentos) y acepta duplicados que en pantalla son iguales, o rechaza etiquetas distintas.
**How to avoid:** en `checkTrip`, etiqueta = `dayPillLabel({ pill, eyebrow })` importada de `app/utils/tripLayout.ts`, comparación exacta. Dos sábados con eyebrow `sábado · …` derivan los dos `Sábado` → violación hasta que se añada `pill`. Validar `pill` como `z.string().min(1).optional()` (discreción: no limitar la longitud; como mucho rechazar espacios al principio y al final con `.regex(/^\S(.*\S)?$/)`).

### Pitfall 6: Páginas cortas y scrollspy
**What goes wrong:** (a) en `forma`, con días mínimos, la página no puede desplazarse hasta el último día, así que la pastilla activa nunca será la del último día; (b) en `prueba`, al desaparecer las secciones vacías (`#domingo`…`#arquitectura`) y el pie (D-14), hay menos altura bajo `#sabado`. El test existente `la pastilla activa sigue al scroll entre los días de prueba` [VERIFIED: tests/trips/isolation.spec.ts:132-159] necesita `altura del documento − offsetTop(#sabado) ≥ 800 − 110 = 690 px`.
**Estimación (b):** `#sabado` de prueba lleva la ficha `spagna`, con hero de 280 px en escritorio (`.card-hero { … height: 280px; }` [VERIFIED: base.css:723]), 3 secciones de prosa, datos y notas, más el padding de sección `3rem` (base.css:93) y el `.flourish`. Debería superar con holgura los 690 px [ASSUMED: no medido; se confirma con `pnpm test:trips`].
**How to avoid:** en `forma`, comprobar la navegación de las pastillas por `href` + existencia de `section[id=…]` + `location.hash` tras el clic, no por `.active`. Para `prueba`, si (b) falla, la solución está en el test o en el contenido de `forma`, nunca en `prueba` (D-15) ni en `tests/parity/`.

### Pitfall 7: El test-trampa pasa en vacío o da falsos positivos
**What goes wrong:** `\bRoma\b` de JS es ASCII: «Romaña» o «Romà» darían falso positivo, y «aroma» falla bien pero «guiaRoma» (baseURL en el payload) podría colarse si se escanea `textContent` con scripts. O el test pasa porque la página aún no se ha hidratado o está vacía.
**How to avoid:** matcher con límites Unicode: `new RegExp('(?<![\\p{L}\\p{N}])(?:' + words + ')(?![\\p{L}\\p{N}])', 'iu')`, con «Royal Court» como frase. Escanear `document.title` + `body.innerText` + `textContent` de un clon del body sin `script, style, noscript, template` (cubre texto oculto como `.dia-ligera`/banners). Control positivo: el mismo matcher sobre Roma DEBE encontrar «Roma». Antes de escanear, comprobar que el viaje se renderizó (p. ej. que hay 10 `.nav-pill` de día en forma). Los dientes del matcher van en Vitest (`tests/unit/romaLeaks.spec.ts`): `'aroma'` → nada, `'Romaña'` → nada, `'en Roma.'` → `Roma`, `'ROYAL COURT'` → `Royal Court`.

### Pitfall 8: Guardián D-17 que solo mira `<script>`
**What goes wrong:** copiar `scriptOf` de `tripCoupling.spec.ts`, que solo concatena los bloques `<script>` [VERIFIED: tests/unit/tripCoupling.spec.ts:52-57]. Los literales de Roma viven en `<template>` y en `app/app.vue`, que además está fuera de `SCANNED_DIRS` (`app/composables`, `app/components`, `app/utils`) [VERIFIED: tests/unit/tripCoupling.spec.ts:36-40].
**How to avoid:** escanear el fichero ENTERO de `app/**/*.{vue,ts}` (incluidos `app/app.vue` y `app/pages/`), quitando comentarios JS (`stripComments`, reutilizable) y HTML (`/<!--[\s\S]*?-->/g`). Literales: `giugno MMXXVI`, `concierto Einaudi`, `19—23 giugno 2026`, `dos colegas`. Dientes con cadenas sintéticas, como en tripCoupling.

### Pitfall 9: Orden de trabajo del esquema (D-10)
**What goes wrong:** añadir `brand:` al YAML de Roma antes que al esquema → la regla `unknown-key` falla, porque las claves conocidas salen de `row.shape` [VERIFIED: tests/data/trips.ts:173-175, 205-209]. O apretar `DaySchema.slug` con una regex que rompa datos existentes.
**How to avoid:** tarea 1 = esquema + tests de esquema, con `pnpm test:data` en verde **sin tocar YAML**; tarea 2 = valores de Roma. Los slugs actuales (`viernes`, `sabado`, `domingo`, `lunes`, `martes`; prueba `viernes`, `sabado`) cumplen `^[a-z0-9-]+$` [VERIFIED: content/trips/*/days/*.yml]. `pnpm test:unit` (164) y `pnpm test:data` (263) están en verde hoy [VERIFIED: ejecutado 2026-11-20].

### Pitfall 10: Viaje `forma` sin monumentos → mapa roto
**What goes wrong:** `LeafletMap` hace `map.fitBounds(L.latLngBounds(markers.map(...)).pad(0.1))` [VERIFIED: app/components/LeafletMap.client.vue:138] sin comprobar que haya marcadores. Con 0 marcadores Leaflet lanza un error de «bounds» en `onMounted` [ASSUMED: comportamiento conocido de Leaflet 1.9].
**How to avoid:** dar a `forma` al menos 2 monumentos con coordenadas (y referenciarlos en `cards` de algún día). LeafletMap no se toca en esta fase (CONTEXT).

## Code Examples

### `app/utils/tripLayout.ts` (sketch; firma de discreción)
```ts
// Puro: sin imports de Nuxt ni alias `~~` de valor (lo importa también tests/data/trips.ts).
import { dayLabel } from './dayLabel'

export type SectionKind = 'inicio' | 'mapa' | 'day' | 'reservas' | 'gastronomia' | 'practica' | 'arte' | 'arquitectura'
export interface LayoutDayInput { slug: string, eyebrow: string, pill?: string | null }
export interface TripPresence<D extends LayoutDayInput = LayoutDayInput> {
  days: readonly D[] // YA ordenados por `order` (useTrip: .order('order','ASC'))
  hasReservas: boolean // refById.get('reservas')
  hasPractica: boolean // refById.get('practica')
  foodCount: number
  artistKinds: ReadonlySet<string> // 'artist' | 'arquitectura' | 'glossary'
}
export interface LayoutEntry<D extends LayoutDayInput = LayoutDayInput> { id: string, kind: SectionKind, label: string, day?: D }

export const dayPillLabel = (d: LayoutDayInput): string => d.pill || dayLabel(d.eyebrow)

export function buildTripLayout<D extends LayoutDayInput>(p: TripPresence<D>): LayoutEntry<D>[] {
  const out: LayoutEntry<D>[] = [
    { id: 'inicio', kind: 'inicio', label: 'Inicio' },
    { id: 'mapa', kind: 'mapa', label: 'Mapa' },
    ...p.days.map(d => ({ id: d.slug, kind: 'day' as const, label: dayPillLabel(d), day: d })),
  ]
  if (p.hasReservas) out.push({ id: 'reservas', kind: 'reservas', label: 'Reservas' })
  if (p.foodCount > 0) out.push({ id: 'gastronomia', kind: 'gastronomia', label: 'Gastronomía' })
  if (p.hasPractica) out.push({ id: 'practica', kind: 'practica', label: 'Pratica' })
  if (p.artistKinds.has('artist')) out.push({ id: 'arte', kind: 'arte', label: 'Arte' })
  if (p.artistKinds.has('arquitectura') || p.artistKinds.has('glossary')) out.push({ id: 'arquitectura', kind: 'arquitectura', label: 'Arquitectura' })
  return out
}

/** `Cinque giorni a _Roma_` → `Cinque giorni a Roma` (respaldo neutro D-14). */
export function inlineMdToPlain(md: string): string {
  return md.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/(\*\*|__|\*|_)(.+?)\1/g, '$2').trim()
}
```
(Etiquetas de `NavPills.vue:36-79`; ids de `tests/data/trips.ts:51`; título de `content/trips/roma/trip.yml:2` `title: Cinque giorni a _Roma_`.)

### TripView: `<main>` desde el layout + pie + título (sketch)
```vue
<script setup lang="ts">
const props = defineProps<{ slug: string }>()
provideTripSlug(props.slug) // SIEMPRE antes del primer await (tripCoupling.spec.ts:144-152)
const { trip, days, monById, food, artists, refById } = await useTrip(props.slug)
await useCardNavigationController(props.slug)

const layout = computed(() => buildTripLayout({
  days: days.value ?? [],
  hasReservas: !!refById.value.get('reservas'),
  hasPractica: !!refById.value.get('practica'),
  foodCount: food.value?.length ?? 0,
  artistKinds: new Set((artists.value ?? []).map(a => a.kind)),
}))
const plainTitle = computed(() => inlineMdToPlain(trip.value?.title ?? ''))
const footerLines = computed(() => trip.value?.footer ?? [])
useHead({ title: () => trip.value?.pageTitle || plainTitle.value })
</script>

<template>
  <Topbar :layout="layout" :brand="trip?.brand ?? null" :fallback-title="plainTitle" />
  <main>
    <template v-for="e in layout" :key="e.id">
      <TheHero v-if="e.kind === 'inicio' && trip" :trip="trip" />
      <section v-else-if="e.kind === 'mapa'" id="mapa"><!-- chrome estático VERBATIM de hoy; solo cambia la leyenda: -->
        <!-- … -->
        <p v-if="trip?.mapLegend" class="map-legend">{{ trip.mapLegend }}</p>
      </section>
      <section v-else-if="e.kind === 'day'" :id="e.id">
        <DaySection :day="e.day!" :mon-by-id="monById" />
      </section>
      <!-- reservas / gastronomia / practica / arte / arquitectura: mismo markup que hoy, envuelto en v-else-if -->
    </template>
  </main>
  <BackButton />
  <div class="flourish">·  ·  ·  ✦  ·  ·  ·</div>
  <footer v-if="footerLines.length">
    <div class="container">
      <p><template v-for="(line, i) in footerLines" :key="i"><br v-if="i > 0"><MDC :value="line" :tag="false" unwrap="p" /></template></p>
    </div>
  </footer>
</template>
```
(`.flourish` verbatim de la build: `'<div class="flourish"> · · · ✦ · · · </div>'`; es chrome compartido, se queda.)

### Topbar `.brand`
```vue
<div class="brand">
  <template v-if="brand">{{ brand.before }} <span class="brand-dot">✦</span> {{ brand.after }}</template>
  <template v-else>{{ fallbackTitle }}</template>
</div>
```

### Esquema aditivo (`shared/schemas.ts`)
```ts
export const DAY_SLUG_RE = /^[a-z0-9-]+$/ // D-02
// DaySchema: slug: z.string().regex(DAY_SLUG_RE), order: z.number(), // único y contiguo 1..N (puerta)
//            pill: z.string().min(1).optional(),
// TripSchema (+):
brand: z.object({ before: z.string(), after: z.string() }).optional(),
footer: z.array(Md).optional(),
mapLegend: z.string().optional(),
pageTitle: z.string().optional(),
```
Valores de Roma (verbatim de `index.html:8, 2259, 2370, 6238`):
```yaml
pageTitle: 'Roma · 19—23 giugno 2026'
brand: { before: 'Roma', after: 'giugno MMXXVI' }
mapLegend: '✦  Rojos · paradas con ficha · Dorados · eventos guiados · Verde · concierto Einaudi ✦'
footer:
  - 'Itinerario preparado para _Pay_ y dos colegas'
  - 'Roma · 19—23 giugno 2026'
  - '"Roma no se cuenta, se camina."'
```
Nombres de campo sin conflicto con las columnas reservadas: `export const RESERVED_KEYS: ReadonlySet<string> = new Set(['id', 'meta', 'stem', 'extension', '__hash__'])` [VERIFIED: tests/data/trips.ts:57].

### `checkTrip` — reglas nuevas (sketch)
```ts
// RULES += 'day-order', 'day-pill'  (los it.each(RULES) por viaje se crean solos: invariants.spec.ts:45-49)
const sorted = [...days].sort((a, b) => Number(a.data.order) - Number(b.data.order))
sorted.forEach((d, i) => { if (d.data.order !== i + 1) push(d.file, 'day-order', `order ${String(d.data.order)} ≠ ${i + 1} (1..N contiguo, D-04)`) })
const labels = new Map<string, Doc[]>()
for (const d of days) { const l = dayPillLabel({ slug: d.slug, eyebrow: String(d.data.eyebrow ?? ''), pill: d.data.pill as string | undefined }); labels.set(l, [...(labels.get(l) ?? []), d]) }
for (const [l, ds] of labels) if (ds.length > 1) for (const d of ds) push(d.file, 'day-pill', `pastilla «${l}» repetida (D-03)`)

const layout = buildTripLayout({ days: sorted.map(d => ({ slug: d.slug, eyebrow: String(d.data.eyebrow ?? ''), pill: d.data.pill as string | undefined })),
  hasReservas: reference.some(r => r.slug === 'reservas'), hasPractica: reference.some(r => r.slug === 'practica'),
  foodCount: food.length, artistKinds: new Set(artists.map(a => a.kind ?? '')) })
const anchorable = new Set([...entities.map(d => d.slug), ...layout.map(e => e.id)])
// cross-trip-link = LISTA BLANCA (D-05b): solo '#id' o /^https?:\/\//i
if (!target.startsWith('#') && !/^https?:\/\//i.test(target)) push(d.file, 'cross-trip-link', `enlace no admitido (D-05): "${target}"`)
```
Hoy no hay ningún enlace Markdown no-`#` en todo `content/` (127 enlaces, todos `#…`) [VERIFIED: grep `\]\(` sobre content/], así que la lista blanca no rompe datos. Los `href` estructurados de `FoodEntry` no son enlaces Markdown y no se escanean. D-05(a) ya está cubierto en gran parte: `dup-id` incluye los días entre las `entities`, y `fixed-anchor` recorre `[...days, ...monuments, ...food, ...artists]` contra `FIXED_DOM_IDS` [VERIFIED: tests/data/trips.ts:189, 218-234]. Al pasar a secciones dinámicas, WR-01 desaparece (ya no hay `<section id="lunes">` vacía si no hay día `lunes`). Hay que añadir fixtures que lo demuestren: un monumento `lunes` junto a un día `lunes` → `dup-id`; un día con slug `mapa` → `fixed-anchor`; `[x](/#pantheon)`, `[x](/guiaRoma/#x)` y `[x](../roma#x)` → `cross-trip-link`.

### Viaje `forma` (dev-only)
- Carpeta `content/trips/forma/`. El slug cumple `export const TRIP_SLUG_RE = /^[a-z0-9]+$/` [VERIFIED: shared/schemas.ts:331].
- `trip.yml` con `# draft: true` comentado, como en prueba [VERIFIED: content/trips/prueba/trip.yml]: el campo `draft` aún no existe y `unknown-key` lo rechazaría. Debe llevar un centinela propio (p. ej. `FORMA-CENTINELA-10`) y los 4 campos de chrome, **sin** ninguna palabra de la lista trampa.
- 10 ficheros `days/*.yml` mínimos. Forma válida según los fixtures de la puerta [VERIFIED: tests/data/invariants.spec.ts:66-77]: `slug, trip, order, roman, eyebrow, title, subtitle, stats: [], timeline: [], cards: []`. Slugs con fecha (`sabado-19` … `sabado-26`), `order` 1..10, `pill` explícita al menos en los dos sábados (`Sáb 19` / `Sáb 26`).
- ≥2 `monuments/` (Pitfall 10) y, opcionalmente, 1-2 `food/` con un `group` que no esté en `FOOD_GROUP_ORDER`, para ejercitar el orden por primera aparición. Sin `artists/` ni `reference/reservas.yml`. Con o sin `practica`: discreción. Recomendación: sin ninguna referencia, para ejercitar dos ausencias más.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 5 `<section>` de día fijas + 7 pastillas literales | Layout derivado de datos (`buildTripLayout`) | Esta fase | N días, secciones opcionales |
| `<title>` global en `app.vue` | `useHead` por viaje en TripView | Esta fase | La página de error ya no hereda el título de Roma |
| `cross-trip-link` como lista negra (`/trips/`) | Lista blanca `#id` / `http(s)://` | Esta fase (cierra WR-02) | Bloquea también `javascript:`, `/#x`, `../roma#x` |

**Deprecated/outdated:** el comentario `order: z.number(), // 1..5` [VERIFIED: shared/schemas.ts:134] y el «Hallazgo D-03» del comentario de `content/trips/prueba/trip.yml` (los slugs de día ya no tienen por qué ser viernes…martes). Corregir el comentario de prueba es opcional: D-15 dice «no se toca» y un comentario YAML no afecta a ningún test.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | El combinador `section + section` ignora los comentarios de fragmento de Vue | Pattern 2 | Bajo: es semántica estándar de CSS; la puerta de 56 goldens lo confirmaría |
| A2 | La altura bajo `#sabado` en `prueba` seguirá ≥690 px sin las secciones vacías ni el pie | Pitfall 6 | Medio: fallaría un test de `test:trips` (no la puerta); se arregla en el test, no en prueba |
| A3 | Leaflet lanza un error con `fitBounds` de 0 marcadores | Pitfall 10 | Bajo: se evita dando monumentos a `forma` |
| A4 | Usar `_Pay_` (o `*Pay*`) en el pie produce `<em>Pay</em>` sin clase, como el resto de la prosa MDC | Pitfall 2 | Bajo: verificado el mismo patrón en `#practica` (`<em><!--[-->Roma<!--]--></em>`) |
| A5 | En runtime, un campo de chrome ausente llega como `null` (columna NULL), no como `undefined` | Pattern 3 | Nulo si se usa `??`/`||` |

## Open Questions (RESOLVED)

1. **¿Invertir el control negativo `[x](#reservas)` de la Fase 9?**
   - Lo que sabemos: con D-08 esa ancla queda colgante si no hay reservas.
   - Recomendación: invertirlo (`anchor` rojo) y añadir el caso positivo. Es coherente con D-05/D-08 y no toca `tests/parity/`.
2. **WR-01/WR-02 siguen marcados `[pending]` en `09-UAT.md` punto 5.**
   - D-05 los cierra aquí. Si el usuario decide otra cosa en `/gsd-verify-work 9`, se ajusta la regla (ya previsto en CONTEXT). Recomendación: anotar en el SUMMARY que el punto 5 del UAT 09 queda resuelto por esta fase.
3. **¿`practica` en el viaje `forma`?** Discreción. Recomendación: sin referencias (ejercita dos ausencias más). Con `practica`, el layout la incluiría y el test lo reflejaría.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node 22 | generate / Playwright / typecheck (better-sqlite3 ABI) | ✓ | v22.20.0 en `~/.nvm/versions/node/v22.20.0/bin` | — |
| pnpm | scripts | ✓ (con Node 22 en PATH) | 10.32.1 | corepack 0.34.0 |
| Chromium de Playwright | parity / trips | ✓ | builds 1228 y 1234 en `~/.cache/ms-playwright` | — |
| nuxi / vitest / playwright / eslint (bin locales) | todo | ✓ | `node_modules/.bin` | — |

**Missing dependencies with no fallback:** ninguna.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.9 (Node-puro) + Playwright 1.61.0 |
| Config file | `vitest.config.ts`, `playwright.gate.config.ts` (puerta, congelada), `playwright.trips.config.ts` (dev, puerto 5300) |
| Quick run command | `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && pnpm test:unit && pnpm test:data` (<2 s) |
| Full suite command | `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && pnpm verify` (incluye `rm -rf .data .nuxt .output` + generate + unit + data + parity) |
| Trips (fuera de verify) | `export PATH="$HOME/.nvm/versions/node/v22.20.0/bin:$PATH" && rm -rf .data .nuxt && pnpm test:trips` (nunca a la vez que `generate`/`verify`) |
| Estático | `pnpm typecheck && pnpm lint` (Node 22) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHAPE-01 | 10 días con 2 sábados → 10 entradas de día con ids/labels únicos y en orden; Roma → 5 días `viernes…martes` | unit | `pnpm vitest run tests/unit/tripLayout.spec.ts` | ❌ Wave 0 |
| SHAPE-01 | `order` contiguo 1..N; pastillas únicas; slug de día `^[a-z0-9-]+$`; dientes con fixtures | data | `pnpm vitest run tests/data/invariants.spec.ts tests/data/schema.spec.ts` | ✅ (ampliar) |
| SHAPE-01 | `/trips/forma`: 10 `section` de día + 10 pastillas de día distintas, cada `href` lleva a su `section[id]` | e2e (dev) | `pnpm test:trips -g "forma"` | ❌ Wave 0 (`tests/trips/shape.spec.ts`) |
| SHAPE-01/02 | Roma: 12 pastillas en el orden bloqueado | e2e (build) | `pnpm test:parity` (shell.spec.ts `EXPECTED_PILLS`) | ✅ congelado |
| SHAPE-02 | Presencia: sin artistas → sin arte/arquitectura; glosario solo → arquitectura; sin comida → sin gastronomía | unit | `pnpm vitest run tests/unit/tripLayout.spec.ts` | ❌ Wave 0 |
| SHAPE-02 | `/trips/forma` sin `#arte`, `#arquitectura` (ni sus pastillas) | e2e (dev) | `pnpm test:trips -g "forma"` | ❌ Wave 0 |
| SHAPE-02 | Ancla a sección ausente → `anchor` rojo | data | `pnpm test:data` | ✅ (invertir control) |
| SHAPE-03 | Valores de chrome de Roma == `index.html` verbatim | data | `pnpm vitest run tests/data/romaChrome.spec.ts` | ❌ Wave 0 |
| SHAPE-03 | Marca/pie en el `/` construido (texto) | e2e (build) | `pnpm test:parity` (shell.spec) | ✅ congelado |
| SHAPE-03 | Forma muestra SU brand/footer/mapLegend; prueba (sin campos) no tiene `<footer>`/`.map-legend` y su marca = título plano | e2e (dev) | `pnpm test:trips -g "chrome"` | ❌ Wave 0 |
| SHAPE-04 | Roma `<title>` = `Roma · 19—23 giugno 2026` | e2e (build) | `pnpm test:parity` (shell.spec `toHaveTitle(TITLE)`) | ✅ congelado |
| SHAPE-04 | `document.title` de forma = su `pageTitle`; prueba = `Dos días de Prueba` | e2e (dev) | `pnpm test:trips -g "título"` | ❌ Wave 0 |
| SHAPE-04 | `inlineMdToPlain` | unit | `pnpm vitest run tests/unit/tripLayout.spec.ts` | ❌ Wave 0 |
| SHAPE-05 | Trampa: ninguna palabra de Roma en título/body de prueba y forma; control positivo en Roma | e2e (dev) | `pnpm test:trips -g "trampa"` | ❌ Wave 0 |
| SHAPE-05 | Dientes del matcher (aroma/Romaña no; Roma/ROYAL COURT sí) | unit | `pnpm vitest run tests/unit/romaLeaks.spec.ts` | ❌ Wave 0 |
| SHAPE-05 / D-17 | Literales de chrome de Roma ausentes de `app/**` (plantillas incluidas) | unit | `pnpm vitest run tests/unit/romaChromeGuard.spec.ts` | ❌ Wave 0 |
| SHAPE-05 | Centinela de forma ausente de `index.html`/`_payload.json` | data (post-build) | `pnpm verify` (build-isolation.spec.ts) | ✅ (ampliar) |
| Criterio 5 / D-18 | 56 goldens + 80 tests de la puerta sin re-baseline | e2e (build) | `pnpm verify` | ✅ congelado |

### Sampling Rate
- **Per task commit:** `pnpm test:unit && pnpm test:data` (+ `pnpm typecheck` si se tocan tipos o props).
- **Per wave merge:** `pnpm verify` (Node 22; incluye el `rm -rf`). En las waves que toquen `tests/trips` o el viaje forma: `rm -rf .data .nuxt && pnpm test:trips`.
- **Phase gate:** `pnpm verify` + `pnpm test:trips` + `pnpm lint` + `pnpm typecheck` en verde antes de `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `tests/unit/tripLayout.spec.ts`: SHAPE-01/02/04 (puro)
- [ ] `tests/unit/romaLeaks.spec.ts` + `tests/trips/romaLeaks.ts`: matcher con dientes (SHAPE-05)
- [ ] `tests/unit/romaChromeGuard.spec.ts`: guardián D-17
- [ ] `tests/data/romaChrome.spec.ts`: verbatim contra `index.html` (SHAPE-03/04)
- [ ] `tests/trips/shape.spec.ts`: forma + trampa + chrome de prueba (SHAPE-01..05)
- [ ] Ampliar `tests/data/invariants.spec.ts`, `schema.spec.ts` y `build-isolation.spec.ts`
- Sin instalación de framework: todo existe.

## Security Domain

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | sitio estático sin cuentas |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | yes | zod (`shared/schemas.ts`) + puerta `checkTrip`; chrome como texto plano interpolado (escapado por Vue) y Markdown vía MDC; **nunca `v-html`** |
| V6 Cryptography | no | — |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Enlace `javascript:`/relativo en prosa YAML que saca al lector del viaje | Tampering / Spoofing | Lista blanca `cross-trip-link` (D-05b): solo `#id` o `https?://` |
| Texto de un viaje que se cuela en otro (leak) | Information disclosure | Test-trampa (D-16) + guardián estático (D-17) + centinela en build-isolation |
| Viajes dev-only en el `sql_dump` público | Information disclosure | Diferido a la Fase 11 (`draft`, CR-01); se documenta que `forma` queda en el mismo caso |

## Sources

### Primary (HIGH confidence)
- Lectura directa en esta sesión: `app/components/{TripView,Topbar,NavPills,TheHero,GastroSection,DaySection,LeafletMap.client}.vue`, `app/app.vue`, `app/composables/{useTrip,useCardNavigation}.ts`, `app/utils/{dayLabel,foodGroups}.ts`, `shared/schemas.ts`, `content.config.ts`, `nuxt.config.ts`, `vitest.config.ts`, `playwright.{gate,trips}.config.ts`, `tests/data/{trips,invariants.spec,schema.spec,build-isolation.spec,migration-diff.spec}.ts`, `tests/unit/tripCoupling.spec.ts`, `tests/trips/isolation.spec.ts`, `tests/parity/{shell,visual-diff}.spec.ts`, `app/assets/css/base.css`, `index.html`, `content/trips/{roma,prueba}/**`.
- Build actual (`.output/public/index.html`, `__nuxt_content/{trip,day}/sql_dump.txt`): HTML prerenderizado de marca, leyenda, pie, pastillas, `<title>`, orden de `<section>`; columnas `NULL` y `"order" INT`.
- Ejecución: `pnpm test:unit` (13 ficheros / 164 tests) y `pnpm test:data` (4 / 263) en verde, 2026-11-20.

### Secondary (MEDIUM confidence)
- [Unhead — Titles](https://unhead.unjs.io/docs/head/guides/core-concepts/titles): desempate de títulos con la misma prioridad.
- [Nuxt 4 — SEO and Meta](https://nuxt.com/docs/4.x/getting-started/seo-meta): entrada reactiva en `useHead`, sin `titleTemplate` por defecto.

### Tertiary (LOW confidence)
- Ninguna fuente solo de búsqueda web.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH, sin dependencias nuevas; versiones leídas de package.json y node_modules.
- Architecture: HIGH, basada en el código y la build reales; el único supuesto es A1 (CSS `+` y comentarios), estándar.
- Pitfalls: HIGH en 1-5, 7-9 (verificados); MEDIUM en 6 y 10 (estimados, se confirman con `test:trips`).

**Research date:** 2026-11-20
**Valid until:** 2026-12-20 (stack estable; válido mientras no cambie la plantilla de TripView)
