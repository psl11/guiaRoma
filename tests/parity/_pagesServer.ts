import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { extname, join, normalize, resolve, sep } from 'node:path'

/**
 * Servidor estático EN PROCESO que imita a GitHub Pages sobre `.output/public`, servido bajo la
 * base del sitio (`/guiaRoma/`). Lo usan los specs nuevos de la Fase 11 (redirección de enlaces
 * antiguos, portada).
 *
 * Conducta de Pages que reproduce (research de la Fase 11, verificado contra hosts
 * `server: GitHub.com`):
 *  · la base sin barra final (`/guiaRoma`) responde 301 a `/guiaRoma/`;
 *  · un directorio sin barra final (`/guiaRoma/trips/roma`) responde 301 a la forma con barra,
 *    conservando la query (el hash nunca llega al servidor: el navegador lo mantiene);
 *  · un directorio con barra sirve su `index.html`, y `…/index.html` responde 200;
 *  · lo inexistente responde 404 con el `404.html` de la build.
 *
 * Por qué no `serve` (el de los specs existentes): su `cleanUrls` reescribe y oculta justo la
 * conducta de barra final de Pages que aquí se quiere probar.
 *
 * Seguridad: ninguna ruta puede salir de `outDir` (ruta normalizada + comprobación de contención;
 * fuera → 404). Escucha solo durante la suite; se cierra con `server.close()` en `afterAll`.
 *
 * No es un spec: su nombre no casa con `*.spec.ts`, así que Playwright no lo ejecuta.
 */

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
  '.wasm': 'application/wasm',
}

export function startPagesServer(outDir: string, port: number, base = '/guiaRoma/'): Promise<Server> {
  const root = resolve(outDir)
  const notFound = (res: import('node:http').ServerResponse): void => {
    const page = join(root, '404.html')
    res.writeHead(404, { 'Content-Type': TYPES['.html'] })
    res.end(existsSync(page) ? readFileSync(page) : '')
  }

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    let p: string
    try {
      p = decodeURIComponent(url.pathname)
    }
    catch {
      return notFound(res)
    }

    if (p === base.slice(0, -1)) {
      res.writeHead(301, { Location: base + url.search })
      return void res.end()
    }
    if (!p.startsWith(base)) return notFound(res)

    let file = resolve(root, normalize(p.slice(base.length)).replace(/^(\.\.(\/|\\|$))+/, ''))
    // Contención: la ruta resuelta debe quedar dentro de outDir.
    if (file !== root && !file.startsWith(root + sep)) return notFound(res)

    if (existsSync(file) && statSync(file).isDirectory()) {
      if (!p.endsWith('/')) {
        res.writeHead(301, { Location: url.pathname + '/' + url.search })
        return void res.end()
      }
      file = join(file, 'index.html')
    }
    if (!existsSync(file) || statSync(file).isDirectory()) return notFound(res)

    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' })
    createReadStream(file).pipe(res)
  })

  return new Promise((ok, fail) => {
    server.once('error', fail)
    server.listen(port, '127.0.0.1', () => ok(server))
  })
}
