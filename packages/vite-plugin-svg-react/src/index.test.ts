import type { ResolvedConfig } from 'vite';

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import vitePluginSVGReact, { type Options } from './index.js';

const SVG = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1v1H0z"/></svg>';

type LoadHook = (
    this: { addWatchFile: (id: string) => void },
    id: string,
) => Promise<undefined | { code: string; map: unknown }>;

type ResolveIdHook = (
    this: { resolve: (source: string) => Promise<null | { id: string }> },
    source: string,
    importer: string | undefined,
    options: object,
) => Promise<null | { id: string }>;

async function loadSVGComponent({
    command,
    svg,
}: {
    command: 'build' | 'serve';
    svg?: Options['svg'];
}) {
    const plugin = vitePluginSVGReact({ svg });
    const configResolved = plugin.configResolved as (
        config: Pick<ResolvedConfig, 'command'>,
    ) => void;
    configResolved({ command });

    const directory = await mkdtemp(join(tmpdir(), 'vite-plugin-svg-react-'));
    try {
        const filePath = join(directory, 'icon.svg');
        await writeFile(filePath, SVG);

        const load = plugin.load as LoadHook;
        const watchedFiles: Array<string> = [];
        const context = {
            addWatchFile: (file: string) => {
                watchedFiles.push(file);
            },
        };
        const result = await load.call(context, `\0vite-plugin-svg-react:${filePath}`);
        return { ...result, filePath, watchedFiles };
    } finally {
        await rm(directory, { force: true, recursive: true });
    }
}

describe('vite-plugin-svg-react', () => {
    // The dep scanner treats .svg imports as assets and never crawls these
    // virtual modules, so any dep they alone import is discovered
    // mid-first-request on a cold optimizer cache, forcing a re-optimization
    // under the in-flight SSR render (see “Why the dev JSX runtime in dev
    // matters” in the README). Matching the main pipeline’s jsx transform
    // (dev runtime outside `vite build`) keeps them off that path.
    it('emits the dev jsx runtime when serving', async () => {
        const { code } = await loadSVGComponent({ command: 'serve' });
        expect(code).toContain('react/jsx-dev-runtime');
        // Bare specifier (no quotes) so a quote-style change in the emitted
        // import can’t make this pass vacuously; it can’t match
        // react/jsx-dev-runtime, which diverges after "react/jsx-".
        expect(code).not.toContain('react/jsx-runtime');
    });

    it('emits the production jsx runtime when building', async () => {
        const { code, map } = await loadSVGComponent({ command: 'build' });
        expect(code).toContain('react/jsx-runtime');
        expect(code).not.toContain('react/jsx-dev-runtime');
        // the oxc compile’s sourcemap is forwarded, never dropped to null
        expect(map).not.toBeNull();
    });

    it('passes svg options through to generation', async () => {
        const { code } = await loadSVGComponent({
            command: 'build',
            svg: { icon: true },
        });
        expect(code).toContain('1em');
    });

    it('mints \\0-prefixed virtual ids from the resolved SVG path', async () => {
        const plugin = vitePluginSVGReact();
        const resolveId = plugin.resolveId as ResolveIdHook;
        const context = {
            resolve: (source: string) => Promise.resolve({ id: source }),
        };
        const resolved = await resolveId.call(
            context,
            '/project/icon.svg?react',
            '/project/app.tsx',
            {},
        );
        expect(resolved?.id).toBe('\0vite-plugin-svg-react:/project/icon.svg');
        // the id is a virtual module, not a fake path to a file that doesn’t
        // exist on disk (the v1 `.tsx`-suffix hack died under workerd)
        expect(resolved?.id.endsWith('.tsx')).toBe(false);
    });

    it('ignores ids that aren’t its own', async () => {
        const plugin = vitePluginSVGReact();
        const resolveId = plugin.resolveId as ResolveIdHook;
        const context = {
            resolve: (source: string) => Promise.resolve({ id: source }),
        };
        // plain .svg imports stay on Vite’s asset pipeline
        await expect(
            resolveId.call(context, '/project/icon.svg', '/project/app.tsx', {}),
        ).resolves.toBeNull();

        const load = plugin.load as LoadHook;
        await expect(
            load.call({ addWatchFile: () => undefined }, '/project/icon.svg'),
        ).resolves.toBeUndefined();
    });

    it('registers the source SVG as a watched file', async () => {
        // the virtual id hides the on-disk source from Rollup, so without
        // this, editing an SVG in dev wouldn’t invalidate its module
        const { filePath, watchedFiles } = await loadSVGComponent({
            command: 'serve',
        });
        expect(watchedFiles).toEqual([filePath]);
    });

    it('rejects svg options that this plugin doesn’t support', () => {
        expect(() =>
            vitePluginSVGReact({
                // @ts-expect-error exportType is a dropped svgr option
                svg: { exportType: 'named', icon: true },
            }),
        ).toThrow(/unsupported svg options: exportType/);
    });

    it('rejects unknown top-level option keys', () => {
        // a typo one level up would otherwise silently default everything
        expect(() =>
            // @ts-expect-error svgOptions is a typo of svg
            vitePluginSVGReact({ svgOptions: { icon: true } }),
        ).toThrow(/unsupported options: svgOptions/);
    });

    it('points svgrOptions users at the renamed key', () => {
        // the svgr-era key (this plugin ≤ 0.1 and vite-plugin-svgr) gets a
        // migration message instead of the generic unknown-key error
        expect(() =>
            // @ts-expect-error svgrOptions was renamed to svg
            vitePluginSVGReact({ svgrOptions: { icon: true } }),
        ).toThrow(/svgrOptions was renamed to svg/);
    });

    it('rejects a non-object svg value', () => {
        // Object.keys(true) is empty, so these would otherwise pass the key
        // check and silently default every option
        for (const svg of [true, 42, 'icon', ['icon'], null]) {
            expect(() =>
                // @ts-expect-error svg must be an object
                vitePluginSVGReact({ svg }),
            ).toThrow(/svg must be an object/);
        }
    });

    it('rejects svg option values of the wrong type', () => {
        // TypeScript catches these on an object literal; a plain-JS
        // vite.config gets nothing, and the option silently does nothing
        expect(() =>
            // @ts-expect-error dimensions is a boolean
            vitePluginSVGReact({ svg: { dimensions: 'yes' } }),
        ).toThrow(/dimensions must be a boolean/);
        expect(() =>
            // @ts-expect-error icon is a boolean, number, or string
            vitePluginSVGReact({ svg: { icon: null } }),
        ).toThrow(/icon must be a boolean, number, or string/);
        expect(() =>
            // @ts-expect-error svgProps is an object
            vitePluginSVGReact({ svg: { svgProps: 'role' } }),
        ).toThrow(/svgProps must be an object/);
    });

    it('rejects svgProps that would emit invalid JSX', () => {
        // these reach the generated module verbatim, so an invalid one would
        // otherwise die inside transformWithOxc blaming the SVG file
        expect(() =>
            vitePluginSVGReact({ svg: { svgProps: { 'data x': 'y' } } }),
        ).toThrow(/svgProps name "data x" isn’t a valid JSX attribute name/);
        expect(() =>
            vitePluginSVGReact({ svg: { svgProps: { height: '{props.width}}' } } }),
        ).toThrow(/isn’t a balanced \{expression\}/);
        expect(() =>
            vitePluginSVGReact({ svg: { svgProps: { height: '{a} {b}' } } }),
        ).toThrow(/isn’t a balanced \{expression\}/);
        // a truncated expression emits as a literal string rather than
        // breaking the build, so it’s silently wrong without this check
        expect(() =>
            vitePluginSVGReact({ svg: { svgProps: { height: '{props.width' } } }),
        ).toThrow(/isn’t a balanced \{expression\}/);
    });

    it('accepts valid svgProps names and expression values', () => {
        expect(() =>
            vitePluginSVGReact({
                svg: {
                    svgProps: {
                        'aria-hidden': 'true',
                        'data-testid': 'icon',
                        // a brace inside a quoted string doesn’t unbalance it
                        height: '{fn("}")}',
                        role: 'img',
                        width: '{props.width}',
                    },
                },
            }),
        ).not.toThrow();
    });

    it('doesn’t mistake a string value ending in a brace for an expression', () => {
        // only a leading brace means an expression was intended; this emits
        // as a quoted string attribute and is valid JSX
        expect(() =>
            vitePluginSVGReact({ svg: { svgProps: { d: 'M0 0}' } } }),
        ).not.toThrow();
    });

    it('leaves expressions it can’t confidently lex to the JSX compiler', () => {
        // a slash may open a regex literal or a comment, either of which can
        // hold an unmatched brace; rejecting these would block a valid config
        for (const height of ['{/}/.test(x) ? 1 : 2}', '{props.width /* } */}']) {
            expect(() =>
                vitePluginSVGReact({ svg: { svgProps: { height } } }),
            ).not.toThrow();
        }
    });
});
