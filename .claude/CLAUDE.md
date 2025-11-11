<!-- Import workspace-level CLAUDE.md configuration -->
<!-- See /home/lab/workspace/.claude/CLAUDE.md for complete rules -->

# Project-Specific Configuration

This file extends workspace-level configuration with project-specific rules.

## Project Context

**Project**: JupyterLab Markdown Insert Content Extension
**Type**: JupyterLab extension (TypeScript/Python hybrid)
**Purpose**: Extension for inserting reusable content blocks into markdown cells in JupyterLab

### Technology Stack

- JupyterLab 4.x extension framework
- TypeScript for frontend components
- Python for backend server extension
- npm/yarn for JavaScript dependency management
- jlpm for JupyterLab-specific tooling
- pytest for Python testing

### Naming Conventions

- Package name: `jupyterlab_markdown_insert_content_extension`
- Repository naming follows pattern: `jupyterlab_<feature>_extension`
- Python module uses underscores
- TypeScript/JavaScript uses camelCase for variables, PascalCase for classes

### Development Workflow

- Use `jlpm` command for package management (JupyterLab's wrapper around yarn)
- Development install: `pip install -e .`
- Build frontend: `jlpm build`
- Watch mode: `jlpm watch`
- Standard JupyterLab extension structure with `src/` and `style/` directories
