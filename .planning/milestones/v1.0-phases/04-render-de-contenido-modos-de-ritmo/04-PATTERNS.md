# Fase 4: Render de contenido + modos de ritmo - Mapa de patrones

**Mapeado:** 2026-06-20
**Ficheros analizados:** 22 (15 componentes nuevos + 1 composable + 1 util + 6 tests; 2 modificados)
**Analogías encontradas:** 20 / 22 con análogo directo en el repo (F3 acaba de aterrizar el patrón)

> **Misma base de código.** F4 NO es greenfield: F3 ya estableció y bloqueó el patrón de componente
> (`app/components/*.vue`), el composable (`useTrip.ts`), el util puro (`dayLabel.ts`/`tripIndexes.ts`)
> y la infraestructura de test (Playwright autocontenido + Vitest puro). **Cada fichero nuevo de F4 copia
> un análogo concreto del repo.** Las referencias `index.html:NNNN` son el markup VERBATIM a transcribir;
> los `app/...` son el patrón de código a replicar. El planner/ejecutor lee AMBOS.

---

## Clasificación de ficheros

### Componentes nuevos

| Fichero nuevo | Rol | Flujo de datos | Análogo más cercano | Calidad |
|---------------|-----|----------------|---------------------|---------|
| `app/components/MonumentCard.vue` | component (presentacional) | transform (Monument→markup + `<MDC>`) | `app/components/TheHero.vue` (props tipados + `<MDC>` + verbatim) | exacto (rol) |
| `app/components/DaySection.vue` | component (contenedor) | transform (Day→header/stats/timeline/cards) | `app/components/Topbar.vue` (contenedor que pasa props a hijos) + `TripView.vue` (consume `useTrip`) | exacto (rol) |
| `app/components/Timeline.vue` | component (dispatcher) | transform (`day.timeline[]`→`<component :is>` por kind) | `app/components/NavPills.vue` (`v-for` sobre array tipado) | role-match |
| `app/components/TimelineStop.vue` | component (presentacional) | transform (1 fila `kind:'stop'`) | `app/components/NavPills.vue` (markup verbatim por item) + `index.html:2404` | exacto (rol) |
| `app/components/TimelineTransport.vue` | component (presentacional) | transform (1 fila `kind:'transport'`) | `index.html:2405/2408/2411/2445` (variantes) + patrón F3 | role-match |
| `app/components/TimelineMeta.vue` | component (presentacional) | transform (1 fila `kind:'meta'`) | `index.html:2407/2410/2413` + patrón F3 | role-match |
| `app/components/TimelineFood.vue` | component (presentacional) | transform (1 fila `kind:'food'`) | `index.html:2420-2426/2434-2444` + patrón F3 | role-match |
| `app/components/TimelineReservation.vue` | component (presentacional) | transform (1 fila `kind:'reservation'`) | `index.html:2433` + patrón F3 | role-match |
| `app/components/GastroCard.vue` | component (presentacional) | transform (Food→markup) | `app/components/MonumentCard.vue` (gemelo F4) / `TheHero.vue` | role-match |
| `app/components/GastroSection.vue` *(contenedor #gastronomia — verificar nombre)* | component (contenedor + agrupado) | transform + group-by (`food.group`) | `app/components/NavPills.vue` (`v-for`) + util agrupado | role-match |
| `app/components/ArtistCard.vue` | component (presentacional, ramifica por `kind`) | transform (Artist union→markup) | `app/components/ThemeToggle.vue` (lógica de ramas) + `MonumentCard.vue` | role-match |
| `app/components/ReservasSection.vue` | component (sección de referencia) | transform (Reference `slug:'reservas'`→tabla) | `app/components/TheHero.vue` (sección completa data-bound) | role-match |
| `app/components/PracticaSection.vue` | component (sección de referencia) | transform (Reference `slug:'practica'`→prosa+media) | `app/components/TheHero.vue` (sección + `<MDC>`) | role-match |
| `app/components/DetailPhoto.global.vue` | component MDC inline (**GLOBAL**) | transform (props MDC→`.detail-photo`) | **SIN análogo de mecanismo** (1er `.global.vue` del repo) — markup desde `index.html:2479-2482` | parcial |
| `app/components/ProseUl.global.vue` *(Pitfall 1 — verificar)* | component MDC override (**GLOBAL**) | transform (`<ul>` Markdown→`.detail-list`) | **SIN análogo** (override Prose) — clase desde `index.html:2483` | parcial |
| `app/components/ProseLi.global.vue` *(Pitfall 1 — verificar)* | component MDC override (**GLOBAL**) | transform (`<li>`→`.detail-list li`) | **SIN análogo** (override Prose) | parcial |

### Composable / util / modificados

| Fichero | Rol | Flujo de datos | Análogo más cercano | Calidad |
|---------|-----|----------------|---------------------|---------|
| `app/composables/useTripModes.ts` | composable (estado reactivo) | event-driven (pace/light/resumen + persistencia) | `app/composables/useTrip.ts` (convención de composable) + `ThemeToggle.vue` (init cliente, claves localStorage) | role-match |
| `app/utils/pace.ts` | utility (función pura) | transform (`isVisible(itemPace,pace)`) | `app/utils/dayLabel.ts` (pura, auto-import, testeable) | exacto |
| `app/components/TheHero.vue` **(MODIFICAR)** | component (cablear controles) | event-driven (consume composable) | sí mismo (markup F3) + RESEARCH §Pattern 7 | exacto |
| `app/components/TripView.vue` **(MODIFICAR)** | component (poseedor) | transform (enchufa render en 11 secciones) | sí mismo (markup F3) | exacto |

### Tests nuevos

| Fichero | Rol | Análogo más cercano | Calidad |
|---------|-----|---------------------|---------|
| `tests/unit/pace.spec.ts` | test (unit puro) | `tests/unit/dayLabel.spec.ts` | exacto |
| `tests/unit/foodGroups.spec.ts` *(opcional)* | test (unit puro) | `tests/unit/dayLabel.spec.ts` / `tripIndexes.spec.ts` | exacto |
| `tests/parity/render-cards.spec.ts` | test (E2E DOM autocontenido) | `tests/parity/shell.spec.ts` | exacto |
| `tests/parity/render-timeline.spec.ts` | test (E2E DOM autocontenido) | `tests/parity/shell.spec.ts` | exacto |
| `tests/parity/render-reference.spec.ts` | test (E2E DOM autocontenido) | `tests/parity/shell.spec.ts` | exacto |
| `tests/parity/modes.spec.ts` | test (E2E comportamiento) | `tests/parity/theme.spec.ts` (interacción + persistencia + micro-flash) | exacto |

---

## Asignaciones de patrón

### `MonumentCard.vue` (component, transform) · UI-02

**Análogo:** `app/components/TheHero.vue` (props `Trip` tipados + `<MDC>` + markup verbatim, CERO CSS).
**Markup fuente:** `index.html:2450-2510` (galleria-sciarra) · datos en `content/trips/roma/monuments/galleria-sciarra.yml`.

**Cabecera de fichero + imports** — copiar el estilo de `TheHero.vue:1-27` (comentario que cita el rango `index.html`, el porqué del CERO CSS, e import de tipo desde `~~/shared/schemas`):
```vue
<script setup lang="ts">
// MonumentCard — .card VERBATIM (UI-02). Reproduce index.html:2450-2510 data-bound desde un Monument.
// CERO CSS, SIN <style scoped> (data-v-* rompería .card-section p:first-of-type::first-letter, etc.).
import type { Monument } from '~~/shared/schemas'

defineProps<{ monument: Monument }>()
</script>
```

**Patrón núcleo (prosa por secciones)** — `v-for` sobre `monument.sections` con `<MDC>` SIN `unwrap` + `no-dropcap` reactivo (Pitfall 2). Esto es lo que distingue a `MonumentCard` de `TheHero` (que usa `unwrap="p"` en inline):
```vue
<div
  v-for="(s, i) in monument.sections"
  :key="i"
  class="card-section"
  :class="{ 'no-dropcap': i !== 0 }"
>
  <h4>{{ s.heading }}</h4>
  <MDC :value="s.body" /> <!-- SIN unwrap: <p> reales para el dropcap + :detail-photo + listas -->
</div>
```
> Confirmado en el dato: galleria-sciarra `sections[3].body` empieza con `:detail-photo{...}` y sigue con
> lista `- ` nativa (Markdown). La 1ª sección ("Qué es") lleva dropcap; el resto `no-dropcap` (verbatim
> `index.html:2460/2465/2471/2476`).

**Hero PLANO (D-01, frontera F7)** — copiar el patrón `<img>` de `TheHero` pero SIN `onerror` (el index.html sí lo tiene en :2459; F4 lo OMITE, F7 lo reañade):
```vue
<div class="card-hero"><img :src="monument.hero.src" :alt="monument.hero.alt" loading="lazy"></div>
```

**maps-link** — reconstruir el `href` con `encodeURIComponent(monument.mapsQuery)`; texto estático "Ver en Google Maps". El original lo trae ya escapado (`index.html:2498`: `query=Galleria%20Sciarra%20Roma`). **Verificar el escaping en fichas con apóstrofo** (A4/Pitfall maps-link):
```vue
<a :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(monument.mapsQuery)}`"
   target="_blank" rel="noopener" class="maps-link">Ver en Google Maps</a>
```

**sorrentino-box (opcional)** — `unwrap="p"` (el texto va directo tras el `<span class="label">`, `index.html:2501-2504`). **culture-box** (opcional): `monument.culture[]` = `{title,text}`.

**notes-area SHELL (D-02, frontera F7)** — markup exacto `index.html:2506-2509`, `textarea` con `data-note-key` y SIN binding de persistencia (eso es F7). Mismo principio que F3 con los controles de `TheHero`:
```vue
<div class="notes-area">
  <label :for="`note-${monument.slug}`">Notas in situ</label>
  <textarea class="notes-textarea" :id="`note-${monument.slug}`" :data-note-key="monument.slug"
            placeholder="Lo que quieras recordar de aquí…" />
</div>
```

**card-artists / card-arch (opcional)** — `index.html:2521`: `<div class="card-artists card-arch">Arquitectura: <a class="art-link" href="#arq-moderna">Tardobarroco</a></div>`. Esquema: `monument.artists[]`/`monument.arch[]` = `Link[]` (`{ref,label,note?}`). Enlaces planos `#id` (la intercepción es F5).

---

### `DetailPhoto.global.vue` (component MDC inline, GLOBAL) · D-02

**SIN análogo de mecanismo en el repo** — es el PRIMER componente `.global.vue`. El planner debe tratar el sufijo `.global.vue` como el mecanismo (RESEARCH §Pattern 1, VERIFICADO desde `@nuxtjs/mdc@0.22.0`):

- `<MDC :value="body" />` al toparse con `:detail-photo{...}` llama `resolveComponent(pascalCase('detail-photo'))` = `resolveComponent('DetailPhoto')` contra el registro **GLOBAL** de la app.
- En Content v3 los auto-imports normales de `app/components/` **NO** son globales → un `DetailPhoto.vue` normal NO lo resolvería. El sufijo `.global.vue` lo registra global.
- Alternativa equivalente: entrada `components:[{path:'~/components/content', global:true}]` en `nuxt.config.ts` (más superficie). **Recomendado el sufijo.**

**Markup fuente:** `index.html:2479-2482`. Props = los `{key=value}` del MDC (`src`/`alt`/`caption`). `<img>` PLANO (D-01; sin `onerror`):
```vue
<script setup lang="ts">
defineProps<{ src: string, alt: string, caption: string }>()
</script>
<template>
  <div class="detail-photo">
    <img :src="src" :alt="alt" loading="lazy">
    <div class="detail-photo-caption"><MDC :value="caption" unwrap="p" /></div>
  </div>
</template>
```
> La caption de galleria-sciarra es texto plano → `{{ caption }}` bastaría; `<MDC unwrap="p">` es seguro
> para cualquiera con markup. El planner decide tras grep de las ~37 captions (Open Q 3).

---

### `ProseUl.global.vue` / `ProseLi.global.vue` (override Prose, GLOBAL) · Pitfall 1 — VERIFICAR

**SIN análogo en el repo.** Riesgo de paridad REAL confirmado en el dato: las listas "En qué fijarse" están como **listas Markdown nativas** (`- item`) en `sections[].body` (visto en galleria-sciarra.yml), no como `<ul class="detail-list">`. `<MDC>` las renderiza con `ProseUl`/`ProseLi` → `<ul>`/`<li>` **SIN** la clase `.detail-list` (✦ + bordes, `base.css:799-818`) → divergencia visual.

**Recomendación (RESEARCH Pitfall 1, opción 1):** crear `ProseUl.global.vue` que renderice `<ul class="detail-list"><slot/></ul>` y `ProseLi.global.vue` `<li><slot/></li>`. **El planner DEBE grep `content/trips/roma/**/*.yml` para confirmar que TODA lista de prosa (también practica/artist) debe verse como `.detail-list`** antes de aplicarlo global (si alguna lista debe verse distinta, esta solución la rompería).

**Markup objetivo:** `index.html:2483` (`<ul class="detail-list">`). El nombre `ProseUl`/`ProseLi` es la convención de override de Prose components de Content/MDC (resuelto por `findMappedTag`).

---

### `Timeline.vue` (component dispatcher, transform) · UI-03

**Análogo:** `app/components/NavPills.vue` (`v-for` sobre array tipado de `~~/shared/schemas`, markup verbatim).
**Markup fuente:** `index.html:2403-2446` (contenedor `.timeline`).

**Patrón núcleo (dispatch por `kind`)** — mapea 1:1 el `discriminatedUnion('kind')` de `shared/schemas.ts:85-123`:
```vue
<script setup lang="ts">
import type { Day } from '~~/shared/schemas'
defineProps<{ rows: Day['timeline'] }>()

const COMPONENT_BY_KIND = {
  stop: 'TimelineStop', transport: 'TimelineTransport', meta: 'TimelineMeta',
  food: 'TimelineFood', reservation: 'TimelineReservation',
} as const
</script>
<template>
  <div class="timeline">
    <component :is="COMPONENT_BY_KIND[row.kind]" v-for="(row, i) in rows" :key="i" :row="row" />
  </div>
</template>
```
> El filtrado por ritmo (`.tl-hidden`) NO vive aquí — vive en `TimelineStop`/`TimelineTransport`
> (Pitfall 4). `Timeline` solo despacha. Orden = orden del array (nunca reordenar).

---

### `TimelineStop.vue` (component, transform) · UI-03

**Análogo:** `NavPills.vue` (markup verbatim por item) · **Markup:** `index.html:2404` (+ `.disabled` 2404/2406, `.reserved-event` 2432).
**Tipo de prop:** la rama `kind:'stop'` de `TimelineRow` (`shared/schemas.ts:86-96`): `{pace,time,title,ref?,disabled,reservedEvent,tag?,note?}`.

**SE FILTRA por ritmo** — aplicar el binding sobre el elemento raíz (consume `useTripModes`, auto-importado):
```vue
<script setup lang="ts">
const props = defineProps<{ row: /* stop row */ }>()
const { isVisible } = useTripModes()
</script>
<template>
  <div class="tl-item" :class="{ 'tl-hidden': !isVisible(row.pace), 'reserved-event': row.reservedEvent }" :data-pace="row.pace">
    <span class="tl-time">{{ row.time }}</span>
    <!-- a.tl-title[href=#ref] si row.ref; si no span.tl-title.disabled (index.html:2404 disabled / 2409 con enlace) -->
    ...
  </div>
</template>
```
> Conservar `:data-pace="row.pace"` por paridad de atributo (el golden lo tiene). Enlaces `#ref` planos (F5 intercepta).

---

### `TimelineTransport.vue` (component, transform) · UI-03

**Markup:** `index.html:2405` (taxi), `2408` (taxi slow-only), `2411` (walk), `2445` (taxi). Variantes de clase: `taxi`/`walk`/`train`/`metro`/`metro-b`.
**Tipo de prop:** rama `kind:'transport'` (`shared/schemas.ts:97-104`): `{pace,variant?,header,modes:TransportMode[],footnote?}`. `TransportMode` = `{icon,recommended,desc,tag?,meta?}` (`schemas.ts:68-74`).
**SE FILTRA por ritmo** (igual que `TimelineStop`: `:class="{ 'tl-hidden': !isVisible(row.pace) }"`, `:data-pace`).
**`unwrap="p"`** en `desc`/`meta`/`footnote` (fragmentos inline; UI-SPEC matriz unwrap).

---

### `TimelineMeta.vue` / `TimelineFood.vue` / `TimelineReservation.vue` (component, transform) · UI-03

| Componente | Markup | Tipo de prop (schemas.ts) | Ritmo |
|------------|--------|---------------------------|-------|
| `TimelineMeta` | `index.html:2407/2410/2413` | rama `kind:'meta'` (105-111): `items:[{level:'ok'\|'warn'\|'plain',text}]` | **NO filtra** (no consulta `isVisible`) |
| `TimelineFood` | `index.html:2420-2426/2434-2444` | rama `kind:'food'` (112-118): `{pace,header,entries:FoodEntry[],footnote?}`; `FoodEntry` (75-83) | **NO filtra** (aunque lleve `pace`) |
| `TimelineReservation` | `index.html:2433` | rama `kind:'reservation'` (119-122): `{text}` (banda verde "✅ **{…}** — {…}") | **NO filtra** |

> **Pitfall 4 crítico:** estos tres NUNCA consultan `isVisible`. Solo stop/transport se filtran por ritmo
> (mapea `index.html:6521`: `querySelectorAll('.tl-item[data-pace], .tl-transport[data-pace]')`).
> `unwrap="p"` en `tl-note`/`tl-food-desc`/`tl-meta-item`/footnotes (matriz UI-SPEC).

---

### `DaySection.vue` (component contenedor, transform) · UI-03

**Análogo:** `Topbar.vue` (contenedor que recibe `:days` y pasa a hijos) + `TripView.vue:28-31` (consume `useTrip`; **recomendación: recibir `monById`/`day` por props desde TripView**, no re-llamar `useTrip`).
**Markup fuente:** sección de día `index.html:2375-2448` (light-banner + section-eyebrow + day-header + day-stats + dia-ligera + Timeline + cards-list).
**Tipo de prop:** `Day` (`schemas.ts:124-145`) + `monById: Map<string, Monument>`.

**Patrón núcleo (resolver `day.cards[]`→Monument, ORDEN = dato)** — consume el índice O(1) de `useTrip` (igual que el patrón de `buildTripIndexes`):
```vue
<script setup lang="ts">
import type { Day, Monument } from '~~/shared/schemas'
const props = defineProps<{ day: Day, monById: Map<string, Monument> }>()
const dayCards = computed(() =>
  props.day.cards.map(slug => props.monById.get(slug)).filter((m): m is Monument => !!m))
</script>
<template>
  ...
  <div class="cards-list">
    <MonumentCard v-for="m in dayCards" :key="m.slug" :monument="m" />
  </div>
</template>
```
> `.light-banner` (`index.html:2377`, texto verbatim) y `.dia-ligera` (2393-2401, `lg-see`/`lg-move`/`lg-skip`/`lg-care`/`lg-rest`) son markup CSS-hidden (visibles solo con `body.light-mode`). `day.stats[]` → `.day-stats-item` por `variant` (walk/train/taxi/metro/ticket). **Nunca reordenar `day.cards`** (Pitfall 6; es el orden de la ruta del día de F6).

---

### `GastroCard.vue` + contenedor `#gastronomia` (component, transform + group-by) · UI-04

**Análogo card:** `MonumentCard.vue` (gemelo F4). **Análogo contenedor:** `NavPills.vue` (`v-for`) + agrupado por `Map`.
**Markup:** `index.html:5335-5377+` (sección), `5346-5360` (card). **Tipo:** `Food` (`schemas.ts:153-167`).

**Patrón núcleo (agrupar por `food.group` preservando orden de aparición)** — extraer a util puro testeable (analogía: `tripIndexes.ts`) o `computed`:
```ts
const foodGroups = computed(() => {
  const groups = new Map<string, Food[]>()
  for (const f of (food.value ?? [])) {
    if (!groups.has(f.group)) groups.set(f.group, [])
    groups.get(f.group)!.push(f)
  }
  return [...groups.entries()].map(([group, items]) => ({ group, groupIntro: items[0]?.groupIntro, items }))
})
```
> **Pitfall 6 / A3:** el `Map` preserva el orden de `queryCollection('food').all()`. **Verificar que coincide
> con el orden de `gastro-section-title` del golden `#gastronomia`**; si difiere, ordenar explícitamente.
> Card: `gastro-card-badge.badge-*` (de `badgeKind`) + name + address + `p.gastro-card-desc` + `.gastro-plato`
> + footer. `unwrap="p"` en `desc`/`plato` (clase en el contenedor propio).

---

### `ArtistCard.vue` (component, ramifica por `kind`) · UI-04

**Análogo:** `ThemeToggle.vue` (lógica de ramas en `<script setup>`) + `MonumentCard.vue` (prosa por secciones).
**Markup:** arte `index.html:~5941` (`art-*`), arquitectura `~6104` (`arq-*`), glosario `~6202` (`arq-glosario`).
**Tipo:** `Artist` = `discriminatedUnion('kind')` con 3 ramas (`schemas.ts:175-209`): `artist` / `arquitectura` / `glossary`.

**UN SOLO componente** que ramifica por `kind` (no tres):
- `kind:'artist'` y `'arquitectura'`: `.artist-card` con avatar/name/dates/epithet + `sections[]` (prosa `<MDC>` sin unwrap, como MonumentCard) + `seenIn[]` (✦ Links `#monumento`).
- `kind:'glossary'`: `.arq-glosario` con `terms[]` = 10 `arch-term` (`<b>{term}</b><span>{def}</span>`).

> El estrechamiento de tipo de la unión: usar `v-if="row.kind === 'glossary'"` (Vue estrecha la rama). Patrón de
> ramas como `ThemeToggle.toggle()` pero en template.

---

### `ReservasSection.vue` (component sección, transform) · UI-04

**Análogo:** `TheHero.vue` (sección completa data-bound, `<MDC>`).
**Markup:** `index.html:5260-5333`. **Tipo:** `ReservasSchema` (`schemas.ts:212-232`): `{title,eyebrow,intro,confirmed[],table[]}`.
**Patrón:** `.section-eyebrow` + `h2.section-title` + `p.gastro-intro` + `.reservas-box` (`.reservas-confirmadas` 2× `ul` por `confirmed[].group` mesas/visitas · `.reservas-table` con filas `.is-done?` + `td` con `a` + `.reservas-badge.badge-urgent`/`.badge-done`/`.badge-rec` de `badgeKind`). `unwrap="p"` en `confirmed[].text`/`table[].desc` (dentro de `<li>`/`<td>`).

---

### `PracticaSection.vue` (component sección, transform) · UI-04

**Análogo:** `TheHero.vue` (sección + `<MDC>` + `v-for` de párrafos).
**Markup:** `index.html:5825`. **Tipo:** `PracticaSchema` (`schemas.ts:233-245`): `{title,eyebrow,intro,sections[],media[]}`.
**Patrón:** eyebrow + h2 + intro + `sections[]` (prosa `<MDC>`, posibles `.detail-list` → cubierto por ProseUl) + `media[]` por `category` (libros/peliculas/series/playlist), cada item Markdown-inline.

---

### `useTripModes.ts` (composable, event-driven) · FEAT-06/07/08

**Análogo de convención:** `app/composables/useTrip.ts` (composable exportado, comentario de cabecera explicando el contrato).
**Análogo de init cliente + localStorage:** `ThemeToggle.vue` (consume estado de cliente, claves localStorage literales `roma-*`, evita FOUC/mismatch).
**Lógica fuente VERBATIM:** `index.html:6505-6577` (`setPace`/`setLightMode`/`setResumen` + restores).

**Forma exacta (RESEARCH §Pattern 6):** `useState` (SSR-singleton) para `pace`/`light`/`resumen`; `useHead({bodyAttrs})` para las clases de `<body>`; init + persistencia en `onMounted`:
```ts
export function useTripModes() {
  const pace = useState<'optimistic'|'neutral'|'slow'>('pace', () => 'optimistic') // DEFAULT = prerenderizado
  const light = useState('light', () => false)
  const resumen = useState('resumen', () => false)

  watch(light, (on) => { if (on) pace.value = 'slow' }) // index.html:6552 — SIN else (Pitfall 5)

  const isVisible = (itemPace: 'all'|'medium'|'slow-only') => // delega en utils/pace.ts (matriz 6521-6534)
    isVisibleFn(itemPace, pace.value)

  useHead({ bodyAttrs: { class: computed(() =>
    [light.value ? 'light-mode' : '', resumen.value ? 'modo-resumen' : ''].filter(Boolean).join(' ')) } })

  onMounted(() => { // micro-flash intencional (SC#4); restaurar light DESPUÉS de pace (index.html:6650-6652)
    const sp = localStorage.getItem('roma-pace')
    if (sp === 'optimistic' || sp === 'neutral' || sp === 'slow') pace.value = sp
    if (localStorage.getItem('roma-light') === '1') light.value = true
    if (localStorage.getItem('roma-resumen') === '1') resumen.value = true
    watch(pace, v => localStorage.setItem('roma-pace', v))       // persistencia DENTRO de onMounted
    watch(light, v => localStorage.setItem('roma-light', v ? '1' : '0'))
    watch(resumen, v => localStorage.setItem('roma-resumen', v ? '1' : '0'))
  })

  return { pace, light, resumen, isVisible }
}
```
> Claves localStorage LITERALES (`roma-pace`/`roma-light`/`roma-resumen`). NO leer localStorage en setup
> síncrono (rompe prerender). NO `classList`/`querySelectorAll` (anti-patrón CLAUDE.md). NO script inline
> para modos (solo el tema lo justifica, y ya lo cubre color-mode F3).

---

### `utils/pace.ts` (utility pura) · FEAT-06

**Análogo EXACTO:** `app/utils/dayLabel.ts` (función pura, framework-free, auto-importada como `<nombre>`, testeable en Vitest plano sin runtime Nuxt). Mismo comentario de cabecera explicando por qué se extrae.
**Lógica fuente:** `index.html:6521-6534`.
```ts
export type Pace = 'optimistic' | 'neutral' | 'slow'
export type ItemPace = 'all' | 'medium' | 'slow-only'
export function isVisible(itemPace: ItemPace, pace: Pace): boolean {
  if (pace === 'optimistic') return true
  if (pace === 'neutral') return itemPace !== 'slow-only'
  return itemPace === 'all' // slow: oculta 'medium' Y 'slow-only'
}
```

---

### `TheHero.vue` **(MODIFICAR)** · D-05 / FEAT-06/07/08

**Análogo:** sí mismo (markup F3 `app/components/TheHero.vue:64-114`). **NO reestructurar el DOM del #inicio.**
Añadir al `<script setup>`: `const { pace, light, resumen } = useTripModes()`. Cablear los controles YA montados:
- `pace-btn`: el 1er botón hoy es `class="pace-btn active"` (línea 68-69) → cambiar a `class="pace-btn" :class="{ active: pace === 'optimistic' }"` + `@click="pace = 'optimistic'"` (si no, Vue mergea y queda siempre `active`). Los otros dos: `:class="{ active: pace === '...' }"` + `@click`.
- `#light-toggle` (línea 94-97, hoy `aria-pressed="false"`): `:aria-pressed="light"` + `@click="light = !light"`.
- `#resumen-toggle` (línea 105-108): `:aria-pressed="resumen"` + `@click="resumen = !resumen"`.
> Los `pace-btn` usan `.active`, NO `aria-pressed` (no añadirlo). El `search-input` lo cablea F6 (no tocar).

---

### `TripView.vue` **(MODIFICAR)** · enchufe del render

**Análogo:** sí mismo (markup F3 `app/components/TripView.vue`). Hoy `const { trip, days } = await useTrip(props.slug)` (línea 30) y 11 `<section id>` VACÍAS (líneas 42-51).
Cambios: ampliar el destructuring a `monById` (y `food`/`artists`/`reference`/sus índices); rellenar las 11 secciones pasando datos POR PROPS (un solo `useTrip`, mismo patrón que `Topbar :days`):
```vue
<section id="viernes"><DaySection :day="days.find(d => d.slug === 'viernes')!" :mon-by-id="monById" /></section>
...
<section id="reservas"><ReservasSection :reservas="refById.get('reservas')" /></section>
```
> Mantener el orden de hermanos VERBATIM. `#mapa` sigue vacío (F7). Ningún `<NuxtLink>` a `/trips/*`.

---

## Patrones compartidos

### Patrón de componente F3 (aplica a TODOS los 15 componentes nuevos)
**Fuente:** `app/components/TheHero.vue`, `Topbar.vue`, `NavPills.vue`, `ThemeToggle.vue`, `BackButton.vue`.
**Regla bloqueada (LOCKED por F3, reiterada en CONTEXT D-10 + UI-SPEC "Regla de oro"):**
1. Comentario de cabecera que cita el rango `index.html:NNNN` reproducido + por qué CERO CSS.
2. `<script setup lang="ts">` + `defineProps<{...}>()` con tipo importado de `~~/shared/schemas`.
3. Markup + clases VERBATIM del index.html.
4. **CERO CSS, SIN `<style scoped>`** — un `data-v-*` rompería en silencio selectores globales descendientes (`.card-section p:first-of-type::first-letter`, `.detail-list li::before`, `body.modo-resumen .cards-list`).
```vue
<!-- esqueleto de TODO componente F4 (copiado de TheHero.vue:24-27) -->
<script setup lang="ts">
// <Componente> — <clase> VERBATIM. Reproduce index.html:NNNN-MMMM. CERO CSS, SIN scoped.
import type { Monument } from '~~/shared/schemas'
defineProps<{ monument: Monument }>()
</script>
```

### Render de prosa `<MDC>` — matriz unwrap
**Fuente:** `app/components/TheHero.vue:37-40` (`unwrap="p"` inline) y `:140` (sin unwrap para párrafo).
**Aplica a:** todo campo Markdown. **Regla:** si el dato va dentro de un contenedor que YA estiliza como bloque → `unwrap="p"`; si el dato ES el bloque de párrafos (prosa de ficha/artist/practica) → **sin unwrap** (lo exige el dropcap, Pitfall 2). Matriz campo-por-campo completa en UI-SPEC ▸ "Contrato del render de prosa".

### Consumo del índice O(1) de `useTrip`
**Fuente:** `app/composables/useTrip.ts:65-68` + `app/utils/tripIndexes.ts`.
**Aplica a:** `DaySection` (`monById`), `GastroSection` (`food`), `ReservasSection`/`PracticaSection` (`refById`), `ArtistCard` (`artById`).
**Regla:** resolver `day.cards[]`/`timeline.ref`/`seenIn[].ref` con `monById.get(slug)` (O(1)), NUNCA `.find()` por render. Pasar por props desde `TripView` (un solo `useTrip`).

### Estado cliente inicializado en `onMounted` (cero mismatch + micro-flash)
**Fuente:** patrón del tema F3 (`ThemeToggle.vue` consume color-mode, que aplica estado post-paint).
**Aplica a:** `useTripModes` (los 3 modos). **Regla:** default = HTML prerenderizado (`optimistic`/false/false); restaurar de localStorage en `onMounted` (1 frame post-paint = micro-flash SC#4). Esto es lo OPUESTO al tema (que usa script anti-FOUC): los modos PRESERVAN el flash intencionalmente.

### Test E2E DOM autocontenido (Playwright)
**Fuente:** `tests/parity/shell.spec.ts` (helpers `waitForServer`/`killGroup`/`ensureBuild`; `describe` con `beforeAll` que hace `pnpm generate` → copia `.output/public` a `<tmp>/guiaRoma/` → sirve con `serve`).
**Aplica a:** `render-cards`/`render-timeline`/`render-reference`/`modes`.
**Regla CRÍTICA (D2):** tolerar EXACTAMENTE el error de hidratación de color-mode y fallar ante cualquier otro:
```ts
const EXPECTED_HYDRATION_MSG = /Hydration completed but contains mismatches/i // shell.spec.ts:37
page.on('console', (msg) => {
  if (msg.type() === 'error' && !EXPECTED_HYDRATION_MSG.test(msg.text())) consoleErrors.push(msg.text())
})
// ... expect(consoleErrors).toHaveLength(0)
```
NO tocar `golden.spec.ts` ni sus snapshots (D-08). NO usar el webServer de `playwright.config.ts` (sirve el index.html vivo del golden).

### Test de interacción + persistencia + micro-flash
**Fuente:** `tests/parity/theme.spec.ts` (click sobre control + assert de clase/atributo; `context.addInitScript(localStorage.setItem(...))` para preseteo; `MutationObserver` + `exposeFunction` para vigilar transiciones/flash).
**Aplica a:** `modes.spec.ts`. Reusar el patrón de `theme.spec.ts:117-161` (preseteo `roma-pace=slow` → recarga → estado slow; observar la transición default→slow para confirmar el micro-flash).

### Test unitario puro (Vitest)
**Fuente:** `tests/unit/dayLabel.spec.ts` (import directo de `../../app/utils/<x>`, sin runtime Nuxt; un `it` por caso).
**Aplica a:** `pace.spec.ts` (9 casos: 3 paces × 3 itemPaces) y `foodGroups.spec.ts` (orden de primera aparición).

---

## Sin análogo (usar RESEARCH en su lugar)

| Fichero | Rol | Razón | Guía sustituta |
|---------|-----|-------|----------------|
| `DetailPhoto.global.vue` | component MDC inline GLOBAL | **Primer `.global.vue` del repo** — el mecanismo de registro global no existe aún en F3 | RESEARCH §Pattern 1 (verificado desde `@nuxtjs/mdc@0.22.0`); markup desde `index.html:2479-2482` |
| `ProseUl.global.vue` / `ProseLi.global.vue` | override Prose GLOBAL | No hay override de Prose components en el repo; depende de la decisión de Pitfall 1 | RESEARCH Pitfall 1 (opción 1); **grep obligatorio** de las listas de prosa antes de implementar; clase desde `index.html:2483` |

> Estos 3 ficheros comparten el sufijo `.global.vue` como mecanismo (no es opcional para que `<MDC>` los
> resuelva). El resto de F4 son auto-imports normales (planos en `app/components/`, sin subcarpeta) igual que F3.

---

## Notas de configuración (no son ficheros nuevos pero el planner las necesita)

- **`eslint.config.mjs`** — `Timeline` es un nombre de UNA palabra → `vue/multi-word-component-names` lo
  rechazará. F3 ya resolvió el mismo caso con `Topbar` (ver `eslint.config.mjs:24-29`): añadir un bloque
  gemelo para `app/components/Timeline.vue`, **o** renombrar a `DayTimeline`. El resto de componentes F4
  ya son multi-palabra. Patrón a copiar:
  ```js
  { files: ['app/components/Timeline.vue'], rules: { 'vue/multi-word-component-names': 'off' } }
  ```
- **Auto-import plano** — mantener todos los componentes directamente en `app/components/` (sin subcarpetas
  de dominio), igual que F3, para que `MonumentCard.vue` → `<MonumentCard>` sin prefijo. `<component :is="'TimelineStop'">`
  resuelve por string para auto-imports (A5).
- **`package.json`** — comandos existentes: `pnpm test:unit` (Vitest unit), `pnpm test:golden` (Playwright,
  incluye los specs nuevos de `tests/parity/`), `pnpm typecheck`, `pnpm lint`. Sin scripts nuevos necesarios.

---

## Metadata

**Alcance de búsqueda de análogos:** `app/components/` (6 componentes F3), `app/composables/` (`useTrip.ts`),
`app/utils/` (`dayLabel.ts`, `tripIndexes.ts`), `tests/parity/` (`shell.spec.ts`, `theme.spec.ts`),
`tests/unit/` (`dayLabel.spec.ts`), `shared/schemas.ts`, `eslint.config.mjs`, `index.html` (rangos UI-02/03/04 + modos JS),
`content/trips/roma/monuments/galleria-sciarra.yml` (confirmación de la forma del dato).
**Ficheros escaneados:** 14 leídos en detalle.
**Fecha de extracción de patrones:** 2026-06-20
