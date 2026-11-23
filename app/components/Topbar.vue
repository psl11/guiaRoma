<script setup lang="ts">
// Chrome fijo de cabecera — reproduce index.html:2257-2278 VERBATIM (UI-01).
//
// header.topbar es el elemento EXTERIOR (sticky + border-bottom + backdrop-filter,
// base.css:24-30). Dentro: div.topbar-inner (grid 3-col) que contiene .brand (col 2,
// centrada) y el ThemeToggle (que renderiza button.theme-btn → col 3 por la regla
// DESCENDIENTE `.topbar-inner .theme-btn`, base.css:37). NavPills es HERMANO de
// .topbar-inner, aún dentro de <header>, exactamente como el <nav> del index.html:2264.
//
// CSS verbatim global (base.css) — NO se añade bloque de estilos scoped: inyectaría data-v-* que
// rompe selectores descendientes cross-componente (`.topbar-inner .theme-btn`,
// `[data-theme] .theme-btn .moon`). ThemeToggle y NavPills se auto-importan.
//
// F10 (Plan 10-01, D-06): recibe de TripView el `layout` del viaje (la MISMA lista con la que se
// montan las secciones de `<main>`) y lo reenvía tal cual a NavPills.
//
// F10 (Plan 10-02, D-11/D-14): la marca `.brand` sale del trip.yml del viaje. Con `brand`, el DOM
// es el de siempre: `before` + UN espacio + el span del punto (✦) + UN espacio +
// `after` (ni más ni menos espacios alrededor del span: el margen lo pone la clase del punto en
// base.css). Sin `brand`, la marca es el título plano del propio viaje (`fallbackTitle`), sin
// punto. Solo interpolación `{{ }}` (Vue escapa): nunca HTML crudo desde los datos.
import type { LayoutEntry } from '~/utils/tripLayout'

defineProps<{
  layout: LayoutEntry[]
  brand: { before: string, after: string } | null
  fallbackTitle: string
}>()
</script>

<template>
  <header class="topbar">
    <div class="topbar-inner">
      <div
        v-if="brand"
        class="brand"
      >
        {{ brand.before }} <span class="brand-dot">✦</span> {{ brand.after }}
      </div>
      <div
        v-else
        class="brand"
      >
        {{ fallbackTitle }}
      </div>
      <ThemeToggle />
    </div>
    <NavPills :layout="layout" />
  </header>
</template>
