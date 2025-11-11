# jupyterlab_markdown_insert_content_extension

[![GitHub Actions](https://github.com/stellarshenson/jupyterlab_markdown_insert_content_extension/actions/workflows/build.yml/badge.svg)](https://github.com/stellarshenson/jupyterlab_markdown_insert_content_extension/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/jupyterlab_markdown_insert_content_extension.svg)](https://www.npmjs.com/package/jupyterlab_markdown_insert_content_extension)
[![PyPI version](https://img.shields.io/pypi/v/jupyterlab_markdown_insert_content_extension.svg)](https://pypi.org/project/jupyterlab_markdown_insert_content_extension/)
[![Total PyPI downloads](https://static.pepy.tech/badge/jupyterlab_markdown_insert_content_extension)](https://pepy.tech/project/jupyterlab_markdown_insert_content_extension)
[![JupyterLab 4](https://img.shields.io/badge/JupyterLab-4-orange.svg)](https://jupyterlab.readthedocs.io/en/stable/)

JupyterLab extension for inserting reusable content blocks into markdown files and notebook cells, starting with automatic table of contents generation.

## Features

- **Context menu integration** - right-click in markdown editors or notebook cells to insert content
- **Table of contents generation** - automatically extracts headings and creates hierarchical TOC with working anchor links
- **Configurable settings** - customize TOC caption and maximum heading depth through JupyterLab settings
- **Code block filtering** - excludes headings within fenced code blocks from TOC
- **JupyterLab-compatible anchors** - generates anchor IDs matching JupyterLab's format for reliable navigation
- **Dual mode support** - works in both markdown file editors and notebook markdown cells
- **Cursor-aware insertion** - inserts content at current cursor position

Right-click in markdown editor or notebook cell to access the context menu:

![](.resources/screenshot-menu.png)

Generated table of contents with hierarchical structure and working anchor links:

![](.resources/screenshot-toc.png)

Configure TOC caption and maximum heading level through JupyterLab settings:

![](.resources/screenshot-settings.png)

## Requirements

- JupyterLab >= 4.0.0

## Install

```bash
pip install jupyterlab_markdown_insert_content_extension
```

## Usage

### Insert Table of Contents

1. Open a markdown file or create a markdown cell in a notebook
2. Position cursor where you want the TOC inserted
3. Right-click and select "Insert Table of Contents"
4. TOC is generated with links to all headings in the document

### Configure Settings

Access settings through Settings -> Settings Editor -> Markdown Insert Content:

- **TOC Caption** - markdown content inserted before TOC list (default: `## Table of Contents`)
- **Maximum Heading Level** - deepest heading level to include (1-6, default: 3)

Settings apply immediately without restart.

## Uninstall

```bash
pip uninstall jupyterlab_markdown_insert_content_extension
```

## Development

### Development install

```bash
# Clone repository
git clone https://github.com/stellarshenson/jupyterlab_markdown_insert_content_extension.git
cd jupyterlab_markdown_insert_content_extension

# Set up virtual environment
python -m venv .venv
source .venv/bin/activate
pip install --editable "."

# Link extension with JupyterLab
jupyter labextension develop . --overwrite

# Build extension
jlpm install
jlpm build
```

### Development workflow

```bash
# Watch mode - automatically rebuilds on changes
jlpm watch

# In another terminal, run JupyterLab
jupyter lab
```

Refresh JupyterLab after changes to load updated extension.

### Development uninstall

```bash
pip uninstall jupyterlab_markdown_insert_content_extension
jupyter labextension list  # Find labextensions folder
# Remove symlink from labextensions folder
```

### Testing

**Frontend tests**:

```bash
jlpm test
```

**Integration tests**:
See [ui-tests/README.md](./ui-tests/README.md) for Playwright integration tests.

### Packaging

See [RELEASE.md](RELEASE.md) for release process.
