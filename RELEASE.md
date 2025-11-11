# Release v1.0.22

## Features

- Table of contents insertion with context menu integration for markdown files and notebook cells
- Configurable TOC caption and maximum heading level through JupyterLab settings
- Code block filtering - excludes headings within fenced code blocks from TOC
- JupyterLab-compatible anchor ID generation preserving Title-Case and special characters
- Cursor-aware insertion at current editor position
- Dual mode support for file editors and notebook markdown cells

## Settings

- `tocCaption` - markdown content inserted before TOC (default: `## Table of Contents`)
- `tocMaxLevel` - maximum heading level to include 1-6 (default: 3)

## Documentation

- Comprehensive README with features, usage instructions, and screenshots
- GitHub Actions workflows for CI/CD, testing, and release management
- Complete package metadata (repository URL, homepage, bugs URL)

## Installation

```bash
pip install jupyterlab_markdown_insert_content_extension
```

## Usage

1. Open a markdown file or create a markdown cell in a notebook
2. Position cursor where you want the TOC inserted
3. Right-click and select "Insert Table of Contents"
4. TOC is generated with links to all headings in the document
