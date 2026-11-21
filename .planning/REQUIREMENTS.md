# Requirements: guiaRoma — v1.1 Multi-viaje + Campania

**Defined:** 2026-11-20 (BORRADOR — pendiente de aprobación del usuario)
**Core Value:** La guía se consulta paseando por el destino y debe ser fiel, editorial y fiable (también offline). Lo ya publicado no se rompe: Roma sigue exactamente igual mientras la plataforma crece a varios viajes.

> Borrador preparado de forma autónoma mientras el usuario estaba de viaje, a partir de las decisiones
> ya tomadas (portada índice, español fijo + chrome por viaje, Campania con contenido en este hito,
> año 2027) y de `.planning/research/SUMMARY.md`. Las decisiones aún abiertas están marcadas con ⚠.

## v1.1 Requirements

### Plataforma por viaje (PLAT)

- [x] **PLAT-01**: La búsqueda de una guía solo devuelve fichas de ese viaje
- [x] **PLAT-02**: Los enlaces entre fichas, la pila de «Volver» y el scrollspy funcionan dentro de cualquier viaje, no solo en Roma
- [x] **PLAT-03**: Las notas, el ritmo, «caminar menos» y el modo resumen se guardan por viaje, y quien ya usa Roma conserva sus notas y preferencias sin hacer nada (claves `roma-*` intactas)
- [x] **PLAT-04**: El contenido de cada viaje se valida contra el esquema y sus invariantes (slug de viaje, carpeta = slug, ids únicos, sin colisión con anclas de sección, enlaces `#ficha` dentro del mismo viaje); un YAML inválido de cualquier viaje rompe `pnpm verify`

### Forma del viaje desde datos (SHAPE)

- [x] **SHAPE-01**: Una guía muestra tantos días como tenga su viaje, con sus nombres y fechas, aunque se repita el día de la semana (dos sábados en Campania) y con pastillas de navegación únicas
- [x] **SHAPE-02**: Una guía solo muestra las secciones y pastillas para las que su viaje tiene datos (p. ej. Campania sin Arte/Arquitectura si no los tiene)
- [x] **SHAPE-03**: La marca de la cabecera, el pie y la leyenda del mapa salen de los datos del viaje
- [x] **SHAPE-04**: La pestaña del navegador muestra el título propio de cada viaje
- [x] **SHAPE-05**: Ningún texto específico de Roma («Roma», «Einaudi», «giugno 2026»…) aparece en la guía de otro viaje (test-trampa con viaje fixture)

### Rutas y portada (ROUTE)

- [x] **ROUTE-01**: Al abrir `/guiaRoma/` el usuario ve una portada con una tarjeta por viaje publicado (título, fechas, destinos, resumen) que enlaza a su guía
- [x] **ROUTE-02**: La guía de Roma está en `/guiaRoma/trips/roma/` y la de Campania en `/guiaRoma/trips/campania/`
- [x] **ROUTE-03**: Un enlace antiguo `/guiaRoma/#ancla` (p. ej. `#viernes`, `#pantheon`) lleva automáticamente a la misma ancla dentro de `/trips/roma/`, sin bucles al pulsar «Atrás»
- [x] **ROUTE-04**: Todas las guías publicadas se generan como páginas estáticas para GitHub Pages y cargan sin descargar la base de datos de contenido (`sql_dump`/WASM)
- [x] **ROUTE-05**: Un viaje marcado como borrador (`draft`) no aparece en la portada ni se publica
- [x] **ROUTE-06** ⚠: Desde cualquier guía el usuario puede volver a la portada (recomendado: enlace discreto «← Todos los viajes» en el pie, con re-captura documentada solo de esa captura de Roma — **pendiente de decisión**)

### Formas nuevas de viaje (EXT)

- [x] **EXT-01**: Un día puede ofrecer opciones alternativas («Elige una»: A o B), mostradas ambas apiladas con «— o bien —», con filas comunes antes y después
- [x] **EXT-02**: Cada día indica dónde se duerme («Dormís en…») a partir de las bases del viaje
- [ ] **EXT-03**: El timeline distingue con estilo propio los tramos en ferry, coche, autobús, bici y avión
- [ ] **EXT-04**: Los lugares de naturaleza (playas, pozas termales, ríos, senderos) tienen ficha, marcador propio en el mapa y dibujo de reserva cuando falla la imagen
- [ ] **EXT-05**: El mapa de un viaje de varias ciudades encuadra todos sus marcadores (Roma conserva su vista actual)
- [ ] **EXT-06**: La «ruta del día» usa el modo adecuado al día (a pie, coche, transporte público) o se oculta cuando no tiene sentido (días de ferry)
- [ ] **EXT-07**: Una ficha puede incluir una nota para familias con niños

### Contenido Campania 2027 (CAMP)

- [ ] **CAMP-01**: La guía de Campania tiene los 10 días (19–28 junio 2027) con su timeline, horarios y logística (vuelos, ferris, coche, conciertos), en el tono slow/auténtico del planning
- [ ] **CAMP-02**: Cada lugar relevante del itinerario tiene ficha con imagen, nombre italiano, prosa y enlace a Google Maps (Nápoles, Procida, Ischia, Salerno, Cilento, Vesubio, Casertavecchia, Campos Flégreos)
- [ ] **CAMP-03**: La guía de Campania incluye su sección de gastronomía (pizzerías de barrio, mozzarella di bufala, tabernas, trattorias de monte…)
- [ ] **CAMP-04**: La sección de reservas de Campania recoge alojamientos por base, ferris, coche de alquiler, conciertos y vuelos
- [ ] **CAMP-05**: La sección práctica de Campania cubre ferris, conducción/ZTL y restricciones en islas, calor, calzado y consejos con niños
- [ ] **CAMP-06**: Los datos de campo críticos (horarios de ferry, fechas de conciertos, acceso a Sorgeto de noche, coche en islas) están verificados o marcados como «por confirmar» en la guía

### Paridad de Roma (PAR)

- [x] **PAR-01**: Los 56 goldens de Roma pasan en su nueva URL sin re-baseline (salvo excepción aprobada explícitamente por el usuario, p. ej. ROUTE-06)
- [x] **PAR-02**: La suite de comportamiento de Roma (navegación, búsqueda, ruta del día, mapa, notas, modos) sigue en verde en `/trips/roma/`
- [ ] **PAR-03**: Un usuario de la guía viva (`index.html` de `main`) que actualiza a la nueva versión conserva sus notas y preferencias de Roma (test de upgrade en el mismo origen)
- [ ] **PAR-04**: Sign-off humano de Roma y Campania en móvil real, incluido el comportamiento sin conexión

## Future Requirements (v1.2+)

### Durante el viaje
- **TRIP-01**: Estado del viaje en la portada («faltan N días», «en curso») y botón «Ir a hoy» dentro de la guía
- **TRIP-02**: Elegir una opción A/B y que la guía la recuerde (ocultando la otra)

### Mapa
- **MAP-01**: Marcadores de las bases de alojamiento
- **MAP-02**: Control «enfocar este día» en el mapa
- **MAP-03**: Trazado de los tramos de ferry

### Plataforma
- **PLAT-05**: Actualización de dependencias (Nuxt 4.6.x, Content 3.17.x, Playwright) en una chore aislada con `pnpm verify`
- **PLAT-06**: PWA con caché offline real de todas las guías (`@vite-pwa/nuxt`)

## Out of Scope

| Feature | Reason |
|---------|--------|
| i18n / UI multidioma | Decidido: UI en español fijo; lo propio del viaje sale de sus datos |
| Modelo de participantes (quién va cada día) | Texto libre basta (p. ej. «Arantxa llega el 23») |
| Tema/colores distintos por viaje | Un único sistema visual; evita regresiones en Roma |
| Clustering de marcadores | Ocultaría los numerales y cambiaría el mapa de Roma |
| Horarios de ferry en tiempo real | Requiere red/API; contradice el uso offline |
| Navegación SPA entre viajes | Carga completa por viaje = aislamiento de estado gratis y mismo camino validado en v1.0 |
| Backend, auth, subida de media, CMS | v2 (Nitro sigue dormido) |
| Merge a `main` y deploy | Acto de ship separado tras el hito (como en v1.0) |
| Cap de 10 paradas vs límite de waypoints de Google Maps en móvil | Deuda heredada de Roma; no se toca en v1.1 |

## Decisiones abiertas (⚠ requieren al usuario)

1. **ROUTE-06** — ¿Enlace «← Todos los viajes» en Roma (cambia una captura del pie) o ninguno en v1.1?
2. **EXT-01** — Opciones A/B apiladas y siempre visibles (recomendado) vs selector que oculte la no elegida (TRIP-02, futuro).
3. **CAMP-01** — Fecha de devolución del coche (25 vs 26), que decide si el día del 26 es en coche o en transporte público.
4. **EXT-04** — Dibujos SVG nuevos de naturaleza vs reutilizar provisionalmente los existentes.
5. **ROUTE-05** — Publicar Campania solo cuando esté completa (`draft` hasta entonces) vs publicarla con días provisionales.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | Phase 9 | Complete |
| PLAT-02 | Phase 9 | Complete |
| PLAT-03 | Phase 9 | Complete |
| PLAT-04 | Phase 9 | Complete |
| SHAPE-01 | Phase 10 | Complete |
| SHAPE-02 | Phase 10 | Complete |
| SHAPE-03 | Phase 10 | Complete |
| SHAPE-04 | Phase 10 | Complete |
| SHAPE-05 | Phase 10 | Complete |
| ROUTE-01 | Phase 11 | Complete |
| ROUTE-02 | Phase 11 | Complete |
| ROUTE-03 | Phase 11 | Complete |
| ROUTE-04 | Phase 11 | Complete |
| ROUTE-05 | Phase 11 | Complete |
| ROUTE-06 | Phase 11 | Complete |
| EXT-01 | Phase 12 | Complete |
| EXT-02 | Phase 12 | Complete |
| EXT-03 | Phase 12 | Pending |
| EXT-04 | Phase 12 | Pending |
| EXT-05 | Phase 12 | Pending |
| EXT-06 | Phase 12 | Pending |
| EXT-07 | Phase 12 | Pending |
| CAMP-01 | Phase 13 | Pending |
| CAMP-02 | Phase 13 | Pending |
| CAMP-03 | Phase 13 | Pending |
| CAMP-04 | Phase 13 | Pending |
| CAMP-05 | Phase 13 | Pending |
| CAMP-06 | Phase 13 | Pending |
| PAR-01 | Phase 11 | Complete |
| PAR-02 | Phase 11 | Complete |
| PAR-03 | Phase 14 | Pending |
| PAR-04 | Phase 14 | Pending |

**Notas de trazabilidad:**
- **PAR-01/PAR-02** se asignan a la Fase 11, la primera en la que Roma vive en `/trips/roma/`; las fases 12, 13 y 14 los vuelven a exigir como criterio de éxito (la puerta de Roma sigue verde) y la 14 los re-verifica desde build limpia.
- **ROUTE-02**: el mecanismo `/trips/<slug>/` y la URL de Roma se entregan en la Fase 11; la URL concreta `/trips/campania/` aparece en la Fase 13, cuando Campania deja de ser `draft`.
- **ROUTE-05**: el mecanismo `draft` se entrega en la Fase 11; el esqueleto de Campania de la Fase 12 nace `draft: true`.
- **Decisiones abiertas (⚠)** y fase que las necesita: ROUTE-06 → antes de planificar la Fase 11 · EXT-01 y EXT-04 → antes de planificar la Fase 12 · CAMP-01 (devolución del coche, 25 vs 26) → antes de redactar el día VIII en la Fase 13 · ROUTE-05 (publicación de Campania) → antes de cerrar la Fase 13. Si el usuario descarta ROUTE-06, pasa a Future Requirements y no se toca ningún golden.

**Coverage:**
- v1.1 requirements: 32 total
- Mapped to phases: 32 ✓
- Unmapped: 0 ✓
- Por fase: Fase 9 = 4 · Fase 10 = 5 · Fase 11 = 8 · Fase 12 = 7 · Fase 13 = 6 · Fase 14 = 2

---
*Requirements defined: 2026-11-20 (borrador)*
*Last updated: 2026-11-20 — trazabilidad rellenada al crear el roadmap v1.1 (Fases 9-14); borrador pendiente de aprobación del usuario*
