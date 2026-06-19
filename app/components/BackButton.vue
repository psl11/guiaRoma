<template>
  <!--
    Botón "Volver" — SHELL VISUAL ÚNICAMENTE (D-07). Reproduce index.html:6230-6232.

    El manejador de retroceso del index.html se DESCARTA en F3: aquí no hay reacción al
    pulsar ni comportamiento alguno (la pila de retroceso y la clase de visibilidad se
    cablean en F5). En reposo (sin esa clase) el CSS — base.css:1001-1029 — aplica
    opacity:0, pointer-events:none y translateY(120%): queda fuera de pantalla e
    invisible, de modo que el golden no se ve afectado. Se conserva id="back-btn" (F5 lo
    revela) y el aria-label "Volver" verbatim. La flecha ← es un glifo literal en
    .back-btn-arrow. CSS verbatim global (base.css): NO se añade <style scoped>.
  -->
  <button
    id="back-btn"
    class="back-btn"
    aria-label="Volver"
  >
    <span class="back-btn-arrow">←</span> Volver
  </button>
</template>
