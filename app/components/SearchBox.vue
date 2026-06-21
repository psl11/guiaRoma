<script setup lang="ts">
// SearchBox — el control `.search-wrap` de FEAT-03, comportamiento atado al shell que F3
// dejó YA RENDERIZADO en TheHero (sin manejadores). Reproduce el markup del index.html
// (2295-2300 + el dropdown que el original montaba imperativamente en 6451-6456) VERBATIM,
// pero el dropdown se pinta con plantilla Vue auto-escapada en vez del
// `searchResults.innerHTML = matches.map(...)` del original.
//
// RENDER-SAFETY LOCKED (security V5 / T-V5): las filas y el estado vacío se pintan con
// `{{ }}` (interpolación auto-escapada de Vue), NUNCA `v-html`. `name`/`day` vienen de los
// `storeFields` de MiniSearch (datos tipados, no input de usuario), pero el `{{ }}` es la
// frontera XSS-relevante y es la mejora sancionada sobre el `innerHTML` del original. Un
// `v-html` aquí es un fallo duro.
//
// Estado y comportamiento vienen del accesor puro `useSearch()`; los EFECTOS (construir el
// índice MiniSearch en cliente + el outside-click) los registra `useSearchController()`,
// invocado UNA SOLA VEZ aquí (espejo del único `useTripModesController()` de TheHero). El
// controller es async y registra sus hooks SÍNCRONAMENTE antes de su `await` (contrato A1
// definido en useSearch.ts) — invocarlo a nivel-top del setup, como TheHero hace con su
// controller, es correcto.
//
// Input: `:value="query"` + `@input` que llama a `onInput(value)` (NO `v-model`, para que el
// `query.value = ''` de onSelect — limpiar al elegir — sea explícito y fiel al original).
// El click de un resultado llama a `onSelect(slug, $event)`, que delega en `navigateToCard`
// (F5): este hace `preventDefault` → el hash NO cambia (D-03).
//
// CERO CSS nuevo y SIN bloque scoped: todas las clases existen en base.css
// (`.search-wrap`/`.search-input`/`.search-results`/`.search-results.show`/`.search-result`/
// `.search-result-meta`). Un `data-v-*` rompería `.search-results.show` y `.search-result:hover`.
const { query, isOpen, results, onInput, onSelect } = useSearch()

// Efectos secundarios de la búsqueda: se registran AQUÍ una sola vez (CR-01 / Pitfall 4).
useSearchController()
</script>

<template>
  <div class="search-wrap">
    <input
      id="search"
      type="search"
      class="search-input"
      placeholder="Buscar lugar, día, anécdota…"
      autocomplete="off"
      :value="query"
      @input="onInput(($event.target as HTMLInputElement).value)"
    >
    <div
      id="search-results"
      class="search-results"
      :class="{ show: isOpen }"
    >
      <template v-if="results.length">
        <a
          v-for="r in results"
          :key="r.slug"
          :href="`#${r.slug}`"
          class="search-result"
          :data-card="r.slug"
          @click="onSelect(r.slug, $event)"
        >
          {{ r.name }}
          <div class="search-result-meta">
            {{ r.day }}
          </div>
        </a>
      </template>
      <div
        v-else
        style="padding:.65rem 1rem;color:var(--ink-faint);font-style:italic"
      >
        Sin resultados
      </div>
    </div>
  </div>
</template>
