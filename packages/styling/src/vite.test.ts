// @vitest-environment happy-dom
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, defaultClientConditions, type Rolldown } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import styleSheets, { type Options } from './vite.js';

type Environment = {
    config: { consumer: 'client' | 'server'; root: string };
    mode: 'build' | 'dev';
};

type Hook<Handler> = { filter: { id: Array<RegExp> }; handler: Handler };

type ResolveContext = {
    environment: { config: { root: string }; mode: Environment['mode'] };
    resolve: (...args: Array<unknown>) => Promise<null | { id: string }>;
};

type ResolveHandler = (
    this: ResolveContext,
    source: string,
    importer: string,
) => Promise<string | undefined | { external: boolean; id: string }>;

const ROOT = '/project';
const FILE = '/project/app/components/card.css';
const ID = '\0style-sheet:app/components/card.css.sheet.js';

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

function resolveId(
    source: string,
    resolved: null | { id: string },
    mode: Environment['mode'] = 'build',
    plugin = styleSheets(),
) {
    const calls: Array<unknown> = [];
    const hook = plugin.resolveId as Hook<ResolveHandler>;
    const result = hook.handler.call(
        {
            environment: { config: { root: ROOT }, mode },
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
    const matches = (hook: unknown, id: string) =>
        (hook as Hook<unknown>).filter.id.some((filter) => filter.test(id));

    expect(matches(plugin.resolveId, './card.css?sheet')).toBe(true);
    expect(matches(plugin.resolveId, './card.css?sheet=%40scope%2Fui%2Fcard.css')).toBe(
        true,
    );
    expect(matches(plugin.resolveId, '@acusti/styling')).toBe(true);
    expect(matches(plugin.resolveId, './card.css?inline')).toBe(false);
    expect(matches(plugin.resolveId, './card.css')).toBe(false);
    expect(matches(plugin.resolveId, '@acusti/styling/vite')).toBe(false);
    expect(matches(plugin.load, ID)).toBe(true);
    expect(matches(plugin.load, '\0acusti-styling:inline')).toBe(true);
    expect(matches(plugin.load, FILE)).toBe(false);
});

describe('resolveId', () => {
    it('resolves a ?sheet import to a virtual id ending in .js', async () => {
        const { calls, result } = resolveId('./card.css?sheet', { id: FILE });

        expect(await result).toBe(ID);
        expect(calls).toEqual([
            ['./card.css', '/project/app/components/Card.tsx', { skipSelf: true }],
        ]);
    });

    // in dev, the module is served at a URL made from its id, where the `..`
    // segments of a path from the Vite root would collapse
    it('keeps the absolute path in a dev id', async () => {
        const { result } = resolveId(
            '../../shared/card.css?sheet',
            { id: '/shared/card.css' },
            'dev',
        );

        expect(await result).toBe('\0style-sheet:/shared/card.css.sheet.js');
    });

    it('leaves other imports alone', async () => {
        const { calls, result } = resolveId('./card.css?inline', { id: FILE });

        expect(await result).toBeUndefined();
        expect(calls).toEqual([]);
    });

    it('leaves an import it can’t resolve to Vite', async () => {
        expect(await resolveId('./missing.css?sheet', null).result).toBeUndefined();
    });
});

describe('a dual-published library', () => {
    it('resolves @acusti/styling to plain <style>s in a default library build', async () => {
        const plugin = styleSheets({ library: 'default' });
        const { result } = resolveId('@acusti/styling', null, 'build', plugin);

        expect(await result).toBe('\0acusti-styling:inline');
        expect(load({ id: '\0acusti-styling:inline' })).toContain(
            "jsx('style', { children: sheet.css, href: sheet.href, precedence })",
        );
    });

    it('leaves @acusti/styling external in a raw library build', async () => {
        const plugin = styleSheets({ library: 'raw' });
        const { result } = resolveId('@acusti/styling', null, 'build', plugin);

        expect(await result).toEqual({ external: true, id: '@acusti/styling' });
    });

    it('leaves @acusti/styling to Vite in an app', async () => {
        expect(await resolveId('@acusti/styling', null).result).toBeUndefined();
    });

    it('takes the href a raw library build’s import carries', async () => {
        const plugin = styleSheets({ prefix: '@app/' });
        const { calls, result } = resolveId(
            './card.css?sheet=%40scope%2Fui%2Fsrc%2Fcard.css',
            { id: FILE },
            'build',
            plugin,
        );
        const id = (await result) as string;
        const hook = plugin.load as Hook<
            (this: { environment: Environment }, id: string) => string
        >;

        expect(calls).toEqual([
            ['./card.css', '/project/app/components/Card.tsx', { skipSelf: true }],
        ]);
        expect(
            hook.handler.call(
                {
                    environment: {
                        config: { consumer: 'client', root: ROOT },
                        mode: 'build',
                    },
                },
                id,
            ),
        ).toContain('href: "@scope/ui/src/card.css"');
    });

    // the server keeps the default build, which Node loads for a dependency
    // Vite leaves external
    it('resolves a library to its raw build in an app’s client only', () => {
        const configEnvironment = (options?: Options) => {
            const hook = styleSheets(options).configEnvironment as (
                name: string,
                config: {
                    consumer?: 'client' | 'server';
                    resolve?: { conditions?: Array<string> };
                },
            ) => unknown;
            return hook;
        };

        expect(configEnvironment()('client', {})).toEqual({
            resolve: { conditions: ['acusti-styling', ...defaultClientConditions] },
        });
        expect(
            configEnvironment()('client', { resolve: { conditions: ['custom'] } }),
        ).toEqual({ resolve: { conditions: ['acusti-styling', 'custom'] } });
        expect(configEnvironment()('ssr', {})).toBeUndefined();
        expect(configEnvironment()('client', { consumer: 'server' })).toBeUndefined();
        expect(configEnvironment()('edge', { consumer: 'client' })).toEqual({
            resolve: { conditions: ['acusti-styling', ...defaultClientConditions] },
        });
        expect(configEnvironment({ library: 'raw' })('client', {})).toBeUndefined();
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
        expect(load({ id: '\0style-sheet:app/my card.css.sheet.js' })).toContain(
            'href: "app/my%20card.css"',
        );
    });

    it('gives a stripping client build the URL of the sheet’s asset in place of its text', () => {
        expect(load({ options: { stripClientCSS: true } })).toBe(
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
        expect(load({ consumer: 'server', options: { stripClientCSS: true } })).toContain(
            '?inline',
        );
    });

    it('keeps the text in dev with stripping on', () => {
        expect(load({ mode: 'dev', options: { stripClientCSS: true } })).toContain(
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
            "import sheet from './sheet.css?sheet';\nexport default sheet;\n",
        );
        await writeFile(
            join(root, 'src/library.js'),
            "import { Style } from '@acusti/styling';\nimport sheet from './sheet.css?sheet';\nexport default () => Style({ sheet });\n",
        );
        await mkdir(join(root, 'src/inner'));
        await writeFile(
            join(root, 'src/component.js'),
            "import sheet from './sheet.css?sheet';\nexport default () => sheet.href;\n",
        );
    });

    afterAll(() => rm(root, { force: true, recursive: true }));

    async function buildEntry({
        cssMinify = false,
        entry = 'src/entry.js',
        options,
        ssr = false,
        viteRoot = root,
    }: {
        cssMinify?: boolean;
        entry?: string;
        options?: Options;
        ssr?: boolean;
        viteRoot?: string;
    }) {
        const output = (await build({
            build: {
                cssMinify,
                minify: false,
                rolldownOptions: {
                    external: [/^react(\/|$)/],
                    input: join(root, entry),
                    preserveEntrySignatures: 'strict',
                },
                ssr,
                write: false,
            },
            configFile: false,
            logLevel: 'silent',
            plugins: [styleSheets(options)],
            root: viteRoot,
        })) as Rolldown.RolldownOutput;
        const code = output.output
            .filter((file) => file.type === 'chunk')
            .map((chunk) => chunk.code)
            .join('\n');
        const assets = output.output.filter((file) => file.type === 'asset');
        return { assets, code };
    }

    it('leaves the text out of a stripping client build and emits it as an asset', async () => {
        const { assets, code } = await buildEntry({ options: { stripClientCSS: true } });

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

    // a build that keeps comments, as a library’s does by default, names each
    // module in the output by its id
    it('keeps the path of the directory it builds in out of the output', async () => {
        const { code } = await buildEntry({ entry: 'src/component.js' });

        // the comment spells out the id’s NUL as `\0`
        expect(code).toContain('// \\0style-sheet:src/sheet.css.sheet.js');
        expect(code).not.toMatch(/style-sheet:\//);
    });

    it('keeps the text in a default library build with stripping on', async () => {
        const { assets, code } = await buildEntry({
            entry: 'src/library.js',
            options: { library: 'default', stripClientCSS: true },
        });

        expect(code).toContain('from-the-sheet');
        expect(assets).toEqual([]);
    });

    it('builds a default library that imports nothing from @acusti/styling', async () => {
        const { assets, code } = await buildEntry({
            entry: 'src/library.js',
            options: { library: 'default', prefix: '@scope/ui/' },
        });

        expect(code).not.toContain('@acusti/styling"');
        expect(code).toContain('jsx("style"');
        expect(code).toContain('from-the-sheet');
        expect(code).toContain('href: "@scope/ui/src/sheet.css"');
        expect(assets).toEqual([]);
    });

    it('builds a raw library that keeps its sheet imports, with their hrefs', async () => {
        const { assets, code } = await buildEntry({
            entry: 'src/library.js',
            options: { library: 'raw', prefix: '@scope/ui/' },
        });

        expect(code).toContain('from "@acusti/styling"');
        expect(code).toContain(
            'from "./src/sheet.css?sheet=%40scope%2Fui%2Fsrc%2Fsheet.css"',
        );
        expect(assets.map((file) => file.fileName)).toEqual(['src/sheet.css']);
        // the library’s processed text, as the default build carries it
        expect(String(assets[0]!.source)).toContain('from-the-sheet');
    });

    it('emits the library’s processed CSS in a raw library build', async () => {
        const { assets } = await buildEntry({
            cssMinify: true,
            entry: 'src/library.js',
            options: { library: 'raw' },
        });

        expect(String(assets[0]!.source)).toBe('.from-the-sheet{color:#010203}');
    });

    it('refuses a raw library sheet outside the Vite root', async () => {
        await expect(
            buildEntry({
                entry: 'src/library.js',
                options: { library: 'raw' },
                viteRoot: join(root, 'src/inner'),
            }),
        ).rejects.toThrow(/outside the Vite root/);
    });

    it('keeps the text in a server build that strips', async () => {
        const { code } = await buildEntry({
            options: { stripClientCSS: true },
            ssr: true,
        });

        expect(code).toContain('from-the-sheet');
    });
});
