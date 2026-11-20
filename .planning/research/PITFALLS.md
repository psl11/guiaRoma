# Pitfalls Research

**Domain:** Guía de viajes editorial estática (Nuxt 4 + Nuxt Content v3, GitHub Pages bajo `/guiaRoma/`). Milestone v1.1: de un viaje a varios (portada índice, Roma movida a `/trips/roma`, redirecciones de enlaces antiguos, persistencia por viaje con migración de `roma-*`, chrome y secciones desde datos, mapa multi-ciudad, segundo viaje Campania 2027)
**Researched:** 2026-11-20
**Confidence:** HIGH en lo que sale de leer el código y la build actuales (`app/`, `shared/schemas.ts`, `tests/`, `.output/public`). MEDIUM en el comportamiento de Nuxt Content v3 y de Nuxt en navegación cliente (docs oficiales leídas, más comprobación en la build local). LOW en el pageKey por defecto de Nuxt, que se dedujo del código fuente y no está documentado.

> Convención de fases (propuesta para el roadmap, ver §Pitfall-to-Phase Mapping):
> **P1 Plataforma data-driven** (generalizar TripView, composables y chrome **con Roma aún en `/`** y la puerta intacta) →
> **P2 Persistencia por viaje + migración** →
> **P3 Rutas: portada `/`, Roma a `/trips/roma`, redirecciones legacy, prerender multi-viaje** →
> **P4 Contenido Campania 2027** →
> **P5 Puerta multi-viaje + deploy**.
> La regla de orden más importante: **no refactorizar y mover de URL en la misma fase**. Ver Pitfall 1.

---

## Critical Pitfalls

### Pitfall 1: Refactorizar Roma a data-driven y moverla de URL en la misma fase (se pierde el oráculo de paridad)

**Qué falla:**
La puerta de paridad (`pnpm verify`: 56 goldens + 80 tests en 11 ficheros) apunta a `STATIC_URL = …/guiaRoma/`, repetido como constante en **10 specs** (`modes`, `search-route`, `navigation`, `render-*`, `shell`, `visual-diff`, `theme`, `map-fallback-notes`). Si en el mismo cambio se mueve Roma a `/trips/roma` y se generaliza `TripView`, el chrome y los composables, cuando un golden falle no habrá forma de saber si la causa es la ruta o el refactor. La tentación entonces es re-baselinar, y con eso se destruye la referencia. Hay un riesgo peor y silencioso: en cuanto `/` sea la portada, los specs que solo comprueban "carga y tiene X" (p. ej. `subpath.spec.ts`, que mira que los assets cargan bajo el subpath) pueden **seguir en verde contra la portada** y dejar de cubrir Roma.

**Por qué ocurre:**
Parece más eficiente hacerlo todo de una vez. Además, la URL está duplicada en cada spec en lugar de centralizada.

**Cómo evitarlo:**
- **P1 primero, con Roma todavía en `/`**: generalizar todo (días, secciones, chrome, singletons por slug) **sin tocar ni una línea de `tests/parity/`**. Que los 80 tests y los 56 goldens sigan verdes sin cambios es la mejor prueba de que el refactor no tocó Roma.
- **P3 después, como movimiento puro**: centralizar `STATIC_URL` en un helper compartido (`tests/parity/_urls.ts` → `ROMA_URL = …/guiaRoma/trips/roma/`) y hacer que el **único** diff de los specs de Roma sea esa constante. Los 56 goldens tienen que pasar **sin `--update-snapshots`** en la nueva URL.
- Añadir en P3 un test que asevere que `ROMA_URL` sirve el `#inicio` de Roma y que `/guiaRoma/` sirve la portada (un `h1`/selector propio del índice). Así un spec que apunte por error a la portada falla de forma ruidosa.
- Re-medir y registrar el conteo de la puerta en `tests/README.md` §4 (hoy `Total: 80 tests in 11 files`). Los specs nuevos de portada, redirección y Campania deben **sumarse** y dejar intacto el subconjunto de Roma.

**Señales de alarma:**
Un PR que toca a la vez `app/pages/` y `tests/parity/*.spec.ts`. Alguien que propone `test:golden:update`. Que el `Total:` de `--list` baje.

**Fase:** P1 (refactor con la puerta congelada) y P3 (movimiento de URL como diff mínimo).

---

### Pitfall 2: Hardcodes de Roma que sobreviven al refactor (silenciosos porque Roma sigue verde)

**Qué falla:**
La puerta solo mira Roma, así que **cualquier** dato de Roma que siga fijo en el código pasa la puerta y aparece en Campania. Inventario real en la rama:
- `app/app.vue:27`: `title: 'Roma · 19—23 giugno 2026'` es **global**. Lo heredarían la portada y Campania.
- `Topbar.vue:22`: la marca `Roma ✦ giugno MMXXVI` está fija.
- `TripView.vue:237-241`: footer fijo («Itinerario preparado para *Pay* y dos colegas … Roma · 19—23 giugno 2026»).
- `TripView.vue`: las 5 `<section id="viernes|sabado|domingo|lunes|martes">` están escritas a mano con `dayBySlug('viernes')`. Un día de Campania con otro slug **no se renderiza** y no hay ningún error.
- `TripView.vue`: la leyenda del mapa dice «Verde · concierto Einaudi», y el subtítulo del mapa también es fijo.
- `NavPills.vue`: las pastillas de sección están fijas e incluyen **«Pratica»** en italiano. Es una rareza que forma parte de la paridad.
- `foodGroups.ts`: `FOOD_GROUP_ORDER` contiene los 7 grupos romanos. Los grupos de Campania caerían en orden de inserción sin aviso (rank = ∞).
- `useCardNavigation.ts:173` y `useSearch.ts:144`: `await useTrip('roma')`. En Campania, los enlaces a ficha harían el salto nativo (sin `.highlight` ni pila de "Volver") y la búsqueda devolvería **fichas de Roma**.
- `useTripModes.ts` y `MonumentCard.vue:123` usan claves `roma-*` literales (ver Pitfall 4).
- `pages/index.vue`: `<TripView slug="roma" />`.

**Por qué ocurre:**
v1.0 se construyó con el objetivo de que Roma fuera idéntica. Los comentarios del propio código lo justifican ("Roma hardcodeado, D-02"). Ningún test ve Campania.

**Cómo evitarlo:**
- Al empezar P1, hacer un barrido con `grep -rn "'roma'\|roma-\|Roma\|viernes\|Einaudi\|giugno" app/` y convertir cada resultado en una tarea o en un campo de `trip.yml`.
- Pasar el slug **explícitamente** a los controllers (`useCardNavigationController(slug)`, `useSearchController(slug)`, por `provide/inject` desde `TripView` o como argumento) y que **ningún** composable invente un slug por defecto.
- Al llevar textos a datos, **los valores de Roma se copian verbatim**, incluido «Pratica», el doble espacio de `✦  Rojos` y el `<br>` del footer. La UI está en español fijo, pero las etiquetas que ya existen en Roma son parte de la paridad: o el texto de la pastilla de sección sale de datos, o Campania hereda «Pratica».
- Añadir un **test-trampa**: un fixture de viaje mínimo (`tests/fixtures/trips/zz-test/`, o un viaje de prueba en la build de test) con un slug y unos días distintos, y aseverar que su página no contiene «Roma», «Einaudi» ni «giugno 2026». Ese test detecta hardcodes residuales que la puerta de Roma no puede ver.

**Señales de alarma:**
Campania muestra «Roma» en la pestaña o en el footer. La búsqueda en Campania encuentra el Pantheon. Una ficha de Campania enlazada salta sin resaltado.

**Fase:** P1.

---

### Pitfall 3: Slugs de día por nombre de la semana: Campania tiene dos sábados, dos domingos y dos lunes

**Qué falla:**
Los días de Roma usan el nombre de la semana como `slug`, que además es el id DOM de la sección y el `href` de la pastilla (`sabado.yml` → `#sabado`). Campania va del sábado 19 al lunes 28 de junio de 2027 (10 días), así que **sábado, domingo y lunes se repiten**. Si se sigue la convención, se obtienen ids DOM duplicados, `getElementById` y el scrollspy saltan al primero, `useAsyncData` y las Maps machacan un día con otro, y además `dayLabel()` saca la etiqueta del `eyebrow` y produce **dos pastillas «Sabato»** idénticas. Con 10 días más 7 secciones, la barra de pastillas en móvil también pasa a ser muy larga.

**Por qué ocurre:**
Se copia la convención de Roma. El esquema no exige unicidad de `slug` dentro de un viaje.

**Cómo evitarlo:**
- Convención nueva para viajes futuros: slug con fecha (`dia-19`, `sab-19`) o con ordinal. **Roma conserva `viernes…martes`**, porque son anclas legacy que hay que redirigir (Pitfall 6).
- Invariante en `tests/data`: los slugs de día, ficha, comida, artista y referencia son **únicos dentro de cada viaje** y **no chocan con los ids de sección** (`inicio`, `mapa`, `reservas`, `gastronomia`, `practica`, `arte`, `arquitectura`). Si una ficha de Campania se llamara `practica`, `isFichaTarget` y el scrollspy fallarían.
- Etiqueta de pastilla con fecha para viajes largos: un campo `pill` opcional en el día, que Roma no rellena y que por tanto sigue derivándose de `eyebrow`.

**Señales de alarma:**
Dos ficheros `sabado*.yml` en `content/trips/campania/days/`. Una pastilla que, al pulsarla, salta a otro día.

**Fase:** P1 (esquema e invariante) y P4 (contenido).

---

### Pitfall 4: Migración de `roma-*` que pierde, duplica o pisa notas (datos irrecuperables del usuario)

**Qué falla:**
Las notas (`roma-note-<slug>`) son el único dato del usuario que no se puede regenerar. Formas concretas de perderlas:
1. **Orden de montaje de Vue.** Los `onMounted` de los hijos se ejecutan **antes** que el del padre. Si la migración vive en el `onMounted` de `TripView`, cada `MonumentCard` ya habrá leído la clave nueva (vacía) antes de que la migración copie. El usuario ve sus notas vacías en la primera carga tras el upgrade, y si escribe algo, el watcher con debounce **sobrescribe** la clave nueva. La nota vieja queda huérfana.
2. **Mover en vez de copiar.** Si se borran las claves `roma-*` tras copiar, desaparece la red de seguridad. Un rollback del deploy (volver a servir el `index.html` vivo, que lee `roma-note-*`) dejaría al usuario sin notas.
3. **Migración no idempotente.** Si se ejecuta en cada carga y copia viejo→nuevo sin comprobar, las ediciones hechas en la clave nueva se **revierten** a la versión vieja en cada recarga.
4. **Prefijos genéricos en un origen compartido.** Todas las *project pages* de un usuario de GitHub (`<user>.github.io/*`) comparten **el mismo origen y el mismo localStorage**. Claves como `pace` o `notes:x` pueden chocar con otro repo del mismo usuario. Enumerar por prefijo (`key.startsWith('roma')`) también arrastraría `roma-theme` o un viaje futuro `roma-2027`.
5. **Tema.** `roma-theme` es la `storageKey` de `@nuxtjs/color-mode` (`nuxt.config.ts:33`) y la lee un **script inline anti-FOUC**. Si se "namespacea" por viaje, se rompe el no-FOUC (el script es estático y no sabe en qué viaje está) y se pierde la preferencia de tema guardada.

**Por qué ocurre:**
La migración se trata como una tarea de "renombrar claves" y no como una migración de datos con rollback.

**Cómo evitarlo:**
- **Opción recomendada, que hace la migración trivial:** elegir un esquema de claves por viaje en el que **las claves actuales de Roma ya sean válidas**: `${tripSlug}-note-${cardSlug}`, `${tripSlug}-pace`, `${tripSlug}-light`, `${tripSlug}-resumen`. Con eso, para Roma la "migración" es un **no-op** (cero riesgo de pérdida) y Campania escribe en `campania-*`. Requisitos:
  - validar el slug del viaje con una regex en `TripSchema` (`^[a-z0-9]+$`, sin guiones, para evitar ambigüedades de prefijo);
  - prohibir la enumeración por prefijo; solo se permiten lecturas por clave exacta;
  - en un helper `tripStorageKey(slug, name)` + test unitario, aseverar que `tripStorageKey('roma','note-pantheon') === 'roma-note-pantheon'`.
- **Si aun así se elige un formato nuevo** (p. ej. `guia:<slug>:note:<card>`):
  - migrar en un **plugin cliente** (`app/plugins/00.storage-migrate.client.ts`), que se ejecuta **antes del montaje de la app** y por tanto antes que cualquier `onMounted`;
  - **copiar sin borrar**, y solo si la clave nueva no existe;
  - guardar un marcador de versión (`guia:storage-version = 2`);
  - envolver todo en `try/catch` (localStorage bloqueado o modo privado, como ya hace `MonumentCard`).
- **El tema es global y no se migra**: mantener `storageKey: 'roma-theme'` aunque el nombre ya no encaje, y documentar por qué en `nuxt.config.ts`.
- **Test de upgrade real (P2/P5):** en un mismo origen de Playwright, cargar el `index.html` vivo de `main` (la herramienta de `golden.spec.ts` ya lo sirve), escribir una nota y fijar el ritmo; después cargar la build nueva en `/trips/roma/` y aseverar que la nota y el ritmo aparecen **en la primera carga**, sin recargar. Hoy `map-fallback-notes.spec.ts:386` solo siembra la clave con `addInitScript`; eso prueba que la clave se lee, no que el upgrade funcione.
- Como el deploy de v1.0 nunca se hizo (D-08 diferido), **el primer deploy público será a la vez v1.0 y v1.1**. Las claves que hay que preservar son las que escribe el `index.html` vivo de `main`. Hay que verificar su formato exacto leyendo ese fichero, no el código Nuxt.

**Señales de alarma:**
Lógica de migración en un `onMounted` de componente. Un `localStorage.removeItem` en el código de migración. Un bucle `for (key in localStorage)`. Cambios en `colorMode.storageKey`.

**Fase:** P2 (diseño de claves y migración) y P5 (test de upgrade en la puerta).

---

### Pitfall 5: Estado global (`useState` y refs de módulo) que se filtra entre viajes en la navegación cliente

**Qué falla:**
Todo el estado de interacción usa claves **globales**: `useState('pace')`, `'light'`, `'resumen'`, `'cardNav:stack'`, `'cardNav:activeSection'`, `'search:query'`, `'search:results'`. Además, `useSearch.ts` guarda el índice MiniSearch en una **ref a nivel de módulo** (`const indexRef = shallowRef(…)`). Con una página por carga (v1.0) esto no importaba. Con portada + `<NuxtLink>` hacia los viajes (navegación SPA), al pasar de Roma a Campania:
- el ritmo, el modo light y el resumen de Roma se aplican a Campania. Si `campania-pace` no existe, el valor heredado se queda y además lo escribirán los watchers;
- `navStack` contiene posiciones de scroll de la página de Roma, así que "Volver" en Campania salta a una posición sin sentido;
- el índice de búsqueda de Roma sigue vivo hasta que se reconstruye;
- `useHead({ bodyAttrs: class })` deja `light-mode` o `modo-resumen` en el `<body>` si el desmontaje no limpia a tiempo.

**Por qué ocurre:**
Los singletons se diseñaron con un único viaje por carga. Los tests de paridad siempre hacen `page.goto` (carga completa) y nunca navegan entre viajes.

**Cómo evitarlo:**
- Incluir el slug en las claves: `useState(\`pace:${slug}\`)`, `cardNav:stack:${slug}`, etc. Para el índice de búsqueda, usar `Map<slug, MiniSearch>` o un `useState` por slug, nunca una ref de módulo única.
- Leer el estado persistido **por slug** al montar cada viaje y **reiniciar a los valores por defecto** si no existe (no heredar el valor anterior).
- Decidir de forma explícita cómo se navega de la portada a un viaje:
  - con `<NuxtLink>` (SPA): exige todo lo anterior más tests SPA;
  - con `<a href>` normal (carga completa): reproduce exactamente las condiciones en las que se validó v1.0.

  Recomendación: claves por slug **siempre**, y un test Playwright de ida y vuelta **portada → Roma → atrás → Campania → atrás → Roma** que asevere el ritmo, la búsqueda y "Volver" de cada viaje.
- Nuxt remonta la página al cambiar `params.slug` porque la clave de página por defecto interpola los parámetros (confianza LOW, deducido del código fuente). Aun así, `TripView` recibe `slug` como prop y `useTrip(slug)` **no es reactivo** al slug: si algún día se usa un `pageKey` fijo o un `<KeepAlive>`, se mostrarían los datos del viaje anterior. Fijar `definePageMeta({ key: route => route.fullPath })` en `trips/[slug].vue` hace explícito el remontaje.

**Señales de alarma:**
Resultados de búsqueda de otro viaje. El ritmo de Campania arranca en un valor que nunca se eligió en Campania.

**Fase:** P1 (claves por slug) y P3 (decisión de navegación + test SPA).

---

### Pitfall 6: Redirecciones legacy `/#ancla` imposibles en el servidor (el fragmento nunca llega a GitHub Pages)

**Qué falla:**
Los enlaces compartidos de la versión viva son del tipo `…/guiaRoma/#viernes`, `…/guiaRoma/#pantheon` o `…/guiaRoma/index.html#gastronomia`. **El fragmento `#…` no se envía nunca al servidor**, y GitHub Pages tampoco admite reglas de redirección. Cualquier intento de redirigir "en el servidor" (meta refresh fijo, `404.html` o `routeRules` de Nitro, que en estático no tiene servidor) **descarta el ancla**. Errores habituales:
- redirigir en `onMounted` de la portada con `navigateTo`: la portada se pinta y luego hay un salto (flash), la redirección queda en el historial (el botón Atrás vuelve a la portada y vuelve a redirigir, un bucle) y el scroll al ancla compite con la hidratación;
- redirigir **cualquier** visita a `/` hacia Roma (por ejemplo "el último viaje visto"): la portada deja de existir;
- `/guiaRoma/trips/roma` **sin barra final**: GitHub Pages responde con un 301 a `…/roma/`. El fragmento se conserva, pero en una red móvil mala es un viaje de red más;
- escribir `/guiaRoma/` a mano en el destino: se rompe en dev o si cambia el dominio.

**Por qué ocurre:**
Se piensa en redirecciones de servidor (estilo 301) y no en el modelo estático.

**Cómo evitarlo:**
- **Script inline en `<head>` solo en la portada** (con `useHead({ script: [{ innerHTML, tagPosition: 'head' }] })`), que se ejecuta **antes del primer paint**: si `location.hash` está en la **lista blanca de anclas de Roma**, hace `location.replace(base + 'trips/roma/' + location.search + location.hash)`. Con `replace` no queda entrada en el historial y no hay bucle de Atrás.
- Generar la lista blanca **desde los datos** en build (los ids de sección, los 5 slugs de día y los slugs de ficha, comida y artista de Roma), o como mínimo "cualquier hash no vacío que no sea un ancla propia de la portada". Tomar `base` de `useRuntimeConfig().app.baseURL`.
- Destino **con barra final** (`trips/roma/`) para evitar el 301 de Pages.
- Mantener el comportamiento de v1.0 al aterrizar: en el `index.html` vivo, abrir `/#pantheon` hacía el **salto nativo** al ancla, sin `.highlight`. Hay que comprobar que el `scrollBehavior` del router de Nuxt no lleva la página arriba tras hidratar y que `scroll-margin` coincide.
- Tests Playwright de P3, en ambos proyectos (mobile y desktop):
  - `/#viernes` termina en `/trips/roma/#viernes` con `#viernes` en el viewport;
  - `/#pantheon` hace lo mismo con su ficha;
  - `/index.html#gastronomia` funciona igual;
  - `/` sin hash **se queda** en la portada;
  - Atrás tras la redirección **no** vuelve a la portada.

**Señales de alarma:**
Redirección en `onMounted` o `middleware`. `meta http-equiv="refresh"`. Un `'/guiaRoma/'` literal en el código.

**Fase:** P3.

---

### Pitfall 7: Prerender que no emite (o emite de más) las rutas de viaje y la disciplina D-01 invertida

**Qué falla:**
Hoy `nitro.prerender.routes: ['/']` + `crawlLinks: true`. **No hay ningún enlace a `/trips/*`**, de forma deliberada (D-01), y `shell.spec.ts:186` **asevera que `.output/public/trips` NO existe**. En v1.1 todo eso se invierte:
- si los viajes solo se descubren por crawl desde la portada, un viaje sin tarjeta en la portada (borrador, oculto) **no se emite** y Pages devuelve `404.html`. Ese `404.html` es el **shell SPA** (2.361 B, igual que `200.html` en la build actual): renderiza en cliente y obliga a Content a **descargar `__nuxt_content/*/sql_dump.txt` e iniciar SQLite en WASM**. Funciona online, pero **no offline** y con más peso;
- la aserción `no-trips-dir` de `shell.spec.ts` **debe fallar** en v1.1. Si alguien la borra en vez de invertirla («`trips/roma/index.html` y `trips/campania/index.html` existen»), la puerta pierde la garantía de prerender;
- `failOnError: true` no cubre las anclas internas rotas (los fragmentos no se crawlean). Un `[enlace](#slug-inexistente)` en la prosa de Campania pasa el build.

**Por qué ocurre:**
Se confía en que el crawler descubrirá las rutas, y la aserción de v1.0 se vive como un obstáculo en lugar de invertirla.

**Cómo evitarlo:**
- Rutas de prerender **explícitas y derivadas de los datos**: en `nuxt.config.ts`, leer `content/trips/*/trip.yml` (fs + glob) y generar `['/', ...slugs.map(s => \`/trips/${s}\`)]`. El crawl queda como red de seguridad, no como fuente.
- Invertir la aserción en `shell.spec.ts` (de "no existe" a "existe para cada slug de la colección `trip`") y aseverar que **no** existe `trips/<slug-no-declarado>`.
- Añadir a `tests/data/invariants.spec.ts` la resolución de **todas** las referencias `#slug` de la prosa y del timeline **dentro del mismo viaje**. Hoy `ROOT` está fijado a `content/trips/roma` (ver Pitfall 9).
- Opcional: un campo `published: boolean` en `TripSchema` para borradores. Se excluyen de las rutas y de la portada, de forma explícita.

**Señales de alarma:**
El `.output/public/trips/` no contiene un viaje que sí está en `content/`. Peticiones a `sql_dump.txt` en el DevTools al abrir un viaje. `shell.spec` editado a la baja.

**Fase:** P3 (rutas + spec invertido) y P5 (puerta).

---

### Pitfall 8: Contenido de Campania sin validar (Content v3 no valida `type:'data'` en build y los tests solo miran Roma)

**Qué falla:**
Nuxt Content v3 **no valida** los ficheros `type:'data'` contra zod en build (#3351). En v1.0 la validación vive en `tests/data/schema.spec.ts` e `invariants.spec.ts`, con `ROOT = content/trips/roma` **fijo** y conteos fijos (`expected: 38` monumentos, `5` días, `26` comida…). Consecuencias:
- **Ningún YAML de Campania se valida.** Una errata (un enum de `motif` inexistente, `coords` como string, un campo mal escrito) llega a producción **en silencio**: campos `null`, secciones vacías o una ficha sin fallback;
- si se cambia `ROOT` a `content/trips/*` "para cubrir todo", los **conteos de Roma** fallan (38 + N), y el `migration-diff` contra `index.html` podría recorrer ficheros de Campania que no tienen equivalente.

**Por qué ocurre:**
Los tests de datos nacieron con un solo viaje.

**Cómo evitarlo:**
- Parametrizar `tests/data` por viaje: `describe.each(tripSlugs)`. Esquema e invariantes genéricos (unicidad de slugs, referencias resueltas **dentro del viaje**, `motif` resoluble, `coords` dentro del bounding box de la región) **para todos los viajes**. Los conteos y el `migration-diff` siguen **solo para Roma**.
- Un test que falle si existe `content/trips/<slug>/` sin `trip.yml` o con un `trip.yml` cuyo `slug` no coincide con el nombre de la carpeta.
- Los nombres reservados de Content v3 en colecciones `data` son al menos `id` y `meta` (comprobado en v1.0, CR-01). `stem` y `extension` también son columnas por defecto (MEDIUM). En los campos nuevos de Campania (opción A/B, ferris, coche) no usar esos nombres. Añadir un test que recorra las claves de los esquemas y falle si aparece un nombre reservado.

**Señales de alarma:**
`pnpm test:data` verde con la carpeta de Campania vacía o rota. Un `[object Object]` o un texto vacío en un campo de Campania.

**Fase:** P1 (parametrizar los tests antes de que exista contenido nuevo) y P4.

---

### Pitfall 9: Ensanchar el esquema para Campania rompe Roma o la materialización SQL de Content

**Qué falla:**
Campania necesita cosas que el esquema de Roma no admite:
- `PlaceType` solo acepta `card|guided|concert`, y los colores de los marcadores están fijos por tipo;
- `Motif` tiene 19 motivos romanos (`dome`, `pantheon`, …), sin `island`, `volcano`, `beach` ni `ferry`;
- `TransportMode.variant` solo acepta `walk|train|taxi|metro|ticket`, y el timeline `taxi|walk|train`, sin `ferry`, `car` ni `bus`. Cada variante es además una **clase CSS** (`lg-*`, `badge-*`) con estilos verbatim;
- `badgeKind` de comida tiene 8 tipos romanos (`quinto`, `ghetto`…);
- las **opciones A/B** de un día no existen en el modelo.

Errores típicos:
- modelar la opción A/B como un `discriminatedUnion` **a nivel raíz** de una colección: esos esquemas **no se materializan en columnas SQL** (lección de v1.0 con `ArtistSchema` → `ArtistRowSchema` aplanado). Anidado dentro del `timeline` (columna JSON) sí funciona;
- convertir en obligatorio un campo nuevo, lo que obliga a reescribir Roma y abre la puerta a un diff en el `migration-diff`;
- añadir una variante de enum **sin su clase CSS**: el elemento sale sin estilo y nada falla;
- cambiar el esquema **sin `rm -rf .data .nuxt .output`**: la build sigue usando la tabla SQLite y los checksums viejos y renderiza contenido rancio sin avisar (lección de memoria). Con columnas nuevas, el síntoma es que el campo nuevo sale `null`.

**Cómo evitarlo:**
- Toda ampliación del esquema es **aditiva y opcional**, y los YAML de Roma no se tocan. Si un YAML de Roma tiene que cambiar (p. ej. mover textos del chrome a `trip.yml`), el `migration-diff` y los goldens deben seguir verdes sin re-baselinar.
- Opción A/B: modelarla **dentro** del día (p. ej. `options: [{ key: 'A', title, timeline: [...] }]` como array anidado en la columna JSON), no como una colección raíz con unión discriminada. Decidir antes de redactar contenido cómo interactúa con: (a) la **ruta del día**: ¿una URL por opción?; (b) la **numeración del mapa**: ¿marcadores de las dos opciones?; (c) los **modos de ritmo**.
- Por cada valor de enum nuevo: estilo en el CSS global (sin `scoped`), un SVG en `SVG_MOTIFS` y un test unitario que asevere que **cada valor del enum tiene estilo o SVG**. `motifSvg(undefined)` devuelve `undefined` y **oculta el fallback**, así que una ficha de Campania sin `motif` se queda sin imagen offline.
- Añadir `rm -rf .data .nuxt .output` al principio de `pnpm verify` (o un script `clean` previo a `generate`) para que la puerta nunca compare contra una build rancia.

**Señales de alarma:**
Un `z.discriminatedUnion` nuevo en el nivel raíz de un esquema de colección. Un enum ampliado sin cambios en el CSS ni en `svgMotifs.ts`. Un campo nuevo que siempre sale `null`.

**Fase:** P1 (modelo y ampliaciones) y P4 (uso).

---

### Pitfall 10: Mapa multi-ciudad: encuadre, numeración y "ruta del día" con ferris y coche

**Qué falla:**
- `fitBounds` sobre Nápoles + Procida + Ischia + Salerno + Cilento + Vesubio (unos 100 km) deja un zoom 8–9. Los marcadores de Nápoles se amontonan y los popups no se pueden pulsar en móvil. A ese zoom, en una red mala, pocas teselas cargan y el heurístico `isOffline(errored>3 && loaded===0)` se comporta distinto.
- El orden es `setView(trip.map.center, zoom)` **y luego** `fitBounds`. Con un `center` mal puesto en `trip.yml` hay un salto visible; si falta `trip.map`, `trip.value!.map` **lanza** dentro del `try` y aparece el mensaje «No se ha podido cargar el mapa».
- La numeración `roman` es manual por ficha. Con 10 días y opciones A/B se esperan duplicados o huecos.
- La **ruta del día** construye URLs de Google Maps en modo **a pie** (port 1:1 de `index.html`). Un día con ferry Nápoles→Procida o con coche a Cilento da en modo a pie "no hay ruta" o un recorrido absurdo.
- Los popups se componen con `${m.name}` dentro de HTML (`bindPopup(popupHtml)`). Un nombre de Campania con `&`, `<` o comillas rompe el marcado del popup.

**Cómo evitarlo:**
- Mantener la regla de Roma (encuadre sobre **todos** los marcadores con `.pad(0.1)`, `trip.mapExtras` incluido) para no romper su paridad. Para multi-ciudad, `maxZoom` en `fitBounds` y, si se quiere, una agrupación por ciudad o un selector de día **solo cuando el viaje lo declare**. Clustering con un plugin nuevo no entra en v1.1 (scope creep).
- `trip.map` obligatorio en el esquema, y un invariante de que el `center` está dentro del bounding box de los marcadores.
- Invariante por viaje: los números `roman` son únicos o secuenciales según el orden de los días.
- Por día: un campo `routeMode` (`walking|driving|transit`, por defecto `walking`, que es lo que hay para Roma) y la posibilidad de **trocear** la ruta en los tramos de ferry. El caso de Roma (cap de 10 paradas, `capStops` verbatim) no cambia.
- Escapar el texto que va a los popups (`name`, `day`) con un `escapeHtml`, o construir el popup con nodos DOM. Para Roma el resultado es idéntico porque sus nombres no tienen caracteres especiales.

**Señales de alarma:**
Captura del mapa de Campania con todos los pines en una mancha. Una URL de ruta del día con `travelmode=walking` que cruza el golfo.

**Fase:** P1 (parametrización del mapa, escape, `routeMode`) y P4 (datos).

---

## Technical Debt Patterns

| Atajo | Beneficio inmediato | Coste a largo plazo | Cuándo es aceptable |
|-------|---------------------|---------------------|---------------------|
| Mantener `storageKey: 'roma-theme'` para un tema global | Cero FOUC y cero pérdida de preferencia | Un nombre engañoso | **Siempre en v1.1.** Documentarlo en el config |
| Esquema de claves `${slug}-…` que hace válidas las claves de Roma | Migración no-op y cero riesgo de pérdida | Requiere prohibir guiones en el slug y la enumeración por prefijo | **Recomendado** |
| Re-baselinar goldens porque falla tras mover la URL | La puerta vuelve a verde | Se pierde el oráculo de paridad de Roma | **Nunca** en P1–P3. Solo con sign-off humano explícito y una causa clasificada (precedente D-01) |
| Dejar `useTrip('roma')` en controllers "porque Roma pasa" | Ahorra pasar el slug | Campania busca y navega contra Roma | **Nunca** |
| `ROOT = content/trips/*` en `tests/data` sin parametrizar | Un cambio de una línea | Los conteos de Roma rompen o se relajan, y Campania queda validada a medias | Nunca. Usar `describe.each` por viaje |
| Rutas de prerender solo por crawl | Sin código | Los viajes no enlazados caen al shell SPA (WASM + dump, sin offline) | Solo como red de seguridad añadida a rutas explícitas |
| Clustering o plugin de mapa para multi-ciudad | Mapa más legible | Dependencia nueva y riesgo para la paridad del mapa de Roma | Diferir a v2. En v1.1, `maxZoom` + datos |
| Redactar Campania con huecos ("TBD") porque el input llegó troceado | Se publica antes | La guía falla sobre el terreno (días que faltan en `campania-2027-itinerario-raw.md`) | Solo con `published: false` o con días marcados como provisionales de forma visible |

## Integration Gotchas

| Integración | Error común | Enfoque correcto |
|-------------|-------------|------------------|
| GitHub Pages (subpath `/guiaRoma/`) | Servir `.output/public` en la raíz al probar la portada o las redirecciones, con página en blanco o redirecciones a rutas equivocadas | Servir bajo un subdirectorio `guiaRoma/` (lección de memoria). Todas las URLs derivadas de `app.baseURL` |
| GitHub Pages (directorios) | Enlazar `/trips/roma` sin barra final, lo que añade un 301 por cada visita | Enlaces y destino de redirección con `/trips/roma/` |
| GitHub Pages (404) | Creer que un slug inexistente da un 404 limpio | Pages sirve `404.html`, que es el **shell SPA**. El cliente consulta Content por WASM y luego lanza `createError(404)`. Funciona online y es aceptable, pero hay que probarlo |
| GitHub Pages (origen compartido) | Claves de localStorage genéricas | `<user>.github.io` comparte el localStorage entre repos: prefijo por viaje siempre |
| Primer deploy (D-08 diferido) | Asumir que v1.0 ya está en producción | El primer deploy sustituye el `index.html` vivo de golpe: las claves y los enlaces que importan son los de `main` |
| Nuxt Content v3 en navegación cliente | Un `queryCollection` nuevo en la portada o en un componente `client-only` con una clave que no está en el payload | En cliente, Content descarga `__nuxt_content/<col>/sql_dump.txt` y arranca SQLite en WASM (verificado en el bundle). Todo lo que se pinte tiene que venir del payload prerenderizado |
| Nuxt Content v3 (cache) | Editar YAML o el esquema y regenerar sin limpiar | `rm -rf .data .nuxt .output` antes de `generate` y del gate, siempre |
| `@nuxtjs/color-mode` en la portada | Escribir un toggle o un script de tema propio para la portada | El módulo ya cubre `/` y todas las rutas. Reutilizar `ThemeToggle` |
| Google Maps (ruta del día) | `travelmode=walking` para días con ferry o coche | `routeMode` por día y tramos partidos |
| Wikimedia / imágenes de terceros (Campania) | Fichas sin `motif`, con lo que no hay fallback offline | `motif` obligatorio en viajes nuevos, o un motivo por defecto |

## Performance Traps

| Trampa | Síntoma | Prevención | Cuándo rompe |
|--------|---------|------------|--------------|
| La portada llama a `useTrip(slug)` por cada viaje para pintar sus tarjetas | El HTML de `/` incrusta el payload de **todos** los viajes. Cada viaje de Roma ya pesa unos 540 KB de HTML más 1 MB de `_payload.json` | En la portada, consultar solo la colección `trip` con `.select('slug','title','heroMeta',…)`, con una clave `useAsyncData` propia (`trips-index`) | Desde el segundo viaje (unos 2 MB en la portada) |
| Payload por viaje duplicado (HTML inline + `_payload.json`) | Primera carga lenta en móvil sobre el terreno | Medir el tamaño de `trips/*/index.html` en P5. Aceptar que Roma cuesta lo mismo que en v1.0 y vigilar que Campania no crezca sin control (prosa larga, 10 días) | Con conexiones 3G en Cilento o el Vesubio |
| Índice MiniSearch con todas las fichas de todos los viajes | Búsqueda lenta, resultados cruzados y `duplicate ID` si coinciden slugs | Un índice por viaje, construido solo con `monById` de ese viaje | En cuanto dos viajes compartan un slug |
| Barra de pastillas con 10 días + 7 secciones | Scroll horizontal largo en móvil; el scrollspy (+130) salta | Etiquetas cortas por fecha (Pitfall 3). Verificarlo con capturas móviles de Campania | Desde unos 12 días |

## Security Mistakes

| Error | Riesgo | Prevención |
|-------|--------|------------|
| Interpolar `name` o `day` del YAML en el HTML de los popups de Leaflet | Marcado roto. Con contenido aportado por terceros vía PR, inyección de HTML | `escapeHtml` o construcción con nodos DOM. Se mantiene la salida de Roma |
| Redirección legacy construida con `location.hash` sin filtrar | Redirección abierta o inyección si se concatena a mano | Lista blanca de anclas, `location.replace` a una ruta propia y el hash solo como sufijo validado (`^#[a-z0-9-]+$`) |
| Slug de viaje desde la URL usado como clave de almacenamiento o de consulta sin validar | Claves arbitrarias en localStorage; consultas con valores inesperados | El slug solo se acepta si existe en la colección `trip` (guard 404 ya presente en `[slug].vue`) y cumple la regex del esquema |

## UX Pitfalls

| Error | Impacto en el usuario | Mejor enfoque |
|-------|-----------------------|---------------|
| Añadir un enlace visible «← Todos los viajes» al chrome de Roma | Cambia píxeles de Roma: los goldens fallan o, peor, se re-baselinan | Si hace falta, ponerlo en un lugar ya existente que no altere el render de Roma, o aceptarlo como cambio consciente con sign-off. Decidirlo en P3, no improvisarlo |
| La portada redirige automáticamente al último viaje visto | Se pierde el índice y aparecen bucles con la redirección legacy | La portada siempre es la portada. Solo redirigen los hashes legacy |
| Ritmo, light o resumen compartidos entre viajes | Elegir el modo "lento" en Campania (con niños) cambia Roma | Estado y persistencia por viaje (Pitfalls 4 y 5) |
| Opciones A/B que se presentan como dos itinerarios completos uno detrás de otro | El día de Campania se vuelve ilegible paseando | Diseñar la presentación A/B dentro del sistema visual existente (sin rediseño) y decidirlo antes de redactar |
| Días de Campania con huecos del input troceado | La guía "miente" sobre el terreno | Lista de huecos del input en P4 y confirmación con el usuario antes de publicar |

## "Looks Done But Isn't" Checklist

- [ ] **Roma en `/trips/roma`:** comprobar que los 56 goldens pasan **sin** `--update-snapshots` en la nueva URL y que `git diff tests/parity/golden.spec.ts-snapshots/` está vacío.
- [ ] **Conteo de la puerta:** `--list` muestra el subconjunto de Roma (80) **más** los specs nuevos, y `tests/README.md` §4 está actualizado con el desglose.
- [ ] **Portada:** su `<title>` no es «Roma · 19—23 giugno 2026», porque hoy `app.vue` lo fija globalmente.
- [ ] **Campania:** el `<title>`, la marca de la topbar, el footer, la leyenda del mapa y las pastillas salen de `trip.yml`. El test-trampa no encuentra «Roma» ni «Einaudi».
- [ ] **Búsqueda en Campania:** devuelve solo fichas de Campania, y al seleccionar una aparece el `.highlight` y la pila de "Volver".
- [ ] **Enlaces a ficha en Campania:** hacen scroll suave + `.highlight` y no el salto nativo. Es la prueba de que el controller recibe el slug correcto.
- [ ] **Notas:** el test de upgrade desde el `index.html` vivo conserva la nota en la **primera** carga.
- [ ] **Notas por viaje:** una nota en `campania` no aparece en una ficha de Roma que tenga el mismo slug.
- [ ] **Redirección:** `/#viernes`, `/#pantheon` e `/index.html#gastronomia` funcionan, `/` sin hash se queda y Atrás no hace bucle, en mobile y desktop.
- [ ] **Prerender:** existen `.output/public/trips/roma/index.html` y `trips/campania/index.html`. Abrir un viaje **no** pide `sql_dump.txt`.
- [ ] **Offline:** con la red cortada tras la primera carga de un viaje, el banner del mapa, los fallbacks SVG de Campania y las fuentes self-host siguen funcionando.
- [ ] **Datos:** `pnpm test:data` valida **también** Campania: borrar un campo obligatorio de un YAML de Campania pone el test en rojo.
- [ ] **Build limpia:** `pnpm verify` empieza con `rm -rf .data .nuxt .output`.
- [ ] **Navegación SPA:** el test de ida y vuelta portada → Roma → Campania pasa (ritmo, búsqueda y Volver por viaje).

## Recovery Strategies

| Pitfall | Coste de recuperación | Pasos |
|---------|-----------------------|-------|
| Goldens re-baselinados por error | MEDIUM | `git checkout <commit-v1.0> -- tests/parity/golden.spec.ts-snapshots/`, volver a ejecutar la puerta y clasificar cada diff (procedimiento de `diff-classification.md` de F8) |
| Notas perdidas por una migración que borró claves | **HIGH / irrecuperable** en el dispositivo del usuario | Solo se puede prevenir: copiar sin borrar. Si las claves viejas siguen ahí, basta con re-ejecutar la migración tras corregirla. Si se borraron, no hay recuperación |
| Notas "vacías" por el orden de montaje | LOW si no se ha escrito encima | Mover la migración a un plugin cliente. Las claves viejas siguen intactas si se copió sin borrar |
| Estado filtrado entre viajes | LOW | Añadir el slug a las claves `useState`. Las claves de localStorage ya guardadas se corrigen solas en el siguiente cambio |
| Viaje no prerenderizado (cae al shell SPA) | LOW | Añadir el slug a las rutas explícitas. Redeploy |
| Contenido rancio por la cache de Content | LOW | `rm -rf .data .nuxt .output && pnpm generate` |
| Redirección legacy en bucle o sin ancla | LOW–MEDIUM | Cambiar a `location.replace` en un script de head. Los enlaces ya compartidos vuelven a funcionar en cuanto se despliega |

## Pitfall-to-Phase Mapping

| Pitfall | Fase de prevención | Verificación |
|---------|--------------------|--------------|
| 1. Refactor + cambio de URL a la vez | P1 (puerta congelada) → P3 (movimiento puro) | P1: `tests/parity/` sin diff y puerta verde. P3: el diff de los specs de Roma es solo la URL, y los goldens pasan sin update |
| 2. Hardcodes de Roma residuales | P1 | Barrido con grep a cero + test-trampa con un viaje fixture |
| 3. Slugs de día duplicados | P1 (invariante) y P4 | Invariante de unicidad de slugs y de no-colisión con secciones en `tests/data` |
| 4. Migración de `roma-*` | P2 (+ P5) | Test unitario de `tripStorageKey` + test E2E de upgrade desde el `index.html` vivo en el mismo origen |
| 5. Estado global entre viajes | P1 (claves por slug) y P3 (navegación) | Test SPA de ida y vuelta portada ↔ viajes |
| 6. Redirecciones legacy | P3 | Specs de redirección (hash de día, de ficha, `index.html#`, sin hash, Atrás) en ambos proyectos |
| 7. Prerender multi-viaje | P3 (+ P5) | `shell.spec` invertido: cada slug emitido. Ninguna petición a `sql_dump.txt` al abrir un viaje |
| 8. Campania sin validar | P1 (parametrizar tests) y P4 | Mutar un YAML de Campania pone `test:data` en rojo |
| 9. Ampliación del esquema / cache | P1 y P4 | `migration-diff` de Roma verde. Test "cada valor de enum tiene CSS/SVG". `verify` con limpieza previa |
| 10. Mapa multi-ciudad y ruta del día | P1 (parametrización) y P4 | Unit de `routeMode` y de escape. Capturas del mapa de Campania. El mapa de Roma sigue igual (`map-fallback-notes.spec` 12/12) |

## Sources

- Lectura directa del código de `release/nuxt-4` (HIGH): `app/composables/{useTrip,useTripModes,useSearch,useCardNavigation}.ts`, `app/components/{TripView,NavPills,Topbar,LeafletMap.client,MonumentCard,SearchBox}.vue`, `app/app.vue`, `app/pages/{index.vue,trips/[slug].vue}`, `app/utils/{foodGroups,dayRoute,mapMarkers,mapOffline,dayLabel,svgMotifs,tripIndexes}.ts`, `shared/schemas.ts`, `content.config.ts`, `nuxt.config.ts`.
- Build local `.output/public` (HIGH): presencia de `404.html`/`200.html` (shell SPA de 2.361 B), `_payload.json` (~1 MB), `index.html` (~540 KB), `__nuxt_content/<col>/` y referencias del bundle a `__nuxt_content/<col>/sql_dump.txt`.
- `tests/README.md` (puerta: 80 tests en 11 ficheros, 56 goldens, exclusiones D-04, invariante D-01), `tests/parity/*.spec.ts` (`STATIC_URL` duplicado y la aserción `no-trips-dir` en `shell.spec.ts:186`), `tests/data/*.spec.ts` (`ROOT` fijado a Roma y conteos fijos) (HIGH).
- `.planning/milestones/v1.0-MILESTONE-AUDIT.md` (deuda: ranking de MiniSearch, test de dev-routing excluido, D-08 deploy diferido) y `.planning/milestones/v1.0-research/PITFALLS.md` (hidratación con localStorage, subpath, FOUC) (HIGH).
- `.planning/inputs/campania-2027-itinerario-raw.md`: 10 días sáb 19 → lun 28, opciones A/B, ferris y coche, input troceado con días que faltan (HIGH).
- Memoria del proyecto: cache de Content (`rm -rf .data .nuxt .output`), servir bajo `guiaRoma/`, CR-01 de captura de clics, nombres reservados `id`/`meta`, `discriminatedUnion` sin columnas SQL (HIGH, de experiencia del propio proyecto).
- Nuxt Content — Static deploy (https://content.nuxt.com/docs/deploy/static): las consultas en navegación cliente se ejecutan en el navegador con SQLite WASM (MEDIUM; el detalle del dump se confirmó en la build local).
- Nuxt — `<NuxtPage>` (https://nuxt.com/docs/4.x/api/components/nuxt-page): `pageKey` controla el re-render. El valor por defecto (interpolación de params) no está documentado ahí (LOW, del código fuente de Nuxt).
- Semántica de la web (HIGH, estándar): el fragmento no se envía al servidor; en una redirección HTTP sin fragmento en `Location`, el navegador hereda el original (RFC 9110 §10.2.2). `<user>.github.io` es un único origen para todas las *project pages* (same-origin policy).

---
*Pitfalls research for: v1.1 Multi-viaje + Campania (guiaRoma, Nuxt 4 + Nuxt Content v3, GitHub Pages)*
*Researched: 2026-11-20*
