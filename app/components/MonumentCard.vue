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
// FRONTERAS DEL ROADMAP:
//  · D-01 (hero plano): la `<img>` del hero es PLANA — `src`/`alt`/`loading` y NADA de manejador
//    de error. El fallback SVG de imagen rota (el patrón del index.html) es trabajo de la Fase 7.
//  · D-02 (notas shell): el `<textarea>` es un SHELL — `data-note-key` presente pero SIN v-model
//    ni persistencia (la persistencia de notas, FEAT-04, es Fase 7).
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
// CSS verbatim global (base.css) — CERO CSS nuevo y SIN bloque de estilos con scope: un `data-v-*`
// rompería en silencio selectores que cruzan componentes y elementos generados por MDC, como
// `.card-section p:first-of-type::first-letter`, `.detail-list li::before` y `.facts-row .label`.
// La paridad es por construcción.
import { defineComponent, h } from 'vue'
import type { DefineComponent } from 'vue'
import type { Monument } from '~~/shared/schemas'

defineProps<{ monument: Monument }>()

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

    <div class="card-hero">
      <img
        :src="monument.hero.src"
        :alt="monument.hero.alt"
        loading="lazy"
      >
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

    <div class="facts">
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

    <div
      v-if="monument.culture"
      class="culture-box"
    >
      <span class="label">{{ monument.culture[0]?.title }}</span>
      <div
        v-for="ref in monument.culture.slice(1)"
        :key="ref.title"
        class="ref-item"
      >
        <span class="ref-title">{{ ref.title }}</span> <MDC
          :value="ref.text"
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
      />
    </div>
  </article>
</template>
