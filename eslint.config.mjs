// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // El CSS editorial se extrae VERBATIM del index.html (paridad por construcción):
  // no debe reformatearse. ESLint flat config no procesa .css por defecto, pero lo
  // ignoramos explícitamente para blindar el verbatim ante reglas futuras.
  //
  // tests/parity/** es el harness Playwright del golden (Plan 01-01): suite E2E
  // independiente con su propio runtime/contexto TS, fuera del código fuente Nuxt.
  // Se mantiene intacta (no se lintea con la config de Nuxt).
  //
  // tests/data/** (puertas Vitest de la Fase 2, Plan 02-01) NO se ignora: es código
  // fuente TS de validación (no un harness verbatim), y debe lintarse como el resto.
  {
    ignores: ['app/assets/css/**', 'tests/parity/**'],
  },
  // `Topbar` es un nombre de componente de UNA palabra por mandato del contrato de
  // marcado (Fase 3): el auto-import debe producir `<Topbar>` para reproducir el shell
  // VERBATIM del index.html (header.topbar). Renombrarlo (p. ej. `TheTopbar`) rompería
  // la paridad por construcción, así que se permite explícitamente ante
  // vue/multi-word-component-names. El resto de componentes ya son multi-palabra
  // (NavPills, ThemeToggle, BackButton), por lo que la regla sigue activa para ellos.
  {
    files: ['app/components/Topbar.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
  // `Timeline` (Plan 04-03) es otro nombre de UNA palabra exigido por el contrato de
  // auto-import: el dispatcher del timeline debe producir `<Timeline>` (gemelo de Topbar).
  // El resto de componentes de la Fase 4 son multi-palabra (MonumentCard, DetailPhoto,
  // TimelineStop, …), por lo que la regla sigue activa para ellos.
  {
    files: ['app/components/Timeline.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
  // `MonumentCard.vue` (Plan 04-02): los bloques `.card-artists`/`.card-arch` reproducen el original
  // `Artistas: <a class="art-link">…</a> <a>…</a>`, donde el ESPACIO entre enlaces es significativo
  // (`.art-link` es inline-block; el hueco se suma al margin). Ese marcado se escribe en una sola
  // línea con separadores `{{ ' ' }}` EXPLÍCITOS porque reformatearlo con saltos de línea haría que
  // el compilador de Vue (whitespace: 'condense') colapsara los huecos y se perdiera la paridad de
  // espaciado (verificado byte-a-byte contra index.html). Por eso se relajan SOLO las dos reglas de
  // saltos de línea de contenido en ESTE fichero; el resto de reglas (incl. el CERO CSS) siguen.
  {
    files: ['app/components/MonumentCard.vue'],
    rules: {
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/max-attributes-per-line': 'off',
    },
  },
)
