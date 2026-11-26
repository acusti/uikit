import { expect, test } from '@playwright/test';

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const SHEET = join(import.meta.dirname, 'fixture/src/b.css');

test('an edit to a server-rendered sheet swaps its text in place in dev', async ({
    page,
}) => {
    const original = await readFile(SHEET, 'utf8');
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Show more' })).toHaveAttribute(
        'data-hydrated',
        'true',
    );
    await expect(page.locator('.b')).toHaveCSS('color', 'rgb(128, 0, 128)');
    // gone if the edit reloads the page rather than updating it
    await page.evaluate(() => {
        (window as { isSamePage?: boolean }).isSamePage = true;
    });

    try {
        // `$&` would expand into the old text in a replacement string
        await writeFile(
            SHEET,
            original
                .replace('rgb(128, 0, 128)', 'rgb(0, 0, 128)')
                .replace('"b"', () => '"b$&"'),
        );

        await expect(page.locator('.b')).toHaveCSS('color', 'rgb(0, 0, 128)');
        await expect(page.locator('.a')).toHaveCSS('color', 'rgb(0, 128, 0)');
        const styles = page.locator('head style[data-href~="src/b.css"]');
        await expect(styles).toHaveCount(1);
        expect(await styles.textContent()).toContain('"b$&"');
        expect(
            await page.evaluate(() => (window as { isSamePage?: boolean }).isSamePage),
        ).toBe(true);
    } finally {
        await writeFile(SHEET, original);
    }
});
