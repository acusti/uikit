// @vitest-environment happy-dom
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, type Rolldown } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import styleSheets, { type Options } from './vite.js';

type Environment = {
    config: { consumer: 'client' | 'server'; root: string };
    mode: 'build' | 'dev';
};

type Hook<Handler> = { filter: { id: RegExp }; handler: Handler };

const ROOT = '/project';
const FILE = '/project/app/components/card.css';
const ID = `\0style-sheet:${FILE}.style.js`;

function load({
    consumer = 'client',
    id = ID,
    mode = 'build',
    options,
}: {
    consumer?: Environment['config']['consumer'];
    id?: string;
    mode?: Environment['mode'];
    options?: Options;
}) {
    const plugin = styleSheets(options);
    const hook = plugin.load as Hook<
        (this: { environment: Environment }, id: string) => string
    >;
    return hook.handler.call(
        { environment: { config: { consumer, root: ROOT }, mode } },
        id,
    );
}

function resolveId(source: string, resolved: null | { id: string }) {
    const plugin = styleSheets();
    const calls: Array<unknown> = [];
    const hook = plugin.resolveId as Hook<
        (
            this: {
                resolve: (...args: Array<unknown>) => Promise<null | { id: string }>;
            },
            source: string,
            importer: string,
        ) => Promise<string | undefined>
    >;
    const result = hook.handler.call(
        {
            resolve: (...args) => {
                calls.push(args);
                return Promise.resolve(resolved);
            },
        },
        source,
        '/project/app/components/Card.tsx',
    );
    return { calls, result };
}

// what Rolldown checks before calling into JavaScript at all
it('filters each hook to the ids it handles', () => {
    const plugin = styleSheets();
    const resolveFilter = (plugin.resolveId as Hook<unknown>).filter.id;
    const loadFilter = (plugin.load as Hook<unknown>).filter.id;

    expect(resolveFilter.test('./card.css?style')).toBe(true);
    expect(resolveFilter.test('./card.css?inline')).toBe(false);
    expect(resolveFilter.test('./card.css')).toBe(false);
    expect(loadFilter.test(ID)).toBe(true);
    expect(loadFilter.test(FILE)).toBe(false);
});

describe('resolveId', () => {
    it('resolves a ?style import to a virtual id ending in .js', async () => {
        const { calls, result } = resolveId('./card.css?style', { id: FILE });

        expect(await result).toBe(ID);
        expect(calls).toEqual([
            ['./card.css', '/project/app/components/Card.tsx', { skipSelf: true }],
        ]);
    });

    it('leaves other imports alone', async () => {
        const { calls, result } = resolveId('./card.css?inline', { id: FILE });

        expect(await result).toBeUndefined();
        expect(calls).toEqual([]);
    });

    it('leaves an import it can’t resolve to Vite', async () => {
        expect(await resolveId('./missing.css?style', null).result).toBeUndefined();
    });
});

describe('load', () => {
    it('leaves other ids alone', () => {
        expect(load({ id: FILE })).toBeUndefined();
    });

    it('gives the sheet Vite’s ?inline text and an href from the Vite root', () => {
        expect(load({})).toBe(
            [
                `import css from "${FILE}?inline";`,
                'const sheet = { css, href: "app/components/card.css" };',
                'export default sheet;',
                '',
            ].join('\n'),
        );
    });

    it('takes the href from the root option', () => {
        expect(load({ options: { root: '/project/app' } })).toContain(
            'href: "components/card.css"',
        );
    });

    it('resolves a relative root option against the Vite root', () => {
        expect(load({ options: { root: 'app' } })).toContain(
            'href: "components/card.css"',
        );
    });

    it('puts the prefix option ahead of the href', () => {
        expect(load({ options: { prefix: '@scope/ui/', root: 'app' } })).toContain(
            'href: "@scope/ui/components/card.css"',
        );
    });

    it('encodes a space, which would split the href in a server render’s data-href', () => {
        const file = '/project/app/my card.css';
        expect(load({ id: `\0style-sheet:${file}.style.js` })).toContain(
            'href: "app/my%20card.css"',
        );
    });

    it('gives a stripping client build the URL of the sheet’s asset in place of its text', () => {
        expect(load({ options: { stripClientText: true } })).toBe(
            [
                `import url from "${FILE}?url";`,
                'export default { href: "app/components/card.css", url };',
                '',
            ].join('\n'),
        );
    });

    it('keeps the text in a client build by default', () => {
        expect(load({})).toContain('?inline');
    });

    it('keeps the text in a server build that strips', () => {
        expect(
            load({ consumer: 'server', options: { stripClientText: true } }),
        ).toContain('?inline');
    });

    it('keeps the text in dev with stripping on', () => {
        expect(load({ mode: 'dev', options: { stripClientText: true } })).toContain(
            '?inline',
        );
    });

    it('accepts updates to the sheet in client dev, and only there', () => {
        const code = load({ mode: 'dev' });
        expect(code).toContain(
            `import.meta.hot.accept("${FILE}?inline", (module) => replaceText(sheet, module?.default));`,
        );
        expect(load({ consumer: 'server', mode: 'dev' })).not.toContain(
            'import.meta.hot',
        );
        expect(load({})).not.toContain('import.meta.hot');
    });

    it('inlines a replaceText that runs on its own in the browser', () => {
        const code = load({ mode: 'dev' });
        const source = code.slice(
            code.indexOf('const replaceText = ') + 'const replaceText = '.length,
            code.indexOf(';\n    import.meta.hot.accept'),
        );
        // oxlint-disable-next-line typescript/no-implied-eval
        const replaceText = new Function(`return (${source});`)() as (
            sheet: { css: string; href: string },
            css: string,
        ) => void;
        const style = document.createElement('style');
        style.dataset.href = 'app/components/card.css';
        style.textContent = '.card{color:red}';
        document.head.appendChild(style);

        replaceText(
            { css: '.card{color:red}', href: 'app/components/card.css' },
            '.card{}',
        );

        expect(style.textContent).toBe('.card{}');
        style.remove();
    });
});

// a real Vite build of an entry that imports a sheet
describe('build', () => {
    let root = '';
    const CSS = '.from-the-sheet {\n    color: rgb(1, 2, 3);\n}\n';

    beforeAll(async () => {
        root = await mkdtemp(join(tmpdir(), 'styling-vite-'));
        await mkdir(join(root, 'src'));
        await writeFile(join(root, 'src/sheet.css'), CSS);
        await writeFile(
            join(root, 'src/entry.js'),
            "import sheet from './sheet.css?style';\nexport default sheet;\n",
        );
    });

    afterAll(() => rm(root, { force: true, recursive: true }));

    async function buildEntry({
        options,
        ssr = false,
    }: {
        options?: Options;
        ssr?: boolean;
    }) {
        const output = (await build({
            build: {
                minify: false,
                rolldownOptions: {
                    input: join(root, 'src/entry.js'),
                    preserveEntrySignatures: 'strict',
                },
                ssr,
                write: false,
            },
            configFile: false,
            logLevel: 'silent',
            plugins: [styleSheets(options)],
            root,
        })) as Rolldown.RolldownOutput;
        const code = output.output
            .filter((file) => file.type === 'chunk')
            .map((chunk) => chunk.code)
            .join('\n');
        const assets = output.output.filter((file) => file.type === 'asset');
        return { assets, code };
    }

    it('leaves the text out of a stripping client build and emits it as an asset', async () => {
        const { assets, code } = await buildEntry({ options: { stripClientText: true } });

        expect(code).not.toContain('from-the-sheet');
        expect(code).toContain('href: "src/sheet.css"');
        const asset = assets.find((file) => file.fileName.endsWith('.css'))!;
        expect(String(asset.source)).toContain('.from-the-sheet');
        expect(code).toContain(asset.fileName);
    });

    it('keeps Vite’s processed text in a client build that doesn’t strip', async () => {
        const { assets, code } = await buildEntry({});

        expect(code).toContain('from-the-sheet');
        expect(assets.filter((file) => file.fileName.endsWith('.css'))).toEqual([]);
    });

    it('keeps the text in a server build that strips', async () => {
        const { code } = await buildEntry({
            options: { stripClientText: true },
            ssr: true,
        });

        expect(code).toContain('from-the-sheet');
    });
});
