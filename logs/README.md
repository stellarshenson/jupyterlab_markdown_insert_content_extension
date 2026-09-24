# Logs

Build and test output. The logs themselves are gitignored; this file is not.

- `jlpm-build.log` - `jlpm build` (development build of lib/ and the labextension, no version change)
- `jlpm-build-prod.log` - `jlpm build:prod` (clean production build of lib/ and the labextension, no version change)
- `make-check-dependencies.log` - `make check_dependencies` (installs node_modules with jlpm when it is missing, no version change)
- `make-build.log` - `make build` (npm/jlpm install, TypeScript compile, `python -m build`)
- `make-install.log` - `make install` (build plus the wheel install)
- `make-upgrade.log` - `make upgrade` (`jlpm up`)
- `lint-check.log` - `jlpm run lint:check` (stylelint, prettier and eslint without fixing)
- `make-test.log` - `make test` (Jest unit tests with coverage, then pytest when a tests directory exists)
- `uitests-install.log` - `jlpm install` in `ui-tests/`
- `galata-fragments.log` - the Galata run for `ui-tests/tests/markdown-fragments.spec.ts` alone
- `galata-full.log` - the full Galata suite
- `python-build.log` - `python -m build` into a directory outside the repository (sdist and wheel, no version change)
- `publish-<version>.log` - `make publish` for that release (build, npm and PyPI upload, post-publish commit)
