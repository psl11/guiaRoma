# Phase 9: Plataforma por viaje - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-11-20
**Phase:** 09-plataforma-por-viaje
**Areas discussed:** Viaje de prueba, Preferencias por viaje, Rigor de la validación

---

## Viaje de prueba

| Option | Description | Selected |
|--------|-------------|----------|
| Viaje ficticio mínimo | content/trips/prueba/ con 1-2 días y 2-3 fichas inventadas, borrador; estable para tests | ✓ |
| Esqueleto de Campania | Empezar content/trips/campania/ con 2 días reales; tests dependen de contenido cambiante | |
| Solo datos de test | Fixtures en tests/, sin página real; solo tests unitarios | |

**User's choice:** Viaje ficticio mínimo

| Option | Description | Selected |
|--------|-------------|----------|
| Accesible solo en dev | /trips/prueba en `pnpm dev`; sin prerender ni enlaces en la build estática | ✓ |
| Fuera de content/ siempre | Carpeta de fixtures cargada solo en tests | |

**User's choice:** Accesible solo en dev

---

## Preferencias por viaje

| Option | Description | Selected |
|--------|-------------|----------|
| «Caminar menos» por viaje | Activarlo en Roma no lo activa en Campania; roma-light intacta | ✓ |
| «Caminar menos» global | Preferencia de la persona; clave global nueva | |

| Option | Description | Selected |
|--------|-------------|----------|
| Ritmo y resumen por viaje | Claves roma-pace / roma-resumen intactas | ✓ |
| Ritmo por viaje, resumen global | Resumen como preferencia de lectura global | |

| Option | Description | Selected |
|--------|-------------|----------|
| Valores por defecto como hoy | Optimista, light off, resumen off | ✓ |
| Definidos por cada viaje | Campo nuevo en trip.yml | |

---

## Rigor de la validación

| Option | Description | Selected |
|--------|-------------|----------|
| Igual de estrictas | Esquema e invariantes bloquean en todos los viajes; incompleto ≠ roto | ✓ |
| Avisos en borradores | Errores de borradores como aviso, no rompen verify | |

| Option | Description | Selected |
|--------|-------------|----------|
| Error que rompe verify | Enlace #ficha fuera del viaje = error con fichero y enlace | ✓ |
| Permitir enlaces entre viajes | Sintaxis nueva /trips/roma#pantheon | |

---

## Claude's Discretion

- Nombre/contenido exacto del viaje ficticio.
- Mecanismo de contexto de viaje (provide/inject recomendado por la investigación).
- Forma de probar el aislamiento (unit y/o Playwright en dev), sin tocar tests/parity/.

## Deferred Ideas

- Enlaces entre viajes.
- Ritmo por defecto por viaje.
- «Caminar menos» global.
