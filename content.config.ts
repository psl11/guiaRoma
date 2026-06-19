import { defineCollection, defineContentConfig } from '@nuxt/content'
import {
  MonumentSchema,
  DaySchema,
  FoodSchema,
  ArtistSchema,
  ReferenceSchema,
  TripSchema,
} from './shared/schemas'

// Registro de las 6 colecciones del viaje (Fase 2). El esquema zod vive en
// `shared/schemas.ts` y NO inline aquí PORQUE lo comparten dos consumidores: este
// config (genera tipos/columnas) y los tests de tests/data (la verdadera puerta de
// validación — Content v3 no valida los `type:'data'` contra zod en build, #3351).
//
// `type: 'data'` + globs ANIDADOS `trips/*/…` → un fichero = un documento, y multi-viaje
// es trivial (crear content/trips/florencia/ con los mismos ficheros, cero código).
export default defineContentConfig({
  collections: {
    trip: defineCollection({ type: 'data', source: 'trips/*/trip.yml', schema: TripSchema }),
    day: defineCollection({ type: 'data', source: 'trips/*/days/*.yml', schema: DaySchema }),
    monument: defineCollection({ type: 'data', source: 'trips/*/monuments/*.yml', schema: MonumentSchema }),
    food: defineCollection({ type: 'data', source: 'trips/*/food/*.yml', schema: FoodSchema }),
    artist: defineCollection({ type: 'data', source: 'trips/*/artists/*.yml', schema: ArtistSchema }),
    reference: defineCollection({ type: 'data', source: 'trips/*/reference/*.yml', schema: ReferenceSchema }),
  },
})
