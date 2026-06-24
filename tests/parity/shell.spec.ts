import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

/**
 * PARIDAD DE SHELL del «/» CONSTRUIDO (SC#2/ARCH-01) + cabecera de paridad (D-09) +
 * routing/404 (ARCH-02) + disciplina de prerender (D-01).
 *
 * AUTOCONTENIDO (igual que subpath.spec.ts): NO depende del webServer de playwright.config.ts
 * (que sirve el index.html VIVO en :4173 para el golden). Generamos el sitio Nuxt
 * (`pnpm generate`) UNA vez, copiamos `.output/public/*` a una subcarpeta `guiaRoma/` y servimos
 * el directorio PADRE con un static server propio bajo /guiaRoma/ (topología GitHub Pages).
 *
 * DOS bloques con ciclos de vida SEPARADOS para no acoplar el server estático (rápido) al dev
 * server (arranque lento de Nitro + Content):
 *   1) describe «build estática» → solo static server (shell/head/no-trips-dir).
 *   2) describe «routing dinámico» → solo `pnpm dev` (TripView reutilizado en /trips/roma + 404),
 *      porque la salida estática SOLO emite «/» (D-01) y no puede ejercitar /trips/* ni 404 reales.
 *
 * NOTA D1/D2 (ver deferred-items.md): la salida estática emite un único error de consola esperado
 * — «Hydration completed but contains mismatches.» — propio del SSG de @nuxtjs/color-mode (su
 * script anti-FOUC fija data-theme antes de hidratar; SC#3). Lo toleramos EXPLÍCITAMENTE y fallamos
 * ante cualquier OTRO error, para no enmascarar una regresión real.
 */

// --- Orden BLOQUEADO de las 12 pastillas (index.html:2265-2276) ---
const EXPECTED_PILLS = [
  'Inicio', 'Mapa',
  'Venerdì', 'Sabato', 'Domenica', 'Lunedì', 'Martedì',
  'Reservas', 'Gastronomía', 'Pratica', 'Arte', 'Arquitectura',
]

const TITLE = 'Roma · 19—23 giugno 2026'
// Mensaje de consola ESPERADO del SSG de color-mode (D2) — único tolerado.
const EXPECTED_HYDRATION_MSG = /Hydration completed but contains mismatches/i

const OUTPUT_DIR = join(process.cwd(), '.output', 'public')

async function waitForServer(url: string, timeoutMs = 120_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  let lastErr: unknown
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.status > 0) return
    }
    catch (err) {
      lastErr = err
    }
    await new Promise(r => setTimeout(r, 300))
  }
  throw new Error(`Server no respondió en ${url} tras ${timeoutMs}ms (último error: ${String(lastErr)})`)
}

/** Mata el GRUPO de procesos completo (líder creado con detached:true) — evita zombies (WR-02). */
function killGroup(proc: ChildProcess | undefined): void {
  if (proc?.pid && !proc.killed) {
    try {
      process.kill(-proc.pid, 'SIGTERM')
    }
    catch {
      try {
        proc.kill('SIGTERM')
      }
      catch { /* ya muerto */ }
    }
  }
}

/** Asegura la build estática una sola vez (workers paralelos NO recompilan a la vez). */
function ensureBuild(): void {
  if (!existsSync(join(OUTPUT_DIR, 'index.html'))) {
    const gen = spawnSync('pnpm', ['generate'], { stdio: 'inherit', shell: false })
    expect(gen.status, 'pnpm generate debe salir 0').toBe(0)
  }
  expect(existsSync(join(OUTPUT_DIR, 'index.html')), '.output/public/index.html debe existir').toBe(true)
}

// ============================================================================
// 1) Build estática servida bajo /guiaRoma/ — shell + head + no-trips-dir.
// ============================================================================
test.describe('shell de la build estática (/guiaRoma/)', () => {
  const STATIC_PORT = 5100 + Number(process.env.TEST_WORKER_INDEX ?? 0)
  const STATIC_URL = `http://localhost:${STATIC_PORT}/guiaRoma/`

  let server: ChildProcess | undefined
  let previewRoot: string | undefined

  test.beforeAll(async () => {
    test.setTimeout(180_000) // generate (si hace falta) + arranque del static server
    ensureBuild()

    // Topología Pages: .output/public → <tmp>/guiaRoma/, servir el PADRE.
    previewRoot = mkdtempSync(join(tmpdir(), 'guiaroma-shell-'))
    const subDir = join(previewRoot, 'guiaRoma')
    mkdirSync(subDir, { recursive: true })
    cpSync(OUTPUT_DIR, subDir, { recursive: true })

    // Static server propio (sin --single → 404 reales). detached → matar el grupo en afterAll.
    server = spawn('pnpm', ['dlx', 'serve', '-l', String(STATIC_PORT), previewRoot], {
      stdio: 'ignore',
      shell: false,
      detached: true,
    })
    server.unref()
    await waitForServer(STATIC_URL)
  })

  test.afterAll(() => {
    killGroup(server)
    if (previewRoot && existsSync(previewRoot)) {
      rmSync(previewRoot, { recursive: true, force: true })
    }
  })

  test('el «/» construido reproduce el shell + #inicio + footer (SC#2/ARCH-01)', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !EXPECTED_HYDRATION_MSG.test(msg.text())) {
        consoleErrors.push(msg.text())
      }
    })

    const response = await page.goto(STATIC_URL)
    expect(response?.status(), 'el documento bajo /guiaRoma/ debe responder 200').toBe(200)
    await page.waitForLoadState('networkidle')

    // --- Topbar / brand ---
    await expect(page.locator('header.topbar')).toBeVisible()
    await expect(page.locator('.topbar-inner .brand')).toContainText('Roma')
    await expect(page.locator('.topbar-inner .brand .brand-dot')).toHaveText('✦')
    await expect(page.locator('.topbar-inner .theme-btn')).toBeAttached()

    // --- NavPills: 12 anclas en el ORDEN BLOQUEADO (incl. las 5 etiquetas de día derivadas) ---
    const nav = page.locator('nav.nav-pills#nav-pills')
    await expect(nav).toBeVisible()
    await expect(nav.locator('.nav-pill')).toHaveText(EXPECTED_PILLS)

    // --- #inicio masthead (h1 con <em>, hero-decoration, hero-meta, hero-quote) ---
    const inicio = page.locator('#inicio')
    await expect(inicio).toBeVisible()
    await expect(inicio.locator('.hero .hero-decoration')).toContainText('ROMA AETERNA')
    await expect(inicio.locator('.hero h1 em')).toContainText('Roma')
    // Aserción de TEXTO real (no solo visibilidad): atrapa la corrupción «[object Object]» si
    // un campo del trip choca con un nombre RESERVADO de Content v3 (CR-01: 'meta' → 'heroMeta').
    const heroMeta = inicio.locator('.hero .hero-meta')
    await expect(heroMeta).toContainText('giugno 2026')
    await expect(heroMeta).toContainText('Hotel Royal Court')
    await expect(heroMeta).not.toContainText('[object Object]')
    await expect(inicio.locator('.hero .hero-quote .hero-quote-attr')).toContainText('FELLINI')

    // --- info-grid con 4 info-card ---
    await expect(inicio.locator('.info-grid .info-card')).toHaveCount(4)

    // --- footer (línea de paridad con el em-dash) ---
    await expect(page.locator('footer .container p')).toContainText('Roma · 19—23 giugno 2026')

    // --- back-btn: montado pero invisible EN REPOSO (D-07: sin clase .show). Playwright trata
    //     opacity:0 como «visible», así que verificamos el ESTADO DE REPOSO real por CSS computado:
    //     opacity 0 + pointer-events none (base.css:1001-1029) → fuera de alcance e inerte. ---
    const backBtn = page.locator('#back-btn.back-btn')
    await expect(backBtn).toBeAttached()
    await expect(backBtn).not.toHaveClass(/\bshow\b/)
    await expect(backBtn).toHaveCSS('opacity', '0')
    await expect(backBtn).toHaveCSS('pointer-events', 'none')

    expect(consoleErrors, `errores de consola inesperados: ${consoleErrors.join(' | ')}`).toHaveLength(0)
  })

  test('la cabecera de paridad es verbatim (D-09): title, lang es, ambos theme-color', async ({ page }) => {
    await page.goto(STATIC_URL)

    await expect(page).toHaveTitle(TITLE)
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')

    const darkMeta = page.locator('meta[name="theme-color"][media="(prefers-color-scheme: dark)"]')
    const lightMeta = page.locator('meta[name="theme-color"][media="(prefers-color-scheme: light)"]')
    await expect(darkMeta).toHaveAttribute('content', '#1a1612')
    await expect(lightMeta).toHaveAttribute('content', '#f5f0e8')
    // Exactamente 2 metas theme-color (ni más ni menos).
    await expect(page.locator('meta[name="theme-color"]')).toHaveCount(2)
  })

  test('la build NO emite el directorio trips/ (disciplina de prerender D-01)', () => {
    expect(existsSync(join(OUTPUT_DIR, 'index.html')), 'la build debe existir').toBe(true)
    expect(existsSync(join(OUTPUT_DIR, 'trips')), '.output/public/trips NO debe existir (solo «/» se prerenderiza)').toBe(false)
  })
})

// ============================================================================
// 2) Routing dinámico (ARCH-02) — solo ejercitable contra `pnpm dev` (la build
//    estática emite SOLO «/», D-01). TripView reutilizado en /trips/roma + 404.
// ============================================================================
test.describe('routing dinámico /trips/[slug] (vía dev — ARCH-02)', () => {
  // EXCLUIDO DEL GATE (D-04 exclusión #2): este bloque lanza `pnpm dev` (Nitro + Content), que
  // es frágil al lock rancio de `nuxi dev` (ver deferred-items.md de la Fase 5). La skip a nivel
  // de DESCRIBE se evalúa ANTES del beforeAll de este bloque, así que el spawn de `pnpm dev` NO
  // ocurre cuando RUN_DEV_ROUTING está sin definir (el caso del gate). ARCH-02 (TripView reutilizado
  // + 404) queda cubierto por la build estática + las aserciones estáticas de este mismo fichero.
  // Ejecutable bajo demanda: `RUN_DEV_ROUTING=1 pnpm test:parity`. Es el "tirante" (suspenders) al
  // "cinturón" (belt) del grep-invert de title que el Plan 03 añadió en test:parity.
  test.skip(!process.env.RUN_DEV_ROUTING, 'dev-routing excluido del gate (D-04): lanza nuxi dev, frágil al lock rancio; ARCH-02 cubierto por el build estatico')

  // Puerto FIJO (un único dev server activo) — no se desplaza por worker.
  const DEV_PORT = 5200
  const DEV_SUBPATH = `http://localhost:${DEV_PORT}/guiaRoma`

  let devServer: ChildProcess | undefined

  // Playwright EXIGE el patrón de desestructuración como primer argumento del hook (rechaza un
  // identificador plano: "First argument must use the object destructuring pattern"). Solo
  // necesitamos testInfo (segundo arg), así que el primero es {} y silenciamos no-empty-pattern.
  // eslint-disable-next-line no-empty-pattern
  test.beforeAll(async ({}, testInfo) => {
    // Suspenders del suspenders: aunque la skip a nivel de describe ya impide llegar aquí sin la
    // bandera, un early-return defensivo garantiza que el spawn de `pnpm dev` sea un no-op si este
    // hook se ejecutara con RUN_DEV_ROUTING sin definir (nunca lanzar un dev server en el gate).
    if (!process.env.RUN_DEV_ROUTING) return

    // El routing/404 es INDEPENDIENTE del viewport (status HTTP + DOM). Lo ejercitamos en UN solo
    // proyecto (desktop) para arrancar UN único `pnpm dev`: dos dev servers en paralelo (uno por
    // proyecto) compiten por la caché .nuxt/el websocket de Vite y el segundo no levanta.
    test.skip(testInfo.project.name !== 'desktop', 'routing solo en desktop (dev server único)')

    test.setTimeout(180_000) // arranque en frío de `pnpm dev` (Nitro + Content)
    devServer = spawn('pnpm', ['dev', '--port', String(DEV_PORT)], {
      stdio: 'ignore',
      shell: false,
      detached: true,
      env: { ...process.env, NUXT_APP_BASE_URL: '/guiaRoma/' },
    })
    devServer.unref()
    await waitForServer(`${DEV_SUBPATH}/`)
  })

  test.afterAll(() => {
    killGroup(devServer)
  })

  test('/trips/roma reutiliza el MISMO TripView y un slug desconocido 404 (ARCH-02)', async ({ page }) => {
    // /trips/roma → mismo shell (TripView reutilizado): mismas 12 pastillas + #inicio.
    const ok = await page.goto(`${DEV_SUBPATH}/trips/roma`)
    expect(ok?.status(), '/trips/roma debe responder 200 (TripView reutilizado)').toBe(200)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('nav.nav-pills#nav-pills .nav-pill')).toHaveText(EXPECTED_PILLS)
    await expect(page.locator('#inicio .hero h1 em')).toBeVisible()

    // slug inexistente → createError 404 fatal (página de error de Nuxt).
    const notFound = await page.goto(`${DEV_SUBPATH}/trips/does-not-exist`)
    expect(notFound?.status(), 'un slug desconocido debe dar 404').toBe(404)
  })
})
