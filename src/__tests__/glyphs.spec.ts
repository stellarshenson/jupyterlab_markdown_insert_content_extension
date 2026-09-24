import {
  formatCodePoint,
  GLYPH_GROUPS,
  glyphFor,
  parseCodePoint,
  searchGlyphs,
  withTextPresentation
} from '../glyphs';

const chars = (query: string): string[] =>
  searchGlyphs(query).map(glyph => glyph.char);

describe('searchGlyphs', () => {
  it('finds a glyph by its plain name', () => {
    expect(chars('empty star')).toEqual(['☆']);
    expect(chars('full star')).toEqual(['★']);
  });

  it('finds a glyph by words from its official Unicode name', () => {
    expect(chars('white star')).toContain('☆');
    expect(chars('white star')).not.toContain('★');
    // No curated name uses an official colour or shade word, so none
    // outranks ★ or ▓ here
    expect(chars('black star')[0]).toBe('★');
    expect(chars('dark')[0]).toBe('▓');
  });

  it('matches word starts, not any substring', () => {
    // "unchecked" contains "checked" - substring matching put the empty box
    // ahead of the checked one
    expect(chars('checked checkbox')).toEqual(['☑']);
    expect(chars('hecked')).toEqual([]);
  });

  it('puts glyphs named by the whole query first', () => {
    // "pi" also starts pinwheel, pilcrow and the product sign's keyword
    expect(chars('pi')[0]).toBe('π');
  });

  it('finds every glyph first by its own name', () => {
    // A name made of words from an earlier row's name, such as "centre star"
    // inside "open centre star", must still win its own search
    for (const group of GLYPH_GROUPS) {
      for (const glyph of group.glyphs) {
        expect([glyph.name, chars(glyph.name)[0]]).toEqual([
          glyph.name,
          glyph.char
        ]);
      }
    }
  });

  it('matches a prefix while the user is still typing', () => {
    expect(chars('arr')).toEqual(expect.arrayContaining(['←', '→', '↩']));
  });

  it('splits hyphenated names into words', () => {
    expect(chars('pointed')).toEqual(['✦', '✧']);
  });

  it('matches the group name', () => {
    expect(chars('currency')).toEqual(['€', '£', '¥', '₿', '₹', '¢']);
  });

  it('lists a glyph that sits in two groups once', () => {
    expect(chars('full block')).toEqual(['█']);
  });
});

describe('parseCodePoint', () => {
  it('accepts U+ with any case and surrounding space', () => {
    expect(parseCodePoint('U+2605')?.char).toBe('★');
    expect(parseCodePoint('u+2605')?.char).toBe('★');
    expect(parseCodePoint('  U+2605  ')?.char).toBe('★');
    expect(parseCodePoint('U+41')?.char).toBe('A');
  });

  it('accepts 4 to 6 bare hex digits', () => {
    expect(parseCodePoint('2605')?.char).toBe('★');
    expect(parseCodePoint('1F600')?.char).toBe('😀');
    expect(parseCodePoint('41')).toBeNull();
  });

  it('treats a hex-only word as a search, not a code point', () => {
    expect(parseCodePoint('face')).toBeNull();
    expect(parseCodePoint('cafe')).toBeNull();
    expect(parseCodePoint('U+FACE')?.char).toBe('龜');
  });

  it('names a code point that is in the table', () => {
    expect(parseCodePoint('2606')?.name).toBe('empty star');
    expect(parseCodePoint('U+41')?.name).toBe('');
  });

  it('rejects code points that would corrupt the document', () => {
    expect(parseCodePoint('U+0007')).toBeNull(); // control
    expect(parseCodePoint('D800')).toBeNull(); // lone surrogate
    expect(parseCodePoint('0378')).toBeNull(); // unassigned
    expect(parseCodePoint('U+110000')).toBeNull(); // beyond Unicode
  });
});

describe('withTextPresentation', () => {
  it('appends U+FE0E to glyphs that also have an emoji form', () => {
    expect(withTextPresentation('☑')).toBe('☑︎');
    expect(withTextPresentation('▶')).toBe('▶︎');
    expect(withTextPresentation('©')).toBe('©︎');
  });

  it('leaves text-only glyphs, emoji and ASCII unchanged', () => {
    expect(withTextPresentation('★')).toBe('★');
    expect(withTextPresentation('⭐')).toBe('⭐');
    expect(withTextPresentation('😀')).toBe('😀');
    expect(withTextPresentation('0')).toBe('0');
    expect(withTextPresentation('#')).toBe('#');
  });
});

describe('formatCodePoint and glyphFor', () => {
  it('formats the code point with at least four hex digits', () => {
    expect(formatCodePoint('A')).toBe('U+0041');
    expect(formatCodePoint('★')).toBe('U+2605');
    expect(formatCodePoint('😀')).toBe('U+1F600');
  });

  it('returns the table entry, or an unnamed one outside the table', () => {
    expect(glyphFor('★').name).toBe('full star');
    expect(glyphFor('A')).toEqual({ char: 'A', name: '', keywords: '' });
  });
});

describe('GLYPH_GROUPS', () => {
  it('holds one named, single code point glyph per entry', () => {
    for (const group of GLYPH_GROUPS) {
      for (const glyph of group.glyphs) {
        expect([...glyph.char]).toHaveLength(1);
        expect(glyph.name).not.toBe('');
      }
    }
  });
});
