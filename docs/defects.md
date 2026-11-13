# Defects

Known defects of the JupyterLab markdown insert content extension, found by reading src/, schema/ and the README.

## Authors

- `@kj` Konrad Jelen

## Heading numbering `NUM`

Add, remove and update of hierarchical heading numbers

- log: 2026-11-13T07:14:38Z @kj category created

- [x] `DEF-NUM-1-DOTLESS` **Dotless numbering is not recognised** - MAJOR; default numbering has no trailing dot (1, 1.1) but NUMBERING_PATTERN needs one; Add twice or Update gives '# 1 1 First', '## 1.1 1 Sub'; Remove leaves '# 1 First'; src/index.ts
  - evidence: pattern now /^\d+(\.\d+)*\.?\s+/ in src/headings.ts; jest stripNumbering and Galata 'should renumber and remove numbering written without the trailing dot'; build_test.py 2026-11-13: Jest 25, Galata 42 passed
  - root-cause: 2026-11-13T07:19:17Z @kj NUMBERING_PATTERN /^(\d+\.)+\s*/ needs a dot after every number; default numberingTrailingDot false writes none after the last
  - repro: default settings, md file '# First', Add Heading Numbering, then Update Heading Numbering
  - log: 2026-11-13T07:14:38Z @kj added
  - log: 2026-11-13T07:19:18Z @kj closed
- [x] `DEF-NUM-2-TOC-STALE` **TOC links wrong after add or remove numbering** - MEDIUM; notebook Remove Heading Numbering runs per cell, TOC in another cell keeps numbered links; two headings with one name ('Summary') both get the last one's number on Add; README promises automatic TOC update
  - evidence: Add and Remove commands call updateTOCIn* after numbering, both contexts, src/index.ts; Galata 'full workflow' passes; notebook path not run in a browser; build_test.py 2026-11-13: Jest 25, Galata 42 passed
  - root-cause: 2026-11-13T07:19:18Z @kj TOC links were patched by a per-heading-name regex over the text being numbered; notebook remove sees one cell at a time, and one name maps to one link
  - repro: notebook, TOC in cell 1, numbered headings in cell 2, Remove Heading Numbering, click a TOC link
  - log: 2026-11-13T07:14:38Z @kj added
  - log: 2026-11-13T07:19:18Z @kj closed
- [x] `DEF-NUM-3-CELL-NEWLINE` **Notebook numbering moves a newline between cells** - MINOR; addNumberingInNotebook joins and splits cells on a blank line; a markdown cell ending with one newline loses it and the next markdown cell starts with it
  - evidence: cells joined and split on a NUL separator line, one part per cell, src/index.ts addNumberingInNotebook; no notebook test, verified by reading; build_test.py 2026-11-13: Jest 25, Galata 42 passed
  - root-cause: 2026-11-13T07:19:18Z @kj cells joined with a blank line and split on blank lines; a source ending in a newline shifts the split point
  - repro: two markdown cells, first source ends with a newline, Add Heading Numbering, read second cell source
  - log: 2026-11-13T07:14:38Z @kj added
  - log: 2026-11-13T07:19:18Z @kj closed

## Table of contents `TOC`

TOC generation, update and anchor links

- log: 2026-11-13T07:14:38Z @kj category created

- [x] `DEF-TOC-4-ANCHOR-MARKUP` **TOC link dead for a heading with inline markup** - MAJOR; generateHeadingId keeps backticks, asterisks and link syntax, JupyterLab builds the id from the rendered text; '## The `run` command' gets link #The-`run`-command, real id The-run-command
  - evidence: generateHeadingId drops code spans, asterisk emphasis and link syntax, src/headings.ts; jest generateHeadingId 3 cases; build_test.py 2026-11-13: Jest 25, Galata 42 passed
  - root-cause: 2026-11-13T07:19:18Z @kj generateHeadingId hyphenated the markdown source; rendermime createHeaderId uses header.textContent, which has no inline markup
  - repro: md file with '## The `run` command', Insert Table of Contents, open preview, click the link
  - log: 2026-11-13T07:14:38Z @kj added
  - log: 2026-11-13T07:19:18Z @kj closed

## Documentation `DOCS`

README claims against the code

- log: 2026-11-13T07:14:38Z @kj category created

- [x] `DEF-DOCS-5-DEFAULTS` **README states wrong numbering defaults** - MINOR; README says numbering level default 3 and trailing dot enabled, example '# 1. Introduction'; schema/plugin.json and the code default to 5 and no trailing dot
  - evidence: README Features, Heading Numbering and Configure Settings state 5, disabled and '# 1 Introduction', matching schema/plugin.json
  - root-cause: 2026-11-13T07:19:18Z @kj README not updated when the schema defaults changed to 5 and no trailing dot
  - repro: compare README Configure Settings with schema/plugin.json
  - log: 2026-11-13T07:14:38Z @kj added
  - log: 2026-11-13T07:19:18Z @kj closed

## Code quality `CODE`

Structure of src/index.ts

- log: 2026-11-13T07:14:38Z @kj category created

- [-] `DEF-CODE-6-DISPATCH-DUP` **Context dispatch repeated in six commands** - MINOR; each numbering and TOC command repeats the notebook or markdown-file check, and toggleTOCIgnore exists once per context; about 200 duplicated lines in src/index.ts, no user-visible effect
  - repro: read the execute bodies of the six markdown-insert commands in src/index.ts
  - log: 2026-11-13T07:14:38Z @kj added
  - log: 2026-11-13T07:19:25Z @kj rejected: no user-visible effect; removing it rewrites about 200 lines of command registration, an overhaul by the campaign rule
- [-] `DEF-CODE-7-SETSOURCE-CARET` **Whole-document setSource moves the caret** - MINOR; numbering, TOC update and TOC:IGNORE toggle replace the whole source with setSource, so the caret goes to offset 0 and undo is one whole-document step
  - repro: md file, caret in the last line, Add Heading Numbering, type a character
  - log: 2026-11-13T07:14:38Z @kj added
  - log: 2026-11-13T07:19:26Z @kj rejected: caret reset after a whole-document command is cosmetic and not confirmed to scroll the view; a minimal-diff update is new logic at six call sites for no reported harm

