import { defineConfig } from 'vitest/config'

// Puerta de validación de DATOS de la Fase 2 (DATA-05 / DATA-06 / SC#4).
//
// Hallazgo crítico (RESEARCH §DATA-05, nuxt/content#3351): Nuxt Content v3 NO valida
// las colecciones `type:'data'` contra el esquema zod en build — un dato inválido
// (enum erróneo, campo requerido ausente) pasaría silenciosamente a producción. Por eso
// la VERDADERA puerta de build es este runner Vitest Node-puro: lee cada `.yml`, ejecuta
// `Schema.safeParse` por fichero (schema.spec) y resuelve las cross-refs entre colecciones
// (invariants.spec). No usa runtime Nuxt ni SQLite (sería contraproducente: Content
// "limpia" los datos inválidos y ocultaría los fallos que DATA-05 debe atrapar).
//
// Runners DISJUNTOS: este Vitest cubre SOLO `tests/data/**`. El golden de paridad
// (`tests/parity/**`) sigue en Playwright (playwright.config.ts), sin solaparse.
export default defineConfig({
  test: {
    include: ['tests/data/**/*.spec.ts'],
  },
})
