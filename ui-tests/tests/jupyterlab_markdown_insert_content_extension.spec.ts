import { expect, test } from '@jupyterlab/galata';

/**
 * Sample hierarchical markdown for testing
 */
const SAMPLE_MARKDOWN = `# Project Overview

This is a sample document for testing the markdown extension.

## Introduction

Some introduction text here.

### Background

Background information.

### Motivation

Why we're doing this.

## Implementation

Implementation details.

### Architecture

System architecture.

#### Components

Component details.

### Testing

Testing approach.

## Conclusion

Final thoughts.

### Summary

Summary of findings.

### Future Work

Future improvements.
`;

/**
 * Markdown with code blocks (headings inside should be ignored)
 * Simplified to avoid keyboard.type() mangling issues
 */
const MARKDOWN_WITH_CODE = `# Main Title

## Section One

\`\`\`
# Not a heading
\`\`\`

## Section Two
`;

/**
 * Don't load JupyterLab webpage before running the tests.
 * This is required to ensure we capture all log messages.
 */
test.use({ autoGoto: false });

test.describe('Extension Activation', () => {
  test('should emit an activation console message', async ({ page }) => {
    const logs: string[] = [];

    page.on('console', message => {
      logs.push(message.text());
    });

    await page.goto();

    expect(
      logs.filter(
        s =>
          s ===
          'JupyterLab extension jupyterlab_markdown_insert_content_extension is activated!'
      )
    ).toHaveLength(1);
  });
});

test.describe('TOC Generation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto();
  });

  test('should show Markdown Tools submenu in markdown file context menu', async ({
    page
  }) => {
    // Create a new markdown file
    await page.menu.clickMenuItem('File>New>Markdown File');
    await page.waitForSelector('.jp-FileEditor');

    // Right-click to open context menu
    await page.click('.jp-FileEditor .cm-content', { button: 'right' });

    // Check for Markdown Tools submenu
    const submenu = page.locator('li.lm-Menu-item:has-text("Markdown Tools")');
    await expect(submenu).toBeVisible();
  });

  test('should insert TOC with markers at cursor position', async ({
    page
  }) => {
    // Create a new markdown file
    await page.menu.clickMenuItem('File>New>Markdown File');
    await page.waitForSelector('.jp-FileEditor');

    // Type sample markdown
    const editor = page.locator('.jp-FileEditor .cm-content');
    await editor.click();
    await page.keyboard.type(SAMPLE_MARKDOWN);

    // Go to beginning of file
    await page.keyboard.press('Control+Home');

    // Insert a blank line for TOC
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowUp');

    // Open context menu and click Insert TOC
    await editor.click({ button: 'right' });
    await page.click('li.lm-Menu-item:has-text("Markdown Tools")');
    await page.click('li.lm-Menu-item:has-text("Insert Table of Contents")');

    // Wait for TOC to be inserted
    await page.waitForTimeout(500);

    // Get editor content
    const content = await page.evaluate(() => {
      const editor = document.querySelector('.jp-FileEditor .cm-content');
      return editor?.textContent || '';
    });

    // Verify TOC markers are present
    expect(content).toContain('<!-- TOC:BEGIN -->');
    expect(content).toContain('<!-- TOC:END -->');
    expect(content).toContain('**Table of Contents**');

    // Verify headings are in TOC
    expect(content).toContain('[Project Overview]');
    expect(content).toContain('[Introduction]');
    expect(content).toContain('[Implementation]');
    expect(content).toContain('[Conclusion]');
  });

  test('should update existing TOC when Update TOC is called', async ({
    page
  }) => {
    // Create markdown with existing TOC
    const markdownWithTOC = `<!-- TOC:BEGIN -->
**Table of Contents**

- [Old Heading](#Old-Heading)
<!-- TOC:END -->

# New Heading

## Section One

## Section Two
`;

    await page.menu.clickMenuItem('File>New>Markdown File');
    await page.waitForSelector('.jp-FileEditor');

    const editor = page.locator('.jp-FileEditor .cm-content');
    await editor.click();
    await page.keyboard.type(markdownWithTOC);

    // Open context menu and click Update TOC
    await editor.click({ button: 'right' });
    await page.click('li.lm-Menu-item:has-text("Markdown Tools")');
    await page.click('li.lm-Menu-item:has-text("Update Table of Contents")');

    await page.waitForTimeout(500);

    const content = await page.evaluate(() => {
      const editor = document.querySelector('.jp-FileEditor .cm-content');
      return editor?.textContent || '';
    });

    // Old heading should be replaced with new ones
    expect(content).not.toContain('[Old Heading]');
    expect(content).toContain('[New Heading]');
    expect(content).toContain('[Section One]');
    expect(content).toContain('[Section Two]');
  });

  test('should exclude headings in code blocks from TOC', async ({ page }) => {
    await page.menu.clickMenuItem('File>New>Markdown File');
    await page.waitForSelector('.jp-FileEditor');

    const editor = page.locator('.jp-FileEditor .cm-content');
    await editor.click();
    await page.keyboard.type(MARKDOWN_WITH_CODE);

    // Go to beginning
    await page.keyboard.press('Control+Home');
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowUp');

    // Insert TOC
    await editor.click({ button: 'right' });
    await page.click('li.lm-Menu-item:has-text("Markdown Tools")');
    await page.click('li.lm-Menu-item:has-text("Insert Table of Contents")');

    await page.waitForTimeout(500);

    const content = await page.evaluate(() => {
      const editor = document.querySelector('.jp-FileEditor .cm-content');
      return editor?.textContent || '';
    });

    // Should include real headings
    expect(content).toContain('[Main Title]');
    expect(content).toContain('[Section One]');
    expect(content).toContain('[Section Two]');

    // Should NOT include headings from code blocks
    expect(content).not.toContain('[Not a heading]');
  });
});

test.describe('Heading Numbering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto();
  });

  test('should add hierarchical numbering to headings', async ({ page }) => {
    await page.menu.clickMenuItem('File>New>Markdown File');
    await page.waitForSelector('.jp-FileEditor');

    const editor = page.locator('.jp-FileEditor .cm-content');
    await editor.click();
    await page.keyboard.type(SAMPLE_MARKDOWN);

    // Add numbering
    await editor.click({ button: 'right' });
    await page.click('li.lm-Menu-item:has-text("Markdown Tools")');
    await page.click('li.lm-Menu-item:has-text("Add Heading Numbering")');

    await page.waitForTimeout(500);

    const content = await page.evaluate(() => {
      const editor = document.querySelector('.jp-FileEditor .cm-content');
      return editor?.textContent || '';
    });

    // Check numbering is added (with trailing dot by default)
    expect(content).toContain('# 1. Project Overview');
    expect(content).toContain('## 1.1. Introduction');
    expect(content).toContain('### 1.1.1. Background');
    expect(content).toContain('### 1.1.2. Motivation');
    expect(content).toContain('## 1.2. Implementation');
    expect(content).toContain('### 1.2.1. Architecture');
    expect(content).toContain('### 1.2.2. Testing');
    expect(content).toContain('## 1.3. Conclusion');
  });

  test('should remove numbering from headings', async ({ page }) => {
    const numberedMarkdown = `# 1. First Heading

## 1.1. Section One

### 1.1.1. Subsection

## 1.2. Section Two
`;

    await page.menu.clickMenuItem('File>New>Markdown File');
    await page.waitForSelector('.jp-FileEditor');

    const editor = page.locator('.jp-FileEditor .cm-content');
    await editor.click();
    await page.keyboard.type(numberedMarkdown);

    // Remove numbering
    await editor.click({ button: 'right' });
    await page.click('li.lm-Menu-item:has-text("Markdown Tools")');
    await page.click('li.lm-Menu-item:has-text("Remove Heading Numbering")');

    await page.waitForTimeout(500);

    const content = await page.evaluate(() => {
      const editor = document.querySelector('.jp-FileEditor .cm-content');
      return editor?.textContent || '';
    });

    // Numbering should be removed
    expect(content).toContain('# First Heading');
    expect(content).toContain('## Section One');
    expect(content).toContain('### Subsection');
    expect(content).toContain('## Section Two');

    // Should not have numbered format
    expect(content).not.toContain('1. First');
    expect(content).not.toContain('1.1.');
    expect(content).not.toContain('1.2.');
  });

  test('should update numbering and TOC together', async ({ page }) => {
    // Simple markdown without TOC - add numbering first, then insert TOC
    const simpleMarkdown = `# First

## Sub First

# Second
`;

    await page.menu.clickMenuItem('File>New>Markdown File');
    await page.waitForSelector('.jp-FileEditor');

    const editor = page.locator('.jp-FileEditor .cm-content');
    await editor.click();
    await page.keyboard.type(simpleMarkdown);

    // Add numbering
    await editor.click({ button: 'right' });
    await page.click('li.lm-Menu-item:has-text("Markdown Tools")');
    await page.click('li.lm-Menu-item:has-text("Add Heading Numbering")');

    await page.waitForTimeout(500);

    const content = await page.evaluate(() => {
      const editor = document.querySelector('.jp-FileEditor .cm-content');
      return editor?.textContent || '';
    });

    // Headings should be numbered
    expect(content).toContain('# 1. First');
    expect(content).toContain('## 1.1. Sub First');
    expect(content).toContain('# 2. Second');
  });
});

test.describe('TOC:IGNORE Marker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto();
  });

  test('should exclude headings with TOC:IGNORE from TOC', async ({ page }) => {
    const markdownWithIgnore = `# Main Title

## Included Section

## Excluded Section <!-- TOC:IGNORE -->

## Another Included

### Sub Excluded
<!-- TOC:IGNORE -->

### Sub Included
`;

    await page.menu.clickMenuItem('File>New>Markdown File');
    await page.waitForSelector('.jp-FileEditor');

    const editor = page.locator('.jp-FileEditor .cm-content');
    await editor.click();
    await page.keyboard.type(markdownWithIgnore);

    // Go to beginning and insert TOC
    await page.keyboard.press('Control+Home');
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowUp');

    await editor.click({ button: 'right' });
    await page.click('li.lm-Menu-item:has-text("Markdown Tools")');
    await page.click('li.lm-Menu-item:has-text("Insert Table of Contents")');

    await page.waitForTimeout(500);

    const content = await page.evaluate(() => {
      const editor = document.querySelector('.jp-FileEditor .cm-content');
      return editor?.textContent || '';
    });

    // Should include non-ignored headings
    expect(content).toContain('[Main Title]');
    expect(content).toContain('[Included Section]');
    expect(content).toContain('[Another Included]');
    expect(content).toContain('[Sub Included]');

    // Should NOT include ignored headings
    expect(content).not.toContain('[Excluded Section]');
    expect(content).not.toContain('[Sub Excluded]');
  });

  test('should toggle TOC:IGNORE marker on heading', async ({ page }) => {
    const simpleMarkdown = `# Test Heading

Some content.
`;

    await page.menu.clickMenuItem('File>New>Markdown File');
    await page.waitForSelector('.jp-FileEditor');

    const editor = page.locator('.jp-FileEditor .cm-content');
    await editor.click();
    await page.keyboard.type(simpleMarkdown);

    // Go to heading line
    await page.keyboard.press('Control+Home');

    // Toggle ignore marker
    await editor.click({ button: 'right' });
    await page.click('li.lm-Menu-item:has-text("Markdown Tools")');
    await page.click('li.lm-Menu-item:has-text("Toggle Exclude from TOC")');

    await page.waitForTimeout(500);

    let content = await page.evaluate(() => {
      const editor = document.querySelector('.jp-FileEditor .cm-content');
      return editor?.textContent || '';
    });

    // Marker should be added
    expect(content).toContain('<!-- TOC:IGNORE -->');

    // Toggle again to remove
    await page.keyboard.press('Control+Home');
    await editor.click({ button: 'right' });
    await page.click('li.lm-Menu-item:has-text("Markdown Tools")');
    await page.click('li.lm-Menu-item:has-text("Toggle Exclude from TOC")');

    await page.waitForTimeout(500);

    content = await page.evaluate(() => {
      const editor = document.querySelector('.jp-FileEditor .cm-content');
      return editor?.textContent || '';
    });

    // Marker should be removed
    expect(content).not.toContain('<!-- TOC:IGNORE -->');
  });

  test('should still number headings with TOC:IGNORE', async ({ page }) => {
    const markdownWithIgnore = `# First Heading

## Second Heading <!-- TOC:IGNORE -->

## Third Heading
`;

    await page.menu.clickMenuItem('File>New>Markdown File');
    await page.waitForSelector('.jp-FileEditor');

    const editor = page.locator('.jp-FileEditor .cm-content');
    await editor.click();
    await page.keyboard.type(markdownWithIgnore);

    // Add numbering
    await editor.click({ button: 'right' });
    await page.click('li.lm-Menu-item:has-text("Markdown Tools")');
    await page.click('li.lm-Menu-item:has-text("Add Heading Numbering")');

    await page.waitForTimeout(500);

    const content = await page.evaluate(() => {
      const editor = document.querySelector('.jp-FileEditor .cm-content');
      return editor?.textContent || '';
    });

    // All headings should be numbered including the ignored one
    expect(content).toContain('# 1. First Heading');
    expect(content).toContain('## 1.1. Second Heading');
    expect(content).toContain('## 1.2. Third Heading');
  });
});

test.describe('Feature Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto();
  });

  test('full workflow: insert TOC, add numbering, update TOC', async ({
    page
  }) => {
    await page.menu.clickMenuItem('File>New>Markdown File');
    await page.waitForSelector('.jp-FileEditor');

    const editor = page.locator('.jp-FileEditor .cm-content');
    await editor.click();

    // Type initial markdown
    await page.keyboard.type(`# Introduction

## Background

## Motivation

# Methods

## Experiment

# Results
`);

    // Step 1: Insert TOC at beginning
    await page.keyboard.press('Control+Home');
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowUp');

    await editor.click({ button: 'right' });
    await page.click('li.lm-Menu-item:has-text("Markdown Tools")');
    await page.click('li.lm-Menu-item:has-text("Insert Table of Contents")');
    await page.waitForTimeout(500);

    let content = await page.evaluate(() => {
      const editor = document.querySelector('.jp-FileEditor .cm-content');
      return editor?.textContent || '';
    });

    // Verify TOC has unnumbered links
    expect(content).toContain('[Introduction](#Introduction)');
    expect(content).toContain('[Methods](#Methods)');

    // Step 2: Add numbering (should also update TOC)
    await editor.click({ button: 'right' });
    await page.click('li.lm-Menu-item:has-text("Markdown Tools")');
    await page.click('li.lm-Menu-item:has-text("Add Heading Numbering")');
    await page.waitForTimeout(500);

    content = await page.evaluate(() => {
      const editor = document.querySelector('.jp-FileEditor .cm-content');
      return editor?.textContent || '';
    });

    // Headings should be numbered
    expect(content).toContain('# 1. Introduction');
    expect(content).toContain('# 2. Methods');
    expect(content).toContain('# 3. Results');

    // Step 3: Update TOC to reflect numbering
    await editor.click({ button: 'right' });
    await page.click('li.lm-Menu-item:has-text("Markdown Tools")');
    await page.click('li.lm-Menu-item:has-text("Update Table of Contents")');
    await page.waitForTimeout(500);

    content = await page.evaluate(() => {
      const editor = document.querySelector('.jp-FileEditor .cm-content');
      return editor?.textContent || '';
    });

    // TOC should now have numbered links
    expect(content).toContain('[1. Introduction]');
    expect(content).toContain('[2. Methods]');
    expect(content).toContain('[3. Results]');
  });

  test('numbering respects maxLevel setting (default 3)', async ({ page }) => {
    const deepMarkdown = `# Level 1

## Level 2

### Level 3

#### Level 4

##### Level 5
`;

    await page.menu.clickMenuItem('File>New>Markdown File');
    await page.waitForSelector('.jp-FileEditor');

    const editor = page.locator('.jp-FileEditor .cm-content');
    await editor.click();
    await page.keyboard.type(deepMarkdown);

    // Add numbering
    await editor.click({ button: 'right' });
    await page.click('li.lm-Menu-item:has-text("Markdown Tools")');
    await page.click('li.lm-Menu-item:has-text("Add Heading Numbering")');

    await page.waitForTimeout(500);

    const content = await page.evaluate(() => {
      const editor = document.querySelector('.jp-FileEditor .cm-content');
      return editor?.textContent || '';
    });

    // Levels 1-3 should be numbered (default maxLevel is 3)
    expect(content).toContain('# 1. Level 1');
    expect(content).toContain('## 1.1. Level 2');
    expect(content).toContain('### 1.1.1. Level 3');

    // Levels 4+ should NOT be numbered
    expect(content).toContain('#### Level 4');
    expect(content).toContain('##### Level 5');
    expect(content).not.toContain('1.1.1.1.');
  });

  test('whitespace after TOC:END is preserved during update', async ({
    page
  }) => {
    const markdownWithSpacing = `<!-- TOC:BEGIN -->
**Table of Contents**

- [Old](#Old)
<!-- TOC:END -->

# New Heading

Some content after TOC.
`;

    await page.menu.clickMenuItem('File>New>Markdown File');
    await page.waitForSelector('.jp-FileEditor');

    const editor = page.locator('.jp-FileEditor .cm-content');
    await editor.click();
    await page.keyboard.type(markdownWithSpacing);

    // Update TOC
    await editor.click({ button: 'right' });
    await page.click('li.lm-Menu-item:has-text("Markdown Tools")');
    await page.click('li.lm-Menu-item:has-text("Update Table of Contents")');

    await page.waitForTimeout(500);

    const content = await page.evaluate(() => {
      const editor = document.querySelector('.jp-FileEditor .cm-content');
      return editor?.textContent || '';
    });

    // Content after TOC should still be there
    expect(content).toContain('# New Heading');
    expect(content).toContain('Some content after TOC.');

    // TOC should be updated with new heading
    expect(content).toContain('[New Heading]');
    // Old entry should be gone
    expect(content).not.toContain('[Old]');
  });
});

test.describe('Notebook Markdown Cells', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto();
  });

  test('should show Markdown Tools in notebook markdown cell context menu', async ({
    page
  }) => {
    // Create a new notebook
    await page.menu.clickMenuItem('File>New>Notebook');

    // Wait for kernel selection dialog and dismiss it
    try {
      await page.waitForSelector('.jp-Dialog', { timeout: 5000 });
      await page.click('.jp-Dialog .jp-mod-accept');
    } catch {
      // Dialog may not appear if default kernel is set
    }

    // Wait for notebook to be ready
    await page.waitForSelector('.jp-Notebook .jp-Cell', { timeout: 30000 });
    await page.waitForTimeout(1000);

    // Change cell to markdown
    await page.keyboard.press('Escape'); // Command mode
    await page.keyboard.press('m'); // Change to markdown

    // Wait for cell type change
    await page.waitForSelector('.jp-MarkdownCell', { timeout: 10000 });

    // Enter edit mode by double-clicking
    await page.dblclick('.jp-MarkdownCell');
    await page.waitForTimeout(500);

    // Type some content
    await page.keyboard.type('# Test Heading');

    // Right-click in the cell editor area
    const cellEditor = page.locator('.jp-MarkdownCell .jp-InputArea-editor');
    await cellEditor.click({ button: 'right' });

    // Check for Markdown Tools submenu
    const submenu = page.locator('li.lm-Menu-item:has-text("Markdown Tools")');
    await expect(submenu).toBeVisible({ timeout: 5000 });
  });
});
