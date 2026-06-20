<script setup lang="ts">
// ArtistCard — UN SOLO componente (D-10) que unifica las TRES ramas del discriminatedUnion
// `Artist` (schemas.ts:175-209) por `kind` (NO tres componentes): `artist` y `arquitectura`
// comparten estructura (cabecera + secciones de prosa + "lo verás en este viaje"), y `glossary`
// es el caso especial del glosario (cabecera + rejilla de términos). Reproduce VERBATIM:
//   · arte         index.html:5947-5967  (.artist-card art-bernini)
//   · arquitectura index.html:6110-6127  (.artist-card arq-antigua)
//   · glosario     index.html:6202-6223  (.artist-card arq-glosario)
//
// CLASE RAÍZ: en el original TODAS las tarjetas (artist, arquitectura y glosario) usan
// `<article class="artist-card" id="…">` — el id (#art-bernini / #arq-antigua / #arq-glosario)
// es lo que las distingue, NO una clase de variante. (No existe `.art-bernini`/`.arq-antigua`
// en base.css; lo verifiqué.) Así que la raíz es siempre `article.artist-card` con `:id="slug"`.
//
// CABECERA (común a las 3 ramas): `div.artist-head` con `div.artist-avatar {{ avatar }}` + un
// `<div>` que envuelve `h3{{ name }}` + `div.artist-dates {{ dates }}` + `div.artist-epithet
// {{ epithet }}`. (El `<interfaces>` del plan omitía el wrapper `artist-head` y el `<div>`
// interno; se reproducen porque base.css:1256/1264 los necesita para el layout flex.)
//
// RAMA glossary (v-if estrecha a la rama con `terms`): tras la cabecera, `div.arch-glossary`
// (OJO: la clase del CONTENEDOR es `arch-glossary`, base.css:1300 — NO `arq-glosario`, que es
// el id del article) con un `div.arch-term` por término: `<b>{{ term }}</b>` + `<span>` con la
// definición vía `<MDC unwrap="p" :tag="false">` (la def lleva Markdown-inline `_cursiva_`).
//
// RAMA artist/arquitectura (v-else): por cada `sections[]` un `div.artist-section` con `h4
// {{ heading }}` + la prosa con `<MDC :tag="false">` SIN unwrap (mismo criterio que MonumentCard:
// el cuerpo puede ser `<p>` o `<ul>`; no se desenvuelve). Luego `div.artist-trip` (ver abajo).
//
// PITFALL 1 (CRÍTICO) — las listas de prosa de `.artist-section` van como `<ul>` PLANO, SIN
// `.detail-list`. El Plan 04-01 resolvió (opción b) que NO hay ProseUl global, y el Plan 04-02
// aplicó `.detail-list` SOLO en MonumentCard vía un override LOCAL `:components="{ ul: … }"`.
// AQUÍ NO se aplica ese override: las `.artist-section ul` del original son bullets por defecto
// (base.css:1270-1271), así que el `<MDC>` de las secciones se deja con el ProseUl por defecto
// (que emite `<ul>` sin clase) → paridad correcta. (Verificado: index.html:5959/5961 usan `<ul>`
// sin clase.) NO hay conflicto con el Plan 01: como no existe ProseUl global, las listas de
// artista ya salen planas sin tocar nada. Datos de F2 intactos.
//
// ARTIST-TRIP ("✦ Lo verás / Dónde la verás en este viaje"): `div.artist-trip` con
// `div.artist-trip-head` + los enlaces. Convención de datos F2 (verificada en los 13 ficheros):
//   · El `artist-trip-head` es el `note` del PRIMER item de `seenIn` (p. ej. "✦ Lo verás en
//     este viaje").
//   · El cuerpo son los `label` de cada item (Markdown con `[texto](#ancla)`) renderizados con
//     `<MDC>`, SEPARADOS por " · " (verbatim index.html:5965). El `note` del ÚLTIMO item, si
//     existe y NO es el head (índice > 0), es prosa de cierre que se añade también tras " · ".
//   · NOTA DE PARIDAD (documentada en el SUMMARY): el separador del `note` de cierre NO es
//     byte-uniforme en el original (bernini/barroco usan " · "; borromini usa ". " + un `<span>`
//     atenuado). El dato F2 NO codifica ese `<span>` ni el separador; se renderiza uniforme con
//     " · " (el patrón dominante, 2/3). La fidelidad la valida la migration-diff de F2 por
//     multiset de palabras + conjunto de hrefs (D-08, no byte-exacto), no el separador.
//
// MDC: los `label`/`def`/cierre llevan Markdown-inline → `<MDC unwrap="p" :tag="false">` (inline,
// sin `<p>` ni `<div>` envoltorio, learning D-04-A). La prosa de SECCIÓN va `<MDC :tag="false">`
// SIN unwrap (puede ser `<p>` o `<ul>`). `avatar`/`name`/`dates`/`epithet`/`term`/head son texto
// plano (el esquema no los tipa Markdown) → interpolación.
//
// CSS verbatim global (base.css `.artist-card`/`.artist-head`/`.artist-avatar`/`.artist-dates`/
// `.artist-epithet`/`.artist-section`/`.artist-trip`/`.arch-glossary`/`.arch-term`) — CERO CSS,
// sin bloque de estilos con scope (un data-v-* rompería `.artist-section ul`, `.arch-term b`,
// `.artist-trip a`, etc., generados/cruzados por MDC). Paridad por construcción.
import type { Artist } from '~~/shared/schemas'

defineProps<{ artist: Artist }>()
</script>

<template>
  <article
    :id="artist.slug"
    class="artist-card"
  >
    <div class="artist-head">
      <div class="artist-avatar">
        {{ artist.avatar }}
      </div>
      <div>
        <h3>{{ artist.name }}</h3>
        <div class="artist-dates">
          {{ artist.dates }}
        </div>
        <div class="artist-epithet">
          {{ artist.epithet }}
        </div>
      </div>
    </div>

    <!-- Rama glosario: rejilla de términos (arch-glossary > arch-term). v-if estrecha a la
         rama del union con `terms`. -->
    <div
      v-if="artist.kind === 'glossary'"
      class="arch-glossary"
    >
      <div
        v-for="t in artist.terms"
        :key="t.term"
        class="arch-term"
      >
        <b>{{ t.term }}</b><span><MDC
          :value="t.def"
          :tag="false"
          unwrap="p"
        /></span>
      </div>
    </div>

    <!-- Rama artist/arquitectura: secciones de prosa + "lo verás en este viaje". -->
    <template v-else>
      <div
        v-for="(s, i) in artist.sections"
        :key="i"
        class="artist-section"
      >
        <h4>{{ s.heading }}</h4>
        <MDC
          :value="s.body"
          :tag="false"
        />
      </div>

      <div
        v-if="artist.seenIn.length"
        class="artist-trip"
      >
        <div class="artist-trip-head">
          {{ artist.seenIn[0]?.note }}
        </div>
        <template v-for="(link, i) in artist.seenIn" :key="link.ref"><template v-if="i !== 0">{{ ' · ' }}</template><MDC :value="link.label" unwrap="p" :tag="false" /><template v-if="i !== 0 && link.note">{{ ' · ' }}<MDC :value="link.note" unwrap="p" :tag="false" /></template></template>
      </div>
    </template>
  </article>
</template>
