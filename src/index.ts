import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IEditorTracker } from '@jupyterlab/fileeditor';
import { INotebookTracker } from '@jupyterlab/notebook';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

/**
 * Command IDs
 */
namespace CommandIDs {
  export const insertTOC = 'markdown-insert:insert-toc';
}

/**
 * Heading interface for TOC generation
 */
interface IHeading {
  text: string;
  level: number;
  id: string;
}

/**
 * Settings interface
 */
interface ISettings {
  tocCaption: string;
  tocMaxLevel: number;
}

/**
 * Generates anchor ID from heading text matching JupyterLab's format
 * JupyterLab preserves Title-Case and replaces spaces with hyphens
 * Examples:
 *   "Technology Decision Summary" -> "Technology-Decision-Summary"
 *   "CPL-1: User Experience" -> "CPL-1:-User-Experience"
 */
function generateHeadingId(text: string): string {
  // Remove trailing pilcrow (¶) if present
  const cleaned = text.replace(/¶+$/, '').trim();

  // Replace spaces with hyphens, preserving case and special characters
  return cleaned.replace(/\s+/g, '-');
}

/**
 * Extracts headings from markdown text, excluding headings in code blocks
 */
function extractHeadings(text: string, maxLevel: number): IHeading[] {
  const headings: IHeading[] = [];
  const lines = text.split('\n');
  let inCodeBlock = false;

  for (const line of lines) {
    // Check for code block delimiters (``` or ~~~)
    if (line.match(/^```/) || line.match(/^~~~/)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Skip lines inside code blocks
    if (inCodeBlock) {
      continue;
    }

    // Match ATX-style headings (# Heading)
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;

      // Skip headings beyond max level
      if (level > maxLevel) {
        continue;
      }

      const text = match[2].trim();
      const id = generateHeadingId(text);

      headings.push({
        text: text,
        level: level,
        id: id
      });
    }
  }

  return headings;
}

/**
 * Generates TOC markdown from headings
 */
function generateTOC(headings: IHeading[], caption: string): string {
  const lines: string[] = [];

  for (const heading of headings) {
    // Calculate indentation (2 spaces per level, starting from level 2)
    const indent = '  '.repeat(Math.max(0, heading.level - 1));

    // Create link
    const link = `${indent}- [${heading.text}](#${heading.id})`;
    lines.push(link);
  }

  // Caption is raw markdown - insert verbatim
  const captionPart = caption ? `${caption}\n\n` : '';
  return `${captionPart}${lines.join('\n')}\n\n`;
}

/**
 * Inserts TOC at cursor position in file editor
 */
function insertTOCInFileEditor(
  editorTracker: IEditorTracker,
  settings: ISettings
): void {
  const widget = editorTracker.currentWidget;
  if (!widget) {
    console.warn('No active file editor');
    return;
  }

  const editor = widget.content.editor;
  const model = widget.content.model;

  // Get document text
  const text = model.sharedModel.getSource();

  // Extract headings
  const headings = extractHeadings(text, settings.tocMaxLevel);

  if (headings.length === 0) {
    console.warn('No headings found in document');
    return;
  }

  // Generate TOC markdown
  const tocMarkdown = generateTOC(headings, settings.tocCaption);

  // Insert at cursor position
  const cursor = editor.getCursorPosition();
  const offset = editor.getOffsetAt(cursor);

  model.sharedModel.updateSource(offset, offset, tocMarkdown);
}

/**
 * Inserts TOC at cursor position in notebook cell (edit mode only)
 */
function insertTOCInNotebook(
  notebookTracker: INotebookTracker,
  settings: ISettings
): void {
  const panel = notebookTracker.currentWidget;
  if (!panel) {
    console.warn('No active notebook');
    return;
  }

  const notebook = panel.content;
  const activeCell = notebook.activeCell;

  if (!activeCell || activeCell.model.type !== 'markdown') {
    console.warn('Active cell is not a markdown cell');
    return;
  }

  const editor = activeCell.editor;
  const model = activeCell.model;

  if (!editor) {
    console.warn('No editor available - cell may not be in edit mode');
    return;
  }

  // Collect all markdown text from all markdown cells
  let allText = '';
  for (let i = 0; i < notebook.model!.cells.length; i++) {
    const cell = notebook.model!.cells.get(i);
    if (cell.type === 'markdown') {
      allText += cell.sharedModel.getSource() + '\n\n';
    }
  }

  // Extract headings from all markdown cells
  const headings = extractHeadings(allText, settings.tocMaxLevel);

  if (headings.length === 0) {
    console.warn('No headings found in notebook');
    return;
  }

  // Generate TOC markdown
  const tocMarkdown = generateTOC(headings, settings.tocCaption);

  // Insert at cursor position
  const cursor = editor.getCursorPosition();
  const offset = editor.getOffsetAt(cursor);
  const currentText = model.sharedModel.getSource();

  model.sharedModel.setSource(
    currentText.slice(0, offset) + tocMarkdown + currentText.slice(offset)
  );
}

/**
 * Initialization data for the jupyterlab_markdown_insert_content_extension extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab_markdown_insert_content_extension:plugin',
  description:
    'Jupyterlab extension to automatically insert content into markdown - such as TOC, bibliography, list of figures etc.',
  autoStart: true,
  optional: [IEditorTracker, INotebookTracker, ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
    editorTracker: IEditorTracker | null,
    notebookTracker: INotebookTracker | null,
    settingRegistry: ISettingRegistry | null
  ) => {
    console.log(
      'JupyterLab extension jupyterlab_markdown_insert_content_extension is activated!'
    );

    // Default settings (mutable to allow updates from settings registry)
    const settings: ISettings = {
      tocCaption: '**Table of Contents**',
      tocMaxLevel: 3
    };

    // Load settings if available
    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(pluginSettings => {
          // Update settings from registry
          const updateSettings = () => {
            settings.tocCaption = pluginSettings.get('tocCaption')
              .composite as string;
            settings.tocMaxLevel = pluginSettings.get('tocMaxLevel')
              .composite as number;
          };

          updateSettings();
          pluginSettings.changed.connect(updateSettings);
        })
        .catch(reason => {
          console.error(
            'Failed to load settings for markdown-insert-content:',
            reason
          );
        });
    }

    // Register command to insert TOC
    app.commands.addCommand(CommandIDs.insertTOC, {
      label: 'Insert Table of Contents',
      caption: 'Insert a table of contents at the cursor position',
      isVisible: () => {
        // For file editor - check if it's a markdown file
        if (editorTracker?.currentWidget) {
          const path = editorTracker.currentWidget.context.path;
          if (path.endsWith('.md') || path.endsWith('.markdown')) {
            return true;
          }
        }

        // For notebooks - always visible (selector filters to edit mode)
        if (notebookTracker?.currentWidget) {
          return true;
        }

        return false;
      },
      execute: () => {
        // Check current shell widget to determine context
        const currentWidget = app.shell.currentWidget;

        // Check if current widget is a notebook
        if (
          notebookTracker?.currentWidget &&
          currentWidget === notebookTracker.currentWidget
        ) {
          const activeCell = notebookTracker.currentWidget.content.activeCell;
          // Only check for markdown cell type - edit mode was verified by isVisible
          // (cell may exit edit mode when context menu is clicked)
          if (activeCell && activeCell.model.type === 'markdown') {
            insertTOCInNotebook(notebookTracker, settings);
            return;
          }
        }

        // Check if current widget is a file editor with markdown
        if (
          editorTracker?.currentWidget &&
          currentWidget === editorTracker.currentWidget
        ) {
          const path = editorTracker.currentWidget.context.path;
          if (path.endsWith('.md') || path.endsWith('.markdown')) {
            insertTOCInFileEditor(editorTracker, settings);
            return;
          }
        }

        console.warn('No active markdown editor or notebook cell in edit mode');
      }
    });

    // Add to editor context menu - for file editors (isVisible filters to markdown)
    if (editorTracker) {
      app.contextMenu.addItem({
        command: CommandIDs.insertTOC,
        selector: '.jp-FileEditor',
        rank: 10
      });
    }

    // Add to notebook context menu - for markdown cells
    if (notebookTracker) {
      app.contextMenu.addItem({
        command: CommandIDs.insertTOC,
        selector: '.jp-MarkdownCell .jp-InputArea-editor',
        rank: 10
      });
    }
  }
};

export default plugin;
