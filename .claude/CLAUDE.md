<!-- @import /home/lab/workspace/.claude/CLAUDE.md -->

# Project-Specific Configuration

This file imports workspace-level configuration from `/home/lab/workspace/.claude/CLAUDE.md`.
All workspace rules apply. Project-specific rules below strengthen or extend them.

The workspace `/home/lab/workspace/.claude/` directory contains additional instruction files
(MERMAID.md, NOTEBOOK.md, DATASCIENCE.md, GIT.md, and others) referenced by CLAUDE.md.
Consult workspace CLAUDE.md and the .claude directory to discover all applicable standards.

## Mandatory Bans (Reinforced)

The following workspace rules are STRICTLY ENFORCED for this project:

- **No automatic git tags** - only create tags when user explicitly requests
- **No automatic version changes** - only modify version in package.json/pyproject.toml/etc. when user explicitly requests
- **No automatic publishing** - never run `make publish`, `npm publish`, `twine upload`, or similar without explicit user request
- **No manual package installs if Makefile exists** - use `make install` or equivalent Makefile targets, not direct `pip install`/`uv install`/`npm install`
- **No automatic git commits or pushes** - only when user explicitly requests

## Project Context

**Project**: JupyterLab Markdown Insert Content Extension
**Type**: JupyterLab extension (TypeScript/Python hybrid)
**Version**: 1.1.15
**Purpose**: Extension for inserting reusable content blocks into markdown cells in JupyterLab - TOC generation, heading numbering, TOC:IGNORE markers, per-TOC depth configuration

### Technology Stack

- JupyterLab 4.x extension framework
- TypeScript for frontend components
- Python for backend server extension
- npm/yarn for JavaScript dependency management
- jlpm for JupyterLab-specific tooling
- pytest for Python testing
- Playwright for integration tests

### Naming Conventions

- Package name: `jupyterlab_markdown_insert_content_extension`
- Repository naming follows pattern: `jupyterlab_<feature>_extension`
- Python module uses underscores
- TypeScript/JavaScript uses camelCase for variables, PascalCase for classes

### Development Workflow

- Use `jlpm` command for package management (JupyterLab's wrapper around yarn)
- Development install via Makefile targets (project has a Makefile)
- Build frontend: `jlpm build`
- Watch mode: `jlpm watch`
- Standard JupyterLab extension structure with `src/` and `style/` directories

## Strengthened Rules

- **Makefile-first development**: This project has a Makefile - always use `make install`, `make build`, etc. instead of direct package manager commands
- **Version discipline**: Version is at 1.1.15 with npm/PyPI publications - version changes require explicit approval
- **JupyterLab extension conventions**: Follow JUPYTERLAB_EXTENSION.md for extension-specific patterns and jupyter-releaser CI/CD
