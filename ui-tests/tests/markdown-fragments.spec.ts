import { expect, test } from '@jupyterlab/galata';
import type { IJupyterLabPageFixture } from '@jupyterlab/galata';
import type { Locator, Page } from '@playwright/test';

/**
 * Every GitHub alert kind, with the placeholder body inserted when there is
 * no selection. Kept in step with ALERT_TYPES in src/index.ts.
 */
const ALERT_KINDS = [
  {
    label: 'Note',
    tag: 'NOTE',
    placeholder:
      'Useful information that users should know, even when skimming content.'
  },
  {
    label: 'Tip',
    tag: 'TIP',
    placeholder: 'Helpful advice for doing things better or more easily.'
  },
  {
    label: 'Important',
    tag: 'IMPORTANT',
    placeholder: 'Key information users need to know to achieve their goal.'
  },
  {
    label: 'Warning',
    tag: 'WARNING',
    placeholder:
      'Urgent info that needs immediate user attention to avoid problems.'
  },
  {
    label: 'Caution',
    tag: 'CAUTION',
    placeholder: 'Advises about risks or negative outcomes of certain actions.'
  }
];

/**
 * Creates a markdown file and returns its editor locator
 */
async function newMarkdownFile(page: IJupyterLabPageFixture): Promise<Locator> {
  await page.menu.clickMenuItem('File>New>Markdown File');
  await page.waitForSelector('.jp-FileEditor');
  return page.locator('.jp-FileEditor .cm-content');
}

/**
 * Creates a notebook with a single markdown cell in edit mode and returns its
 * editor locator
 */
async function newNotebookMarkdownCell(
  page: IJupyterLabPageFixture
): Promise<Locator> {
  await page.menu.clickMenuItem('File>New>Notebook');

  // Kernel selection dialog only appears when no default kernel is configured
  try {
    await page.waitForSelector('.jp-Dialog', { timeout: 5000 });
    await page.click('.jp-Dialog .jp-mod-accept');
  } catch {
    // No dialog - default kernel already selected
  }

  await page.waitForSelector('.jp-Notebook .jp-Cell', { timeout: 30000 });
  await page.waitForTimeout(1000);

  await page.keyboard.press('Escape');
  await page.keyboard.press('m');
  await page.waitForSelector('.jp-MarkdownCell', { timeout: 10000 });

  await page.dblclick('.jp-MarkdownCell');
  await page.waitForTimeout(500);

  return page.locator('.jp-MarkdownCell .jp-InputArea-editor .cm-content');
}

/**
 * Reads the CodeMirror document one line per entry. Reading `textContent` off
 * the whole editor concatenates lines with no separator, which hides where a
 * blockquote prefix starts and ends.
 */
async function editorLines(page: Page, root: string): Promise<string[]> {
  return page.evaluate(
    selector =>
      Array.from(document.querySelectorAll(`${selector} .cm-line`)).map(
        line => line.textContent ?? ''
      ),
    root
  );
}

/**
 * Opens the context menu on the editor and enters the Markdown Tools submenu
 */
async function openMarkdownTools(page: Page, editor: Locator): Promise<void> {
  await editor.click({ button: 'right' });
  await page.click('li.lm-Menu-item:has-text("Markdown Tools")');
}

/**
 * Clicks a menu item by its exact label, so "Note" does not also match
 * "Notebook" or a longer sibling entry
 */
async function clickMenuItem(page: Page, label: string): Promise<void> {
  await page
    .locator('li.lm-Menu-item')
    .filter({ hasText: new RegExp(`^${label}$`) })
    .click();
}

test.use({ autoGoto: false });

test.describe('GitHub Alert Boxes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto();
  });

  for (const kind of ALERT_KINDS) {
    test(`should insert a ${kind.tag} alert with its placeholder body`, async ({
      page
    }) => {
      const editor = await newMarkdownFile(page);
      await editor.click();

      await openMarkdownTools(page, editor);
      await clickMenuItem(page, 'Insert Alert');
      await clickMenuItem(page, kind.label);
      await page.waitForTimeout(500);

      const lines = await editorLines(page, '.jp-FileEditor');
      expect(lines).toContain(`> [!${kind.tag}]`);
      expect(lines).toContain(`> ${kind.placeholder}`);
    });
  }

  test('should wrap the current selection as the alert body', async ({
    page
  }) => {
    const editor = await newMarkdownFile(page);
    await editor.click();
    await page.keyboard.type('Deploys are frozen on Fridays.');

    // Select the line, then open the context menu from the keyboard - a
    // right-click outside the selection would collapse it first
    await page.keyboard.press('Control+a');
    await page.keyboard.press('ContextMenu');
    await page.click('li.lm-Menu-item:has-text("Markdown Tools")');
    await clickMenuItem(page, 'Insert Alert');
    await clickMenuItem(page, 'Warning');
    await page.waitForTimeout(500);

    const lines = await editorLines(page, '.jp-FileEditor');
    expect(lines).toContain('> [!WARNING]');
    expect(lines).toContain('> Deploys are frozen on Fridays.');

    // The selection was replaced, not appended to
    expect(lines).not.toContain('Deploys are frozen on Fridays.');
    // Placeholder must not appear when a selection supplied the body
    expect(lines.join('\n')).not.toContain('Urgent info that needs');
  });

  test('should keep the following paragraph outside the alert', async ({
    page
  }) => {
    const editor = await newMarkdownFile(page);
    await editor.click();
    await page.keyboard.type('Existing paragraph that follows.');
    await page.keyboard.press('Control+Home');

    await openMarkdownTools(page, editor);
    await clickMenuItem(page, 'Insert Alert');
    await clickMenuItem(page, 'Note');
    await page.waitForTimeout(500);

    const lines = await editorLines(page, '.jp-FileEditor');

    // Without a trailing blank line CommonMark lazy continuation pulls the
    // paragraph into the blockquote; without a leading one it merges into
    // whatever precedes the cursor
    expect(lines).toContain('> [!NOTE]');
    expect(lines).toContain('Existing paragraph that follows.');
    const bodyIndex = lines.indexOf(
      '> Useful information that users should know, even when skimming content.'
    );
    expect(bodyIndex).toBeGreaterThan(-1);
    expect(lines[bodyIndex + 1]).toEqual('');
  });

  test('should not leave a dangling quote line at either end of the selection', async ({
    page
  }) => {
    const editor = await newMarkdownFile(page);
    await editor.click();
    await page.keyboard.type('Alpha\n\nBeta\n\nGamma');

    // Select from the end of "Alpha" down to the blank line after "Beta", so
    // the selection both starts and ends on a line break. A newline at either
    // end must not survive as a bare `>` line.
    await page.keyboard.press('Control+Home');
    await page.keyboard.press('End');
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('Shift+ArrowDown');
    await page.keyboard.press('ContextMenu');
    await page.click('li.lm-Menu-item:has-text("Markdown Tools")');
    await clickMenuItem(page, 'Insert Alert');
    await clickMenuItem(page, 'Warning');
    await page.waitForTimeout(500);

    const lines = await editorLines(page, '.jp-FileEditor');
    expect(lines).toContain('> [!WARNING]');
    expect(lines).toContain('> Beta');
    // The unselected neighbours stay outside the blockquote
    expect(lines).toContain('Alpha');
    expect(lines).toContain('Gamma');
    expect(lines).not.toContain('>');
  });

  test('should insert an alert into a notebook markdown cell', async ({
    page
  }) => {
    const editor = await newNotebookMarkdownCell(page);
    await editor.click();

    await openMarkdownTools(page, editor);
    await clickMenuItem(page, 'Insert Alert');
    await clickMenuItem(page, 'Tip');
    await page.waitForTimeout(500);

    const lines = await editorLines(page, '.jp-MarkdownCell');
    expect(lines).toContain('> [!TIP]');
    expect(lines).toContain(
      '> Helpful advice for doing things better or more easily.'
    );
  });

  test('should offer every alert kind in the Insert Alert submenu', async ({
    page
  }) => {
    const editor = await newMarkdownFile(page);
    await editor.click();

    await openMarkdownTools(page, editor);
    await clickMenuItem(page, 'Insert Alert');

    for (const kind of ALERT_KINDS) {
      await expect(
        page
          .locator('li.lm-Menu-item')
          .filter({ hasText: new RegExp(`^${kind.label}$`) })
      ).toBeVisible();
    }
  });
});

test.describe('Emoji Picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto();
  });

  test('should insert the picked emoji and close the dialog', async ({
    page
  }) => {
    const editor = await newMarkdownFile(page);
    await editor.click();
    await page.keyboard.type('Status: ');

    await openMarkdownTools(page, editor);
    await clickMenuItem(page, 'Insert Emoji');

    const picker = page.locator(
      '.jp-Dialog .jp-MarkdownInsert-emojiPicker emoji-picker'
    );
    await expect(picker).toBeVisible();

    // Searching proves the bundled dataset loaded - an empty or unreachable
    // dataSource yields no options at all
    await picker.locator('input#search').fill('rocket');

    // Search hits are buttons; the picker's skin-tone list is also role=option
    // but rendered as hidden divs, so match on the tag to avoid it
    const firstMatch = picker.locator('button[role="option"]').first();
    await expect(firstMatch).toBeVisible();
    const emoji = ((await firstMatch.textContent()) ?? '').trim();
    expect(emoji).not.toEqual('');

    await firstMatch.click();

    // Picking closes the dialog - there is no confirm button
    await expect(page.locator('.jp-Dialog')).toHaveCount(0);

    // Typing straight afterwards proves two things at once: the command
    // returned focus to the editor, and the caret stayed after the emoji.
    // Rebuilding the whole source instead of splicing would send the caret to
    // offset 0 and produce ' doneStatus: <emoji>'.
    await page.keyboard.type(' done');

    const lines = await editorLines(page, '.jp-FileEditor');
    expect(lines).toContain(`Status: ${emoji} done`);
  });

  test('should select an emoji with the keyboard alone', async ({ page }) => {
    const editor = await newMarkdownFile(page);
    await editor.click();
    await page.keyboard.type('Ship it ');

    await openMarkdownTools(page, editor);
    await clickMenuItem(page, 'Insert Emoji');

    const picker = page.locator(
      '.jp-Dialog .jp-MarkdownInsert-emojiPicker emoji-picker'
    );
    await expect(picker).toBeVisible();

    // No click into the search box - the dialog must hand it focus itself,
    // and Enter must reach the picker rather than resolving Cancel
    await page.keyboard.type('rocket');

    // The picker debounces its search; Enter is a no-op until results land
    await expect(picker.locator('button[role="option"]').first()).toBeVisible();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await expect(page.locator('.jp-Dialog')).toHaveCount(0);

    const lines = await editorLines(page, '.jp-FileEditor');
    expect(lines.join('\n')).toMatch(/^Ship it \S/);
  });

  test('should leave the document unchanged when the dialog is cancelled', async ({
    page
  }) => {
    const editor = await newMarkdownFile(page);
    await editor.click();
    await page.keyboard.type('Status: ');

    await openMarkdownTools(page, editor);
    await clickMenuItem(page, 'Insert Emoji');

    await expect(
      page.locator('.jp-Dialog .jp-MarkdownInsert-emojiPicker emoji-picker')
    ).toBeVisible();

    await page.click('.jp-Dialog .jp-mod-reject');
    await expect(page.locator('.jp-Dialog')).toHaveCount(0);

    const lines = await editorLines(page, '.jp-FileEditor');
    expect(lines).toEqual(['Status: ']);
  });

  test('should insert an emoji into a notebook markdown cell', async ({
    page
  }) => {
    const editor = await newNotebookMarkdownCell(page);
    await editor.click();
    await page.keyboard.type('Ship it ');

    await openMarkdownTools(page, editor);
    await clickMenuItem(page, 'Insert Emoji');

    const picker = page.locator(
      '.jp-Dialog .jp-MarkdownInsert-emojiPicker emoji-picker'
    );
    await expect(picker).toBeVisible();

    await picker.locator('input#search').fill('rocket');

    // Search hits are buttons; the picker's skin-tone list is also role=option
    // but rendered as hidden divs, so match on the tag to avoid it
    const firstMatch = picker.locator('button[role="option"]').first();
    await expect(firstMatch).toBeVisible();
    const emoji = ((await firstMatch.textContent()) ?? '').trim();

    await firstMatch.click();
    await expect(page.locator('.jp-Dialog')).toHaveCount(0);

    // Typing without clicking proves the notebook was returned to edit mode
    // with the caret after the emoji
    await page.keyboard.type(' done');

    const lines = await editorLines(page, '.jp-MarkdownCell');
    expect(lines).toContain(`Ship it ${emoji} done`);
  });
});

test.describe('Fragment Menu Scoping', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto();
  });

  test('should not offer the fragments in a non-markdown file editor', async ({
    page
  }) => {
    await page.menu.clickMenuItem('File>New>Python File');
    await page.waitForSelector('.jp-FileEditor');

    await page.click('.jp-FileEditor .cm-content', { button: 'right' });

    await expect(
      page.locator('li.lm-Menu-item:has-text("Markdown Tools")')
    ).toHaveCount(0);
  });
});
