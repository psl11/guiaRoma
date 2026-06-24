<script setup lang="ts">
// Chrome fijo de cabecera — reproduce index.html:2257-2278 VERBATIM (UI-01).
//
// header.topbar es el elemento EXTERIOR (sticky + border-bottom + backdrop-filter,
// base.css:24-30). Dentro: div.topbar-inner (grid 3-col) que contiene .brand (col 2,
// centrada) y el ThemeToggle (que renderiza button.theme-btn → col 3 por la regla
// DESCENDIENTE `.topbar-inner .theme-btn`, base.css:37). NavPills es HERMANO de
// .topbar-inner, aún dentro de <header>, exactamente como el <nav> del index.html:2264.
//
// CSS verbatim global (base.css) — NO se añade <style scoped>: inyectaría data-v-* que
// rompe selectores descendientes cross-componente (`.topbar-inner .theme-btn`,
// `[data-theme] .theme-btn .moon`). ThemeToggle y NavPills se auto-importan.
import type { Day } from '~~/shared/schemas'

defineProps<{ days: Day[] }>()
</script>

<template>
  <header class="topbar">
    <div class="topbar-inner">
      <div class="brand">
        Roma <span class="brand-dot">✦</span> giugno MMXXVI
      </div>
      <ThemeToggle />
    </div>
    <NavPills :days="days" />
  </header>
</template>
