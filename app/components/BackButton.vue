<script setup lang="ts">
// Botón "Volver" — reproduce index.html:6230-6232.
//
// F3 lo montó como SHELL VISUAL (D-07): markup verbatim, sin manejador ni clase de
// visibilidad. F5 (Plan 05-02) lo CABLEA sobre ese shell ya montado (patrón F3→F4) SIN
// reestructurar el markup: `:class="{ show: canGoBack }"` revela el botón exactamente cuando
// la pila de retroceso no está vacía (reemplaza el `updateBackBtn()` imperativo del original,
// index.html:6385-6388), y `@click="goBack"` restaura la posición anterior de scroll. En
// reposo (sin `.show`) el CSS — base.css:1001-1029 — aplica opacity:0, pointer-events:none y
// translateY(120%): queda fuera de pantalla e invisible, de modo que el golden no se ve
// afectado (canGoBack arranca en false). `useCardNavigation()` es el accesor PURO (sin
// efectos). Se conserva id="back-btn", el aria-label "Volver" y el glifo ← verbatim. CSS
// verbatim global (base.css): togglea SOLO `.back-btn.show` (base.css:1025), NO se añade
// bloque scoped (data-v-* rompería ese selector global).
const { canGoBack, goBack } = useCardNavigation()
</script>

<template>
  <button
    id="back-btn"
    class="back-btn"
    :class="{ show: canGoBack }"
    aria-label="Volver"
    @click="goBack"
  >
    <span class="back-btn-arrow">←</span> Volver
  </button>
</template>
