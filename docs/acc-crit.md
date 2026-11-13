# Acceptance criteria

What the JupyterLab markdown insert content extension must do, one criterion per feature the README states.

## Authors

- `@kj` Konrad Jelen

## Table of contents `TOC`

TOC insert, update, depth and exclusion

- log: 2026-11-13T07:14:57Z @kj category created

- [x] `ACC-TOC-1-INSERT` **Insert TOC at the cursor** - HIGH; Insert Table of Contents writes a nested link list of the document headings between TOC:BEGIN and TOC:END at the cursor, in a markdown file and a notebook markdown cell
  - evidence: the tests its test line names pass: build_test.py 2026-11-13: Jest 25, Galata 42 passed
  - test: Galata 'should insert TOC with markers at cursor position'
  - test-tags: E2E
  - log: 2026-11-13T07:14:57Z @kj added
  - log: 2026-11-13T07:19:18Z @kj closed
- [x] `ACC-TOC-2-UPDATE` **Update TOC in place** - HIGH; Update Table of Contents regenerates the list between the markers and keeps the text after TOC:END
  - evidence: the tests its test line names pass: build_test.py 2026-11-13: Jest 25, Galata 42 passed
  - test: Galata 'should update existing TOC when Update TOC is called'
  - test-tags: E2E
  - log: 2026-11-13T07:14:57Z @kj added
  - log: 2026-11-13T07:19:18Z @kj closed
- [x] `ACC-TOC-3-DEPTH` **Per-TOC depth** - MEDIUM; TOC:BEGIN DEPTH=n limits the TOC to heading level n and an update keeps that depth
  - evidence: the tests its test line names pass: build_test.py 2026-11-13: Jest 25, Galata 42 passed
  - test: Galata 'TOC DEPTH parameter is preserved during update'
  - test-tags: E2E
  - log: 2026-11-13T07:14:57Z @kj added
  - log: 2026-11-13T07:19:18Z @kj closed
- [x] `ACC-TOC-4-IGNORE` **Heading exclusion** - MEDIUM; a heading marked TOC:IGNORE is left out of the TOC and still numbered; Toggle Exclude from TOC adds and removes the marker on the cursor line
  - evidence: the tests its test line names pass: build_test.py 2026-11-13: Jest 25, Galata 42 passed
  - test: Galata describe 'TOC:IGNORE Marker'
  - test-tags: E2E
  - log: 2026-11-13T07:14:57Z @kj added
  - log: 2026-11-13T07:19:19Z @kj closed
- [x] `ACC-TOC-5-FENCED` **Fenced code is skipped** - MEDIUM; a line starting with # inside a fenced code block is neither listed in the TOC nor numbered
  - evidence: the tests its test line names pass: build_test.py 2026-11-13: Jest 25, Galata 42 passed
  - test: Galata 'should exclude headings in code blocks from TOC'
  - test-tags: E2E
  - log: 2026-11-13T07:14:57Z @kj added
  - log: 2026-11-13T07:19:19Z @kj closed
- [x] `ACC-TOC-6-ANCHOR` **TOC links match JupyterLab anchors** - HIGH; each TOC link target equals the id JupyterLab gives the rendered heading: text content, case kept, spaces as hyphens, inline markup dropped
  - evidence: the tests its test line names pass: build_test.py 2026-11-13: Jest 25, Galata 42 passed
  - test: jest src/__tests__/headings.spec.ts generateHeadingId
  - test-tags: UNIT
  - log: 2026-11-13T07:14:57Z @kj added
  - log: 2026-11-13T07:19:19Z @kj closed

## Heading numbering `NUM`

Add, remove and update of hierarchical heading numbers

- log: 2026-11-13T07:14:57Z @kj category created

- [x] `ACC-NUM-7-ADD` **Add, update and remove numbering** - HIGH; Add writes 1, 1.1, 1.1.1 on headings up to the numbering level; Update replaces existing numbers, never stacks them; Remove strips them; both the dotless and the trailing-dot form are recognised
  - evidence: the tests its test line names pass: build_test.py 2026-11-13: Jest 25, Galata 42 passed
  - test: Galata describe 'Heading Numbering'; jest stripNumbering
  - test-tags: E2E, UNIT
  - log: 2026-11-13T07:14:57Z @kj added
  - log: 2026-11-13T07:19:19Z @kj closed
- [x] `ACC-NUM-8-TOC-FOLLOWS` **TOC follows numbering** - MEDIUM; after Add, Remove or Update Heading Numbering an existing TOC is regenerated, so its links carry the new heading text
  - evidence: the tests its test line names pass: build_test.py 2026-11-13: Jest 25, Galata 42 passed
  - test: Galata 'full workflow: insert TOC, add numbering, update TOC'
  - test-tags: E2E
  - log: 2026-11-13T07:14:58Z @kj added
  - log: 2026-11-13T07:19:19Z @kj closed

## Fragments `FRAG`

Alert boxes, emoji and glyph picker, menu and settings

- log: 2026-11-13T07:14:58Z @kj category created

- [x] `ACC-FRAG-9-ALERT` **GitHub alert boxes** - MEDIUM; Insert Alert writes a > [!TAG] blockquote for NOTE, TIP, IMPORTANT, WARNING, CAUTION, wraps the selection when there is one, and stays a separate block from the text around it
  - evidence: the tests its test line names pass: build_test.py 2026-11-13: Jest 25, Galata 42 passed
  - test: Galata describe 'GitHub Alert Boxes'
  - test-tags: E2E
  - log: 2026-11-13T07:14:58Z @kj added
  - log: 2026-11-13T07:19:19Z @kj closed
- [x] `ACC-FRAG-10-SYMBOL` **Emoji and glyph picker** - MEDIUM; Insert Symbol opens a dialog with an Emoji and a Glyphs tab, both searchable and keyboard operable; a pick is inserted at the cursor and focus returns to the editor; recent glyphs come first; a code point inserts its character
  - evidence: the tests its test line names pass: build_test.py 2026-11-13: Jest 25, Galata 42 passed
  - test: Galata describes 'Emoji Picker' and 'Glyph Picker'; jest glyphs.spec.ts
  - test-tags: E2E, UNIT
  - log: 2026-11-13T07:14:58Z @kj added
  - log: 2026-11-13T07:19:19Z @kj closed
- [x] `ACC-FRAG-11-MENU` **Markdown Tools menu scope** - HIGH; the Markdown Tools submenu shows on right-click in a markdown file editor and a notebook markdown cell, and not in a non-markdown file editor
  - evidence: the tests its test line names pass: build_test.py 2026-11-13: Jest 25, Galata 42 passed
  - test: Galata 'should show Markdown Tools...' (file, notebook) and 'Fragment Menu Scoping'
  - test-tags: E2E
  - log: 2026-11-13T07:14:58Z @kj added
  - log: 2026-11-13T07:19:19Z @kj closed
- [ ] `ACC-FRAG-12-SETTINGS` **Settings apply without restart** - MEDIUM; tocCaption, tocMaxLevel, numberingMaxLevel and numberingTrailingDot from the settings registry are used by the next command; defaults: bold caption, 3, 5, no trailing dot
  - test: Galata 'numbering respects maxLevel setting (default 5)' covers the defaults; changing a setting is manual
  - test-tags: E2E, MANUAL
  - log: 2026-11-13T07:14:58Z @kj added

