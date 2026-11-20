# Phase 9: Plataforma por viaje - Context

**Gathered:** 2026-11-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Cualquier guía funciona aislada de las demás: su **búsqueda**, sus **enlaces entre fichas / pila «Volver» / scrollspy**, sus **preferencias guardadas** (ritmo, «caminar menos», resumen, notas) y la **validación de su contenido** pertenecen a su viaje. Es un **refactor invisible**: Roma sigue en `/`, con el mismo aspecto y comportamiento, y la puerta de paridad (`tests/parity/`, 56 goldens) no se toca.

Requisitos: PLAT-01, PLAT-02, PLAT-03, PLAT-04.

Fuera de esta fase (ya asignado a otras): días/secciones/chrome desde datos (Fase 10), portada, rutas, prerender y filtro `draft` (Fase 11), formas nuevas de esquema para Campania (Fase 12), contenido de Campania (Fase 13).

</domain>

<decisions>
## Implementation Decisions

### Viaje de prueba (segundo viaje para probar el aislamiento)
- **D-01:** Se crea un **viaje ficticio mínimo** en `content/trips/prueba/` (slug `prueba`): 1-2 días y 2-3 fichas inventadas, con contenido suficiente para probar aislamiento (p. ej. que buscar «Pantheon» en `prueba` no devuelva la ficha de Roma, y que un enlace `#ficha` de `prueba` navegue dentro de `prueba`). No se usa Campania como viaje de prueba: los tests deben ser estables aunque Campania cambie hasta la Fase 13.
- **D-02:** Hasta que la Fase 11 introduzca el filtro `draft`, el viaje de prueba es **accesible solo en dev** (`pnpm dev` → `/trips/prueba`). En la build estática no se prerenderiza ni se enlaza (igual que hoy `/trips/*`: `nitro.prerender.routes = ['/']`, sin enlaces). La página de Roma no debe descargar datos de `prueba` (las queries ya filtran por `trip`). El fichero `trip.yml` de prueba debe quedar listo para marcarse `draft: true` cuando exista el campo (Fase 11). — **Reversibility:** reversible
- **D-03:** El viaje de prueba **no** debe introducir campos de esquema nuevos (eso es Fase 10/12): usa solo la forma actual del esquema. Si la forma actual obliga a tener 5 días con slugs `viernes…martes` u otras rarezas de Roma, se documenta como hallazgo para la Fase 10, sin ampliar esquema aquí.

### Preferencias por viaje
- **D-04:** Ritmo (`pace`), «caminar menos» (`light`), modo resumen (`resumen`) y notas por ficha se guardan **por viaje** con `tripStorageKey(slug, name) = \`${slug}-${name}\``. Para Roma produce exactamente las claves actuales (`roma-pace`, `roma-light`, `roma-resumen`, `roma-note-<ficha>`) → **sin migración** y sin pérdida. Activar algo en un viaje no lo activa en otro. — **Reversibility:** one-way — las claves `${slug}-*` quedan escritas en el `localStorage` de los usuarios; cambiar el esquema de claves más tarde exigiría código de migración.
- **D-05:** El slug de viaje cumple `^[a-z0-9]+$` (sin guiones) y se valida en esquema + invariante, para que el prefijo `${slug}-` sea inequívoco (`campania`, no `campania-2027`). — **Reversibility:** costly — los slugs aparecen en URLs (Fase 11) y en claves de usuario.
- **D-06:** Un viaje nuevo arranca con los **mismos valores por defecto que hoy**: ritmo optimista, «caminar menos» y resumen desactivados. No hay valores por defecto por viaje (no se añade campo al esquema).
- **D-07:** El tema claro/oscuro sigue **global** (`colorMode.storageKey: 'roma-theme'`, sin renombrar) — decisión ya tomada en el milestone; no se toca.
- **D-08:** El estado en memoria (`useState`) de búsqueda, navegación y modos se aísla por viaje (claves sufijadas con el slug) y el índice MiniSearch deja de ser un único índice de módulo (uno por slug). Invisible en el HTML de Roma.

### Rigor de la validación
- **D-09:** Las comprobaciones de datos son **igual de estrictas para todos los viajes**, borradores incluidos: esquema zod + invariantes bloquean `pnpm verify` en cualquier viaje. «Estar incompleto» (pocos días, pocas fichas) **no** es un error; «estar roto» sí.
- **D-10:** Invariantes nuevos/generalizados por viaje que bloquean: slug de viaje válido (D-05); el campo `trip` de cada fichero == nombre de su carpeta; ids únicos dentro del viaje; ningún id choca con un ancla de sección fija (`inicio`, `mapa`, `reservas`, `gastronomia`, `practica`, `arte`, `arquitectura`…); nombres reservados de Nuxt Content (`id`, `meta`, `stem`, `extension`) no se usan como campos; los mensajes de fallo nombran el fichero culpable.
- **D-11:** Un enlace `[texto](#ficha)` en la prosa que apunta a una ficha que **no existe en ese mismo viaje** es un **error que rompe verify** (fichero + enlace en el mensaje). No se admiten enlaces entre viajes.
- **D-12:** Los checks específicos de Roma (conteos de fichas, `migration-diff` contra `index.html`) siguen siendo **solo de Roma**; esquema e invariantes iteran todos los viajes (`describe.each` sobre `content/trips/*`).

### Claude's Discretion
- Nombre y contenido exacto del viaje ficticio (lugares inventados, textos), siempre que sirva para las pruebas de aislamiento de búsqueda, navegación y notas.
- Mecanismo concreto de contexto de viaje (recomendado por la investigación: `provideTripSlug`/`useTripSlug` con `provide/inject`, leído antes del primer `await`; `useCardNavigationController(slug)` por argumento).
- Cómo se prueba el aislamiento (unit con Vitest y/o Playwright contra `pnpm dev` en `/trips/prueba`), respetando que `tests/parity/` no cambia en esta fase.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Alcance y requisitos
- `.planning/ROADMAP.md` §«Phase 9: Plataforma por viaje» — objetivo y 5 criterios de éxito
- `.planning/REQUIREMENTS.md` — PLAT-01..PLAT-04
- `.planning/PROJECT.md` — Core Value (Roma intacta), decisiones v1.1

### Investigación v1.1
- `.planning/research/ARCHITECTURE.md` §2 (inventario H1-H25 con file:line; esta fase cubre H6-H11 y H23), §5.2 (contexto de viaje provide/inject + trampa del `await`), §5.5 (persistencia `${slug}-${key}` sin migración), §8 «Fase 9»
- `.planning/research/PITFALLS.md` — pitfalls de estado global, claves de storage, tests atados a Roma, orden «refactor con puerta congelada»
- `.planning/research/SUMMARY.md` §«Phase 9» y §«Critical Pitfalls»

### Puerta de paridad y tests
- `tests/README.md` — cómo funciona `pnpm verify` y la suite de paridad (no modificar `tests/parity/` en esta fase)
- `tests/data/schema.spec.ts`, `tests/data/invariants.spec.ts` — hoy con `ROOT = content/trips/roma`; se generalizan
- `tests/data/migration-diff.spec.ts` — se mantiene solo-Roma

### Lecciones previas (memoria del proyecto)
- Tras editar YAML de contenido: `rm -rf .data .nuxt .output` antes de generate/verify o la build sirve contenido rancio
- Nuxt Content v3 no valida `type:'data'` contra zod en build (#3351): la validación real vive en `tests/data`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/composables/useTrip.ts:37` `useTrip(slug)`: ya filtra las 6 colecciones por `trip` — base del aislamiento de datos.
- `app/utils/searchIndex.ts`, `app/utils/cardNav.ts`, `app/utils/pace.ts`: lógica pura ya testeada en `tests/unit/`; el refactor toca los controllers, no estas utils.
- `app/pages/trips/[slug].vue`: ruta dinámica ya existente con guard 404 — sirve para ver `/trips/prueba` en dev.

### Established Patterns
- Controllers singleton (`useSearchController`, `useCardNavigationController`, `useTripModes`) registran hooks en el tramo síncrono y luego hacen `await useTrip(...)`: el slug (inject) debe leerse en ese tramo síncrono.
- Persistencia leída en `onMounted` (nunca en setup) para evitar warnings de hidratación (`MonumentCard.vue:126`, `useTripModes.ts:92`).
- Los consumidores de los controllers (`TimelineStop`, `TimelineTransport`, `NavPills`, `BackButton`, `SearchBox`, `TheHero`) son todos descendientes de `TripView`.

### Integration Points
- `app/components/TripView.vue:64-68` — punto donde publicar el slug y pasarlo al controller de navegación.
- `app/composables/useSearch.ts:52,56-58,144` — índice de módulo, `useState` globales, `useTrip('roma')`.
- `app/composables/useCardNavigation.ts:53-54,173` — `useState` globales, `useTrip('roma')`.
- `app/composables/useTripModes.ts:46-48,92-103` — `useState` globales y claves `roma-*` literales.
- `app/components/MonumentCard.vue:123` — `roma-note-${slug}`.
- `shared/schemas.ts` `TripSchema` — añadir regex de slug (aditivo; `roma` cumple).

</code_context>

<specifics>
## Specific Ideas

- Prueba de aislamiento concreta sugerida en el roadmap: «Pantheon» aparece al buscar en Roma y no en el viaje de prueba.
- El usuario quiere que los errores de datos señalen el fichero culpable (útil cuando colaboradores editen YAML por PR).

</specifics>

<deferred>
## Deferred Ideas

- Enlaces entre viajes (p. ej. de Campania a una ficha de Roma con `/trips/roma#pantheon`) — descartado en v1.1; idea futura si se necesita.
- Valores por defecto de ritmo por viaje (p. ej. Campania con niños empieza en «lento») — descartado por ahora; posible campo opcional futuro en `trip.yml`.
- «Caminar menos» como preferencia global de la persona — descartado; queda por viaje.

</deferred>

---

*Phase: 09-plataforma-por-viaje*
*Context gathered: 2026-11-20*
