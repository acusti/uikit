// @vitest-environment happy-dom
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
    build,
    defaultClientConditions,
    type InlineConfig,
    type Rolldown,
    resolveConfig,
} from 'vite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createElement, type ReactNode } from 'react';
import { jsx } from 'react/jsx-runtime';
import { renderToString } from 'react-dom/server';

import * as sheets from './index.js';
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
    expect(matches(plugin.resolveId, '@acusti/sheets')).toBe(true);
    expect(matches(plugin.resolveId, './card.css?inline')).toBe(false);
    expect(matches(plugin.resolveId, './card.css')).toBe(false);
    expect(matches(plugin.resolveId, '@acusti/sheets/vite')).toBe(false);
    expect(matches(plugin.load, ID)).toBe(true);
    expect(matches(plugin.load, '\0acusti-sheets:inline')).toBe(true);
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
    it('resolves @acusti/sheets to plain <style>s in a default library build', async () => {
        const plugin = styleSheets({ library: 'default' });
        const { result } = resolveId('@acusti/sheets', null, 'build', plugin);

        expect(await result).toBe('\0acusti-sheets:inline');
        expect(load({ id: '\0acusti-sheets:inline' })).toContain(
            "jsx('style', { children: sheet.css, href: sheet.href, precedence })",
        );
    });

    it('leaves @acusti/sheets external in a raw library build', async () => {
        const plugin = styleSheets({ library: 'raw' });
        const { result } = resolveId('@acusti/sheets', null, 'build', plugin);

        expect(await result).toEqual({ external: true, id: '@acusti/sheets' });
    });

    it('leaves @acusti/sheets to Vite in an app', async () => {
        expect(await resolveId('@acusti/sheets', null).result).toBeUndefined();
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
    it('resolves a library to its raw build in an app’s client only', async () => {
        const getEnvironments = async (config: InlineConfig) =>
            (
                await resolveConfig(
                    { configFile: false, logLevel: 'silent', ...config },
                    'build',
                )
            ).environments;

        const app = await getEnvironments({
            environments: { ssr: {} },
            plugins: [styleSheets()],
        });
        expect(app.client!.resolve.conditions).toEqual([
            'acusti-sheets',
            ...defaultClientConditions,
        ]);
        // the app’s copy, which a linked library would otherwise not find
        expect(app.client!.resolve.dedupe).toEqual(['@acusti/sheets']);
        expect(app.ssr!.resolve.conditions).not.toContain('acusti-sheets');

        // conditions the app sets come once, with the library’s after them
        const custom = await getEnvironments({
            plugins: [styleSheets()],
            resolve: { conditions: ['custom'] },
        });
        expect(custom.client!.resolve.conditions).toEqual(['custom', 'acusti-sheets']);

        const edge = await getEnvironments({
            environments: { edge: { consumer: 'client' } },
            plugins: [styleSheets()],
        });
        expect(edge.edge!.resolve.conditions).toContain('acusti-sheets');

        const library = await getEnvironments({
            plugins: [styleSheets({ library: 'raw' })],
        });
        expect(library.client!.resolve.conditions).not.toContain('acusti-sheets');
    });

    describe('a raw library build’s sheets', () => {
        let sheetRoot = '';
        let sheetFile = '';
        const asset = {
            fileName: 'app/components/card.css',
            source: '.card{}',
            type: 'asset',
        };
        const processed = () => Promise.resolve({ code: 'export default ".card{}"' });

        beforeAll(async () => {
            sheetRoot = await mkdtemp(join(tmpdir(), 'sheets-rebuild-'));
            await mkdir(join(sheetRoot, 'app/components'), { recursive: true });
        });

        afterAll(() => rm(sheetRoot, { force: true, recursive: true }));

        // the file each test’s sheet comes from, which a test may delete
        beforeEach(async () => {
            sheetFile = join(sheetRoot, 'app/components/card.css');
            await writeFile(sheetFile, '.card {}\n');
        });

        function rawLibrary({
            load: loadInline,
            meta = {},
        }: {
            load: () => Promise<null | { code: string }>;
            meta?: Record<string, unknown>;
        }) {
            const plugin = styleSheets({ library: 'raw' });
            const emitted: Array<unknown> = [];
            const watched: Array<string> = [];
            const context = {
                addWatchFile: (file: string) => watched.push(file),
                emitFile: (file: unknown) => emitted.push(file),
                environment: { config: { root: sheetRoot }, mode: 'build' },
                error: (message: string) => {
                    throw new Error(message);
                },
                load: loadInline,
                meta,
                resolve: (source: string) =>
                    Promise.resolve({
                        id: source.endsWith('?inline')
                            ? `${sheetFile}?inline`
                            : sheetFile,
                    }),
            };
            const buildStart = () =>
                (plugin.buildStart as (this: unknown) => Promise<void>).call(context);
            const resolveSheet = () =>
                (
                    plugin.resolveId as Hook<
                        (...args: Array<unknown>) => Promise<unknown>
                    >
                ).handler.call(
                    context,
                    './card.css?sheet',
                    join(sheetRoot, 'app/components/Card.tsx'),
                );
            return { buildStart, emitted, resolveSheet, watched };
        }

        it('fails on ?inline output that isn’t a string', async () => {
            const { resolveSheet } = rawLibrary({ load: () => Promise.resolve(null) });

            await expect(resolveSheet()).rejects.toThrow(/unexpected \?inline output/);
        });

        // Rollup reuses the resolutions of an importer that didn’t change, so
        // its rebuild calls `buildStart` and no `resolveId` for their sheets
        it('emits a raw library’s sheets again on Rollup', async () => {
            const { buildStart, emitted, resolveSheet } = rawLibrary({ load: processed });

            await resolveSheet();
            await buildStart();
            // an importer that changed resolves its sheet again
            await resolveSheet();

            expect(emitted).toEqual([asset, asset]);
        });

        it('fails on Rollup when a sheet’s CSS doesn’t compile', async () => {
            let next = processed;
            const { buildStart, resolveSheet } = rawLibrary({ load: () => next() });

            await resolveSheet();
            next = () => Promise.reject(new Error('[postcss] ENOENT: missing.css'));

            await expect(buildStart()).rejects.toThrow('[postcss] ENOENT: missing.css');
        });

        // so that putting the file back rebuilds with it, since Rollup keeps
        // the resolution of an importer that didn’t change
        it('watches on Rollup a sheet whose file is gone, and emits it once it’s back', async () => {
            let next = processed;
            const { buildStart, emitted, resolveSheet, watched } = rawLibrary({
                load: () => next(),
            });

            await resolveSheet();
            await rm(sheetFile);
            next = () => Promise.reject(new Error('ENOENT'));
            await buildStart();
            expect(emitted).toEqual([asset]);
            expect(watched).toEqual([sheetFile]);

            await writeFile(sheetFile, '.card {}\n');
            next = processed;
            await buildStart();
            expect(emitted).toEqual([asset, asset]);
        });

        // Rolldown resolves each import again, and loads nothing from `buildStart`
        it('leaves a raw library’s sheets to resolveId on Rolldown', async () => {
            const loads: Array<string> = [];
            let next = processed;
            const { buildStart, emitted, resolveSheet } = rawLibrary({
                load: () => {
                    loads.push('load');
                    return next();
                },
                meta: { rolldownVersion: '1.3.4' },
            });

            // other importers of the same sheet in one build, resolving it at
            // the same time or later, emit nothing more
            await Promise.all([resolveSheet(), resolveSheet()]);
            await resolveSheet();
            expect(emitted).toEqual([asset]);

            loads.length = 0;
            next = () => Promise.reject(new Error('not supported in buildStart'));
            await buildStart();
            expect(loads).toEqual([]);

            next = processed;
            await resolveSheet();
            expect(emitted).toEqual([asset, asset]);
        });
    });
});

// The few lines a default library build renders in place of
// `@acusti/sheets`, against the package itself
describe('the default library build’s inline runtime', () => {
    const code = load({ id: '\0acusti-sheets:inline' });
    // the plugin’s own constant, which a library build would bundle as a module
    // oxlint-disable-next-line typescript/no-implied-eval
    const shim = new Function(
        'jsx',
        `${code.replace(/^import .*\n/, '').replaceAll('export function', 'function')}
return { RuntimeStyle, Style, StyleProvider };`,
    )(jsx) as typeof sheets;
    const renderPage = (content: ReactNode) =>
        renderToString(
            createElement(
                'html',
                null,
                createElement('head'),
                createElement('body', null, content),
            ),
        );

    it('exports what the package does', () => {
        expect(
            [...code.matchAll(/^export function (\w+)/gm)]
                .map((match) => match[1])
                .sort(),
        ).toEqual(Object.keys(sheets).sort());
    });

    it.each(Object.keys(sheets) as Array<keyof typeof sheets>)(
        'renders %s as the package does, for a sheet with its text',
        (name) => {
            const sheet = { css: '.card{color:red}', href: 'card.css' };
            const render = (module: typeof sheets) => {
                switch (name) {
                    case 'RuntimeStyle':
                        return renderPage([
                            jsx(
                                module.RuntimeStyle,
                                { children: '.a{}', href: 'theme a' },
                                'a',
                            ),
                            jsx(
                                module.RuntimeStyle,
                                { children: '.b{}', href: 'b', precedence: 'high' },
                                'b',
                            ),
                        ]);
                    case 'Style':
                        return renderPage([
                            createElement(module.Style, { key: 'a', sheet }),
                            createElement(module.Style, {
                                key: 'b',
                                precedence: 'high',
                                sheet: { ...sheet, href: 'b.css' },
                            }),
                        ]);
                    case 'StyleProvider':
                        return renderPage(
                            createElement(
                                module.StyleProvider,
                                { onError: () => undefined },
                                createElement(module.Style, { sheet }),
                            ),
                        );
                }
            };

            expect(render(shim)).toBe(render(sheets));
        },
    );
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
        root = await mkdtemp(join(tmpdir(), 'sheets-vite-'));
        await mkdir(join(root, 'src'));
        await writeFile(join(root, 'src/sheet.css'), CSS);
        await writeFile(
            join(root, 'src/entry.js'),
            "import sheet from './sheet.css?sheet';\nexport default sheet;\n",
        );
        await writeFile(
            join(root, 'src/library.js'),
            "import { Style } from '@acusti/sheets';\nimport sheet from './sheet.css?sheet';\nexport default () => Style({ sheet });\n",
        );
        await writeFile(
            join(root, 'src/lazy-library.js'),
            "export default () => import('@acusti/sheets');\n",
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
        entryFileNames = '[name].js',
        external = [/^react(\/|$)/],
        options,
        plugin = styleSheets(options),
        ssr = false,
        viteRoot = root,
    }: {
        cssMinify?: boolean;
        entry?: string;
        entryFileNames?: string;
        external?: Array<RegExp | string>;
        options?: Options;
        plugin?: ReturnType<typeof styleSheets>;
        ssr?: boolean;
        viteRoot?: string;
    }) {
        const output = (await build({
            build: {
                cssMinify,
                minify: false,
                rolldownOptions: {
                    external,
                    input: join(root, entry),
                    // at the output’s root, as a library’s entry is
                    output: { entryFileNames },
                    preserveEntrySignatures: 'strict',
                },
                ssr,
                write: false,
            },
            configFile: false,
            logLevel: 'silent',
            plugins: [plugin],
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

    it('builds a default library that imports nothing from @acusti/sheets', async () => {
        const { assets, code } = await buildEntry({
            entry: 'src/library.js',
            options: { library: 'default', prefix: '@scope/ui/' },
        });

        expect(code).not.toContain('@acusti/sheets"');
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

        expect(code).toContain('from "@acusti/sheets"');
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

    // as a watch build does, with one plugin for every rebuild
    it('emits a raw library’s CSS in every build through the same plugin', async () => {
        const plugin = styleSheets({ library: 'raw' });
        const first = await buildEntry({ entry: 'src/library.js', plugin });
        const second = await buildEntry({ entry: 'src/library.js', plugin });

        expect(first.assets.map((file) => file.fileName)).toEqual(['src/sheet.css']);
        expect(second.assets.map((file) => file.fileName)).toEqual(['src/sheet.css']);
    });

    it('refuses a default library build that still imports @acusti/sheets', async () => {
        await expect(
            buildEntry({
                entry: 'src/library.js',
                external: [/^react(\/|$)/, /^@acusti\//],
                options: { library: 'default' },
            }),
        ).rejects.toThrow(
            /imports @acusti\/sheets, which a default library build replaces/,
        );
    });

    it('refuses a default library build that imports @acusti/sheets lazily', async () => {
        await expect(
            buildEntry({
                entry: 'src/lazy-library.js',
                external: [/^react(\/|$)/, /^@acusti\//],
                options: { library: 'default' },
            }),
        ).rejects.toThrow(/lazy-library\.js imports @acusti\/sheets/);
    });

    it('refuses a raw library chunk outside the output’s root', async () => {
        await expect(
            buildEntry({
                entry: 'src/library.js',
                entryFileNames: 'esm/[name].js',
                options: { library: 'raw' },
            }),
        ).rejects.toThrow(
            /esm\/library\.js imports its sheets from paths relative to the output’s root/,
        );
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
