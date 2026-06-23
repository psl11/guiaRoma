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
  // Componentes hoja del timeline (Plan 04-03) que incrustan `<MDC>` en contenedores inline
  // WHITESPACE-SENSIBLES del original: `.tl-note`, `.tl-transport-mode-desc` (con el
  // `.tl-transport-mode-tag` anidado justo tras el desc), `.tl-transport-mode-meta`,
  // `.tl-transport-footnote`, `.tl-food-desc`, `.tl-food-foot`. En index.html el contenido va
  // PEGADO a su contenedor (`<div class="tl-note">texto</div>`, sin nodos de texto en blanco).
  // Insertar saltos de línea entre el contenedor y el `<MDC>`/`<span>` introduciría nodos de texto
  // que el compilador de Vue (whitespace: 'condense') trataría de forma distinta a la paridad
  // verbatim; y el `<MDC>` lleva 2+ atributos (`:value`/`:tag`/`unwrap`). Por eso se relajan SOLO
  // las tres reglas de formato de contenido/atributos en ESTOS ficheros (mismo precedente que
  // MonumentCard); el resto (incl. el CERO CSS y multi-word salvo Timeline) sigue activo.
  {
    files: [
      'app/components/TimelineStop.vue',
      'app/components/TimelineTransport.vue',
      'app/components/TimelineMeta.vue',
      'app/components/TimelineFood.vue',
      'app/components/TimelineReservation.vue',
    ],
    rules: {
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/max-attributes-per-line': 'off',
    },
  },
  // Secciones de referencia (Plan 04-04) con marcado inline WHITESPACE-SENSIBLE del original:
  //  · ArtistCard `.artist-trip`: los enlaces de `seenIn` van separados por " · " EXPLÍCITO
  //    (`{{ ' · ' }}`) y cada `<MDC>` lleva 2+ atributos en una sola línea (gemelo del patrón
  //    `card-artists` de MonumentCard; reformatear con saltos colapsaría los separadores).
  //  · ReservasSection `.reservas-confirmadas li` (`rc-when` + " — " + `<MDC>`) y las celdas de
  //    `.reservas-table` (a/strong + badge + `<MDC>`) van PEGADAS a su contenedor, sin nodos de
  //    texto en blanco (verbatim index.html:5269/5287).
  //  · PracticaSection: `<li>` de `.detail-list` con `<MDC>` inline y los `<MDC :components>`
  //    multi-atributo.
  // Por eso se relajan SOLO las tres reglas de formato de contenido/atributos en ESTOS ficheros
  // (mismo precedente que MonumentCard/Timeline); el resto (incl. el CERO CSS) sigue activo.
  {
    files: [
      'app/components/ArtistCard.vue',
      'app/components/ReservasSection.vue',
      'app/components/PracticaSection.vue',
    ],
    rules: {
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/max-attributes-per-line': 'off',
    },
  },
  // `DetailPhoto.global.vue` (Plan 07-03): el fallback SVG de imagen rota va PEGADO dentro de
  // `.detail-photo` (un `<span v-else-if v-html>` que sustituye a la `<img>` cuando falla, mismo
  // contenedor whitespace-sensible del original donde `img`/`svg` y `.detail-photo-caption` son
  // hermanos sin nodos de texto en blanco — index.html:2479-2482 / loadSvgFallbackDetail). Ese
  // `<span>` lleva 2 directivas en una línea (`v-else-if` + `v-html`) para mantener el comentario
  // `eslint-disable-next-line vue/no-v-html` adyacente al directivo (la constante SVG es de
  // CONFIANZA). Por eso se relaja SOLO `max-attributes-per-line` en ESTE fichero (mismo precedente
  // que MonumentCard/Timeline/secciones de referencia); el resto (incl. el CERO CSS) sigue activo.
  {
    files: ['app/components/DetailPhoto.global.vue'],
    rules: {
      'vue/max-attributes-per-line': 'off',
    },
  },
)
