# Despliegue de la guía en GitHub Pages

El workflow `.github/workflows/deploy.yml` («Desplegar en GitHub Pages») se ejecuta en cada push a `main` (o a mano): construye la web estática con Node 22 + pnpm (`pnpm generate`), pasa la puerta de tests unitarios y de datos y publica `.output/public`.
Solo `main` puede desplegar (el entorno `github-pages` solo admite `main`).

## Activarlo (una sola vez)

Solo un administrador del repo (psl11) puede hacerlo:

1. Settings, Pages, "Build and deployment", Source: "GitHub Actions" (en lugar de "Deploy from a branch").
2. Pestaña Actions, workflow «Desplegar en GitHub Pages»: abrir la última ejecución fallida y pulsar "Re-run all jobs", o pulsar "Run workflow" sobre la rama `main`.
3. Comprobar:
   - https://psl11.github.io/guiaRoma/ muestra la portada de viajes.
   - https://psl11.github.io/guiaRoma/trips/roma/ abre Roma (hoy esa URL devuelve 404).

## Mientras no se active

El job `deploy` falla en cada push a `main` y es lo esperado. La guía antigua sigue servida por la build clásica desde la rama, así que no se rompe nada.

## Volver atrás

1. Settings, Pages, Source: "Deploy from a branch", Branch `main`, carpeta "/ (root)", Save. En un minuto o dos vuelve a servirse la guía antigua de un solo fichero (el `index.html` de la raíz de `main`, que no debe borrarse mientras se quiera conservar esta vía de vuelta atrás).
2. Opcional: Actions, workflow «Desplegar en GitHub Pages», menú de tres puntos, "Disable workflow", para que los pushes dejen de producir ejecuciones fallidas. Para volver, se reactiva desde el mismo menú.

## Build local idéntica

Con Node 22:

```sh
rm -rf .data .nuxt .output
pnpm generate
```

El resultado queda en `.output/public`. Para previsualizarlo, sírvelo dentro de una subcarpeta `guiaRoma/` y abre `/guiaRoma/` (servir `.output/public` en la raíz muestra una página en blanco por el baseURL `/guiaRoma/`).
