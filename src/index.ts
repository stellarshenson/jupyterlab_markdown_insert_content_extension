import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { IEditorTracker } from '@jupyterlab/fileeditor';
import { INotebookTracker } from '@jupyterlab/notebook';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { Menu } from '@lumino/widgets';

/**
 * Command IDs
 */
namespace CommandIDs {
  export const insertTOC = 'markdown-insert:insert-toc';
  export const updateTOC = 'markdown-insert:update-toc';
  export const toggleTOCIgnore = 'markdown-insert:toggle-toc-ignore';
  export const addNumbering = 'markdown-insert:add-numbering';
  export const removeNumbering = 'markdown-insert:remove-numbering';
  export const updateNumbering = 'markdown-insert:update-numbering';
}

/**
 * TOC markers for auto-generated content
 */
const TOC_BEGIN_MARKER = '<!-- TOC:BEGIN -->';
const TOC_END_MARKER = '<!-- TOC:END -->';

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
  numberingMaxLevel: number;
  numberingTrailingDot: boolean;
}

/**
 * Regex pattern to match hierarchical numbering at start of heading text
 * Matches patterns like: "1.", "1.2.", "1.2.3.", etc.
 */
const NUMBERING_PATTERN = /^(\d+\.)+\s*/;

/**
 * Removes hierarchical numbering from heading text
 * Examples:
 *   "1. Introduction" -> "Introduction"
 *   "1.2.3. Deep Section" -> "Deep Section"
 */
function stripNumbering(text: string): string {
  return text.replace(NUMBERING_PATTERN, '');
}

/**
 * Generates anchor ID from heading text matching JupyterLab's format
 * JupyterLab preserves Title-Case and replaces spaces with hyphens
 * Examples:
 *   "Technology Decision Summary" -> "Technology-Decision-Summary"
 *   "CPL-1: User Experience" -> "CPL-1:-User-Experience"
 *   "1.2. Numbered Heading" -> "1.2.-Numbered-Heading"
 */
function generateHeadingId(text: string): string {
  // Remove trailing pilcrow (¶) if present
  const cleaned = text.replace(/¶+$/, '').trim();

  // Replace spaces with hyphens, preserving case and special characters
  return cleaned.replace(/\s+/g, '-');
}

/**
 * Generates hierarchical number string for a heading level
 * @param counters Array of counters for each level
 * @param level The heading level (1-6)
 * @param trailingDot Whether to add trailing dot
 * @returns Formatted number string like "1.2.3." or "1.2.3"
 */
function generateNumbering(
  counters: number[],
  level: number,
  trailingDot: boolean
): string {
  const base = counters.slice(0, level).join('.');
  return trailingDot ? base + '.' : base;
}

/**
 * Mapping of original heading text to numbered heading text
 * Used for updating TOC links
 */
interface IHeadingMapping {
  original: string;
  numbered: string;
  originalId: string;
  numberedId: string;
}

/**
 * Processes markdown text to add hierarchical numbering to headings
 * Also updates TOC links to match new heading IDs
 */
function addNumberingToText(
  text: string,
  maxLevel: number,
  trailingDot: boolean
): string {
  const lines = text.split('\n');
  const counters = [0, 0, 0, 0, 0, 0]; // counters for h1-h6
  let inCodeBlock = false;
  const result: string[] = [];
  const headingMappings: IHeadingMapping[] = [];

  // First pass: number headings and collect mappings
  for (const line of lines) {
    // Check for code block delimiters
    if (line.match(/^```/) || line.match(/^~~~/)) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }

    if (inCodeBlock) {
      result.push(line);
      continue;
    }

    // Match ATX-style headings
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const headingText = match[2].trim();

      // Only number headings up to maxLevel
      if (level <= maxLevel) {
        // Strip existing numbering first
        const cleanText = stripNumbering(headingText);

        // Increment counter for this level
        counters[level - 1]++;

        // Reset counters for deeper levels
        for (let i = level; i < 6; i++) {
          counters[i] = 0;
        }

        // Generate numbering
        const numbering = generateNumbering(counters, level, trailingDot);

        // Create numbered heading text
        const numberedText = `${numbering} ${cleanText}`;

        // Store mapping for TOC update
        headingMappings.push({
          original: cleanText,
          numbered: numberedText,
          originalId: generateHeadingId(cleanText),
          numberedId: generateHeadingId(numberedText)
        });

        // Reconstruct heading with numbering
        result.push(`${match[1]} ${numberedText}`);
      } else {
        // Keep heading as-is if beyond maxLevel
        result.push(line);
      }
    } else {
      result.push(line);
    }
  }

  // Second pass: update TOC links
  let resultText = result.join('\n');
  for (const mapping of headingMappings) {
    // Update link text and href: [Original Text](#Original-Id) -> [Numbered Text](#Numbered-Id)
    const oldLinkPattern = new RegExp(
      `\\[${escapeRegExp(mapping.original)}\\]\\(#${escapeRegExp(mapping.originalId)}\\)`,
      'g'
    );
    const newLink = `[${mapping.numbered}](#${mapping.numberedId})`;
    resultText = resultText.replace(oldLinkPattern, newLink);

    // Also update links that might already have old numbering
    // Match any numbered version of this heading
    const oldNumberedPattern = new RegExp(
      `\\[\\d+(?:\\.\\d+)*\\.?\\s*${escapeRegExp(mapping.original)}\\]\\(#[^)]+\\)`,
      'g'
    );
    resultText = resultText.replace(oldNumberedPattern, newLink);
  }

  return resultText;
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Processes markdown text to remove hierarchical numbering from headings
 * Also updates TOC links to match unnumbered heading IDs
 */
function removeNumberingFromText(text: string): string {
  const lines = text.split('\n');
  let inCodeBlock = false;
  const result: string[] = [];
  const headingMappings: IHeadingMapping[] = [];

  // First pass: remove numbering from headings and collect mappings
  for (const line of lines) {
    // Check for code block delimiters
    if (line.match(/^```/) || line.match(/^~~~/)) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }

    if (inCodeBlock) {
      result.push(line);
      continue;
    }

    // Match ATX-style headings
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const hashes = match[1];
      const headingText = match[2].trim();

      // Check if heading has numbering
      if (NUMBERING_PATTERN.test(headingText)) {
        // Strip numbering from heading text
        const cleanText = stripNumbering(headingText);

        // Store mapping for TOC update
        headingMappings.push({
          original: cleanText,
          numbered: headingText,
          originalId: generateHeadingId(cleanText),
          numberedId: generateHeadingId(headingText)
        });

        result.push(`${hashes} ${cleanText}`);
      } else {
        result.push(line);
      }
    } else {
      result.push(line);
    }
  }

  // Second pass: update TOC links
  let resultText = result.join('\n');
  for (const mapping of headingMappings) {
    // Update link text and href: [Numbered Text](#Numbered-Id) -> [Original Text](#Original-Id)
    const oldLinkPattern = new RegExp(
      `\\[${escapeRegExp(mapping.numbered)}\\]\\(#${escapeRegExp(mapping.numberedId)}\\)`,
      'g'
    );
    const newLink = `[${mapping.original}](#${mapping.originalId})`;
    resultText = resultText.replace(oldLinkPattern, newLink);

    // Also match links with slightly different numbering formats
    const anyNumberedPattern = new RegExp(
      `\\[\\d+(?:\\.\\d+)*\\.?\\s*${escapeRegExp(mapping.original)}\\]\\(#[^)]+\\)`,
      'g'
    );
    resultText = resultText.replace(anyNumberedPattern, newLink);
  }

  return resultText;
}

/**
 * Marker to exclude heading from TOC (heading will still be numbered)
 */
const NO_TOC_MARKER = '<!-- TOC:IGNORE -->';

/**
 * Extracts headings from markdown text, excluding headings in code blocks
 * and headings marked with <!-- TOC:IGNORE -->
 */
function extractHeadings(text: string, maxLevel: number): IHeading[] {
  const headings: IHeading[] = [];
  const lines = text.split('\n');
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for code block delimiters (``` or ~~~)
    if (line.match(/^```/) || line.match(/^~~~/)) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    // Skip lines inside code blocks
    if (inCodeBlock) {
      continue;
    }

    // Match ATX-style headings (# Heading) - may have <!-- notoc --> at end
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;

      // Skip headings beyond max level
      if (level > maxLevel) {
        continue;
      }

      let headingText = match[2].trim();

      // Check if heading has notoc marker (inline or on next line)
      const hasInlineNotoc = headingText.includes(NO_TOC_MARKER);
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
      const hasNextLineNotoc = nextLine.trim() === NO_TOC_MARKER;

      if (hasInlineNotoc || hasNextLineNotoc) {
        // Skip this heading in TOC, but don't skip the line for numbering
        if (hasNextLineNotoc) {
          i++; // Skip the notoc marker line
        }
        continue;
      }

      // Remove any inline comments for clean text
      headingText = headingText.replace(/<!--.*?-->/g, '').trim();

      const id = generateHeadingId(headingText);

      headings.push({
        text: headingText,
        level: level,
        id: id
      });
    }
  }

  return headings;
}

/**
 * Generates TOC markdown from headings with markers for update detection
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
  // Wrap TOC in markers for update detection
  return `${TOC_BEGIN_MARKER}\n${captionPart}${lines.join('\n')}\n${TOC_END_MARKER}\n\n`;
}

/**
 * Finds and replaces existing TOC in text, or returns null if no TOC found
 */
function findAndReplaceTOC(text: string, newTOC: string): string | null {
  const beginIndex = text.indexOf(TOC_BEGIN_MARKER);
  const endIndex = text.indexOf(TOC_END_MARKER);

  if (beginIndex === -1 || endIndex === -1 || endIndex < beginIndex) {
    return null; // No valid TOC found
  }

  // Replace from BEGIN marker to END marker (inclusive)
  const before = text.slice(0, beginIndex);
  const after = text.slice(endIndex + TOC_END_MARKER.length);

  // New TOC already ends with TOC_END_MARKER + \n\n, trim the trailing \n\n
  // and preserve whatever whitespace was after the original END marker
  const newTOCTrimmed = newTOC.replace(/\n+$/, '');

  return before + newTOCTrimmed + after;
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
 * Adds hierarchical numbering to headings in file editor
 */
function addNumberingInFileEditor(
  editorTracker: IEditorTracker,
  settings: ISettings
): void {
  const widget = editorTracker.currentWidget;
  if (!widget) {
    console.warn('No active file editor');
    return;
  }

  const model = widget.content.model;
  const text = model.sharedModel.getSource();
  const numberedText = addNumberingToText(
    text,
    settings.numberingMaxLevel,
    settings.numberingTrailingDot
  );
  model.sharedModel.setSource(numberedText);
}

/**
 * Removes hierarchical numbering from headings in file editor
 */
function removeNumberingInFileEditor(editorTracker: IEditorTracker): void {
  const widget = editorTracker.currentWidget;
  if (!widget) {
    console.warn('No active file editor');
    return;
  }

  const model = widget.content.model;
  const text = model.sharedModel.getSource();
  const cleanedText = removeNumberingFromText(text);
  model.sharedModel.setSource(cleanedText);
}

/**
 * Adds hierarchical numbering to headings in all notebook markdown cells
 */
function addNumberingInNotebook(
  notebookTracker: INotebookTracker,
  settings: ISettings
): void {
  const panel = notebookTracker.currentWidget;
  if (!panel) {
    console.warn('No active notebook');
    return;
  }

  const notebook = panel.content;

  // Collect all markdown content with cell boundaries
  const cellContents: { index: number; source: string }[] = [];
  for (let i = 0; i < notebook.model!.cells.length; i++) {
    const cell = notebook.model!.cells.get(i);
    if (cell.type === 'markdown') {
      cellContents.push({ index: i, source: cell.sharedModel.getSource() });
    }
  }

  // Combine all markdown content
  const allText = cellContents.map(c => c.source).join('\n\n');

  // Add numbering to combined text
  const numberedText = addNumberingToText(
    allText,
    settings.numberingMaxLevel,
    settings.numberingTrailingDot
  );

  // Split back and update cells
  const numberedParts = numberedText.split('\n\n');
  let partIndex = 0;

  for (const cellInfo of cellContents) {
    const cell = notebook.model!.cells.get(cellInfo.index);
    // Count how many parts this cell originally had
    const originalParts = cellInfo.source.split('\n\n').length;
    const cellParts = numberedParts.slice(partIndex, partIndex + originalParts);
    cell.sharedModel.setSource(cellParts.join('\n\n'));
    partIndex += originalParts;
  }
}

/**
 * Removes hierarchical numbering from headings in all notebook markdown cells
 */
function removeNumberingInNotebook(notebookTracker: INotebookTracker): void {
  const panel = notebookTracker.currentWidget;
  if (!panel) {
    console.warn('No active notebook');
    return;
  }

  const notebook = panel.content;

  // Process each markdown cell individually
  for (let i = 0; i < notebook.model!.cells.length; i++) {
    const cell = notebook.model!.cells.get(i);
    if (cell.type === 'markdown') {
      const text = cell.sharedModel.getSource();
      const cleanedText = removeNumberingFromText(text);
      cell.sharedModel.setSource(cleanedText);
    }
  }
}

/**
 * Updates existing TOC in file editor (finds and replaces marked TOC)
 */
function updateTOCInFileEditor(
  editorTracker: IEditorTracker,
  settings: ISettings
): boolean {
  const widget = editorTracker.currentWidget;
  if (!widget) {
    console.warn('No active file editor');
    return false;
  }

  const model = widget.content.model;
  const text = model.sharedModel.getSource();

  // Extract headings
  const headings = extractHeadings(text, settings.tocMaxLevel);

  if (headings.length === 0) {
    console.warn('No headings found in document');
    return false;
  }

  // Generate new TOC
  const tocMarkdown = generateTOC(headings, settings.tocCaption);

  // Try to find and replace existing TOC
  const updatedText = findAndReplaceTOC(text, tocMarkdown);

  if (updatedText) {
    model.sharedModel.setSource(updatedText);
    return true;
  }

  console.warn('No TOC markers found in document - use Insert TOC first');
  return false;
}

/**
 * Updates existing TOC in notebook (finds cell with TOC markers and replaces)
 */
function updateTOCInNotebook(
  notebookTracker: INotebookTracker,
  settings: ISettings
): boolean {
  const panel = notebookTracker.currentWidget;
  if (!panel) {
    console.warn('No active notebook');
    return false;
  }

  const notebook = panel.content;

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
    return false;
  }

  // Generate new TOC
  const tocMarkdown = generateTOC(headings, settings.tocCaption);

  // Find the cell containing the TOC markers and update it
  for (let i = 0; i < notebook.model!.cells.length; i++) {
    const cell = notebook.model!.cells.get(i);
    if (cell.type === 'markdown') {
      const cellText = cell.sharedModel.getSource();
      const updatedText = findAndReplaceTOC(cellText, tocMarkdown);

      if (updatedText) {
        cell.sharedModel.setSource(updatedText);
        return true;
      }
    }
  }

  console.warn('No TOC markers found in notebook - use Insert TOC first');
  return false;
}

/**
 * Toggles TOC:IGNORE marker on the heading at cursor position in file editor
 */
function toggleTOCIgnoreInFileEditor(editorTracker: IEditorTracker): void {
  const widget = editorTracker.currentWidget;
  if (!widget) {
    console.warn('No active file editor');
    return;
  }

  const editor = widget.content.editor;
  const model = widget.content.model;
  const cursor = editor.getCursorPosition();
  const text = model.sharedModel.getSource();
  const lines = text.split('\n');

  // Get current line
  const lineIndex = cursor.line;
  if (lineIndex >= lines.length) {
    return;
  }

  const line = lines[lineIndex];

  // Check if line is a heading
  if (!line.match(/^#{1,6}\s+/)) {
    console.warn('Current line is not a heading');
    return;
  }

  // Toggle the marker
  if (line.includes(NO_TOC_MARKER)) {
    // Remove marker
    lines[lineIndex] = line
      .replace(` ${NO_TOC_MARKER}`, '')
      .replace(NO_TOC_MARKER, '');
  } else {
    // Add marker at end of line
    lines[lineIndex] = `${line} ${NO_TOC_MARKER}`;
  }

  model.sharedModel.setSource(lines.join('\n'));
}

/**
 * Toggles TOC:IGNORE marker on the heading at cursor position in notebook cell
 */
function toggleTOCIgnoreInNotebook(notebookTracker: INotebookTracker): void {
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
    console.warn('No editor available');
    return;
  }

  const cursor = editor.getCursorPosition();
  const text = model.sharedModel.getSource();
  const lines = text.split('\n');

  // Get current line
  const lineIndex = cursor.line;
  if (lineIndex >= lines.length) {
    return;
  }

  const line = lines[lineIndex];

  // Check if line is a heading
  if (!line.match(/^#{1,6}\s+/)) {
    console.warn('Current line is not a heading');
    return;
  }

  // Toggle the marker
  if (line.includes(NO_TOC_MARKER)) {
    // Remove marker
    lines[lineIndex] = line
      .replace(` ${NO_TOC_MARKER}`, '')
      .replace(NO_TOC_MARKER, '');
  } else {
    // Add marker at end of line
    lines[lineIndex] = `${line} ${NO_TOC_MARKER}`;
  }

  model.sharedModel.setSource(lines.join('\n'));
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
      tocMaxLevel: 3,
      numberingMaxLevel: 5,
      numberingTrailingDot: false
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
            settings.numberingMaxLevel = pluginSettings.get('numberingMaxLevel')
              .composite as number;
            settings.numberingTrailingDot = pluginSettings.get(
              'numberingTrailingDot'
            ).composite as boolean;
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

    // Register command to update TOC
    app.commands.addCommand(CommandIDs.updateTOC, {
      label: 'Update Table of Contents',
      caption: 'Update an existing table of contents (requires TOC markers)',
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
        const currentWidget = app.shell.currentWidget;

        // Check if current widget is a notebook
        if (
          notebookTracker?.currentWidget &&
          currentWidget === notebookTracker.currentWidget
        ) {
          updateTOCInNotebook(notebookTracker, settings);
          return;
        }

        // Check if current widget is a file editor with markdown
        if (
          editorTracker?.currentWidget &&
          currentWidget === editorTracker.currentWidget
        ) {
          const path = editorTracker.currentWidget.context.path;
          if (path.endsWith('.md') || path.endsWith('.markdown')) {
            updateTOCInFileEditor(editorTracker, settings);
            return;
          }
        }

        console.warn('No active markdown editor or notebook');
      }
    });

    // Register command to toggle TOC ignore on heading
    app.commands.addCommand(CommandIDs.toggleTOCIgnore, {
      label: 'Toggle Exclude from TOC',
      caption: 'Toggle TOC:IGNORE marker on the heading at cursor position',
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
        const currentWidget = app.shell.currentWidget;

        // Check if current widget is a notebook
        if (
          notebookTracker?.currentWidget &&
          currentWidget === notebookTracker.currentWidget
        ) {
          toggleTOCIgnoreInNotebook(notebookTracker);
          return;
        }

        // Check if current widget is a file editor with markdown
        if (
          editorTracker?.currentWidget &&
          currentWidget === editorTracker.currentWidget
        ) {
          const path = editorTracker.currentWidget.context.path;
          if (path.endsWith('.md') || path.endsWith('.markdown')) {
            toggleTOCIgnoreInFileEditor(editorTracker);
            return;
          }
        }

        console.warn('No active markdown editor or notebook');
      }
    });

    // Register command to add numbering
    app.commands.addCommand(CommandIDs.addNumbering, {
      label: 'Add Heading Numbering',
      caption: 'Add hierarchical numbering to headings (1., 1.1., etc.)',
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
        const currentWidget = app.shell.currentWidget;

        // Check if current widget is a notebook
        if (
          notebookTracker?.currentWidget &&
          currentWidget === notebookTracker.currentWidget
        ) {
          addNumberingInNotebook(notebookTracker, settings);
          return;
        }

        // Check if current widget is a file editor with markdown
        if (
          editorTracker?.currentWidget &&
          currentWidget === editorTracker.currentWidget
        ) {
          const path = editorTracker.currentWidget.context.path;
          if (path.endsWith('.md') || path.endsWith('.markdown')) {
            addNumberingInFileEditor(editorTracker, settings);
            return;
          }
        }

        console.warn('No active markdown editor or notebook');
      }
    });

    // Register command to remove numbering
    app.commands.addCommand(CommandIDs.removeNumbering, {
      label: 'Remove Heading Numbering',
      caption: 'Remove hierarchical numbering from headings',
      isVisible: () => {
        // For file editor - check if it's a markdown file
        if (editorTracker?.currentWidget) {
          const path = editorTracker.currentWidget.context.path;
          if (path.endsWith('.md') || path.endsWith('.markdown')) {
            return true;
          }
        }

        // For notebooks - always visible
        if (notebookTracker?.currentWidget) {
          return true;
        }

        return false;
      },
      execute: () => {
        const currentWidget = app.shell.currentWidget;

        // Check if current widget is a notebook
        if (
          notebookTracker?.currentWidget &&
          currentWidget === notebookTracker.currentWidget
        ) {
          removeNumberingInNotebook(notebookTracker);
          return;
        }

        // Check if current widget is a file editor with markdown
        if (
          editorTracker?.currentWidget &&
          currentWidget === editorTracker.currentWidget
        ) {
          const path = editorTracker.currentWidget.context.path;
          if (path.endsWith('.md') || path.endsWith('.markdown')) {
            removeNumberingInFileEditor(editorTracker);
            return;
          }
        }

        console.warn('No active markdown editor or notebook');
      }
    });

    // Register command to update numbering (remove then add)
    app.commands.addCommand(CommandIDs.updateNumbering, {
      label: 'Update Heading Numbering',
      caption: 'Update hierarchical numbering on headings',
      isVisible: () => {
        // For file editor - check if it's a markdown file
        if (editorTracker?.currentWidget) {
          const path = editorTracker.currentWidget.context.path;
          if (path.endsWith('.md') || path.endsWith('.markdown')) {
            return true;
          }
        }

        // For notebooks - always visible
        if (notebookTracker?.currentWidget) {
          return true;
        }

        return false;
      },
      execute: () => {
        const currentWidget = app.shell.currentWidget;

        // Check if current widget is a notebook
        if (
          notebookTracker?.currentWidget &&
          currentWidget === notebookTracker.currentWidget
        ) {
          // Remove then add numbering
          removeNumberingInNotebook(notebookTracker);
          addNumberingInNotebook(notebookTracker, settings);
          // Also update TOC if it exists
          updateTOCInNotebook(notebookTracker, settings);
          return;
        }

        // Check if current widget is a file editor with markdown
        if (
          editorTracker?.currentWidget &&
          currentWidget === editorTracker.currentWidget
        ) {
          const path = editorTracker.currentWidget.context.path;
          if (path.endsWith('.md') || path.endsWith('.markdown')) {
            // Remove then add numbering
            removeNumberingInFileEditor(editorTracker);
            addNumberingInFileEditor(editorTracker, settings);
            // Also update TOC if it exists
            updateTOCInFileEditor(editorTracker, settings);
            return;
          }
        }

        console.warn('No active markdown editor or notebook');
      }
    });

    // Create submenu for markdown tools
    const submenuId = 'markdown-insert-submenu';
    const submenu = new Menu({ commands: app.commands });
    submenu.id = submenuId;
    submenu.title.label = 'Markdown Tools';

    // Add commands to submenu
    submenu.addItem({ command: CommandIDs.insertTOC });
    submenu.addItem({ command: CommandIDs.updateTOC });
    submenu.addItem({ command: CommandIDs.toggleTOCIgnore });
    submenu.addItem({ type: 'separator' });
    submenu.addItem({ command: CommandIDs.addNumbering });
    submenu.addItem({ command: CommandIDs.removeNumbering });
    submenu.addItem({ command: CommandIDs.updateNumbering });

    // Add submenu to editor context menu - for file editors
    if (editorTracker) {
      app.contextMenu.addItem({
        type: 'submenu',
        submenu,
        selector: '.jp-FileEditor',
        rank: 10
      });
    }

    // Add submenu to notebook context menu - for markdown cells
    if (notebookTracker) {
      app.contextMenu.addItem({
        type: 'submenu',
        submenu,
        selector: '.jp-MarkdownCell .jp-InputArea-editor',
        rank: 10
      });
    }
  }
};

export default plugin;
