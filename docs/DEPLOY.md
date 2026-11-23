# Despliegue de la guía en GitHub Pages

El workflow `.github/workflows/deploy.yml` («Desplegar en GitHub Pages») se ejecuta en cada push a `main` (o a mano): construye la web estática con Node 22 + pnpm (`pnpm generate`), pasa la puerta de tests unitarios y de datos y publica `.output/public`.
Solo `main` puede desplegar (el entorno `github-pages` solo admite `main`).

## Estado actual

La guía nueva ya está publicada: el primer push con este workflow desplegó aunque Pages sigue en "Deploy from a branch".
Mientras no se cambie el ajuste, cada push a `main` lanza DOS despliegues que compiten: la build clásica (Jekyll, sirve el `index.html` antiguo de la raíz) y este workflow (sirve la guía nueva). Gana el que termina el último; normalmente es este workflow, pero no está garantizado, y si su puerta de tests falla se quedaría servida la guía antigua.

## Dejarlo fijo (una sola vez)

Solo un administrador del repo (psl11) puede hacerlo:

1. Settings, Pages, "Build and deployment", Source: "GitHub Actions" (en lugar de "Deploy from a branch").
2. No hace falta relanzar nada: la guía nueva ya está desplegada. A partir de ahí solo despliega este workflow.
3. Comprobar:
   - https://psl11.github.io/guiaRoma/ muestra la portada «Guías de viaje».
   - https://psl11.github.io/guiaRoma/trips/roma/ abre Roma y https://psl11.github.io/guiaRoma/trips/campania/ abre Campania.
   - Un enlace antiguo como https://psl11.github.io/guiaRoma/#viernes lleva a Roma.

## Volver a la guía antigua

1. Actions, workflow «Desplegar en GitHub Pages», menú de tres puntos, "Disable workflow".
2. Si Source está en "GitHub Actions": Settings, Pages, Source: "Deploy from a branch", Branch `main`, carpeta "/ (root)", Save.
3. Si Source sigue en "Deploy from a branch": Actions, último «pages build and deployment», "Re-run all jobs".
4. En un minuto o dos vuelve a servirse la guía antigua de un solo fichero (el `index.html` de la raíz de `main`, que no debe borrarse mientras se quiera conservar esta vía de vuelta atrás). Para volver a la nueva, se reactiva el workflow desde el mismo menú y se pulsa "Run workflow" sobre `main`.

## Build local idéntica

Con Node 22:

```sh
rm -rf .data .nuxt .output
pnpm generate
```

El resultado queda en `.output/public`. Para previsualizarlo, sírvelo dentro de una subcarpeta `guiaRoma/` y abre `/guiaRoma/` (servir `.output/public` en la raíz muestra una página en blanco por el baseURL `/guiaRoma/`).
