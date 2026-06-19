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
)
