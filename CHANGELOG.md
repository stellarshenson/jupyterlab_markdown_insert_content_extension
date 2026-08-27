# Changelog

## [1.1.28] - 2026-08-27

### Added

- GitHub alert blockquotes (`> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`) inserted from the Markdown Tools context menu, wrapping the current selection or seeding placeholder text
- Emoji picker dialog with search and a frequently-used bar that persists across sessions, backed by a bundled dataset so it works offline
- Galata functional test suite covering both fragments in markdown file editors and notebook markdown cells

### Changed

- Makefile adopted from the shared extension template - project-local nodeenv, `jlpm prettier`, pytest in `test`
- Emoji dataset ships as a labextension static asset rather than being fetched from a CDN
- `schema/*.json` and `webpack.config.js` added to the published npm tarball

### Fixed

- Alert blockquotes are now separated by blank lines, so a following paragraph is no longer absorbed into the alert by CommonMark lazy continuation
- Insertions splice the selection instead of rewriting the whole document, preserving cursor position and undo granularity
- Enter in the emoji picker selects the highlighted emoji instead of cancelling the dialog
- Focus returns to the editor after inserting an alert or an emoji
- Emoji picker no longer overflows the dialog body, which had sliced its frequently-used bar
- Galata suite runs again - galata 5.6.3 for JupyterLab 4.6, Playwright 1.62, and a configurable test port

<!-- <START NEW CHANGELOG ENTRY> -->

## 1.0.22 (2025-01-11)

**Released**: RELEASE_1.0.22

- Implemented table of contents insertion with context menu integration
- Added configurable settings for TOC caption and maximum heading level
- Added code block filtering to exclude headings within fenced code blocks
- Fixed anchor ID generation to match JupyterLab format (preserves Title-Case and special characters)
- Changed default maximum heading level from 6 to 3
- Updated README with badges, features section, and screenshots
- Updated GitHub Actions workflows for CI/CD, testing, and release management
- Fixed repository URL, homepage, and bugs URL in package.json
- Fixed code formatting issues with Prettier and ESLint

<!-- <END NEW CHANGELOG ENTRY> -->
