import { generateHeadingId, stripNumbering } from '../headings';

describe('stripNumbering', () => {
  it('removes numbering written without the trailing dot, the default', () => {
    expect(stripNumbering('1 Introduction')).toBe('Introduction');
    expect(stripNumbering('1.2 Sub First')).toBe('Sub First');
    expect(stripNumbering('1.2.3 Deep Section')).toBe('Deep Section');
  });

  it('removes numbering written with the trailing dot', () => {
    expect(stripNumbering('1. Introduction')).toBe('Introduction');
    expect(stripNumbering('1.2.3. Deep Section')).toBe('Deep Section');
  });

  it('keeps a number that is part of the first word', () => {
    expect(stripNumbering('1.5x faster')).toBe('1.5x faster');
    expect(stripNumbering('3D rendering')).toBe('3D rendering');
    expect(stripNumbering('Introduction')).toBe('Introduction');
  });
});

describe('generateHeadingId', () => {
  it('replaces spaces with hyphens and keeps case and punctuation', () => {
    expect(generateHeadingId('CPL-1: User Experience')).toBe(
      'CPL-1:-User-Experience'
    );
    expect(generateHeadingId('1.2 Numbered Heading')).toBe(
      '1.2-Numbered-Heading'
    );
  });

  it('drops inline markup, as the rendered heading does', () => {
    expect(generateHeadingId('The `run` command')).toBe('The-run-command');
    expect(generateHeadingId('**Bold** and *soft* words')).toBe(
      'Bold-and-soft-words'
    );
    expect(generateHeadingId('See [the docs](https://example.com)')).toBe(
      'See-the-docs'
    );
  });

  it('keeps an asterisk inside a code span', () => {
    expect(generateHeadingId('`*args` and `**kwargs`')).toBe(
      '*args-and-**kwargs'
    );
    expect(generateHeadingId('snake_case_name')).toBe('snake_case_name');
  });
});
