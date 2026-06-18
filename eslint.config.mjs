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
  {
    ignores: ['app/assets/css/**', 'tests/parity/**'],
  },
)
