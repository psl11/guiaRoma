/**
 * Helpers de los GUARDIANES CSS (multitripCss.spec.ts, tripShapesCss.spec.ts y la mitad de build
 * de tests/data/build-isolation.spec.ts). NO es un spec.
 *
 * Existe como módulo aparte porque importar un `.spec.ts` desde otro fichero re-registra sus
 * suites (Vitest ejecuta los `describe`/`it` del módulo importado dentro del importador; ver la
 * cabecera de romaChromeGuard.spec.ts). Aquí solo hay funciones puras: Node puro, sin Vitest.
 */

/**
 * Selectores de una hoja CSS, en orden. Quita los comentarios y recorre el texto: el preludio
 * antes de cada `{` es una at-rule (empieza por `@`, no cuenta como selector) o una lista de
 * selectores separados por comas. Los espacios internos se normalizan a uno.
 */
export function cssSelectors(css: string): string[] {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const out: string[] = []
  let buf = ''
  for (const ch of src) {
    if (ch === '{') {
      const prelude = buf.trim()
      buf = ''
      if (prelude === '' || prelude.startsWith('@')) continue
      for (const sel of prelude.split(',')) {
        const s = sel.replace(/\s+/g, ' ').trim()
        if (s) out.push(s)
      }
    }
    else if (ch === '}' || ch === ';') {
      buf = ''
    }
    else {
      buf += ch
    }
  }
  return out
}

/**
 * Clases nuevas de la Fase 12 (lista CERRADA de 12-UI-SPEC, D-17). Ninguna aparece en el DOM de
 * Roma; cada selector de tripshapes.css debe contener al menos una como token completo.
 */
export const NEW_CLASSES = [
  'tl-choice', 'tl-choice-heading', 'tl-choice-option', 'tl-choice-label', 'tl-choice-title', 'tl-choice-sep',
  'day-stay', 'day-stay-name', 'family-box', 'ferry', 'car', 'bus', 'bike', 'plane',
] as const

const NEW_CLASS_SET: ReadonlySet<string> = new Set<string>(NEW_CLASSES)

/** Clases de un selector como tokens completos (`.tl-transport.car::before` → tl-transport, car). */
export function classTokens(selector: string): string[] {
  return [...selector.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map(m => m[1]!)
}

/**
 * Selectores de tripshapes.css que podrían alcanzar el DOM de Roma: los que no llevan ningún token
 * de `NEW_CLASSES` y los que usan algo prohibido aunque lo lleven — selectores funcionales
 * (`:not(`, `:is(`, `:where(`, `:has(`: dentro de ellos la clase deja de ser requisito), `:root`,
 * selectores de atributo (`[`: `[class*="car"]` casaría con `card`) o un selector de tipo
 * `html`/`body`.
 */
export function tripShapesOffenders(css: string): string[] {
  return cssSelectors(css).filter(s =>
    !classTokens(s).some(c => NEW_CLASS_SET.has(c))
    || /:(not|is|where|has)\(/.test(s)
    || s.includes(':root')
    || s.includes('[')
    || /(^|[\s>+~])(html|body)(?![\w-])/.test(s),
  )
}

/** Tokens de clase de TODOS los atributos `class="…"` de un HTML, en orden de aparición. */
export function htmlClassTokens(html: string): string[] {
  return [...html.matchAll(/\bclass="([^"]*)"/g)].flatMap(m => m[1]!.split(/\s+/).filter(Boolean))
}
