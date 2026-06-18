# Phase 1: Andamiaje + Golden de paridad - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-18
**Phase:** 1-Andamiaje + Golden de paridad
**Areas discussed:** Ubicación del proyecto, Gestor de paquetes, Alcance del golden, Deploy de preview

---

## Ubicación del proyecto

| Option | Description | Selected |
|--------|-------------|----------|
| Raíz, index.html intacto | Nuxt en la raíz (srcDir=app/); index.html se queda en raíz como referencia de paridad; encaja con la investigación | ✓ |
| Subdirectorio web/ | Nuxt aislado en web/, raíz limpia; complica el deploy a Pages y se aparta de la investigación | |
| Raíz, archivar index.html en legacy/ | Nuxt en raíz e index.html movido a legacy/; rompería rutas de favicon/apple-touch-icon | |

**User's choice:** Raíz, index.html intacto
**Notes:** index.html intacto en raíz como fuente del golden; su destino se decide en la Fase 8.

---

## Gestor de paquetes

| Option | Description | Selected |
|--------|-------------|----------|
| pnpm | Rápido, eficiente en disco, el más habitual en Nuxt 4 | ✓ |
| npm | Por defecto, cero setup extra | |
| yarn | Consistencia con otros proyectos | |
| bun | El más rápido pero más nuevo; alguna fricción con módulos Nuxt | |

**User's choice:** pnpm
**Notes:** —

---

## Alcance del golden

| Option | Description | Selected |
|--------|-------------|----------|
| Representativo amplio | Home + 5 días + una ficha de cada tipo + 5 secciones de referencia, claro/oscuro, móvil ~390px + desktop ~1280px | ✓ |
| Exhaustivo (todas las fichas) | Las ~37 fichas una a una; golden pesado y ruidoso | |
| Mínimo (smoke) | Home + un día + una ficha, claro/oscuro, desktop; deja huecos | |

**User's choice:** Representativo amplio
**Notes:** Capturado sirviendo el index.html actual en local con Playwright, antes de divergir.

---

## Deploy de preview

| Option | Description | Selected |
|--------|-------------|----------|
| Local ahora, deploy luego | Verificar el build estático en local (nuxt preview bajo /guiaRoma/); CI/deploy diferido; main vivo intacto | ✓ |
| Preview deploy ya | Montar despliegue de preview de release/nuxt-4; requeriría confirmar cómo se sirve main | |

**User's choice:** Local ahora, deploy luego
**Notes:** Sin tocar el deploy vivo de main. CI/deploy real a una fase posterior.

---

## Claude's Discretion

- Organización exacta de los archivos CSS al extraerlos (tokens/base/leaflet vs único global), conservando reglas verbatim y carga global única.
- Versiones exactas de dependencias (las verificadas en STACK.md).
- Estructura/rutas de los tests Playwright y nombres de snapshots; device exacto de los viewports.
- Configuración fina de `@nuxt/fonts` (incl. itálicas de Cormorant Garamond).
- Contenido del placeholder `server/api/README.md` (backend dormido).

## Deferred Ideas

None — la discusión se mantuvo dentro del alcance de la Fase 1. Los diferidos de producto (backend, PWA, 2º viaje) ya están en STATE.md ▸ Deferred Items; el CI/deploy real se difiere a una fase posterior (D-06).
