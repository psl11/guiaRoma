# Fase 2: Esquema de datos + migración del contenido — Research

**Researched:** 2026-06-19
**Domain:** Modelado de datos tipados (zod 4 + Nuxt Content v3 `type:'data'` YAML) y migración 1:1 del contenido de Roma desde `index.html`
**Confidence:** HIGH (mecánica de Content v3 verificada contra docs oficiales + lectura directa del código fuente instalado `@nuxt/content@3.14.0`; shapes verificados leyendo `index.html` línea a línea, incl. las secciones de referencia que eran la bandera abierta)

<user_constraints>
## User Constraints (from CONTEXT.md)

> Copiadas verbatim de `02-CONTEXT.md`. El planner DEBE respetarlas. D-01..D-08 están **BLOQUEADAS** — esta investigación rellena el CÓMO, no reabre el QUÉ.

### Locked Decisions

**Heredado y bloqueado por el research del proyecto (no reabrir):**
- **Formato**: híbrido **YAML `type:'data'`** con la prosa como **campos string Markdown-inline** renderizados con `<MDC>`. No Markdown-por-ficha, no JSON crudo a mano.
- **Capa de datos**: **Nuxt Content v3** (`@nuxt/content` 3.14.0) con `defineCollection({ type:'data' })` + esquema **zod 4** (`import { z } from 'zod'`, NO el re-export de `@nuxt/content`).
- **6 colecciones**: `trip`, `day`, `monument`, `food`, `artist`, `reference`; glob `trips/*/…` para multi-viaje.
- **`day.cards: string[]` ordenado** (DATA-03) es la pieza crítica: de él se reproduce la "ruta del día".
- **`pace` ∈ `all` | `medium` | `slow-only`** (DATA-02). **La validación zod rompe el build** ante dato inválido (DATA-05).

- **D-01:** La prosa de `monument` y `artist` se modela como **array ordenado de secciones `{ heading, body }`**, `heading` libre (string) y `body` en Markdown-inline para `<MDC>`. No campos fijos por sección, no un único blob.
- **D-02:** Elementos embebidos **híbrido**: dentro del flujo de prosa → listas (`detail-list`) como Markdown nativo, y `detail-photo` como **componente MDC inline** (`:detail-photo`) en su posición exacta; fuera del flujo (campos tipados) → `hero`, `facts`, enlace Maps, cajas especiales (`sorrentino-box`), `notes` (clave = id).
- **D-03:** `reference` **bespoke por sección**: **reservas** → datos tipados (lista de reservas + tabla "cuándo reservar" con badge/estado `is-done`); **práctica** → prosa Markdown/MDC + listas curadas tipadas (libros/películas/series/playlist).
- **D-04:** **`arquitectura` vive en la colección `artist`**, unificada con arte mediante un **discriminador** (`kind: 'artist' | 'arquitectura'`). Comparten el shape `artist-card`. El **glosario** (`arq-glosario`) entra como entrada/sub-shape especial. → `reference` queda SOLO con reservas + práctica.
- **D-05:** **Un fichero por entidad**: `monuments/<id>.yml`, `food/<id>.yml`, `artists/<id>.yml`; sueltos `trip.yml`, `days/<dia>.yml` (5), `reference/<id>.yml`. El glob por colección los reúne. **Verificar en research la mecánica de Content v3 "1 fichero = 1 documento" con globs anidados.** → *Verificado abajo.*
- **D-06:** Validación en **dos capas**: (1) **zod** valida forma + enums y rompe el build; (2) **test de invariantes (Vitest)** carga todas las colecciones y verifica **ids únicos** + que **cada cross-ref** resuelve. El test corre como puerta en CI/pre-commit. → *Matizado abajo: la capa (1) NO rompe el build por sí sola en Content v3; ver hallazgo crítico.*
- **D-07:** **Harness automático de extracción + diff**: script que extrae prosa+enlaces del `index.html` por id de ficha y los compara (normalizados) contra los datos migrados. Repetible.
- **D-08:** **Criterio de aceptación = equivalencia de texto + enlaces NORMALIZADA** (espacios, entidades HTML, `<em>`/`<strong>` ↔ Markdown). El markup puede cambiar, pero no se pierde ni se añade texto ni enlace. No byte-exacto.

### Claude's Discretion (research/planner deciden; no requieren al usuario)
- Shape exacto del **`timeline` del día**: unión discriminada por `kind` (`stop`/`transport`/`meta`/`food`/`reservation`) + `pace` por fila + "versión ligera" (`dia-ligera`: lg-see/lg-move/lg-skip/lg-rest) + `day-stats` (walk/train/taxi). Modelarlo fiel a `index.html`.
- Cómo se modelan las **agrupaciones de gastronomía** (`gastro-section-title`) — campo `group`/`category` por food o secciones ordenadas.
- Dónde viven los **intros y eyebrows** de sección (`gastro-intro`, `art-intro`, `section-eyebrow`).
- Nombres exactos de campos zod, claves del discriminador, ubicación del script del harness (`scripts/` vs `tests/`).
- Migrar el campo **`type`** (card/guided/concert) desde el array JS `places` al dato del monumento.

### Deferred Ideas (OUT OF SCOPE)
Ninguno. La discusión se mantuvo dentro del alcance de la Fase 2. (Los diferidos de producto — backend/PWA/segundo viaje real — siguen en STATE.md ▸ Deferred Items.)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Descripción | Soporte de la investigación |
|----|-------------|------------------------------|
| **DATA-01** | Esquema de viaje tipado con zod en colecciones de Nuxt Content v3 (trip, day, monument, food, artist, reference) | Esquema final por colección abajo (§Standard Stack / §Code Examples); mecánica `defineCollection({type:'data'})` + globs anidados verificada. |
| **DATA-02** | Timeline de cada día con ORDEN explícito de filas (stop/transport/meta/food…) + `pace` por fila (all/medium/slow-only) | `z.discriminatedUnion('kind', …)` modelado 1:1 desde el HTML (6 kinds); `Pace` enum; matriz pace documentada. |
| **DATA-03** | Cada día declara `cards: string[]` con el orden exacto de sus fichas | `day.cards` = array ordenado de ids de monumento; tabla "orden de fichas por día" derivada del DOM. |
| **DATA-04** | Todo el contenido de Roma migrado 1:1, sin pérdida de texto ni enlaces | Inventario completo de shapes (38 monumentos, 26 gastro, 13 artist-cards, reservas, práctica) + harness de diff (D-07/D-08). |
| **DATA-05** | La validación de esquema falla el build ante dato inválido | **HALLAZGO CRÍTICO**: Content v3 NO valida data-collections contra zod en build (issue nuxt/content#3351). DATA-05 se cumple con un **test de validación zod explícito** (§Validation Architecture), no con el esquema de Content por sí solo. |
| **DATA-06** | La prosa rica se escribe en Markdown-inline y se renderiza con `<MDC>` preservando negritas/enlaces/párrafos | Fase 2 solo produce **strings MDC-ready**; el render (`<MDC :value>` / `ContentRenderer` con `unwrap`) es Fase 4. Sintaxis inline segura confirmada. |
</phase_requirements>

## Summary

La Fase 2 define seis colecciones zod en Nuxt Content v3 (`type:'data'`, YAML, un fichero por entidad) y migra **todo** el contenido de Roma 1:1 desde `index.html`. La mecánica está verificada hasta el nivel del código fuente instalado: cada fichero YAML debe ser **un único objeto** (no un array raíz), los globs anidados `trips/*/monuments/*.yml` funcionan, el campo `id` que Content auto-genera es la ruta-con-colección (`monument/roma/monuments/galleria-sciarra.yml`) y por tanto **NO** sirve como ancla estable — hay que declarar un campo propio (recomendado `slug`) con el id del `index.html` (`galleria-sciarra`).

**Hallazgo de mayor impacto (revisa una suposición de DATA-05/D-06):** Nuxt Content v3 (incl. 3.14.0) **no valida los data-collections contra el esquema zod en build** — está documentado como petición abierta (`nuxt/content#3351`, mayo 2025) y confirmado leyendo el código (`generateCollectionInsert` y el `parse` interno no llaman a `schema.parse()`; los campos fuera del esquema van silenciosamente a `meta`, y `undefined`/`null` se reemplazan por defaults). El esquema zod sí genera tipos TS y tipos de columna SQL, pero **un dato inválido pasa el build sin error**. Por tanto, "la validación rompe el build" (DATA-05) **debe** implementarse como un **test que ejecute `Schema.parse()` sobre cada fichero YAML** (la capa 1 de D-06 reinterpretada), no confiando en Content. Esto refuerza —no contradice— el diseño de dos capas de D-06.

Las secciones de referencia (la bandera abierta del proyecto: `index.html` ~5260-6250) están ahora **leídas y mapeadas** (reservas, gastronomía, práctica, arte, arquitectura+glosario). Aparecen además **dos cross-refs que el sketch previo de ARCHITECTURE.md había pasado por alto**: cada monumento tiene `card-artists` (monumento→artist, p.ej. `#art-bernini`) **y** `card-arch` (monumento→arquitectura, p.ej. `#arq-barroco`), ambos con **múltiples** enlaces y etiqueta de texto libre. Hay que modelarlos para no perder esos enlaces (DATA-04) y para que el test de invariantes los valide.

**Primary recommendation:** Definir las 6 colecciones con un campo `slug` propio (= ancla del HTML) además del `id` auto de Content; modelar el timeline con `z.discriminatedUnion('kind', …)` y la prosa como `sections: [{heading, body}]`; reusar los esquemas (exportados desde un módulo compartido) en un **test de validación + invariantes en Vitest puro** que lee los YAML directamente, ejecuta `.parse()` y resuelve todas las cross-refs — esta es la verdadera "puerta de build" de DATA-05/DATA-06 y debe correr en CI/pre-commit.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Definición del esquema tipado | Database / Storage (`content.config.ts`) | — | Las colecciones zod son el contrato de datos; viven en la raíz, fuera de `app/`. |
| Almacenamiento del contenido | Database / Storage (`content/trips/roma/**`) | — | YAML git-based = fuente de verdad única (Content v3). |
| Validación de forma + enums | Database / Storage (zod en Content) | Build / Test (test de validación) | Content tipa SQL/TS pero NO falla el build → el test es quien hace cumplir DATA-05. |
| Validación de cross-refs (invariantes) | Build / Test (Vitest) | — | Content no resuelve refs; un test puro lee YAML y comprueba que ids existen. |
| Fidelidad 1:1 (texto+enlaces) | Build / Test (harness de diff) | — | Script que compara `index.html` ↔ YAML; ni Content ni zod lo hacen. |
| Render de la prosa (`<MDC>`) | Frontend Server / Client | — | **FUERA DE ALCANCE (Fase 4)**. Fase 2 solo entrega strings MDC-ready. |
| Consumo (búsqueda, ruta, mapa) | API/derivados (composables) | — | **FUERA DE ALCANCE (Fases 6-7)**. El esquema debe *habilitarlos* (campos presentes), no implementarlos. |

## Standard Stack

> El stack está **bloqueado** (CLAUDE.md / STACK.md). Aquí solo se listan las piezas que esta fase **usa o añade**, con versiones verificadas contra el `package.json` del repo y el registro npm (2026-06-19).

### Core (ya instalado / en package.json)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@nuxt/content` | 3.14.0 | Colecciones `type:'data'`, validación de tipos, query | Bloqueado. Verificado en `package.json` y en `node_modules/.pnpm`. |
| `zod` | 4.4.3 | Esquema/validación del modelo + tipos TS | Bloqueado. **`import { z } from 'zod'`** — el re-export de `@nuxt/content` está **deprecado** `[CITED: content.nuxt.com/docs/collections/validators]`. Instalado (verificado). |
| `nuxt` | 4.4.8 | Framework / build / prerender | Bloqueado. Instalado. |

### Supporting (AÑADIR en esta fase — no están en package.json todavía)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | 4.1.9 | Runner del test de validación + invariantes | **No instalado.** `latest` = 4.1.9 `[VERIFIED: npm registry]`. Añadir como devDependency. |
| `@nuxt/test-utils` | 4.0.3 | Puente Nuxt↔Vitest (`defineVitestConfig`) | **No instalado.** `latest` = 4.0.3 `[VERIFIED: npm registry]`. Necesario SOLO si el test usa runtime Nuxt; para el test de validación puro (recomendado) basta `vitest` + `yaml`. |
| `yaml` | (verificar) | Parsear los `.yml` en el test de validación, equivalente al parser interno de Content | Necesario para leer ficheros en el test puro. Content usa front-matter internamente; `yaml.parse()` sobre el cuerpo es equivalente para un objeto plano. Alternativa: `js-yaml`. |

**Ya presente y aprovechable:**
- `@nuxtjs/mdc` **0.22.0** (transitiva de `@nuxt/content`) — provee `<MDC>` / `parseMarkdown` / `ContentRenderer` con prop `unwrap`. **Solo relevante para Fase 4** (render); confirma que D-01/D-02 son ejecutables.
- `better-sqlite3` 12.x (devDep) — conector SQLite build-time de Content. Ya configurado en Fase 1.

**Instalación (lo que esta fase añade):**
```bash
# Asegurar deps de Content/zod instaladas (ya en package.json) + tooling de test:
pnpm install
pnpm add -D vitest@4.1.9 yaml
# @nuxt/test-utils SOLO si se decide un test con runtime Nuxt (no recomendado para validación):
# pnpm add -D @nuxt/test-utils@4.0.3 happy-dom
```

**Version verification (ejecutado 2026-06-19):**
- `@nuxt/test-utils` → latest **4.0.3** (no instalado). `vitest` → latest **4.1.9** (no instalado). `zod` 4.4.3, `nuxt` 4.4.8 instalados; `@nuxt/content` 3.14.0 en `package.json` y pnpm store.

## Package Legitimacy Audit

> Esta fase **no introduce paquetes nuevos del ecosistema general** salvo `vitest` y `yaml` (y opcional `@nuxt/test-utils`), todos canónicos y ya presentes en el stack bloqueado del proyecto. slopcheck no estaba disponible en el entorno de research; las dos adiciones son paquetes de primera línea de millones de descargas, verificados en el registro npm.

| Package | Registry | Age | Downloads | Source Repo | slopcheck | Disposition |
|---------|----------|-----|-----------|-------------|-----------|-------------|
| `vitest` | npm | maduro | ~10M+/sem | github.com/vitest-dev/vitest | n/a (no disponible) | Aprobado — canónico, en STACK.md |
| `@nuxt/test-utils` | npm | maduro | ~300k+/sem | github.com/nuxt/test-utils | n/a | Aprobado (opcional) — oficial Nuxt |
| `yaml` | npm | maduro | ~80M+/sem | github.com/eemeli/yaml | n/a | Aprobado — parser YAML de referencia |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none
*slopcheck no estaba disponible; las tres adiciones son paquetes de primera línea verificados en el registro npm y ya referenciados por el stack del proyecto. Riesgo de slop: despreciable. El planner puede instalar sin checkpoint dado que son dependencias de tooling estándar ya decididas en STACK.md.*

## Architecture Patterns

### System Architecture Diagram (flujo de la Fase 2)

```
index.html (FUENTE 1:1)
   │  (D-07) harness de extracción: parsea el DOM por id de ficha
   │           → texto visible + hrefs (Maps externos + anclas #id)
   ▼
[Migración manual + bootstrap]  ──escribe──▶  content/trips/roma/**.yml
   │                                              │  (un objeto por fichero)
   │                                              ▼
   │                                   content.config.ts  ──define──▶  6 colecciones zod
   │                                              │  (genera tipos TS + columnas SQL;
   │                                              │   NO valida valores — ver hallazgo)
   │                                              ▼
   │                                   @nuxt/content build → SQLite dump (prerender, offline)
   │
   ├─(D-07/D-08) DIFF: índice del harness  ⇄  YAML migrado
   │     → reporta texto/enlaces que falten o sobren (normalizado)
   │
   └─(D-06 capa 1+2) TEST Vitest puro:
         lee content/**.yml  →  yaml.parse()  →  Schema.parse() por colección  ── FALLA si inválido (DATA-05)
                                          └─ recoge ids  →  resuelve cross-refs ── FALLA si una ref no existe
```

El diagrama muestra que **tres** verificaciones distintas operan sobre el mismo origen: (a) diff de fidelidad (texto/enlaces), (b) validación de forma (zod.parse), (c) invariantes (ids únicos + cross-refs). Ninguna la hace Content por sí sola.

### Recommended Project Structure (lo que esta fase crea)
```
content/                                  # RAÍZ (hermano de app/, confirmado Nuxt 4)
└── trips/
    └── roma/
        ├── trip.yml                      # hero, info-grid, "cómo usar", map center/zoom
        ├── days/
        │   ├── viernes.yml               # timeline[] ordenado + cards[] ordenado + dia-ligera + day-stats
        │   ├── sabado.yml
        │   ├── domingo.yml
        │   ├── lunes.yml
        │   └── martes.yml
        ├── monuments/                    # 38 ficheros (1 ficha = 1 fichero)
        │   ├── galleria-sciarra.yml
        │   └── … (fontana-trevi, pantheon, vaticano, coliseo, …)
        ├── food/                         # 26 ficheros
        │   └── g-felice.yml, g-roscioli.yml, …
        ├── artists/                      # 12 ficheros (7 arte + 5 arquitectura edades)  [glosario: ver nota]
        │   ├── art-bernini.yml … art-pozzo.yml          (kind: artist)
        │   └── arq-antigua.yml … arq-moderna.yml        (kind: arquitectura)
        └── reference/                    # 2 ficheros
            ├── reservas.yml
            └── practica.yml

content.config.ts                         # RAÍZ — reemplaza el stub {} de Fase 1: 6 colecciones
shared/schemas.ts          (RECOMENDADO)  # esquemas zod exportados, reusados por config.ts + test
tests/data/                (UBICACIÓN)    # test de validación + invariantes (Vitest puro)
   ├── schema.spec.ts                      # Schema.parse() por fichero → DATA-05
   └── invariants.spec.ts                  # ids únicos + cross-refs resuelven → D-06
scripts/                   (UBICACIÓN)    # harness de extracción + diff 1:1 (D-07/D-08)
   └── migration-diff.ts
vitest.config.ts                          # AÑADIR (no existe): incluir tests/data/**
```

> **Nota sobre el glosario** (D-04): `arq-glosario` es un `artist-card` con shape distinto (lista término→definición, sin `seenIn`). Dos opciones (discreción del planner): (a) un fichero `artists/arq-glosario.yml` con `kind: 'glossary'` y un campo `terms: [{term, def}]` (mantiene "1 colección artist"); (b) campo opcional `glossary` en una entrada arquitectura. **Recomendación: (a)** — un tercer valor de discriminador `kind` (`artist | arquitectura | glossary`) es lo más limpio y deja el `discriminatedUnion` exhaustivo.

### Pattern 1: `id` auto de Content NO es el ancla — declarar `slug` propio
**What:** Content auto-genera `id` = `<colección>/<ruta-con-extensión>` (p.ej. `monument/roma/monuments/galleria-sciarra.yml`) y `stem` = `<ruta-sin-extensión>` (p.ej. `roma/monuments/galleria-sciarra`). Ninguno es el ancla limpia `galleria-sciarra` que la prosa usa en `[texto](#galleria-sciarra)` y que el golden/paridad exige.
**When to use:** Siempre en esta fase. Las cross-refs (`day.cards[]`, `timeline.ref`, `seenIn`, `card-artists`, `card-arch`) apuntan al **ancla**, no al path.
**Example:**
```ts
// Source: lectura directa de @nuxt/content@3.14.0 dist (describeId, generateCollectionInsert)
//   id = join(collection.name, source.prefix||'', filePath)  → "monument/roma/monuments/galleria-sciarra.yml"
// Por eso el esquema declara su PROPIO campo estable:
schema: z.object({
  slug: z.string(),   // 'galleria-sciarra'  (= ancla #id del index.html, = nombre de fichero)
  // … resto de campos
})
// Convención: el nombre de fichero === slug. El test de invariantes verifica esa igualdad
// (basename(stem) === slug) para que el grep de anclas siga resolviendo.
```
**Por qué no usar `id` propio:** `id` es un campo **reservado** que Content sobrescribe `[CITED: content.nuxt.com/docs/collections/types]`. Declarar `id` en el esquema entra en conflicto. Usar `slug` (o `ref`) evita la colisión y deja `queryCollection('monument').where('slug','=',…)` limpio.

### Pattern 2: Timeline como `z.discriminatedUnion('kind', …)` (DATA-02)
**What:** El timeline del día es un array ordenado de 6 tipos de fila, modelado por discriminador `kind`. zod compila el `discriminatedUnion` a JSON-Schema `oneOf` (válido), y Vue luego despacha por `kind` con `<component :is>` (Fase 4).
**When to use:** El timeline de cada `days/<dia>.yml`. Es la estructura más rica del HTML (verificado en `index.html` 2403-2446).
**Example:** ver §Code Examples (esquema completo del timeline, derivado 1:1 del HTML).

### Pattern 3: Prosa por secciones `[{heading, body}]` (D-01)
**What:** Cada `card-section`/`artist-section` del HTML (`<h4>` + cuerpo) → un objeto `{ heading: string, body: string-Markdown }`. El orden del array = orden del DOM. `heading` es libre (cambia entre fichas: "Qué es", "Historia", "Anécdotas", "En qué fijarse", "Quién fue", "Su estilo"…).
**When to use:** `monument.sections` y `artist.sections`.
**Anti-pattern evitado:** campos fijos (`queEs`, `historia`, …) — se rompen porque los encabezados varían por ficha (el sketch de STACK.md/ARCHITECTURE.md usaba campos fijos; **D-01 lo corrige a array**).

### Pattern 4: Validación real fuera de Content (DATA-05)
**What:** Como Content NO falla el build con datos inválidos, el esquema zod se **exporta** (desde `shared/schemas.ts`) y un test Vitest lee cada YAML y ejecuta `Schema.safeParse()`; cualquier fallo → test rojo → CI/pre-commit bloquea. Ese test ES la puerta de build de DATA-05.
**When to use:** Obligatorio. Sin él, DATA-05 no se cumple.

### Anti-Patterns to Avoid
- **Confiar en que el esquema de Content rompe el build:** NO lo hace (`nuxt/content#3351`). Sin el test explícito, un `motif` mal escrito o un campo requerido ausente llega a producción silenciosamente (va a `meta` o se rellena con default).
- **Top-level array en un fichero `type:'data'`:** prohibido. Content lo mete en `body` y avisa (no falla) `[VERIFIED: @nuxt/content dist yaml transformer]`. Un fichero = un objeto.
- **Usar el `id` auto como ancla / declarar `id` propio:** colisiona con el reservado; las anclas se romperían.
- **Campos fijos por sección de prosa:** rompe el 1:1 (los headings varían). Usar array ordenado (D-01).
- **Meter la prosa completa de una ficha dentro del `day.yml`:** rompe la reutilización entre días (Pantheon es "Viernes / Sábado") y mezcla "qué se ve" con "contenido". La ficha vive en `monuments/`, el día solo referencia ids (D-05).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Validar forma + enums de los datos | Validador a mano | **zod 4** (esquema en `shared/schemas.ts`) + `Schema.parse()` en test | zod ya da forma, enums, defaults y tipos TS. Reusar el mismo esquema en config y test. |
| Tipos TS del dominio | Interfaces TS a mano | `z.infer<typeof Schema>` | Los tipos salen gratis del esquema; una sola fuente de verdad. |
| Parsear YAML en el test | Regex/parser propio | `yaml` (`yaml.parse`) o `js-yaml` | Equivalente al parser interno de Content; multiline `|`/`>` soportado. |
| Extraer texto/enlaces del `index.html` (D-07) | Regex frágiles sobre HTML | **`cheerio`** (parser HTML, API jQuery) o `linkedom`/`jsdom` | El HTML tiene anidamiento real (`<em>`/`<strong>`/`<a>` dentro de `<p>`); un parser DOM es robusto y repetible. cheerio es el estándar Node para esto (ligero, sin navegador). |
| Normalizar `<em>`/`<strong>`→Markdown para el diff | Conversor ad-hoc completo | Reglas mínimas dirigidas (`<strong>`↔`**`, `<em>`↔`*`/`_`, colapsar espacios, decode entidades con `he` o `DOMParser`) | El criterio de D-08 es equivalencia normalizada de **texto+enlaces**, no conversión Markdown perfecta. Mantener el normalizador pequeño y testeado. |

**Key insight:** la tentación es construir un validador o un comparador HTML→datos a mano. zod + cheerio + un normalizador mínimo cubren el 100% con superficie de bug muy pequeña. El trabajo real de esta fase es el **modelado fiel** y la **transcripción 1:1**, no la infraestructura.

## Common Pitfalls

### Pitfall 1: Asumir que zod-en-Content rompe el build (DATA-05) — NO lo hace
**What goes wrong:** Se define el esquema, se confía en que un dato inválido (enum erróneo, campo requerido ausente, tipo equivocado) reviente `nuxt build`. **No revienta.** Content tipa SQL/TS pero inserta el dato igual (defaults para `undefined`/`null`, campos desconocidos → `meta`). DATA-05 quedaría sin cumplir y nadie se entera hasta que algo falla en runtime.
**Why it happens:** `nuxt/content#3351` (abierto, mayo 2025): "support data schema validation on build". Confirmado en el código instalado: ni `parse()` ni `generateCollectionInsert()` llaman a `schema.parse()`.
**How to avoid:** Implementar el test de validación (Pattern 4 / §Validation Architecture) que ejecuta `Schema.safeParse()` por fichero y falla CI. Exportar el esquema una sola vez (`shared/schemas.ts`) y reusarlo en `content.config.ts` y en el test.
**Warning signs:** El build pasa con un `motif: 'foo'` inexistente o sin `coords`; en runtime un campo sale `undefined`; un boolean sale `0/1` (issue #2927) en vez de `true/false`.

### Pitfall 2: `card-artists` y `card-arch` (cross-refs monumento→artista/arquitectura) se pierden
**What goes wrong:** El sketch previo (ARCHITECTURE.md) solo modelaba `archLink` (singular). El HTML real tiene **DOS** bloques por ficha: `card-artists` (Artistas: `#art-*`, p.ej. Bernini+Borromini) y `card-arch` (Arquitectura: `#arq-*`, p.ej. Renacimiento+Barroco), **ambos con múltiples enlaces** y etiqueta libre (a veces con nota parentética en `<span>`). Si se modela uno solo o singular, se pierden enlaces → falla DATA-04 y el test de invariantes no los cubre.
**Why it happens:** Esas líneas (`card-artists`/`card-arch`) están justo bajo el `card-header`, fáciles de pasar por alto al leer solo el ejemplo del primer card (que no las tiene).
**How to avoid:** Modelar `monument.artists: [{ ref, label }]` y `monument.arch: [{ ref, label }]` (ambos arrays, opcionales, con nota opcional). El test de invariantes resuelve `artists[].ref`→artist(kind:artist) y `arch[].ref`→artist(kind:arquitectura).
**Warning signs:** Un grep de `card-artists`/`card-arch` en `index.html` da ~10 y ~9 ocurrencias respectivamente que no aparecen en el YAML migrado.

### Pitfall 3: El orden de `day.cards[]` se toma del array `places` (¡incorrecto!)
**What goes wrong:** Se rellena `day.cards` con el orden del array JS `places`. Pero `places` está en orden de numeral romano (con saltos: `minerva`=XXXV y `san-luigi`=XXXVI aparecen entre los del lunes), **no** en orden de visita. La ruta del día (Fase 6) saldría desordenada.
**Why it happens:** `places` parece "la lista canónica", pero el orden real de la ruta es el de aparición de las `article.card` dentro de la `<section>` del día en el DOM (hallazgo #2 de ARCHITECTURE.md).
**How to avoid:** `day.cards[]` = ids en el **orden en que las `article.card` aparecen maquetadas** en la sección del día del `index.html`. Verificar día por día leyendo el orden del DOM (no `places`). El `pantheon` puede ir en `cards` de viernes y/o sábado.
**Warning signs:** El orden de `cards` coincide con los numerales romanos en vez del orden visual de la sección.

### Pitfall 4: La prosa pierde enlaces internos o cambia texto al transcribir (D-08)
**What goes wrong:** Al pasar `<p>…<a href="#g-fortunata">Osteria da Fortunata</a>…</p>` a Markdown inline, se omite un enlace, se cambia una comilla tipográfica, o se "normaliza" un guión largo. Falla el criterio de equivalencia de D-08.
**Why it happens:** Transcripción manual de ~64 fichas con prosa densa y muchos `#id`.
**How to avoid:** El harness de diff (D-07) es la red: extrae los `href` y el texto visible del HTML por id y los compara contra el YAML normalizado. Convertir `<a href="#x">t</a>` → `[t](#x)` y `<a href="https…">t</a>` → `[t](https…)`. Los enlaces externos conservan `target=_blank rel=noopener` en el render (Fase 4), pero el dato solo guarda el Markdown.
**Warning signs:** El diff reporta hrefs "que faltan" o texto "que sobra/falta" tras normalizar.

### Pitfall 5: `detail-photo` colocada fuera de su posición exacta en la prosa (D-02)
**What goes wrong:** En "En qué fijarse" la `detail-photo` va **ANTES** de la `detail-list` (verificado en `index.html` 2479-2489). Si se modela como campo de ficha suelto en vez de inline en su sección, se pierde la posición y el orden visual cambia.
**Why it happens:** Es tentador sacar todas las imágenes a un campo `photos[]`.
**How to avoid:** D-02 manda: la `detail-photo` va **dentro del `body`** de su sección como componente MDC inline (`:detail-photo{src=… alt=… caption=…}`) en su posición exacta. El `hero` sí es campo de ficha (fuera del flujo). Distinguir hero (sustituye contenedor) de detail (sustituye img, conserva caption) — pero eso es lógica de Fase 4; aquí solo se preserva la posición y los datos (src/alt/caption + motif para el fallback).
**Warning signs:** En el render (Fase 4) la foto de detalle aparece tras la lista, o el caption desaparece.

### Pitfall 6: zod `superRefine`/`.refine()` no se enforce en Content, y tampoco en SQL
**What goes wrong:** Se añade un `.refine(data => crossRefExists(data))` esperando que valide cross-refs en build. Content convierte el esquema a **JSON-Schema Draft-07** `[CITED: content.nuxt.com/docs/collections/validators]`, que **descarta refinements**. Y aunque el test haga `.parse()`, un refinement con lógica entre-ficheros no tiene contexto de las otras colecciones.
**Why it happens:** Parece natural meter la validación de refs en zod.
**How to avoid:** Mantener zod para forma+enums por-ficha (lo que JSON-Schema expresa). Las **cross-refs entre ficheros** van en el test de invariantes (D-06 capa 2), que carga TODAS las colecciones y resuelve ids — es el único sitio con visión global. No mezclar.
**Warning signs:** Un `.refine()` que "debería" haber fallado pasa el build.

## Code Examples

> Esquemas derivados 1:1 de la lectura de `index.html`. Verificados contra la API de Content v3 (`type:'data'`, globs anidados, campo reservado `id`). El planner ajusta nombres de campo (discreción D); estos reflejan el HTML real.

### Sub-esquemas reutilizables
```ts
// shared/schemas.ts  (exportado; reusado por content.config.ts Y por el test de validación)
// Source: index.html + content.nuxt.com/docs/collections/validators
import { z } from 'zod'   // NO desde @nuxt/content (re-export deprecado)

export const Coords = z.object({ lat: z.number(), lng: z.number() })
export const Fact   = z.object({ label: z.string(), value: z.string() })   // .facts-row
export const Md     = z.string()   // Markdown-inline (render con <MDC> en Fase 4)
export const Link   = z.object({ ref: z.string(), label: Md, note: Md.optional() }) // #id + texto (+nota)

// 19 motifs (CARD_TO_MOTIF, index.html línea 2213). Un enum → motif inválido = test rojo.
export const Motif = z.enum([
  'dome','pantheon','arch','fountain','obelisk','statue','painting','church',
  'fortress','temple','garden','keyhole','mask','monument','rooftops','library',
  'tower','stairs','coffee',
])
export const Pace = z.enum(['all','medium','slow-only'])           // data-pace por fila
export const PlaceType = z.enum(['card','guided','concert'])        // de places[] (★/♪/romano)
```

### Monument (.card) — incluye los cross-refs que faltaban
```ts
// Source: index.html 2450-2576 (card completo: header, card-artists, card-arch, hero,
//   card-section×N, detail-photo/detail-list, facts, maps-link, sorrentino-box/culture-box, notes)
export const MonumentSchema = z.object({
  slug: z.string(),                 // 'galleria-sciarra' (= ancla #id = nombre fichero). NO usar `id`.
  trip: z.string(),                 // 'roma'
  roman: z.string(),                // 'I' | '★' | '♪'  (card-roman; de places[].n)
  name: z.string(),                 // 'Galleria Sciarra'
  italian: z.string(),              // 'Galleria Sciarra · Rione Trevi' (card-italian)
  day: z.string(),                  // 'Viernes' | 'Viernes / Sábado'  (texto popup; de places[].day)
  coords: Coords,                   // de places[]
  type: PlaceType,                  // de places[]  (no hay clase CSS; solo vivía en JS)
  motif: Motif,                     // de CARD_TO_MOTIF (fallback SVG)
  badge: z.string().optional(),     // card-badge: 'Sorrentino' | 'Caravaggio' | 'guiado' | 'concierto'
  artists: z.array(Link).optional(),// card-artists → #art-*  (MÚLTIPLES; ej. Bernini+Borromini)
  arch: z.array(Link).optional(),   // card-arch    → #arq-*  (MÚLTIPLES; ej. Renacimiento+Barroco)
  hero: z.object({ src: z.string(), alt: z.string() }), // src es URL de tercero (Wikimedia) → NO .url() estricto si hay rarezas; validar string
  sections: z.array(z.object({      // D-01: orden EXACTO del DOM; heading libre
    heading: z.string(),            // 'Qué es' | 'Historia' | 'Anécdotas' | 'En qué fijarse' | …
    body: Md,                       // Markdown-inline; detail-list (→ '- …') y :detail-photo embebidos (D-02)
  })),
  facts: z.array(Fact),             // .facts
  mapsQuery: z.string(),            // texto del query de .maps-link (Google Maps search)
  sorrentino: z.object({ label: z.string(), text: Md }).optional(), // .sorrentino-box (label + texto)
  culture: z.array(z.object({ title: z.string(), text: Md })).optional(), // .culture-box (ref-title + prosa)
})
```

### Day (.section del día) — timeline discriminado + cards ordenado
```ts
// Source: index.html 2375-2446 (viernes a fondo): day-header, day-stats, dia-ligera, timeline×6 kinds, cards-list
export const TransportMode = z.object({          // .tl-transport-mode
  icon: z.string(),                               // '🚕' '🚆' 'Ⓜ️' '🚶'
  recommended: z.boolean().default(false),        // .recommended
  desc: Md,                                       // con <strong>/<em>
  tag: z.string().optional(),                     // .tl-transport-mode-tag 'recomendado'
  meta: Md.optional(),                            // .tl-transport-mode-meta '⏱ 45-55 min · 💶 €55'
})
export const FoodEntry = z.object({               // .tl-food-item
  ref: z.string().optional(),                     // id ficha gastro ('g-roscioli') → ancla
  href: z.string().optional(),                    // o URL Maps si no hay ficha (cafés sueltos)
  name: z.string(),
  reserved: z.boolean().default(false),           // .tl-food-item.reserved
  badge: z.string().optional(),                   // .tl-resv-badge '✓ reservado 22:30'
  time: z.string().optional(),                    // .tl-food-time '🚶 3 min'
  desc: Md,
})
export const TimelineRow = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('stop'),               // .tl-item
    pace: Pace.default('all'), time: z.string(), title: z.string(),
    ref: z.string().optional(),                     // a.tl-title href="#id"
    disabled: z.boolean().default(false),           // .tl-title.disabled (llegada/check-in)
    reservedEvent: z.boolean().default(false),      // .tl-item.reserved-event (cena)
    tag: z.string().optional(),                     // .tl-tag 'Sorrentino'|'reservado'|'opcional'|'partido'|'alternativa'|'guiado'|'Caravaggio'
    note: Md.optional(),                            // .tl-note
  }),
  z.object({ kind: z.literal('transport'),          // .tl-transport [taxi|walk|train]
    pace: Pace.default('all'),
    variant: z.enum(['taxi','walk','train']).optional(),
    header: z.string(), modes: z.array(TransportMode), footnote: Md.optional(),
  }),
  z.object({ kind: z.literal('meta'),               // .tl-meta (sin data-pace → siempre visible salvo resumen)
    items: z.array(z.object({
      level: z.enum(['ok','warn','plain']).default('plain'),  // .tl-meta-item.ok/.warn
      text: Md,
    })),
  }),
  z.object({ kind: z.literal('food'),               // .tl-food
    pace: Pace.default('all'),
    header: z.string(), entries: z.array(FoodEntry), footnote: Md.optional(),
  }),
  z.object({ kind: z.literal('reservation'),        // .tl-resv-meta (banda verde)
    text: Md,
  }),
])
export const DaySchema = z.object({
  slug: z.string(),                 // 'viernes'
  trip: z.string(), order: z.number(),  // 1..5
  roman: z.string(),                // 'I' (day-number)
  eyebrow: z.string(),              // 'venerdì · 19 giugno' (section-eyebrow del día)
  title: z.string(),               // 'Centro Storico nocturno'
  subtitle: z.string(),            // .day-subtitle
  stats: z.array(z.object({        // .day-stats-item walk|train|taxi
    variant: z.enum(['walk','train','taxi','metro']), text: Md,
  })),
  light: z.object({                // .dia-ligera (Versión ligera)
    title: z.string(),
    items: z.array(z.object({
      kind: z.enum(['see','move','skip','rest']),   // lg-see/lg-move/lg-skip/lg-rest
      text: Md,
    })),
  }).optional(),
  timeline: z.array(TimelineRow),  // ORDEN EXPLÍCITO (DATA-02)
  cards: z.array(z.string()),      // ORDEN EXPLÍCITO de ids de monumento (DATA-03) — orden del DOM, no de places
})
```

### Food, Artist (con discriminador), Reference, Trip
```ts
// FOOD (.gastro-card) — Source: index.html 5346-5818 (26 cards; 7 gastro-section-title)
export const FoodSchema = z.object({
  slug: z.string(),                 // 'g-felice' (las 5 sin id necesitan slug generado: giolitti, venchi, sant-eustachio, pompi, linari)
  trip: z.string(),
  group: z.string(),                // 'Pasta clásica · trattorias históricas' | 'Quinto quarto …' | 'Pizza' | 'Gelato' | … (gastro-section-title; ORDENA la sección)
  groupIntro: Md.optional(),        // gastro-intro de algunos grupos (quinto quarto, ghetto) — opcional
  badge: z.string(),                // 'trattoria' | 'salumeria + cucina' | 'quinto quarto' | 'pizzeria' | 'gelateria' | 'caffè storico' | …  (texto libre del badge)
  badgeKind: z.enum(['trattoria','deli','quinto','ghetto','pizza','gelato','caffe','pasticceria']), // clase CSS badge-*
  name: z.string(), address: z.string(),
  desc: Md,                         // gastro-card-desc
  plato: Md.optional(),             // gastro-plato 'Plato estrella: …'
  footer: z.string(),               // horario + precio (texto del span del footer)
  itineraryTag: z.string().optional(), // gastro-itinerary-tag 'cerca Campo de' Fiori'
  mapsQuery: z.string(),            // query del gastro-maps-link
})

// ARTIST + ARQUITECTURA + GLOSARIO unificados por `kind` (D-04)
// Source: arte 5948-6099 (7 art-*), arquitectura 6111-6199 (5 arq-* edades), glosario 6202-6221 (10 arch-term)
export const ArtistSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('artist'),             // .artist-card art-*
    slug: z.string(), trip: z.string(),             // 'art-bernini'
    avatar: z.string(),                             // .artist-avatar 'B'
    name: z.string(),
    dates: z.string(),                              // 'Nápoles 1598 – Roma 1680 · escultor · arquitecto'
    epithet: z.string(),                            // .artist-epithet «…»
    sections: z.array(z.object({ heading: z.string(), body: Md })), // Quién fue/Su estilo/Obras maestras/… (orden DOM)
    seenIn: z.array(Link),                          // .artist-trip ✦ 'Lo verás en este viaje' → #monumento (con notas/texto libre)
  }),
  z.object({ kind: z.literal('arquitectura'),       // .artist-card arq-* (edades)
    slug: z.string(), trip: z.string(),             // 'arq-barroco'
    avatar: z.string(),                             // 'IV'
    name: z.string(),                               // 'Barroco'
    dates: z.string(),                              // 's. XVII · el edificio como espectáculo' (reusa artist-dates)
    epithet: z.string(),
    sections: z.array(z.object({ heading: z.string(), body: Md })), // Qué la define/En qué fijarse/Por qué importa
    seenIn: z.array(Link),                          // ✦ 'Dónde la verás' → #monumento
    archLink: z.array(Link).optional(),             // en el cuerpo: Barroco enlaza #art-bernini/#art-borromini (texto, no campo aparte; ver nota)
  }),
  z.object({ kind: z.literal('glossary'),           // .artist-card arq-glosario (especial)
    slug: z.literal('arq-glosario'), trip: z.string(),
    avatar: z.string(),                             // '?'
    name: z.string(),                               // 'Glosario · leer un edificio'
    dates: z.string(), epithet: z.string(),
    terms: z.array(z.object({ term: z.string(), def: Md })), // 10 arch-term: <b>término</b><span>def con <em></span>
  }),
])

// REFERENCE — solo reservas + practica (D-03/D-04)
// Source: reservas 5260-5333, practica 5825-5938
export const ReservasSchema = z.object({
  slug: z.literal('reservas'), trip: z.string(), order: z.number(),
  title: z.string(), eyebrow: z.string(), intro: Md,            // section-eyebrow + section-title + gastro-intro
  confirmed: z.array(z.object({                                  // reservas-confirmadas (2 sub-listas: mesas + visitas)
    group: z.enum(['mesas','visitas']),
    when: z.string(),                                            // rc-when 'Vie 19 · 22:30'
    text: Md,                                                    // resto del <li> con <a>/<em>/<strong>
  })),
  table: z.array(z.object({                                      // reservas-table 'cuándo reservar'
    ref: z.string().optional(),                                  // a #g-* | #galleria-borghese (algunas filas sin ref: 'Otello', 'Sin reserva')
    name: z.string(),                                            // texto del enlace o título
    badge: z.string(),                                           // reservas-badge texto 'semanas antes'|'✓ reservado · …'|'recomendable'|'sin hueco'
    badgeKind: z.enum(['urgent','done','rec']),                  // badge-urgent | badge-done | badge-rec
    isDone: z.boolean().default(false),                          // tr.is-done
    desc: Md,                                                    // 2ª celda
  })),
})
export const PracticaSchema = z.object({
  slug: z.literal('practica'), trip: z.string(), order: z.number(),
  title: z.string(), eyebrow: z.string(), intro: Md,
  sections: z.array(z.object({                                   // h4 + (p | detail-list)
    heading: z.string(),                                         // 'Calor de junio'|'Los nasoni'|'Cómo pedir un café…'|'Transporte'|…
    body: Md,                                                    // párrafos y/o '- …' de detail-list (Markdown)
  })),
  media: z.array(z.object({                                      // 'Lecturas y visionados': libros/pelis/series/playlist
    category: z.enum(['libros','peliculas','series','playlist']),
    items: z.array(Md),                                          // cada <li> como Markdown-inline (título <em>/<strong> + año + desc)
  })),
})
export const ReferenceSchema = z.union([ReservasSchema, PracticaSchema]) // 2 ficheros; o discriminatedUnion por slug

// TRIP — Source: index.html 2283-2357 (hero, info-grid, cómo usar) + map setView
export const TripSchema = z.object({
  slug: z.string(),                 // 'roma'
  title: z.string(),                // 'Cinque giorni a Roma' (con <em> en h1)
  decoration: z.string(),           // hero-decoration '·  ROMA AETERNA  ·'
  meta: z.string(),                 // hero-meta '19 — 23 giugno 2026 · Hotel Royal Court'
  quote: z.string(), quoteAttr: z.string(),  // hero-quote + attr '— FEDERICO FELLINI'
  infoCards: z.array(z.object({ label: z.string(), value: Md })), // info-grid (label + value con <strong>/<br>)
  howTo: z.array(Md),               // 'Cómo usar esta guía' (2 párrafos)
  map: z.object({ center: Coords, zoom: z.number() }), // setView([41.8989,12.477],14)
})
```

### content.config.ts (reemplaza el stub {})
```ts
// Source: content.nuxt.com/docs/collections/define + globs anidados verificados
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { MonumentSchema, DaySchema, FoodSchema, ArtistSchema, ReferenceSchema, TripSchema } from './shared/schemas'

export default defineContentConfig({
  collections: {
    trip:      defineCollection({ type: 'data', source: 'trips/*/trip.yml',            schema: TripSchema }),
    day:       defineCollection({ type: 'data', source: 'trips/*/days/*.yml',          schema: DaySchema }),
    monument:  defineCollection({ type: 'data', source: 'trips/*/monuments/*.yml',     schema: MonumentSchema }),
    food:      defineCollection({ type: 'data', source: 'trips/*/food/*.yml',          schema: FoodSchema }),
    artist:    defineCollection({ type: 'data', source: 'trips/*/artists/*.yml',       schema: ArtistSchema }),
    reference: defineCollection({ type: 'data', source: 'trips/*/reference/*.yml',     schema: ReferenceSchema }),
  },
})
// NOTA: el glob anidado 'trips/*/monuments/*.yml' funciona ('**' y '*' soportados,
//   verificado en docs y en el transformer instalado). Cada fichero = 1 documento.
//   Multi-viaje = crear content/trips/florencia/ con los mismos ficheros (cero código).
```

### Ejemplo de fichero YAML migrado (prosa multilínea legible)
```yaml
# content/trips/roma/monuments/galleria-sciarra.yml   (UN objeto, NO un array raíz)
slug: galleria-sciarra
trip: roma
roman: 'I'
name: Galleria Sciarra
italian: 'Galleria Sciarra · Rione Trevi'
day: Viernes
coords: { lat: 41.8999403, lng: 12.4820553 }
type: card
motif: arch
badge: Sorrentino
hero:
  src: https://turismoroma.it/sites/default/files/Galleria%20Sciarra.jpg
  alt: Galleria Sciarra
sections:
  - heading: Qué es
    body: >
      Un patio cubierto de hierro y cristal en pleno centro, escondido entre dos
      calles, completamente decorado con frescos Liberty. Casi nadie sabe que existe.
  - heading: En qué fijarse
    body: |
      :detail-photo{src="https://upload.wikimedia.org/…/800px-Galleria_Sciarra.jpg" alt="Interior de la Galleria Sciarra, Roma" caption="El interior: bóveda de hierro forjado y cristal…"}

      - El **techo de hierro y cristal**: filtra una luz cenital teatral.
      - Las **cuatro virtudes**: _Pudica, Forte, Umile, Prudente_.
facts:
  - { label: Horario crítico, value: 'L-V 9:00-20:00 · cerrada finde' }
  - { label: Acceso, value: Gratuito }
mapsQuery: Galleria Sciarra Roma
sorrentino:
  label: La Grande Bellezza
  text: >
    Aparece en un travelling fugaz hacia el minuto 0:45 de la película.
```

## Runtime State Inventory

> Fase de creación de datos + esquema (no rename/refactor de estado en ejecución). No aplica un inventario de estado runtime al uso. Se anota lo análogo: estado/artefactos que esta fase toca.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **Ninguno migrado de un datastore.** El "dato" hoy vive en el HTML (DOM/JS `places`), no en una base de datos. Content genera un dump SQLite en build (efímero, no versionado). | Crear los YAML; el SQLite se regenera en cada build. |
| Live service config | Ninguno. | — |
| OS-registered state | Ninguno. | — |
| Secrets/env vars | Ninguno nuevo. | — |
| Build artifacts / installed packages | `@nuxt/content`/`zod` ya en package.json pero deps no totalmente instaladas; `vitest`/`yaml` faltan. `content.config.ts` es stub `{}`. | `pnpm install` + añadir `vitest`+`yaml`; reemplazar el stub. |

**Ids estables (continuidad):** los `slug` DEBEN ser los anclas del `index.html` (`#galleria-sciarra`, `#g-felice`, `#art-bernini`, `#arq-barroco`) para que (a) los enlaces internos de la prosa sigan resolviendo y (b) las claves `localStorage` de notas (`roma-note-<id>`, Fase 7) coincidan con las de usuarios actuales. Verificado: el campo reservado `id` de Content NO sirve para esto → usar `slug`.

## Validation Architecture

> `workflow.nyquist_validation` no está explícitamente en `false` → sección incluida. Esta fase ES, en buena parte, infraestructura de validación (D-05/D-06/D-07/D-08).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | **Vitest 4.1.9** (no instalado — añadir). Para el test de validación/invariantes **NO se necesita** `@nuxt/test-utils` ni runtime Nuxt: es un test Node puro que lee ficheros. |
| Config file | `vitest.config.ts` — **no existe**; crear (Wave 0). Incluir `tests/data/**`. |
| Quick run command | `pnpm vitest run tests/data` |
| Full suite command | `pnpm vitest run` (datos) + `pnpm exec playwright test` (paridad, Fase 8) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | Las 6 colecciones tipadas existen y `nuxt build` genera tipos | typecheck/build | `pnpm exec nuxt build` (no debe romper por tipos) | ❌ Wave 0 |
| DATA-02 | Cada `day.timeline` valida contra el discriminatedUnion + cada fila tiene `pace` válido | unit | `pnpm vitest run tests/data/schema.spec.ts` | ❌ Wave 0 |
| DATA-03 | Cada `day.cards[]` es array de strings y resuelve a monumentos existentes (orden visual) | unit | `pnpm vitest run tests/data/invariants.spec.ts` | ❌ Wave 0 |
| DATA-04 | Texto+enlaces de cada ficha del HTML == YAML migrado (normalizado) | integration | `pnpm vitest run tests/data/migration-diff.spec.ts` (usa el harness D-07) | ❌ Wave 0 |
| DATA-05 | Un dato inválido (enum/required/tipo) **falla** | unit | `pnpm vitest run tests/data/schema.spec.ts` (Schema.safeParse por fichero) | ❌ Wave 0 |
| DATA-06 | La prosa es Markdown-inline parseable (negritas/cursiva/enlaces/párrafos) | unit | `tests/data/schema.spec.ts` (campos `Md` son string; opcional: parseMarkdown sin throw) | ❌ Wave 0 |

**Cómo se observa cada criterio del ROADMAP (SC#1-4):**
- **SC#1** (6 colecciones, fichero-por-entidad, glob multi-viaje): el build genera los 6 tipos + el test cuenta ficheros (38 monuments, 26 food, 13 artist-cards, 5 days, 2 reference, 1 trip) y valida que cada `slug` == basename del fichero.
- **SC#2** (timeline ordenado con kind+pace; cards ordenado): `schema.spec` valida el discriminatedUnion y que cada fila tenga `pace`∈enum; `invariants.spec` valida que `cards[]` resuelva en orden.
- **SC#3** (todo Roma migrado 1:1, prosa MDC-ready, motif por monumento): `migration-diff.spec` (texto+enlaces) + `schema.spec` (motif enum presente en los 38).
- **SC#4** (validación FALLA build ante dato inválido; invariantes: ids únicos + cross-refs resuelven): `schema.spec` (parse falla) + `invariants.spec` (Set de slugs sin duplicados; `day.cards`/`timeline.ref`/`artists`/`arch`/`seenIn`/`archLink`/reservas.table.ref resuelven).

### Patrón recomendado del test (Node puro — la VERDADERA puerta de DATA-05)
```ts
// tests/data/schema.spec.ts  (Vitest puro; sin Nuxt runtime, sin SQLite)
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { globSync } from 'node:fs'          // o fast-glob
import { parse as parseYaml } from 'yaml'
import { MonumentSchema /* … */ } from '../../shared/schemas'

const files = globSync('content/trips/roma/monuments/*.yml')
describe('monument schema', () => {
  for (const f of files) {
    it(`valida ${f}`, () => {
      const data = parseYaml(readFileSync(f, 'utf8'))
      const r = MonumentSchema.safeParse(data)
      expect(r.success, r.success ? '' : JSON.stringify(r.error.issues)).toBe(true)
    })
  }
})
// invariants.spec.ts: cargar TODAS las colecciones, construir Set<slug>, y para cada
//   day.cards[], timeline[kind=stop|food].ref, artist.seenIn[].ref, monument.artists/arch[].ref,
//   reservas.table[].ref → expect(allSlugs.has(ref)).toBe(true)
```
**Por qué Node puro y no `queryCollection`:** (1) Content **no** valida valores → `queryCollection` devolvería datos ya "limpiados" (defaults/meta), ocultando los fallos que DATA-05 debe atrapar. (2) Evita arrancar runtime Nuxt/SQLite en el test (`@nuxt/test-utils` advierte de entornos híbridos). (3) Rápido y determinista en CI/pre-commit. El esquema se exporta una vez y lo comparten `content.config.ts` y el test → una sola fuente de verdad.

### Wave 0 Gaps
- [ ] `vitest.config.ts` — crear; incluir `tests/data/**`.
- [ ] Añadir devDeps: `vitest@4.1.9`, `yaml` (y `fast-glob` si se prefiere a `fs.globSync`).
- [ ] `shared/schemas.ts` — esquemas zod exportados (fuente única).
- [ ] `tests/data/schema.spec.ts` — Schema.safeParse por fichero (DATA-05/DATA-02/DATA-06).
- [ ] `tests/data/invariants.spec.ts` — ids únicos + cross-refs (D-06 capa 2 / SC#4).
- [ ] `scripts/migration-diff.ts` + `tests/data/migration-diff.spec.ts` — harness D-07/D-08 (cheerio + normalizador).
- [ ] Comando de validación en CI/pre-commit (`pnpm vitest run tests/data`).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node + pnpm | Todo | ✓ (proyecto Nuxt activo) | — | — |
| `@nuxt/content` | Esquema/colecciones | ⚠️ en package.json, **no instalado en node_modules** | 3.14.0 | `pnpm install` |
| `zod` | Esquema | ✓ instalado | 4.4.3 | — |
| `vitest` | Test validación/invariantes | ✗ no en package.json | 4.1.9 (latest) | Añadir devDep |
| `yaml` | Leer YAML en el test/harness | ✗ | latest | `js-yaml` |
| `cheerio` (o jsdom/linkedom) | Harness de extracción D-07 | ✗ | latest | jsdom (más pesado) |

**Missing dependencies with no fallback:** ninguno bloqueante (todo se resuelve con `pnpm add`).
**Missing dependencies with fallback:** `vitest`/`yaml`/`cheerio` — añadir; alternativas listadas.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Content v2: `queryContent()`, frontmatter Markdown | Content v3: `defineCollection` + `queryCollection` + colecciones tipadas | v3 (2024) | Toda la fase usa la API v3. `z` desde `zod`, no desde `@nuxt/content` (deprecado). |
| Esperar que el esquema de Content valide datos | **No valida data-collections en build** (issue #3351 abierto) | Estado actual 3.14.0 | Hay que validar con un test propio. **Cambia cómo se cumple DATA-05.** |
| zod 3 + `zod-to-json-schema` externo | zod 4 con JSON-Schema nativo | zod 4 | Sin dependencia extra; pero refinements se pierden al convertir a Draft-07. |

**Deprecated/outdated:**
- `import { z } from '@nuxt/content'` — **deprecado**, se eliminará. Usar `import { z } from 'zod'`.
- Modelo de campos fijos por sección de prosa (sketch de STACK.md/ARCHITECTURE.md) — **superado por D-01** (array `[{heading, body}]`).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | El `id` auto de Content para un fichero data es `<colección>/<ruta-con-ext>` (p.ej. `monument/roma/monuments/galleria-sciarra.yml`) | Pattern 1 | Bajo — derivado del código fuente (`describeId`+`join(collection.name,…)`); si difiere, la recomendación de usar `slug` propio sigue siendo correcta (más segura aún). |
| A2 | `yaml.parse()` produce el mismo objeto que el transformer interno de Content para un objeto plano multilínea | Validation Arch | Bajo — Content usa front-matter (gray-matter) sobre el cuerpo; para un objeto YAML estándar es equivalente. Mitigación: el test parsea igual que se escribe. |
| A3 | `cheerio` es adecuado para el harness D-07 (extraer texto+href por id) | Don't Hand-Roll | Bajo — estándar Node; alternativa jsdom/linkedom si hace falta layout. No se verificó instalación. |
| A4 | El conteo de entidades (38 monuments, 26 food, 13 artist-cards = 7 art + 5 arq + 1 glosario, 10 arch-term, 7 grupos gastro) es exhaustivo | varias | Medio — verificado por `grep -c` sobre `index.html`; si hay cards comentadas/ocultas el harness D-07 las detectará por diferencia. |
| A5 | Las 5 gastro-cards SIN `id` (Giolitti, Venchi, Sant'Eustachio, Pompi, Linari) necesitan un `slug` generado para ser referenciables | FoodSchema | Bajo — algunas se referencian desde el timeline por URL Maps, no por ancla; pero darles slug estable es lo correcto para búsqueda/consistencia. El planner fija la convención. |

**Si esta tabla parece corta:** las decisiones de stack/forma están bloqueadas y verificadas; las asunciones restantes son de detalle de implementación, todas de riesgo bajo-medio y cubiertas por los tests.

## Open Questions (RESOLVED)

> **Estado: las 3 resueltas** por decisiones ya fijadas en los planes de la Fase 2 (nota de resolución por ítem):
> - **Q1 (`slug` vs `id`/`stem`) → RESOLVED:** se usa un campo **`slug`** (== ancla del `index.html`) en todas las colecciones; el esquema lo define en `shared/schemas.ts` (Plan 02-01) y Plan 02-03 lo verifica (`grep -q "slug: roma"`). Se confirma con `pnpm typecheck`/build en 02-01.
> - **Q2 (`archLink` como campo vs inline) → RESOLVED:** se deja **inline en el `body`** (es prosa) y el `invariants.spec` escanea los `(#…)` de todos los campos `Md` para validar TODAS las anclas internas (Plan 02-07 + 02-01).
> - **Q3 (`reference`: `z.union` vs `blocks`) → RESOLVED:** **dos esquemas** (`ReservasSchema` + `PracticaSchema`) unidos por `z.union`/`z.discriminatedUnion('slug', …)` (Plan 02-01 T2), no un `blocks` genérico.

1. **¿`slug` o `id`-propio o confiar en `stem`?**
   - Qué sabemos: `id` reservado (colisiona), `stem` = ruta-sin-ext (no es el ancla limpia).
   - Qué falta: confirmar en build real que un campo `slug` no choca con nada de Content (no debería; no es reservado).
   - Recomendación: **`slug`** (nombre neutral, claro). Verificar con un `nuxt build` mínimo en la primera tarea.

2. **¿`archLink` de las edades de arquitectura (Barroco→Bernini/Borromini) como campo o como enlaces en el `body`?**
   - Qué sabemos: en el HTML el enlace `#art-bernini` está **dentro de la prosa** de "Qué la define" del Barroco, no en un bloque aparte.
   - Qué falta: decidir si se extrae a un campo `archLink[]` (para validarlo como cross-ref) o se deja inline en el Markdown (resuelve en render, pero el test de invariantes no lo ve).
   - Recomendación: dejarlo **inline en el body** (es prosa) y, además, que el test de invariantes escanee los `(#…)` dentro de los campos `Md` para validar TODAS las anclas internas (no solo los campos `ref`). Así se cubre `archLink` y cualquier `[texto](#id)` de la prosa sin duplicar datos.

3. **¿`reference` como dos esquemas distintos (`z.union`) o un esquema con `blocks` heterogéneos?**
   - Qué sabemos: D-03 manda "bespoke por sección" → reservas y practica tienen shapes muy distintos.
   - Recomendación: **dos esquemas** (`ReservasSchema`, `PracticaSchema`) unidos por `z.discriminatedUnion('slug', …)` o `z.union`. Más fiel que un `blocks` genérico (que el sketch previo proponía con confianza MEDIA).

## Sources

### Primary (HIGH confidence)
- **Lectura directa de `/home/vcompanyb/guiaRoma/index.html`** — TODOS los shapes: hero/info-grid/cómo-usar (2283-2357), monument card completo (2450-2576), card-artists/card-arch (greps: ~10/~9 ocurrencias, líneas 2521/2587/2588/2651/2716/2930/2994…), timeline 6 kinds (2403-2446), `places[]` (6269-6314), reservas (5260-5333), gastronomía 26 cards + 7 grupos (5335-5819), práctica + media (5825-5938), arte 7 art-* (5948-6099), arquitectura 5 arq-* (6111-6199), glosario 10 arch-term (6211-6221).
- **Código fuente instalado `@nuxt/content@3.14.0`** (`node_modules/.pnpm/.../dist/module.mjs`) — `describeId`/`id`=join(collection.name,prefix,path) (1168-1181, 1812), `yaml` transformer (single-object, warn-no-throw on array) (1275-1293), `parse()` interno (no llama schema.parse; campos extra→meta) (1466-1516), `generateCollectionInsert` (no valida; defaults para undefined/null) (2442-2472), conversión a JSON-Schema vía `zod-to-json-schema` (49, 3004).
- [Nuxt Content — Collection Types](https://content.nuxt.com/docs/collections/types) — campos built-in `id`/`stem`/`extension`/`meta`; `id` reservado.
- [Nuxt Content — Schema Validators](https://content.nuxt.com/docs/collections/validators) — zod v4, `z` desde `zod` (re-export deprecado), conversión a JSON-Schema Draft-07.
- [Nuxt Content — Define Collections](https://content.nuxt.com/docs/collections/define) + [llms-full.txt](https://content.nuxt.com/llms-full.txt) — "Each file in `data` collection should contain only one object…"; globs `**`/`*` anidados; multi-collection config.
- **npm registry (2026-06-19)** — `vitest` latest 4.1.9, `@nuxt/test-utils` latest 4.0.3 (ambos NO instalados); `zod` 4.4.3, `nuxt` 4.4.8, `@nuxt/content` 3.14.0 (en package.json).

### Secondary (MEDIUM confidence)
- [nuxt/content#3351 — "support data schema validation on build"](https://github.com/nuxt/content/issues/3351) (abierto, 2025-05-13) — **confirma que Content v3 NO valida data-collections contra zod en build** (un fichero inválido pasa y entra en SQLite). Base del hallazgo crítico de DATA-05.
- [nuxt/content#2927 — "Zod not working correctly in V3 schema"](https://github.com/nuxt/content/issues/2927) — coerción boolean→0/1, tipos de `order()`; síntomas de que el esquema tipa pero no valida.
- [Nuxt 4 — Testing](https://nuxt.com/docs/4.x/getting-started/testing) — `defineVitestConfig`, unit (mountSuspended) vs e2e (setup); caveat de entorno híbrido para content/DB.
- [Nuxt Content — queryCollection](https://content.nuxt.com/docs/utils/query-collection) — `.where/.order/.all/.first/.select`.

### Tertiary (LOW confidence — marcado para validación al implementar)
- Formato exacto de `id` para data files: corroborado por código (A1) pero no por un ejemplo oficial explícito en docs. La recomendación (`slug` propio) lo hace irrelevante.

## Metadata

**Confidence breakdown:**
- Mecánica Content v3 (globs, single-object, id auto, no-build-validation): **HIGH** — verificado contra docs + código fuente instalado.
- Shapes del contenido a migrar (incl. reservas/práctica/arte/arquitectura, la bandera abierta): **HIGH** — leídos línea a línea; cross-refs `card-artists`/`card-arch` descubiertos por grep.
- Esquema zod final (nombres de campo): **MEDIUM-HIGH** — fiel al HTML; nombres ajustables por el planner (discreción D).
- Arquitectura de validación (DATA-05 vía test): **HIGH** — el hallazgo de #3351 obliga al patrón; el patrón Node-puro es directo y verificado.

**Research date:** 2026-06-19
**Valid until:** ~2026-07-19 (estable; `@nuxt/content` puede cerrar #3351 en una futura versión — re-verificar si se actualiza más allá de 3.14.x, pues podría cambiar el comportamiento de validación en build).
