import { expect, type Page, test } from '@playwright/test';

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// a custom property only the fixture’s stylesheets declare
const MARKER = '--styling-e2e-marker';
const DIST = join(import.meta.dirname, 'fixture/dist');

function getHoistedStyles(page: Page) {
    return page.locator('head style[data-href]').evaluateAll((styles) =>
        styles.map((style) => ({
            href: style.getAttribute('data-href'),
            precedence: style.getAttribute('data-precedence'),
            text: style.textContent,
        })),
    );
}

async function readAll(directory: string, extension: string) {
    const files = await readdir(directory, { recursive: true });
    return Promise.all(
        files
            .filter((file) => file.endsWith(extension))
            .map((file) => readFile(join(directory, file), 'utf8')),
    );
}

// every console error or warning and every uncaught error, and the URL of
// every stylesheet asset the page asks for
function watch(page: Page) {
    const problems: Array<string> = [];
    const sheetRequests: Array<string> = [];
    page.on('console', (message) => {
        if (message.type() === 'error' || message.type() === 'warning') {
            problems.push(message.text());
        }
    });
    page.on('pageerror', (error) => problems.push(error.message));
    page.on('request', (request) => {
        if (request.url().endsWith('.css')) sheetRequests.push(request.url());
    });
    return { problems, sheetRequests };
}

test('the client build carries no CSS text, and the server build does', async () => {
    const clientScripts = await readAll(join(DIST, 'client'), '.js');
    const clientSheets = await readAll(join(DIST, 'client'), '.css');
    const serverScripts = await readAll(join(DIST, 'server'), '.js');

    expect(clientScripts.length).toBeGreaterThan(1);
    for (const script of clientScripts) expect(script).not.toContain(MARKER);
    // a.css, b.css and the lazy c.css, each emitted as an asset to fetch
    expect(clientSheets.filter((sheet) => sheet.includes(MARKER))).toHaveLength(3);
    expect(serverScripts.join('\n').match(new RegExp(MARKER, 'g'))).toHaveLength(3);
});

test('hydration keeps the server’s styles without fetching them', async ({
    page,
    request,
}) => {
    const { problems, sheetRequests } = watch(page);
    const html = await (await request.get('/')).text();
    const served =
        /<style data-precedence="medium" data-href="([^"]+)">([^<]+)<\/style>/.exec(html);
    expect(served?.[1]).toBe('src/a.css src/b.css');

    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Show more' })).toHaveAttribute(
        'data-hydrated',
        'true',
    );

    expect(await getHoistedStyles(page)).toEqual([
        { href: served![1], precedence: 'medium', text: served![2] },
    ]);
    await expect(page.locator('.a')).toHaveCSS('color', 'rgb(0, 128, 0)');
    await expect(page.locator('.b')).toHaveCSS('color', 'rgb(128, 0, 128)');
    expect(sheetRequests).toEqual([]);
    expect(problems).toEqual([]);
});

test('a client render of a sheet the page lacks fetches it and inserts it in render order', async ({
    page,
}) => {
    const { problems, sheetRequests } = watch(page);
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Show more' })).toHaveAttribute(
        'data-hydrated',
        'true',
    );
    const [served] = await getHoistedStyles(page);

    await page.getByRole('button', { name: 'Show more' }).click();

    await expect(page.getByText('styled by c')).toBeVisible();
    expect(sheetRequests).toEqual([expect.stringMatching(/\/assets\/c-[\w-]+\.css$/)]);
    const hoisted = await getHoistedStyles(page);
    expect(hoisted.map((style) => style.href)).toEqual([
        'src/a.css src/b.css',
        'src/c.css',
        'tokens',
    ]);
    expect(hoisted[0]).toEqual(served);
    expect(hoisted[1]!.text).toContain(`${MARKER}:"c"`);
    // tokens.css overrides c.css’s color only if it comes after it
    await expect(page.locator('.c')).toHaveCSS('color', 'rgb(0, 0, 255)');
    await expect(page.locator('.c')).toHaveCSS('font-weight', '700');
    expect(problems).toEqual([]);
});
