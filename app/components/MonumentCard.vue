<script setup lang="ts">
// MonumentCard — la `.card` de monumento COMPLETA (UI-02). Transcripción 1:1 del markup de
// `index.html:2450-2510` (ficha galleria-sciarra) + el patrón card-artists/card-arch de
// `index.html:2521`, data-bound desde un `Monument` tipado. Es el componente más rico de la
// Fase 4 y donde se resuelven dos sutilezas de paridad (Pitfalls 1 y 2).
//
// PROSA POR SECCIONES (Pitfall 2 — dropcap). Cada `sections[].body` se renderiza con MDC SIN
// unwrap (a diferencia de TheHero, que usa unwrap="p" en los casos inline): el dropcap
// `.card-section p:first-of-type::first-letter` (base.css:784) NECESITA un `<p>` real, así que
// NO se desenvuelve. La 1ª sección lleva el dropcap (sin clase extra); las secciones 2..n llevan
// `.no-dropcap` (que neutraliza el ::first-letter, base.css:794) — exactamente como el original
// (la 1ª `.card-section`, las demás `.card-section no-dropcap`).
//
// LISTAS DE PROSA (Pitfall 1 — `.detail-list`, resuelto LOCALMENTE). El original tiene
// `<ul class="detail-list">` (✦ + bordes, base.css:799-818) en "En qué fijarse"; en los datos de
// F2 esa lista es Markdown nativa, que MDC renderiza como `<ul>` SIN clase (ProseUl por defecto).
// El Plan 04-01 RESOLVIÓ por grep que NO se puede crear un `ProseUl.global.vue` que ponga
// `.detail-list` a TODA lista: las 13 fichas de artista usan `<ul>` SIN esa clase y un override
// global rompería su paridad. Por eso aquí la clase se aplica SOLO a las listas de MonumentCard,
// LOCALMENTE: se obtiene el AST con el slot de `<MDC>` y se pasa a `<MDCRenderer>` un mapa
// `:components` que sustituye `ul` por `DetailListUl` (un componente OBJETO local — no global —
// que emite `<ul class="detail-list">`). MDCRenderer acepta valores-objeto en `components`
// (tipado `Record<string, string | DefineComponent>`) y los usa tal cual, sin tocar el registro
// global → las listas de artista (otro componente) quedan intactas. `:detail-photo{...}` sigue
// resolviéndose por `DetailPhoto.global.vue` (Plan 04-01) porque ES global.
//   · `:tag="false"` en el `<MDCRenderer>` es OBLIGATORIO para la paridad: por defecto MDCRenderer
//     envuelve el contenido en un `<div>` (su prop `tag` default = "div"), lo que metería un
//     `<div class="">` entre `.card-section` y el `<p>`/`<ul>` (divergencia verificada en un render
//     real). Con `tag=false` NO hay envoltorio → el `<p>` y el `<ul>` son hijos DIRECTOS de
//     `.card-section`, como el original. NO se usa `unwrap` aquí (el dropcap necesita el `<p>`).
//
// CARD-ARTISTS / CARD-ARCH (convención de datos F2, distinta de la que asumía el `<interfaces>` del
// plan). El plan suponía `label` = texto plano + prefijo "Artistas:"/"Arquitectura:" hardcodeado.
// PERO los datos de F2 codifican el bloque ENTERO como Markdown en `label`: la 1ª entrada lleva el
// prefijo Y el enlace (`"Artistas: [Bernini](#art-bernini)"`), las siguientes solo el enlace
// (`"[Borromini](#art-borromini)"`), y `note` (solo pantheon) es la anotación inline
// ("(aquí está enterrado)"). Verificado en las 21 entradas de cada bloque. Por eso NO se hardcodea
// el prefijo (vendría duplicado) ni se construye el `<a>` a mano: cada `label` se renderiza como
// Markdown con `<MDCRenderer>` + un override LOCAL `a`→ArtLink que repone `class="art-link"`
// (que ProseA no pone). Los enlaces se separan por un espacio (como el original) y la nota va en su
// `<span>` con el estilo inline VERBATIM del index.html. La fidelidad de label/href la validó la
// migration-diff de F2 (palabras + hrefs).
//
// HERO @ERROR → SVG (UI-05, Fase 7). Port 1:1 de `loadSvgFallback` (index.html:2215-2227): al
// fallar la `<img>` del hero (URL de Wikimedia caída/offline), se sustituye su contenido por el
// SVG del `monument.motif` vía `v-html` de la constante de CONFIANZA `motifSvg` (svgMotifs.ts,
// Plan 01 auto-importado). El SVG NO lleva estilos inline: `.card-hero svg` (base.css:719) ya lo
// dimensiona igual que la `<img>`. RAMA MUERTA portada por fidelidad: si `motifSvg` devuelve
// `undefined` (motif ausente) se oculta `.card-hero` (mirror de `img.parentElement.style.display
// ='none'`, index.html:2222) — para monumentos `motif` es obligatorio, así que nunca ocurre.
//
// NOTAS PERSISTENTES (FEAT-04, Fase 7). Port 1:1 de `setupNotes` (index.html:6471-6483): clave
// EXACTA `roma-note-<slug>`, lectura en `onMounted` (jamás en setup → sin warning de hidratación,
// SSR emite vacío y se rellena un frame después, micro-flash sancionado igual que useTripModes),
// y guardado en `input` con un debounce inocuo (~200ms, D-03). Se enlaza con `:value`/`@input`
// (binding explícito en vez del azúcar bidireccional) para mantener el default de SSR explícito
// (paralelo a SearchBox:62-64). El texto
// de la nota es del propio usuario y SÓLO se refleja en `:value`, nunca en `v-html` → sin
// superficie de XSS almacenado (T-07-05 accept). Las notas son SÓLO de monumentos (este componente).
//
// FACTS: `facts[].value` está tipado plano (z.string) pero 2 fichas (san-luigi, pantheon) llevan
// Markdown-inline en el valor (un enlace, un **negrita**); el original los renderiza como HTML. Por
// eso el value va por `<MDC unwrap="p">` (inline, sin `<p>`), no por interpolación de texto plano.
//
// MAPS-LINK: el href se reconstruye con `encodeURIComponent(monument.mapsQuery)` (prescrito por
// el plan) y conserva `rel="noopener"` VERBATIM (anti-tabnabbing). El icono 📍 lo inyecta el CSS
// (`.maps-link::before`), así que el texto del enlace es solo "Ver en Google Maps".
//
// CULTURE-BOX (convención de datos F2): el `<span class="label">` del original NO es texto fijo —
// varía por ficha ("Referencias culturales" / "Referencias literarias" / "…culturales y
// literarias"). La migración F2 codificó ese label como el PRIMER elemento de `culture[]`, con
// `text: ''` (verificado: en las 18 fichas con culture, `culture[0] = { title: <label>, text: '' }`,
// exactamente una entrada de texto vacío). Por eso aquí `culture[0].title` es el label y
// `culture.slice(1)` son los `.ref-item` (ref-title + prosa MDC). Renderizar `culture[0]` como un
// ref-item más metería un `.ref-item` espurio vacío y un label incorrecto → divergencia. El texto
// de cada ref-item lleva Markdown-inline (p. ej. `_Fornarina_`), así que va por `<MDC unwrap="p">`.
//
// ORDEN culture-box / notes-area (F8 Plan 06). El index.html NO renderiza el par en orden fijo: la
// mayoría de las 18 fichas con `.culture-box` rinde culture→notes, pero 4 (piazza-navona, campo-fiori,
// ghetto, laterano) rinde notes→culture. Se modela con el campo OPCIONAL `boxOrder` del esquema:
// `'notes-first'` (esas 4) invierte el orden; ausente = culture→notes (el resto). El marcado de cada
// bloque es idéntico en ambas ramas (mismo `.culture-box`, mismo `.notes-area`); SÓLO cambia el orden,
// que es exactamente lo que el original varía por ficha. Verificado contra el DOM del index.html por id.
//
// CSS verbatim global (base.css) — CERO CSS nuevo y SIN bloque de estilos con scope: un `data-v-*`
// rompería en silencio selectores que cruzan componentes y elementos generados por MDC, como
// `.card-section p:first-of-type::first-letter`, `.detail-list li::before` y `.facts-row .label`.
// La paridad es por construcción.
import { defineComponent, h, onMounted, onUnmounted, provide, ref, useTemplateRef } from 'vue'
import type { DefineComponent } from 'vue'
import type { Monument } from '~~/shared/schemas'

const { monument } = defineProps<{ monument: Monument }>()

// HERO @error → SVG (port de loadSvgFallback, index.html:2215-2227). `heroFailed` conmuta la
// `<img>` por el `<span v-html>` con el SVG del motivo; `heroHidden` es la RAMA MUERTA (motif
// ausente → ocultar `.card-hero`, mirror de index.html:2222). `motifSvg` viene auto-importado
// de svgMotifs.ts (Plan 01). Sin estilos inline en el SVG: `.card-hero svg` (base.css:719) lo cuadra.
const heroFailed = ref(false)
const heroHidden = ref(false)
function onHeroError() {
  if (motifSvg(monument.motif)) heroFailed.value = true
  else heroHidden.value = true
}

// CARRERA error-antes-de-hidratación del HERO (Rule 1, Fase 8 — bug REAL del visual-diff del Plan 06).
// Mismo problema que DetailPhoto: el original usa `onerror="loadSvgFallback(...)"` inline (síncrono al
// fallar la <img>), mientras que aquí el fallback es un `@error` de Vue que sólo existe tras hidratar.
// Si la <img> del hero ya falló (offline / 404 / abort A5) ANTES de la hidratación, el evento `error`
// ya pasó y el SVG del motivo no se pinta. Se resuelve en onMounted comprobando si la <img> ya está
// "complete" con naturalWidth 0 (= falló) e invocando el MISMO onHeroError. El `@error` del template
// sigue cubriendo los fallos posteriores a la hidratación.
const heroImgRef = useTemplateRef<HTMLImageElement>('heroImg')
onMounted(() => {
  const img = heroImgRef.value
  if (img && img.complete && img.naturalWidth === 0) onHeroError()
})

// NOTAS persistentes (port de setupNotes, index.html:6471-6483). Clave EXACTA `roma-note-<slug>`.
// Lectura SÓLO en onMounted (sin warning de hidratación: SSR emite vacío). Guardado en @input con
// debounce inocuo (~200ms, D-03). try/catch como el original (localStorage puede estar bloqueado).
const noteText = ref('')
const NOTE_KEY = `roma-note-${monument.slug}`
onMounted(() => {
  try {
    noteText.value = localStorage.getItem(NOTE_KEY) ?? ''
  }
  catch {
    // localStorage bloqueado (modo privado, sin permisos): se queda vacío, como el original.
  }
})
let noteTimer: ReturnType<typeof setTimeout> | undefined
function onNoteInput(v: string) {
  noteText.value = v
  clearTimeout(noteTimer)
  noteTimer = setTimeout(() => {
    try {
      localStorage.setItem(NOTE_KEY, v)
    }
    catch {
      // localStorage bloqueado: el guardado se descarta en silencio, como el original.
    }
  }, 200)
}

// WR-02: limpiar el timer de debounce al desmontar (HMR / futura navegación SPA) para no dejar
// un setTimeout pendiente con una referencia al componente ya desmontado.
onUnmounted(() => clearTimeout(noteTimer))

// PROVIDE del motivo para el `DetailPhoto.global.vue` anidado (Task 2 lo `inject`a). Hay
// exactamente un `<DetailPhoto>` por ficha, bajo este componente vía el `<MDCRenderer>` de las
// secciones (más abajo), así que el provide alcanza al correcto a través del subárbol MDC.
provide('monumentMotif', monument.motif)

// Componente LOCAL (objeto, no `.global.vue`) que sustituye `<ul>` SOLO en las listas de prosa de
// MonumentCard, emitiendo el `<ul class="detail-list">` del original. Se pasa por valor en el mapa
// `:components` de `<MDCRenderer>`; al ser un objeto se resuelve tal cual (no por nombre en el
// registro global), de modo que las listas de las fichas de artista NO se ven afectadas (Pitfall 1).
// Anotados como `DefineComponent<any, any, any>` — el tipo EXACTO que admite el prop `components` de
// `<MDCRenderer>` (`Record<string, string | DefineComponent<any, any, any>>`). Sin esta anotación, el
// `DefineComponent` específico que infiere `defineComponent` (con la prop `href` tipada) dispara un
// TS2322 de varianza al pasarlo en el mapa `:components`. El `any` es el de la propia firma de MDC
// (no propio): se silencia no-explicit-any en estas dos líneas, como el `as any` de useTrip (F3).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DetailListUl: DefineComponent<any, any, any> = defineComponent({
  name: 'MonumentDetailList',
  render() {
    return h('ul', { class: 'detail-list' }, this.$slots.default?.())
  },
})

// Componente LOCAL que sustituye `<a>` SOLO al renderizar los labels de `card-artists`/`card-arch`,
// emitiendo el `<a class="art-link" href="#…">` del original (la clave de paridad: `.art-link` da el
// pill + el bullet ✦/▣ vía `.card-artists .art-link::before`, base.css:1288-1297). MDC renderiza el
// label como Markdown (`Artistas: [Bernini](#art-bernini)`), y sin este override el enlace saldría sin
// la clase (ProseA → NuxtLink plano) → divergencia. Es local (objeto en `:components`), así que NO
// afecta a los enlaces de prosa de sección (que el original tiene SIN clase) ni a las otras fichas.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ArtLink: DefineComponent<any, any, any> = defineComponent({
  name: 'MonumentArtLink',
  props: { href: { type: String, default: '' } },
  render() {
    return h('a', { class: 'art-link', href: this.href }, this.$slots.default?.())
  },
})
</script>

<template>
  <article
    :id="monument.slug"
    class="card"
  >
    <div class="card-header">
      <span class="card-roman">{{ monument.roman }}</span>
      <div class="card-title">
        <h3>{{ monument.name }}</h3>
        <div class="card-italian">
          {{ monument.italian }}
        </div>
      </div>
      <span
        v-if="monument.badge"
        class="card-badge"
      >{{ monument.badge }}</span>
    </div>

    <!-- card-artists / card-arch: cada `link.label` se renderiza por separado con su propio <MDC>
         (+ override a→ArtLink) y se SEPARA del siguiente con un espacio EXPLÍCITO `{{ ' ' }}`. No se
         unen en una sola cadena Markdown porque Markdown COLAPSA el espacio entre dos enlaces inline
         contiguos (`[A](#a) [B](#b)` → `<a>A</a><a>B</a>` sin espacio), y el original tiene `</a> <a>`
         (el hueco importa: `.art-link` es inline-block, el espacio se suma al margin). Las reglas
         vue/*-content-newline están relajadas para este fichero (eslint.config.mjs) porque este
         marcado es SENSIBLE AL WHITESPACE y no admite reformateo con saltos de línea (los condensaría
         el compilador y se perderían los espacios). Verificado byte-a-byte contra index.html:2929. -->
    <div
      v-if="monument.artists"
      class="card-artists"
    >
      <template v-for="(link, i) in monument.artists" :key="link.ref"><template v-if="i !== 0">{{ ' ' }}</template><MDC v-slot="{ body }" :value="link.label"><MDCRenderer v-if="body" :body="body" :tag="false" :components="{ a: ArtLink }" unwrap="p" /></MDC><template v-if="link.note">{{ ' ' }}<span style="color:var(--ink-faint);font-style:italic;">{{ link.note }}</span></template></template>
    </div>
    <div
      v-if="monument.arch"
      class="card-artists card-arch"
    >
      <template v-for="(link, i) in monument.arch" :key="link.ref"><template v-if="i !== 0">{{ ' ' }}</template><MDC v-slot="{ body }" :value="link.label"><MDCRenderer v-if="body" :body="body" :tag="false" :components="{ a: ArtLink }" unwrap="p" /></MDC><template v-if="link.note">{{ ' ' }}<span style="color:var(--ink-faint);font-style:italic;">{{ link.note }}</span></template></template>
    </div>

    <div
      v-show="!heroHidden"
      class="card-hero"
    >
      <img
        v-if="!heroFailed"
        ref="heroImg"
        :src="monument.hero.src"
        :alt="monument.hero.alt"
        loading="lazy"
        @error="onHeroError"
      >
      <!-- eslint-disable-next-line vue/no-v-html — constante estática de CONFIANZA (svgMotifs.ts), nunca dato de usuario (T-07-06 mitigate) -->
      <span v-else v-html="motifSvg(monument.motif)" />
    </div>

    <div
      v-for="(s, i) in monument.sections"
      :key="i"
      class="card-section"
      :class="{ 'no-dropcap': i !== 0 }"
    >
      <h4>{{ s.heading }}</h4>
      <MDC
        v-slot="{ body }"
        :value="s.body"
      >
        <MDCRenderer
          v-if="body"
          :body="body"
          :tag="false"
          :components="{ ul: DetailListUl }"
        />
      </MDC>
    </div>

    <!-- FACTS (paridad de orden por ficha, F8 Plan 06). El index.html NO renderiza el bloque
         `.facts` cuando la ficha no tiene datos: #vaticano (la única con `facts: []`) va de la
         última `.card-section` DIRECTAMENTE al `.maps-link`, SIN `.facts`. Un `.facts` vacío añade
         su `margin-top:1.5rem` + `padding:1rem` + banda de fondo (≈+32px y un rectángulo coloreado
         espurio) — divergencia REAL verificada contra el DOM del index.html (#vaticano). Por eso el
         bloque se condiciona a que HAYA facts; las otras 37 fichas siempre los tienen, así que su
         marcado no cambia. Bug REAL del visual-diff (D-02 path a): se corrige el componente, no el
         baseline. -->
    <div
      v-if="monument.facts.length"
      class="facts"
    >
      <div
        v-for="f in monument.facts"
        :key="f.label"
        class="facts-row"
      >
        <span class="label">{{ f.label }}</span><span class="value"><MDC
          :value="f.value"
          :tag="false"
          unwrap="p"
        /></span>
      </div>
    </div>

    <a
      :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(monument.mapsQuery)}`"
      target="_blank"
      rel="noopener"
      class="maps-link"
    >Ver en Google Maps</a>

    <div
      v-if="monument.sorrentino"
      class="sorrentino-box"
    >
      <span class="label">{{ monument.sorrentino.label }}</span>
      <MDC
        :value="monument.sorrentino.text"
        :tag="false"
        unwrap="p"
      />
    </div>

    <!-- ORDEN culture-box / notes-area (F8 Plan 06, paridad de orden por ficha). El index.html NO es
         uniforme: la mayoría de fichas con culture rinde culture→notes, pero 4 (piazza-navona,
         campo-fiori, ghetto, laterano) rinde notes→culture. `monument.boxOrder === 'notes-first'`
         invierte el orden SÓLO en esas 4 (verificado contra el DOM del index.html por id de ficha).
         Ambos bloques se extraen a <template>s con nombre y se emiten en el orden correcto; la marca
         (presencia/ausencia de culture, contenido de notes) es IDÉNTICA en las dos ramas → cero
         divergencia de marcado salvo el ORDEN, que es justo lo que el original varía. -->
    <template v-if="monument.boxOrder === 'notes-first'">
      <div class="notes-area">
        <label :for="'note-' + monument.slug">Notas in situ</label>
        <textarea
          :id="'note-' + monument.slug"
          class="notes-textarea"
          :data-note-key="monument.slug"
          placeholder="Lo que quieras recordar de aquí…"
          :value="noteText"
          @input="onNoteInput(($event.target as HTMLTextAreaElement).value)"
        />
      </div>

      <div
        v-if="monument.culture"
        class="culture-box"
      >
        <span class="label">{{ monument.culture[0]?.title }}</span>
        <div
          v-for="cultureRef in monument.culture.slice(1)"
          :key="cultureRef.title"
          class="ref-item"
        >
          <span class="ref-title">{{ cultureRef.title }}</span> <MDC
            :value="cultureRef.text"
            :tag="false"
            unwrap="p"
          />
        </div>
      </div>
    </template>

    <template v-else>
      <div
        v-if="monument.culture"
        class="culture-box"
      >
        <span class="label">{{ monument.culture[0]?.title }}</span>
        <div
          v-for="cultureRef in monument.culture.slice(1)"
          :key="cultureRef.title"
          class="ref-item"
        >
          <span class="ref-title">{{ cultureRef.title }}</span> <MDC
            :value="cultureRef.text"
            :tag="false"
            unwrap="p"
          />
        </div>
      </div>

      <div class="notes-area">
        <label :for="'note-' + monument.slug">Notas in situ</label>
        <textarea
          :id="'note-' + monument.slug"
          class="notes-textarea"
          :data-note-key="monument.slug"
          placeholder="Lo que quieras recordar de aquí…"
          :value="noteText"
          @input="onNoteInput(($event.target as HTMLTextAreaElement).value)"
        />
      </div>
    </template>
  </article>
</template>
