<script setup lang="ts">
// Conmutador de tema de 2 estados — reproduce el `toggleTheme()` del index.html 1:1 (D-08).
//
// CONSUME @nuxtjs/color-mode (ya configurado en nuxt.config.ts: dataValue 'theme',
// storageKey 'roma-theme'); NO lo reconfigura, NO añade script anti-FOUC, NO lee
// localStorage/window/matchMedia (eso reintroduciría el flash que la fase previene).
//
// `useColorMode()` → { preference (escribible), value (solo lectura, RESUELTO), … }.
// El toggle lee el valor RESUELTO (`value`) y escribe una preferencia CONCRETA
// (light/dark), nunca la preferencia automática del sistema (D-08). El icono ☾/☀
// conmuta SOLO vía las reglas CSS `[data-theme] .theme-btn .moon/.sun` ya presentes
// en base.css:58-61 — ambos spans se renderizan siempre, sin alternarlos por tema con
// directivas condicionales (D-10/SC#4: evita FOUC + mismatch de hidratación, ya que
// la preferencia automática del sistema es desconocida en prerender).
const colorMode = useColorMode()

function toggle() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <button
    class="theme-btn"
    aria-label="Cambiar tema"
    @click="toggle"
  >
    <span class="moon">☾</span><span class="sun">☀</span>
  </button>
</template>
