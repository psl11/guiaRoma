# Phase 11: Portada y rutas multi-viaje - Context

**Gathered:** 2026-11-20
**Status:** Ready for planning
**Mode:** `--auto` (el usuario está de viaje). ROUTE-06 la decidió el usuario en persona antes de arrancar; el resto son
opciones recomendadas elegidas por Claude, a confirmar en `/gsd-verify-work 11`.

<domain>
## Phase Boundary

`/guiaRoma/` deja de ser Roma y pasa a ser una **portada** con una tarjeta por viaje publicado; cada guía vive en su
propia URL estática `/guiaRoma/trips/<slug>/` (Roma en `/guiaRoma/trips/roma/`); los enlaces antiguos `/guiaRoma/#ancla`
llevan a la misma ancla dentro de Roma; los viajes `draft` no se publican de ninguna forma; desde cualquier guía hay un
enlace discreto a la portada; y Roma, en su nueva URL, pasa la puerta de paridad **sin re-baseline**.

Fuera de alcance: Campania (su URL real aparece en la Fase 13), formas nuevas de viaje (Fase 12), PWA, SPA entre viajes,
arreglos de CSS de Roma (desbordamiento de pastillas → Fase 12/13).

</domain>

<decisions>
## Implementation Decisions

### Volver a la portada (ROUTE-06) — decidido por el usuario
- **D-01:** Enlace discreto **«← Todos los viajes»** en el **pie de todas las guías, Roma incluida**. Decisión explícita
  del usuario (2026-11-20, opción recomendada).
- **D-02:** Hallazgo del scout: **ninguna de las 56 goldens captura el pie** (las 14 vistas de
  `tests/parity/visual-diff.spec.ts:56-71` son `#inicio`, los 5 días, 5 referencias y 3 fichas; el `<footer>` va después
  de todas). Por tanto el enlace se añade **sin re-capturar ninguna golden**. La aprobación del usuario para re-capturar
  la del pie queda **sin usar**; si alguna golden falla tras añadir el enlace, es un bug de layout que se arregla, nunca
  `--update-snapshots`. — **Reversibility:** reversible
- **D-03:** El pie existe en **todas** las guías porque aloja el enlace: las líneas `trip.footer` (si las hay) van
  primero, como hoy; el enlace va después, en su propio elemento. Un viaje sin `footer` muestra un pie solo con el enlace.
  Esto **sustituye** la parte «sin pie» de D-14 de la Fase 10; el test `tests/trips/shape.spec.ts:317`
  (`footer` con count 0 en `prueba`) se actualiza a «el pie solo contiene el enlace de vuelta». El aserto de
  `shell.spec.ts:158` (`toContainText('Roma · 19—23 giugno 2026')`) sigue verde porque es `toContainText`.
- **D-04:** El enlace es `<a href>` de **documento completo** a `useRuntimeConfig().app.baseURL` (nunca `/guiaRoma/`
  literal), sin `NuxtLink`. Texto fijo de UI en español (no viene de trip.yml).
- **D-05:** El estilo del enlace reutiliza las reglas existentes de `footer` en `app/assets/css/base.css:993-1010`; si
  necesita algo propio, va en un fichero CSS **nuevo** (ver D-17), nunca editando `base.css`/`tokens.css`.

### Portada (ROUTE-01)
- **D-06:** `app/pages/index.vue` pasa a ser la portada (componente nuevo, p. ej. `TripIndex.vue`). La portada consulta
  **solo** la colección `trip` con `.select(...)` de los campos que pinta; todo sale del payload prerenderizado.
- **D-07:** Cada tarjeta muestra: **título** (plano, sin Markdown), **fechas**, **destinos** y **resumen**, y toda la
  tarjeta enlaza a `{baseURL}trips/<slug>/` (barra final). **Sin imagen** en v1.1 (offline-first; las heros son de
  Wikimedia). Si un viaje no tiene alguno de los campos opcionales, la tarjeta lo omite (sin texto de relleno).
- **D-08:** Campos nuevos **opcionales** en `TripSchema` (`shared/schemas.ts`): `startDate` y `endDate` (ISO
  `YYYY-MM-DD`, para ordenar y para el texto de fechas), `destinations` (lista de strings no vacíos) y `summary`
  (Markdown-inline, una frase o dos). Roma los recibe en `content/trips/roma/trip.yml` (2026-06-19 → 2026-06-23,
  «Roma», resumen corto en el tono de la guía). — **Reversibility:** costly — los campos pasan a ser contrato de datos
  de todos los viajes.
- **D-09:** Texto de fechas generado de forma determinista desde `startDate`/`endDate` en español
  («19–23 de junio de 2026»; si cruza mes/año, ambos completos). Sin `Intl` dependiente de la configuración regional del
  navegador en el render prerenderizado: utilidad pura con tabla de meses y test unitario.
- **D-10:** Orden: por `startDate` **descendente** (el próximo viaje arriba); empate o sin fecha → por título.
- **D-11:** Chrome de la portada, texto fijo en español: `<title>` **«Guías de viaje»**, `<h1>` «Guías de viaje». La
  portada **no** tiene Topbar, buscador, pastillas, mapa ni pie de viaje. Respeta el tema guardado (color-mode global),
  sin conmutador propio. Estado vacío (sin viajes publicados): un párrafo «Todavía no hay viajes publicados.».
- **D-12:** La portada **no puede tener anclas propias** (`id`) que choquen con la redirección legacy (D-14).

### URLs y prerender (ROUTE-02, ROUTE-04)
- **D-13:** Roma sirve en `/guiaRoma/trips/roma/` desde `app/pages/trips/[slug].vue` (el mismo `TripView`).
  `nitro.prerender.routes` = `['/']` + `/trips/<slug>/` de cada viaje **no draft**, derivado en build leyendo
  `content/trips/*/trip.yml` (no lista a mano); `crawlLinks` sigue activo como red y `failOnError: true`. Fijar
  `definePageMeta({ key: route => route.fullPath })` en `trips/[slug].vue`. Todo enlace interno a una guía lleva
  **barra final** (evita el 301 de GitHub Pages). El comportamiento real de Pages (barra final, 301, `autoSubfolderIndex`)
  lo investiga el researcher; plan B `autoSubfolderIndex: false` o `trailing-slash` si hiciera falta.
- **D-14 (redirección legacy, ROUTE-03):** script inline en `<head>` **solo en la portada** (`useHead`,
  `tagPosition: 'head'`), antes del primer paint: si `location.hash` cumple `^#[a-z0-9-]+$` →
  `location.replace(base + 'trips/roma/' + location.hash)`. Sin lista blanca de anclas (el sufijo validado basta y no
  hay anclas propias en la portada); hash vacío o que no cumple → se queda en la portada. `LEGACY_TRIP = 'roma'` es una
  constante de migración en código, no un dato. `/guiaRoma/index.html#x` es la misma página y se cubre igual.
  `location.replace` → sin entrada de historial → «Atrás» no hace bucle. El scroll al ancla tras la redirección lo
  resuelve la carga normal de Roma con hash (el researcher confirma que el mecanismo actual de Roma ya lo hace).
- **D-15:** Ninguna guía ni la portada pide `sql_dump.txt` ni `.wasm` al cargar (ROUTE-04): test Playwright sobre la
  build estática que lo asevera para la portada y para Roma.

### Borradores (ROUTE-05)
- **D-16:** `draft: true` (opcional, booleano) en `TripSchema`. Un viaje draft, en build de producción, **no entra en
  Content** (las fuentes de `content.config.ts` excluyen sus carpetas leyendo los `trip.yml` en tiempo de config), así
  que no aparece en la portada, no se prerenderiza **y sus filas no llegan al `sql_dump` público** (cierra CR-01 de la
  Fase 9 y AR-10-02). En `pnpm dev` los draft **sí** se cargan (siguen accesibles por URL para `pnpm test:trips`), pero
  la portada **nunca** los lista, tampoco en dev. Se añade exactamente `draft: true` a `content/trips/prueba/trip.yml` y
  se activa el `# draft: true` comentado de `content/trips/forma/trip.yml` (única excepción a D-15 de la Fase 10, que ya
  la anticipaba). Si excluir por fuentes no es viable en Content 3.14, el researcher propone la alternativa con la misma
  garantía (nada draft en el `.output/public`, verificado por grep del centinela). — **Reversibility:** reversible
- **D-17:** `tests/data/build-isolation.spec.ts` se invierte de «no existe `.output/public/trips`» a: existe
  `trips/roma/index.html`; **no** existen `trips/prueba` ni `trips/forma`; los centinelas de prueba/forma no aparecen en
  **ningún** fichero de `.output/public` (incluidos los `sql_dump`).

### Paridad (PAR-01, PAR-02)
- **D-18:** Orden obligatorio de commits: (1) `tests/parity/_harness.ts` con `ROMA_URL` (y origen/puerto si conviene)
  y todos los specs de paridad usándolo **con el valor actual** `/guiaRoma/` — puerta verde, cero cambio de
  comportamiento; (2) el movimiento de URL, cuyo **único** diff en los specs de Roma es el valor de `ROMA_URL` →
  `/guiaRoma/trips/roma/`. Más (3): `shell.spec.ts` invierte su aserto de «no `trips/`» (D-17) y añade el test que
  asevera que `/` sirve la portada y `ROMA_URL` sirve Roma (evita specs «verdes» contra la portada).
- **D-19:** Los 56 goldens pasan **sin `--update-snapshots`** y sin tocar `tests/parity/golden.spec.ts-snapshots/`;
  `golden.spec.ts` (excluido de la puerta, renderiza el `index.html` viejo) no cambia. Cualquier otro cambio en
  `tests/parity/` fuera de D-18 está prohibido. `tests/README.md` re-registra el conteo de tests de la puerta.
- **D-20:** Claves de `localStorage` sin cambios (`roma-*`, `roma-theme`): mismo origen, así que notas y ritmo de quien
  ya usa Roma siguen ahí tras el cambio de URL. Ningún código nuevo escribe ni migra claves.

### Restricciones que se mantienen
- **D-21:** Sin cambios en `app/assets/css/base.css`, `tokens.css`, `fonts.css`, `leaflet.css`. Los estilos de la
  portada van en un fichero nuevo (p. ej. `app/assets/css/multitrip.css`) con **todos** los selectores bajo una clase
  raíz propia de la portada (p. ej. `.trip-index`), usando los tokens existentes; sin `<style scoped>`, sin `v-html`.
  Un test asevera que ningún selector de ese fichero alcanza el DOM de Roma (o la puerta de paridad lo demuestra).
- **D-22:** Builds y Playwright con Node 22; `rm -rf .data .nuxt .output` antes de generar; nunca `test:trips` a la vez
  que `generate`/`verify`; todo en `release/nuxt-4`.

### Claude's Discretion
- Nombre y forma exacta de los componentes (`TripIndex.vue`, `TripCard`…) y de la utilidad de fechas.
- Maquetación de la portada dentro del lenguaje visual existente (tipografías y tokens de Roma); la concreta el
  UI-SPEC.
- Cómo derivar las rutas de prerender (hook de Nitro, lectura de YAML en `nuxt.config.ts`, módulo local).
- Servidor estático de test que imite a GitHub Pages (301 a barra final) para los specs de redirección.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Alcance y requisitos
- `.planning/ROADMAP.md` §«Phase 11: Portada y rutas multi-viaje» — goal, 5 success criteria, notas (orden de commits
  del harness, `<a href>` de documento completo, research pendiente).
- `.planning/REQUIREMENTS.md` — ROUTE-01..06, PAR-01, PAR-02 y notas de trazabilidad.

### Investigación del hito
- `.planning/research/SUMMARY.md` §Phase 11 y decisiones de navegación/redirección (líneas ~28-29, 54, 62, 72-81, 97-99, 158-159).
- `.planning/research/PITFALLS.md` — redirección con hash (~160-175), crawl/404 SPA y `sql_dump` (~189-203), barra final
  en Pages (~301), payload y WASM (~305), redirección abierta (~325), checklist (~348-349, 376-377), `pageKey` (~145).
- `.planning/research/ARCHITECTURE.md`, `.planning/research/STACK.md` — prerender, `crawlLinks`, payload.

### Fases previas
- `.planning/phases/10-forma-y-chrome-desde-datos/10-CONTEXT.md` — D-14 (respaldo neutro; aquí se sustituye la parte del pie), D-15 (prueba intocable; aquí se le añade solo `draft: true`).
- `.planning/phases/10-forma-y-chrome-desde-datos/10-SECURITY.md` — AR-10-02 (draft debe excluir del `sql_dump`).
- `.planning/phases/09-plataforma-por-viaje/09-UAT.md` — CR-01 (filas dev-only en `sql_dump`).

### Código y tests clave
- `app/pages/index.vue`, `app/pages/trips/[slug].vue`, `app/components/TripView.vue` (pie en ~262), `nuxt.config.ts` (prerender ~41-48), `content.config.ts`, `shared/schemas.ts`.
- `tests/parity/visual-diff.spec.ts:56-71` (las 14 vistas: el pie no está), `tests/parity/shell.spec.ts` (~118-190), `tests/parity/subpath.spec.ts`, el resto de specs con `/guiaRoma/` literal.
- `tests/data/build-isolation.spec.ts`, `tests/trips/shape.spec.ts:281-317`, `tests/README.md`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TripView.vue` ya es reutilizado por `/` y `/trips/[slug]`; `[slug].vue` ya tiene el guard 404 vía `useTrip(slug)`.
- `useTrip`, `inlineMdToPlain` (`app/utils/tripLayout.ts`) para el título plano de las tarjetas.
- Tokens y tipografías existentes (`tokens.css`, `fonts.css`) para la portada.
- `tests/trips/romaLeaks.ts` (trampa) — la portada sí puede decir «Roma» (es una tarjeta), no aplicar la trampa a `/`.

### Established Patterns
- Prerender con `failOnError: true` y `crawlLinks: true`; `app.baseURL = '/guiaRoma/'`.
- Specs de paridad levantan un servidor estático propio sobre `.output/public` con puerto por fichero.
- Esquema zod compartido entre `content.config.ts` y la puerta de datos (`tests/data/trips.ts`).

### Integration Points
- `app/pages/index.vue` (reescrito), `nuxt.config.ts` (rutas), `content.config.ts` (exclusión draft),
  `shared/schemas.ts` (campos nuevos), `content/trips/{roma,prueba,forma}/trip.yml`, `TripView.vue` (pie).
- Comentarios actuales que dicen «SIN enlaces a /trips/*» (`index.vue`, `[slug].vue`, `shell.spec.ts`) quedan obsoletos.

</code_context>

<specifics>
## Specific Ideas

- Texto exacto del enlace: «← Todos los viajes».
- La URL concreta `/trips/campania/` no se materializa aquí; el mecanismo se prueba con Roma (publicado) y
  prueba/forma (draft, no publicados).

</specifics>

<deferred>
## Deferred Ideas

- Imagen de portada por viaje en las tarjetas — futuro (exige assets locales para offline).
- Mostrar los draft en la portada en dev con etiqueta «borrador» — descartado por ahora.
- Navegación SPA entre viajes — futuro, con test de ida y vuelta (Fase 14 lo mide).
- WR-01..03 de la revisión de la Fase 10 (p. ej. `extractLinkTargets` con formas raras de enlace) — pendientes de la
  decisión del usuario en `10-UAT.md`; no se pliegan aquí.
- Desbordamiento de la barra de pastillas — Fase 12/13.

</deferred>

---

*Phase: 11-portada-y-rutas-multi-viaje*
*Context gathered: 2026-11-20*
