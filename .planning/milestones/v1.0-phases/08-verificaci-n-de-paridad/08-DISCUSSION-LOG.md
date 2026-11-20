# Phase 8: Verificación de paridad - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-23
**Phase:** 8-Verificación de paridad
**Areas discussed:** Visual-diff Nuxt↔golden, Puerta verde de la suite, Alcance comportamiento/datos, Sign-off + merge/deploy

---

## Visual-diff Nuxt↔golden

### Política ante un diff de pixel

| Option | Description | Selected |
|--------|-------------|----------|
| Corregir el componente | Un diff = brecha real → ajustar Nuxt hasta cuadrar en 0.01; máscara/umbral solo para regiones probadamente no deterministas | |
| Investigar primero la causa | Correr el visual-diff una vez y CLASIFICAR cada diff (real→corregir; artefacto inevitable→umbral/máscara con evidencia); política con datos, no a priori | ✓ |
| Tolerar artefactos de render | Subir umbral/enmascarar texto; corregir solo diffs gruesos | |

**User's choice:** Investigar primero la causa
**Notes:** El bar sigue siendo paridad=ley; solo lo demostrablemente no determinista se tolera. Riesgo surfaced: fuentes self-host (@nuxt/fonts) vs Google Fonts del golden → posible ruido AA global a caracterizar primero.

### Topología de la comparación contra los 56 PNGs

| Option | Description | Selected |
|--------|-------------|----------|
| Spec nuevo, golden congelado | Spec autocontenido nuevo (build+serve Nuxt) compara contra los 56 PNGs como baseline read-only; golden.spec queda como captura F1; test:golden:update prohibido | ✓ |
| Repuntar golden.spec a Nuxt | Modificar golden.spec para servir Nuxt; menos ficheros pero se pierde la captura F1 y un --update accidental rebaselinaría | |
| Tú decides la topología | Invariante fijo (baselines congelados + comparar el sitio generado); planner elige fichero-nuevo-vs-repuntar | |

**User's choice:** Spec nuevo, golden congelado
**Notes:** Invariante duro: baselines de solo lectura, comparar el sitio generado, nunca rebaselinar. Mecánica de compartir el dir de snapshots = planner.

---

## Puerta verde de la suite

### Composición del comando-puerta

| Option | Description | Selected |
|--------|-------------|----------|
| Un comando: unit+data+parity | Un comando único (p. ej. pnpm verify) encadena test:unit + test:data + parity; verde = condición de la 1.0 | ✓ |
| Solo la suite Playwright | La puerta es solo Playwright; unit/data quedan como chequeos aparte | |
| Tú decides | Planner decide la composición; invariante = SC#1+SC#2+SC#3 cubiertos y verificables | |

**User's choice:** Un comando: unit+data+parity
**Notes:** Una sola fuente de verdad de "paridad demostrada".

### Fate de los 2 fallos pre-existentes no-Nuxt

| Option | Description | Selected |
|--------|-------------|----------|
| Sacarlos del gate, documentado | golden.spec (captura F1, a demanda) y shell.spec:224 (dev-routing frágil al entorno) fuera del comando-puerta, con razón escrita | ✓ |
| Endurecer y mantener todo | golden.spec estabilizado + shell dev test con NUXT_IGNORE_LOCK=1; todo dentro del gate | |
| Tú decides | Planner decide caso por caso; invariante = gate determinista y verde de verdad | |

**User's choice:** Sacarlos del gate, documentado
**Notes:** ARCH-02 ya probado por build estático + parte estática de shell.spec; sin fallos tolerados sin justificar.

---

## Alcance comportamiento/datos

### Cómo satisface F8 el SC#2/SC#3

| Option | Description | Selected |
|--------|-------------|----------|
| Auditar + rellenar huecos | Audita specs F3-F7 contra SC#2, aserta que todos pasan, añade SOLO lo que falte (p. ej. pila volver de punta a punta por punto de entrada); reutiliza los verdes | ✓ |
| Pasada E2E consolidada nueva | Un spec nuevo cubre todo SC#2 en user-flow, aparte de los por-fase | |
| Aceptar lo existente tal cual | Los specs por-fase + invariantes SON la cobertura; solo asegurarse de que están en el gate | |

**User's choice:** Auditar + rellenar huecos
**Notes:** Candidato de hueco: goBack/restauración de scroll desde mapa, búsqueda y timeline (cada punto de entrada), no solo el scroll-a-ficha.

### Paridad del mapa (sin baseline en el golden)

| Option | Description | Selected |
|--------|-------------|----------|
| Comportamiento basta | Mapa verificado solo por el spec F7 (12/12) + chrome estático; sin pixel; excepción documentada; golden no se rebaselina | ✓ |
| Añadir visual del chrome | Baseline visual nuevo (no-golden) del chrome de #mapa con tiles enmascarados | |
| Tú decides | Planner decide; invariante = comportamiento del mapa dentro del gate, golden no rebaselinado | |

**User's choice:** Comportamiento basta
**Notes:** Única excepción deliberada a la paridad-pixel; a documentar en el sign-off.

---

## Sign-off + merge/deploy

### Sign-off humano final

| Option | Description | Selected |
|--------|-------------|----------|
| Sí, sign-off humano final | Cierre = suite verde + un sign-off humano final de paridad global; consistente con F3-F7 | ✓ |
| Solo suite verde | El gate verde es suficiente; sin sign-off humano separado | |
| Tú decides | Planner decide; invariante = suite verde antes de declarar la 1.0 | |

**User's choice:** Sí, sign-off humano final
**Notes:** La parte automática demuestra; el humano da el OK que declara la 1.0 paridad-buena. (Recordatorio: sign-off de F7 quedó pendiente — Task 2.)

### Frontera de alcance

| Option | Description | Selected |
|--------|-------------|----------|
| Parar en verde + sign-off | F8 entrega la puerta y para; merge a main y deploy/CI fuera de F8 (honra D-06; main intacto) | ✓ |
| F8 también mergea a main | Tras verde+sign-off, F8 mergea release → main (sin deploy/CI) | |
| F8 monta deploy/CI también | F8 además levanta el deploy de GitHub Pages | |

**User's choice:** Parar en verde + sign-off
**Notes:** Shippear la 1.0 (merge + deploy) = acto separado / cierre de milestone. El roadmap de 8 fases acaba en verificación.

---

## Claude's Discretion

- Topología exacta del spec visual-diff y mecánica para leer el dir de snapshots congelado sin rebaselinar.
- Forma/nombre del comando-puerta y orquestación (script encadenado vs testIgnore/grep).
- build-once vs builds por-spec (rendimiento del gate).
- Mecánica de la clasificación de diffs (dónde se revisan, dónde se anota real-vs-artefacto).
- Qué aserciones concretas faltan en la auditoría SC#2 y cómo se añaden.
- Cómo se documentan las exclusiones del gate.

## Deferred Ideas

- Merge release/nuxt-4 → main + montar deploy/CI (GitHub Pages) = ship de la 1.0, fuera de F8 (cierre de milestone / paso de ship).
- Consolidar la suite parity a un build servido una vez (optimización del gate).
- Baseline visual suplementario del chrome de #mapa (descartado en F8; rompería el golden congelado).
- Endurecer shell.spec:224 con NUXT_IGNORE_LOCK=1 (alternativa a excluirlo; mejora opcional).
