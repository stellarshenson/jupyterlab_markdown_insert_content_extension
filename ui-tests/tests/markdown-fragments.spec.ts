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

/**
 * Opens the Insert Symbol dialog on the editor and switches it to the Glyphs
 * tab. Clicking the tab must hand focus to the glyph search box.
 */
async function openGlyphsTab(page: Page, editor: Locator): Promise<Locator> {
  await openMarkdownTools(page, editor);
  await clickMenuItem(page, 'Insert Symbol');
  await page
    .locator('.jp-Dialog .jp-MarkdownInsert-symbolTab', { hasText: 'Glyphs' })
    .click();
  const search = page.locator('.jp-Dialog .jp-MarkdownInsert-glyphSearch');
  await expect(search).toBeFocused();
  return search;
}

/**
 * A glyph button in the open dialog. The same glyph can sit in Recent and in
 * its own group, so this takes the first.
 */
function glyphButton(page: Page, char: string): Locator {
  return page
    .locator(`.jp-Dialog .jp-MarkdownInsert-glyph[data-char="${char}"]`)
    .first();
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
    await clickMenuItem(page, 'Insert Symbol');

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
    await expect(editor).toBeFocused();
    await page.keyboard.type(' done');

    const lines = await editorLines(page, '.jp-FileEditor');
    expect(lines).toContain(`Status: ${emoji} done`);
  });

  test('should select an emoji with the keyboard alone', async ({ page }) => {
    const editor = await newMarkdownFile(page);
    await editor.click();
    await page.keyboard.type('Ship it ');

    await openMarkdownTools(page, editor);
    await clickMenuItem(page, 'Insert Symbol');

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
    await clickMenuItem(page, 'Insert Symbol');

    await expect(
      page.locator('.jp-Dialog .jp-MarkdownInsert-emojiPicker emoji-picker')
    ).toBeVisible();

    await page.click('.jp-Dialog .jp-mod-reject');
    await expect(page.locator('.jp-Dialog')).toHaveCount(0);

    // Cancel hands the caret back too - typing continues where it was
    await expect(editor).toBeFocused();
    await page.keyboard.type('ok');

    const lines = await editorLines(page, '.jp-FileEditor');
    expect(lines).toEqual(['Status: ok']);
  });

  test('should insert an emoji into a notebook markdown cell', async ({
    page
  }) => {
    const editor = await newNotebookMarkdownCell(page);
    await editor.click();
    await page.keyboard.type('Ship it ');

    await openMarkdownTools(page, editor);
    await clickMenuItem(page, 'Insert Symbol');

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
    // with the caret after the emoji. Wait for the focus rather than assuming
    // it - asserting it is the point of the test, and racing it is a flake.
    await expect(editor).toBeFocused();
    await page.keyboard.type(' done');

    const lines = await editorLines(page, '.jp-MarkdownCell');
    expect(lines).toContain(`Ship it ${emoji} done`);
  });
});

test.describe('Glyph Picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto();
  });

  test('should insert a clicked glyph and return focus to the editor', async ({
    page
  }) => {
    const editor = await newMarkdownFile(page);
    await editor.click();
    await page.keyboard.type('Rating: ');

    await openGlyphsTab(page, editor);
    await glyphButton(page, '★').click();
    await expect(page.locator('.jp-Dialog')).toHaveCount(0);

    // Typing straight afterwards proves focus came back with the caret after
    // the glyph
    await expect(editor).toBeFocused();
    await page.keyboard.type(' done');

    const lines = await editorLines(page, '.jp-FileEditor');
    expect(lines).toContain('Rating: ★ done');
  });

  test('should reach the Glyphs tab and insert a search hit by keyboard alone', async ({
    page
  }) => {
    const editor = await newMarkdownFile(page);
    await editor.click();
    await page.keyboard.type('Mark ');

    await openMarkdownTools(page, editor);
    await clickMenuItem(page, 'Insert Symbol');
    const emojiTab = page.locator('.jp-Dialog .jp-MarkdownInsert-symbolTab', {
      hasText: 'Emoji'
    });
    const glyphsTab = page.locator('.jp-Dialog .jp-MarkdownInsert-symbolTab', {
      hasText: 'Glyphs'
    });

    // The dialog opens on the Emoji tab with its search focused; Shift+Tab
    // reaches the selected tab, and ArrowRight must switch tabs rather than
    // being taken by Dialog for its footer buttons
    await page.keyboard.press('Shift+Tab');
    await expect(emojiTab).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(glyphsTab).toBeFocused();
    await expect(glyphsTab).toHaveAttribute('aria-selected', 'true');

    // Tab skips the hidden emoji panel and lands in the glyph search
    await page.keyboard.press('Tab');
    await expect(
      page.locator('.jp-Dialog .jp-MarkdownInsert-glyphSearch')
    ).toBeFocused();

    await page.keyboard.type('check');
    await page.keyboard.press('Enter');
    await expect(page.locator('.jp-Dialog')).toHaveCount(0);

    const lines = await editorLines(page, '.jp-FileEditor');
    expect(lines).toContain('Mark ✓');
  });

  test('should move through the results with the arrow keys', async ({
    page
  }) => {
    const editor = await newMarkdownFile(page);
    await editor.click();
    await page.keyboard.type('Rate ');

    await openGlyphsTab(page, editor);
    await page.keyboard.type('star');

    // The footer names what Enter in the search box would insert
    await expect(
      page.locator('.jp-Dialog .jp-MarkdownInsert-glyphFooter')
    ).toContainText('full star · U+2605');

    // ArrowDown enters the grid on the first hit; ArrowRight must move within
    // the grid rather than jump to the Cancel button
    await page.keyboard.press('ArrowDown');
    await expect(glyphButton(page, '★')).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(glyphButton(page, '☆')).toBeFocused();
    await expect(
      page.locator('.jp-Dialog .jp-MarkdownInsert-glyphFooter')
    ).toContainText('empty star · U+2606');

    await page.keyboard.press('Enter');
    await expect(page.locator('.jp-Dialog')).toHaveCount(0);

    const lines = await editorLines(page, '.jp-FileEditor');
    expect(lines).toContain('Rate ☆');
  });

  test('should keep the footer on what Enter inserts', async ({ page }) => {
    const editor = await newMarkdownFile(page);
    await editor.click();

    await openGlyphsTab(page, editor);
    await page.keyboard.type('star');
    const footer = page.locator('.jp-Dialog .jp-MarkdownInsert-glyphFooter');
    await expect(footer).toContainText('full star · U+2605');

    // Hovering names the glyph in its tooltip, not in the footer
    await glyphButton(page, '☆').hover();
    await expect(glyphButton(page, '☆')).toHaveAttribute(
      'title',
      'empty star · U+2606'
    );
    await expect(footer).toContainText('full star · U+2605');

    // Focus in the grid moves the Enter target, and ArrowUp off the top row
    // hands it back to the first result
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await expect(footer).toContainText('empty star · U+2606');
    await page.keyboard.press('ArrowUp');
    await expect(
      page.locator('.jp-Dialog .jp-MarkdownInsert-glyphSearch')
    ).toBeFocused();
    await expect(footer).toContainText('full star · U+2605');

    await page.keyboard.press('Enter');
    await expect(page.locator('.jp-Dialog')).toHaveCount(0);
    const lines = await editorLines(page, '.jp-FileEditor');
    expect(lines).toContain('★');
  });

  test('should step the tabs from the focused tab, not the selected one', async ({
    page
  }) => {
    const editor = await newMarkdownFile(page);
    await editor.click();
    await openGlyphsTab(page, editor);

    // Tab goes from the search to the grid, then to Cancel; Tab on Cancel
    // wraps to the first tab, which is the unselected Emoji tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(page.locator('.jp-Dialog .jp-mod-reject')).toBeFocused();
    await page.keyboard.press('Tab');
    const emojiTab = page.locator('.jp-Dialog .jp-MarkdownInsert-symbolTab', {
      hasText: 'Emoji'
    });
    const glyphsTab = page.locator('.jp-Dialog .jp-MarkdownInsert-symbolTab', {
      hasText: 'Glyphs'
    });
    await expect(emojiTab).toBeFocused();

    // ArrowRight from Emoji is Glyphs, whichever tab is selected
    await page.keyboard.press('ArrowRight');
    await expect(glyphsTab).toBeFocused();
    await expect(glyphsTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should insert a character typed as a code point', async ({ page }) => {
    const editor = await newMarkdownFile(page);
    await editor.click();
    await page.keyboard.type('Next ');

    await openGlyphsTab(page, editor);
    await page.keyboard.type('U+2192');
    await page.keyboard.press('Enter');
    await expect(page.locator('.jp-Dialog')).toHaveCount(0);

    const lines = await editorLines(page, '.jp-FileEditor');
    expect(lines).toContain('Next →');
  });

  test('should keep glyphs with an emoji form in text presentation', async ({
    page
  }) => {
    const editor = await newMarkdownFile(page);
    await editor.click();
    await page.keyboard.type('Todo ');

    await openGlyphsTab(page, editor);
    await page.keyboard.type('checked checkbox');
    await page.keyboard.press('Enter');
    await expect(page.locator('.jp-Dialog')).toHaveCount(0);

    // U+FE0E after the glyph stops platforms drawing it as a colour emoji
    const lines = await editorLines(page, '.jp-FileEditor');
    expect(lines).toContain('Todo ☑︎');
  });

  test('should list a picked glyph first under Recent', async ({ page }) => {
    const editor = await newMarkdownFile(page);
    await editor.click();

    await openGlyphsTab(page, editor);
    await expect(
      page.locator('.jp-Dialog .jp-MarkdownInsert-glyphGroupName').first()
    ).toHaveText('Stars');
    await glyphButton(page, '▇').click();
    await expect(page.locator('.jp-Dialog')).toHaveCount(0);

    await openGlyphsTab(page, editor);
    await expect(
      page.locator('.jp-Dialog .jp-MarkdownInsert-glyphGroupName').first()
    ).toHaveText('Recent');
    await expect(
      page.locator('.jp-Dialog .jp-MarkdownInsert-glyph').first()
    ).toHaveAttribute('data-char', '▇');
  });

  test('should keep the dialog size when switching tabs', async ({ page }) => {
    const editor = await newMarkdownFile(page);
    await editor.click();

    await openMarkdownTools(page, editor);
    await clickMenuItem(page, 'Insert Symbol');

    // Measure only once the emoji grid has rendered - its scrollbar appears
    // with the data and would change the width
    const picker = page.locator(
      '.jp-Dialog .jp-MarkdownInsert-emojiPicker emoji-picker'
    );
    await expect(picker.locator('.emoji-menu button').first()).toBeVisible();

    const content = page.locator('.jp-Dialog-content');
    const before = await content.boundingBox();
    await page
      .locator('.jp-Dialog .jp-MarkdownInsert-symbolTab', { hasText: 'Glyphs' })
      .click();
    await expect(
      page.locator('.jp-Dialog .jp-MarkdownInsert-glyphSearch')
    ).toBeVisible();
    expect(await content.boundingBox()).toEqual(before);

    // The buttons rendered before the dialog opened get Dialog's jp-mod-styled
    // class, whose 13px text must not win over the glyph size
    await expect(glyphButton(page, '★')).toHaveCSS('font-size', '20px');

    // The glyph footer must sit inside the dialog body, not below its fold
    const body = await page.locator('.jp-Dialog-body').boundingBox();
    const footer = await page
      .locator('.jp-Dialog .jp-MarkdownInsert-glyphFooter')
      .boundingBox();
    expect(body).not.toBeNull();
    expect(footer).not.toBeNull();
    expect(footer!.y + footer!.height).toBeLessThanOrEqual(
      body!.y + body!.height + 1
    );
  });

  test('should insert a glyph into a notebook markdown cell', async ({
    page
  }) => {
    const editor = await newNotebookMarkdownCell(page);
    await editor.click();
    await page.keyboard.type('Rating ');

    await openGlyphsTab(page, editor);
    await glyphButton(page, '★').click();
    await expect(page.locator('.jp-Dialog')).toHaveCount(0);

    // Wait for the focus rather than assuming it - the notebook returns to
    // edit mode asynchronously, and racing it is a flake
    await expect(editor).toBeFocused();
    await page.keyboard.type(' done');

    const lines = await editorLines(page, '.jp-MarkdownCell');
    expect(lines).toContain('Rating ★ done');
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
