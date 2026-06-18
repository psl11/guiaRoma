import { defineContentConfig } from '@nuxt/content'

// Stub de Fase 1: el módulo @nuxt/content queda registrado, pero el esquema zod real
// de las colecciones del viaje (monuments, food, artists, trip, ...) se define en Fase 2.
// Sin colecciones aquí — solo deja la base lista.
export default defineContentConfig({
  collections: {},
})
