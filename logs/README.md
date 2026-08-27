# Logs

Build and test output. The logs themselves are gitignored; this file is not.

- `make-build.log` - `make build` (npm/jlpm install, TypeScript compile, `python -m build`)
- `make-install.log` - `make install` (build plus the wheel install)
- `uitests-install.log` - `jlpm install` in `ui-tests/`
- `galata-fragments.log` - the Galata run for `ui-tests/tests/markdown-fragments.spec.ts` alone
- `galata-full.log` - the full Galata suite
