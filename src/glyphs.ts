/**
 * Curated Unicode glyphs for the symbol picker's Glyphs tab.
 *
 * Names are the words people search with, not the official Unicode names -
 * those call the empty star WHITE STAR and the full one BLACK STAR. Some
 * official words go into the keywords, so `white star` also finds ☆.
 */

export interface IGlyph {
  char: string;
  name: string;
  keywords: string;
}

export interface IGlyphGroup {
  name: string;
  glyphs: IGlyph[];
}

type GlyphRow = [char: string, name: string, keywords?: string];

function group(name: string, rows: GlyphRow[]): IGlyphGroup {
  return {
    name,
    glyphs: rows.map(([char, glyphName, keywords = '']) => ({
      char,
      name: glyphName,
      keywords
    }))
  };
}

export const GLYPH_GROUPS: IGlyphGroup[] = [
  group('Stars', [
    ['★', 'full star', 'black filled rating'],
    ['☆', 'empty star', 'white outline hollow rating'],
    ['✦', 'four-pointed star', 'black sparkle'],
    ['✧', 'four-pointed star outline', 'white sparkle'],
    ['✩', 'stress outlined star', 'white'],
    ['✪', 'circled star', 'white'],
    ['✫', 'open centre star', 'black'],
    ['✬', 'centre star', 'black white'],
    ['✭', 'outlined star', 'black'],
    ['✮', 'heavy outlined star', 'black'],
    ['✯', 'pinwheel star'],
    ['✰', 'shadowed star', 'white'],
    ['⁂', 'asterism', 'three stars']
  ]),
  group('Checks', [
    ['✓', 'check mark', 'tick yes done'],
    ['✔', 'heavy check mark', 'tick yes done bold'],
    ['✗', 'ballot x', 'cross no fail'],
    ['✘', 'heavy ballot x', 'cross no fail bold'],
    ['☐', 'empty checkbox', 'ballot box unchecked todo'],
    ['☑', 'checked checkbox', 'ballot box tick done'],
    ['☒', 'crossed checkbox', 'ballot box x']
  ]),
  group('Arrows', [
    ['←', 'left arrow'],
    ['↑', 'up arrow'],
    ['→', 'right arrow'],
    ['↓', 'down arrow'],
    ['↔', 'left right arrow', 'horizontal both'],
    ['↕', 'up down arrow', 'vertical both'],
    ['↗', 'up right arrow', 'north east trend increase'],
    ['↘', 'down right arrow', 'south east trend decrease'],
    ['⇐', 'double left arrow', 'implied by'],
    ['⇒', 'double right arrow', 'implies'],
    ['⇔', 'double left right arrow', 'if and only if equivalent'],
    ['➔', 'heavy right arrow', 'wide-headed'],
    ['➜', 'round-tipped right arrow', 'heavy'],
    ['➤', 'right arrowhead', 'black pointer'],
    ['↩', 'return arrow', 'left hook'],
    ['↪', 'right hook arrow', 'forward']
  ]),
  group('Bars', [
    ['▁', 'bar 1/8', 'lower one eighth block sparkline level'],
    ['▂', 'bar 2/8', 'lower one quarter block sparkline level'],
    ['▃', 'bar 3/8', 'lower three eighths block sparkline level'],
    ['▄', 'bar 4/8', 'lower half block sparkline level'],
    ['▅', 'bar 5/8', 'lower five eighths block sparkline level'],
    ['▆', 'bar 6/8', 'lower three quarters block sparkline level'],
    ['▇', 'bar 7/8', 'lower seven eighths block sparkline level'],
    ['█', 'full block', 'bar 8/8 solid sparkline level'],
    ['▏', 'left bar 1/8', 'left one eighth block horizontal progress'],
    ['▎', 'left bar 2/8', 'left one quarter block horizontal progress'],
    ['▍', 'left bar 3/8', 'left three eighths block horizontal progress'],
    ['▌', 'left bar 4/8', 'left half block horizontal progress'],
    ['▋', 'left bar 5/8', 'left five eighths block horizontal progress'],
    ['▊', 'left bar 6/8', 'left three quarters block horizontal progress'],
    ['▉', 'left bar 7/8', 'left seven eighths block horizontal progress'],
    ['▰', 'progress filled', 'black parallelogram'],
    ['▱', 'progress empty', 'white parallelogram']
  ]),
  group('Shades', [
    ['░', 'light shade', 'texture fill 25'],
    ['▒', 'medium shade', 'texture fill 50'],
    ['▓', 'dark shade', 'texture fill 75'],
    ['█', 'full block', 'solid fill 100']
  ]),
  group('Shapes', [
    ['●', 'filled circle', 'black dot'],
    ['○', 'empty circle', 'white ring'],
    ['◉', 'fisheye', 'radio selected'],
    ['◎', 'bullseye', 'target'],
    ['■', 'filled square', 'black'],
    ['□', 'empty square', 'white'],
    ['▪', 'small filled square', 'black'],
    ['▫', 'small empty square', 'white'],
    ['◆', 'filled diamond', 'black'],
    ['◇', 'empty diamond', 'white'],
    ['▲', 'filled up triangle', 'black'],
    ['△', 'empty up triangle', 'white'],
    ['▼', 'filled down triangle', 'black'],
    ['▽', 'empty down triangle', 'white'],
    ['▶', 'filled right triangle', 'black play'],
    ['◀', 'filled left triangle', 'black back']
  ]),
  group('Box', [
    ['─', 'horizontal line', 'box drawing light'],
    ['│', 'vertical line', 'box drawing light'],
    ['┌', 'top left corner', 'box drawing light down right'],
    ['┐', 'top right corner', 'box drawing light down left'],
    ['└', 'bottom left corner', 'box drawing light up right'],
    ['┘', 'bottom right corner', 'box drawing light up left'],
    ['├', 'tee right', 'box drawing light vertical and right'],
    ['┤', 'tee left', 'box drawing light vertical and left'],
    ['┬', 'tee down', 'box drawing light down and horizontal'],
    ['┴', 'tee up', 'box drawing light up and horizontal'],
    ['┼', 'cross', 'box drawing light vertical and horizontal']
  ]),
  group('Bullets', [
    ['•', 'bullet', 'dot'],
    ['◦', 'empty bullet', 'white dot'],
    ['‣', 'triangular bullet'],
    ['⁃', 'hyphen bullet', 'dash'],
    ['∙', 'bullet operator', 'dot'],
    ['·', 'middle dot', 'interpunct'],
    ['※', 'reference mark', 'komejirushi note'],
    ['§', 'section sign', 'paragraph'],
    ['¶', 'pilcrow', 'paragraph'],
    ['†', 'dagger', 'footnote obelus'],
    ['‡', 'double dagger', 'footnote']
  ]),
  group('Math', [
    ['±', 'plus minus'],
    ['×', 'multiplication', 'times'],
    ['÷', 'division', 'divide'],
    ['≈', 'approximately equal', 'almost'],
    ['≠', 'not equal'],
    ['≤', 'less than or equal'],
    ['≥', 'greater than or equal'],
    ['∞', 'infinity'],
    ['√', 'square root'],
    ['∑', 'summation', 'sum sigma'],
    ['∏', 'product', 'pi'],
    ['∫', 'integral'],
    ['∂', 'partial differential', 'derivative'],
    ['∆', 'increment', 'delta change'],
    ['∈', 'element of', 'in member'],
    ['∉', 'not element of', 'not in member'],
    ['⊂', 'subset of']
  ]),
  group('Greek', [
    ['α', 'alpha'],
    ['β', 'beta'],
    ['γ', 'gamma'],
    ['δ', 'delta'],
    ['ε', 'epsilon'],
    ['λ', 'lambda'],
    ['μ', 'mu', 'micro'],
    ['π', 'pi'],
    ['σ', 'sigma'],
    ['τ', 'tau'],
    ['φ', 'phi'],
    ['ω', 'omega'],
    ['Ω', 'capital omega', 'ohm'],
    ['Σ', 'capital sigma', 'sum'],
    ['Δ', 'capital delta', 'change']
  ]),
  group('Currency', [
    ['€', 'euro'],
    ['£', 'pound', 'sterling'],
    ['¥', 'yen', 'yuan'],
    ['₿', 'bitcoin'],
    ['₹', 'rupee'],
    ['¢', 'cent']
  ]),
  group('Typography', [
    ['–', 'en dash', 'range'],
    ['—', 'em dash'],
    ['…', 'ellipsis', 'dots'],
    ['«', 'left guillemet', 'quote'],
    ['»', 'right guillemet', 'quote'],
    ['‹', 'single left guillemet', 'quote'],
    ['›', 'single right guillemet', 'quote'],
    ['°', 'degree'],
    ['′', 'prime', 'minutes feet'],
    ['″', 'double prime', 'seconds inches'],
    ['™', 'trade mark'],
    ['©', 'copyright'],
    ['®', 'registered']
  ])
];

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s-]+/)
    .filter(Boolean);
}

/**
 * Glyphs where every word of the query starts a word of the name, keywords or
 * group, without repeats. A glyph named exactly by the query comes first, so
 * every glyph is found first by its own name; then glyphs whose name holds
 * every query word whole, so Enter on "pi" inserts π rather than the pinwheel
 * star; then the rest. Each part keeps table order. Matching word starts
 * rather than any substring keeps "checked" from finding the "unchecked" box.
 */
export function searchGlyphs(query: string): IGlyph[] {
  const queryWords = words(query);
  const seen = new Set<string>();
  const whole: IGlyph[] = [];
  const named: IGlyph[] = [];
  const hits: IGlyph[] = [];
  for (const glyphGroup of GLYPH_GROUPS) {
    for (const glyph of glyphGroup.glyphs) {
      const glyphWords = words(
        `${glyph.name} ${glyph.keywords} ${glyphGroup.name}`
      );
      const matches = queryWords.every(queryWord =>
        glyphWords.some(glyphWord => glyphWord.startsWith(queryWord))
      );
      if (matches && !seen.has(glyph.char)) {
        seen.add(glyph.char);
        const nameWords = words(glyph.name);
        if (nameWords.join(' ') === queryWords.join(' ')) {
          whole.push(glyph);
        } else if (queryWords.every(w => nameWords.includes(w))) {
          named.push(glyph);
        } else {
          hits.push(glyph);
        }
      }
    }
  }
  return [...whole, ...named, ...hits];
}

/**
 * The table entry for a character, or an unnamed entry for one outside it
 */
export function glyphFor(char: string): IGlyph {
  for (const glyphGroup of GLYPH_GROUPS) {
    const found = glyphGroup.glyphs.find(glyph => glyph.char === char);
    if (found) {
      return found;
    }
  }
  return { char, name: '', keywords: '' };
}

export function formatCodePoint(char: string): string {
  const value = char.codePointAt(0) ?? 0;
  return `U+${value.toString(16).toUpperCase().padStart(4, '0')}`;
}

// `U+` followed by 1-6 hex digits, or 4-6 bare hex digits
const CODE_POINT = /^(?:u\+([0-9a-f]{1,6})|([0-9a-f]{4,6}))$/i;

/**
 * The glyph a query names by code point - `U+2605` or `2605` - or null
 */
export function parseCodePoint(query: string): IGlyph | null {
  const match = CODE_POINT.exec(query.trim());
  if (!match) {
    return null;
  }
  // A bare hex-only word such as "face" or "cafe" is a search, not a code point
  const hex = match[1] ?? match[2];
  if (!match[1] && !/\d/.test(hex)) {
    return null;
  }
  const value = parseInt(hex, 16);
  if (value > 0x10ffff) {
    return null;
  }
  const char = String.fromCodePoint(value);
  // Control characters, lone surrogates and unassigned code points would
  // corrupt the document rather than insert a visible glyph
  if (/[\p{Cc}\p{Cs}\p{Cn}]/u.test(char)) {
    return null;
  }
  return glyphFor(char);
}

/**
 * The glyph as it should be inserted. Characters that also have an emoji form
 * render as colour emoji on some platforms; the text variation selector
 * U+FE0E keeps them plain text. ASCII is left alone - digits, `#` and `*` are
 * emoji keycap bases, and a selector after them would be invisible noise.
 */
export function withTextPresentation(char: string): string {
  const hasEmojiForm =
    (char.codePointAt(0) ?? 0) > 0x7f &&
    /^\p{Emoji}$/u.test(char) &&
    !/^\p{Emoji_Presentation}$/u.test(char);
  return hasEmojiForm ? `${char}︎` : char;
}
