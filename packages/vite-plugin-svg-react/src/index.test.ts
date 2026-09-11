import type { ResolvedConfig } from 'vite';

import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { extend } from '@oxvg/napi';
import { describe, expect, it } from 'vitest';

import vitePluginSVGReact, { type Options } from './index.js';
import { getIdPrefix, PREFIX_DELIMITER } from './optimize.js';

const SVG = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1v1H0z"/></svg>';

const DTD_SVG = `\
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN"
    "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4">
    <path d="M 0,0 L 4,0 L 4,4 Z" fill="#ff0000"/>
</svg>`;

// classic Illustrator (10–CS4) declares its Adobe namespaces as entities in
// the doctype’s internal subset and references them from the root element
const ENTITY_SVG = `\
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "svg11.dtd" [
    <!ENTITY ns_extend "http://ns.adobe.com/Extensibility/1.0/">
]>
<svg xmlns:x="&ns_extend;" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 0h1"/>
</svg>`;

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
    fileName = 'icon.svg',
    optimize,
    source = SVG,
    svg,
}: {
    command: 'build' | 'serve';
    fileName?: string;
    optimize?: Options['optimize'];
    source?: string;
    svg?: Options['svg'];
}) {
    const plugin = vitePluginSVGReact({ optimize, svg });
    const configResolved = plugin.configResolved as (
        config: Pick<ResolvedConfig, 'command' | 'root'>,
    ) => Promise<void>;

    // the temp directory stands in for the vite root, so fileName is the
    // SVG’s root-relative path (a subdirectory is fine)
    const directory = await mkdtemp(join(tmpdir(), 'vite-plugin-svg-react-'));
    try {
        await configResolved({ command, root: directory });
        const filePath = join(directory, fileName);
        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(filePath, source);

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
        expect(() =>
            // @ts-expect-error svgProps values are strings
            vitePluginSVGReact({ svg: { svgProps: { height: 10 } } }),
        ).toThrow(/svgProps.height must be a string/);
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

    it('leaves the SVG unoptimized by default', async () => {
        const { code } = await loadSVGComponent({
            command: 'build',
            source: '<svg xmlns="http://www.w3.org/2000/svg"><g><path d="M 0,0 L 1,0"/></g></svg>',
        });
        // the group would be collapsed and the path data rewritten by OXVG
        expect(code).toContain('"g"');
    });

    it('optimizes with OXVG’s default preset when optimize is true', async () => {
        const { code } = await loadSVGComponent({
            command: 'build',
            optimize: true,
            source: '<svg xmlns="http://www.w3.org/2000/svg"><g><path d="M 0,0 L 1,0"/></g></svg>',
        });
        expect(code).not.toContain('"g"');
    });

    it('runs an OXVG config object as the whole job list', async () => {
        // an OXVG config isn’t merged into a preset — it is the job list, so
        // a one-job config leaves everything the default preset would do
        const { code } = await loadSVGComponent({
            command: 'build',
            optimize: { collapseGroups: { field0: true } },
            source:
                '<svg xmlns="http://www.w3.org/2000/svg">' +
                '<desc>kept</desc><g><path d="M0 0h1"/></g></svg>',
        });
        expect(code).not.toContain('"g"');
        // removeDesc is in the default preset but not in this config
        expect(code).toContain('desc');
    });

    it('minifies ids and prefixes them per file', async () => {
        // cleanupIds minifies every file’s ids down to the same `a` and
        // `b`, which is what makes inlined components collide; prefixIds
        // with a prefix derived from the file makes them unique again
        const { code, filePath } = await loadSVGComponent({
            command: 'build',
            fileName: 'icons/brand.svg',
            optimize: true,
            source:
                '<svg xmlns="http://www.w3.org/2000/svg">' +
                '<defs><linearGradient id="brandGradient"><stop offset="0"/></linearGradient></defs>' +
                '<path d="M0 0h1v1H0z" fill="url(#brandGradient)"/></svg>',
        });
        const prefix = getIdPrefix(filePath, dirname(dirname(filePath)));
        expect(prefix).toMatch(/^brand-[0-9a-f]{4}$/);
        const id = `${prefix}${PREFIX_DELIMITER}a`;
        expect(code).toContain(`id: "${id}"`);
        expect(code).toContain(`url(#${id})`);
        expect(code).not.toContain('brandGradient');
    });

    it('gives same-named files in different directories different prefixes', async () => {
        const source =
            '<svg xmlns="http://www.w3.org/2000/svg">' +
            '<defs><path id="shape" d="M0 0h1"/></defs><use href="#shape"/></svg>';
        const ids = await Promise.all(
            ['small/arrow.svg', 'large/arrow.svg'].map(async (fileName) => {
                const { code } = await loadSVGComponent({
                    command: 'build',
                    fileName,
                    optimize: true,
                    source,
                });
                return /id: "([^"]+)"/.exec(code ?? '')?.[1];
            }),
        );
        expect(ids[0]).toMatch(/^arrow-[0-9a-f]{4}_a$/);
        expect(ids[1]).toMatch(/^arrow-[0-9a-f]{4}_a$/);
        expect(ids[0]).not.toBe(ids[1]);
    });

    it('resolves a config object’s Default prefix per file', async () => {
        // `optimise` takes no path, so OXVG resolves `{ type: 'Default' }`
        // to the literal string `prefix` — the plugin has the path, and
        // fills in the same per-file prefix `optimize: true` uses
        const { code } = await loadSVGComponent({
            command: 'build',
            optimize: {
                prefixIds: {
                    delim: '_',
                    prefix: { type: 'Default' },
                    prefixClassNames: false,
                    prefixIds: true,
                },
            },
            source: '<svg xmlns="http://www.w3.org/2000/svg"><path id="shape" d="M0 0h1"/></svg>',
        });
        expect(code).toMatch(/id: "icon-[0-9a-f]{4}_shape"/);
        expect(code).not.toContain('prefix_shape');
    });

    it('leaves an explicit prefixIds prefix alone', async () => {
        const { code } = await loadSVGComponent({
            command: 'build',
            optimize: {
                prefixIds: {
                    delim: '-',
                    prefix: { field0: 'app', type: 'Prefix' },
                    prefixClassNames: false,
                    prefixIds: true,
                },
            },
            source: '<svg xmlns="http://www.w3.org/2000/svg"><path id="shape" d="M0 0h1"/></svg>',
        });
        expect(code).toContain('id: "app-shape"');
    });

    it('leaves ids as authored when cleanupIds is dropped', async () => {
        // the README’s recipe for ids referenced from outside the file (app
        // CSS, getElementById): the default preset minus cleanupIds, and
        // without the prefixIds `optimize: true` adds
        const { cleanupIds: _cleanupIds, ...optimize } = extend({ type: 'Default' });
        const { code } = await loadSVGComponent({
            command: 'build',
            optimize,
            source:
                '<svg xmlns="http://www.w3.org/2000/svg">' +
                '<defs><linearGradient id="brandGradient"><stop offset="0"/></linearGradient></defs>' +
                '<path id="unreferenced" d="M0 0h1v1H0z" fill="url(#brandGradient)"/></svg>',
        });
        expect(code).toContain('brandGradient');
        expect(code).toContain('unreferenced');
    });

    it('leaves class names alone', async () => {
        // the classes an app’s CSS targets can’t be renamed, so the
        // prefixIds `optimize: true` adds runs with prefixClassNames off
        const { code } = await loadSVGComponent({
            command: 'build',
            optimize: true,
            source:
                '<svg xmlns="http://www.w3.org/2000/svg">' +
                '<path class="icon-fill" d="M0 0h1v1H0z"/></svg>',
        });
        expect(code).toContain('icon-fill');
    });

    it('optimizes SVGs that carry a doctype', async () => {
        // OXVG refuses a document with a DTD outright, so the prolog an
        // Illustrator export writes has to be dropped before it gets there
        const { code } = await loadSVGComponent({
            command: 'build',
            optimize: true,
            source: DTD_SVG,
        });
        expect(code).toContain('viewBox');
        expect(code).not.toContain('#ff0000');
    });

    it('accepts a config built with OXVG’s extend', async () => {
        // also a compile-time guard: `extend` returns OXVG’s `Jobs`, an
        // interface, and TypeScript gives interfaces no implicit index
        // signature — so typing the option as Record<string, unknown> would
        // fail tsc right here, as it did for the README’s own examples
        const { cleanupIds: _cleanupIds, ...optimize } = extend(
            { type: 'Default' },
            { removeDesc: { removeAny: true } },
        );
        const { code } = await loadSVGComponent({
            command: 'build',
            optimize,
            source:
                '<svg xmlns="http://www.w3.org/2000/svg">' +
                '<desc>dropped</desc><g><path d="M0 0h1"/></g></svg>',
        });
        expect(code).not.toContain('desc');
        expect(code).not.toContain('"g"');
    });

    it('fails loudly on a doctype whose internal subset declares entities', async () => {
        // A known limitation, pinned here so it stays deliberate: the source
        // is sliced to its root element for OXVG (which rejects any DTD),
        // and that drops entity declarations the root element can still
        // reference — classic Illustrator (10–CS4) declares its Adobe
        // namespaces this way. Expanding them would be a parser of its own,
        // to recover namespaces OXVG’s removeEditorsNSData then deletes, so
        // this fails naming the file instead of parsing part of it.
        await expect(
            loadSVGComponent({
                command: 'build',
                optimize: true,
                source: ENTITY_SVG,
            }),
        ).rejects.toThrow(/failed to optimize .*icon\.svg.*ns_extend/);
        // without optimize the same file still builds, entity references
        // passed through literally
        const { code } = await loadSVGComponent({
            command: 'build',
            source: ENTITY_SVG,
        });
        expect(code).toContain('ns_extend');
    });

    it('names the SVG whose optimization failed', async () => {
        await expect(
            loadSVGComponent({
                command: 'build',
                optimize: true,
                source: '<svg xmlns="http://www.w3.org/2000/svg"><path',
            }),
        ).rejects.toThrow(/failed to optimize .*icon\.svg/);
    });

    it('gives up this parser’s tolerances for non-XML markup', async () => {
        // parse.ts accepts these deliberately (a minimized attribute is
        // legal inline in HTML; an unknown entity name passes through
        // literally), OXVG’s parser runs first and doesn’t. Pinned because
        // the README promises each fails by name and builds without
        // `optimize` — a user hitting one has to be able to tell it’s the
        // option and not their file.
        const cases = [
            {
                pattern: /expected '=' not '>'/,
                source: '<svg xmlns="http://www.w3.org/2000/svg" hidden><path d="M0 0h1"/></svg>',
            },
            {
                pattern: /unknown entity reference 'nbsp'/,
                source: '<svg xmlns="http://www.w3.org/2000/svg"><text>a&nbsp;b</text></svg>',
            },
        ];
        for (const { pattern, source } of cases) {
            await expect(
                loadSVGComponent({ command: 'build', optimize: true, source }),
            ).rejects.toThrow(pattern);
            await expect(
                loadSVGComponent({ command: 'build', source }),
            ).resolves.toBeTruthy();
        }
    });

    it('reports OXVG error positions at the line the file actually has', async () => {
        // the prolog is blanked rather than cut off, so OXVG counts from the
        // same origin the editor does; slicing it away reported line 1 for
        // an error five lines into the file
        await expect(
            loadSVGComponent({
                command: 'build',
                optimize: true,
                source: ENTITY_SVG,
            }),
        ).rejects.toThrow(/at 5:/);
    });

    it('rejects an optimize value that is neither a boolean nor a config', () => {
        for (const optimize of [42, 'true', ['collapseGroups'], null]) {
            expect(() =>
                // @ts-expect-error optimize is a boolean or an OXVG config
                vitePluginSVGReact({ optimize }),
            ).toThrow(/optimize must be a boolean or an OXVG config object/);
        }
    });

    it('rejects an optimize config OXVG can’t read, at config time', async () => {
        // OXVG’s own message names no file, and this runs before any SVG is
        // loaded, so the error has to point back at the option itself
        const plugin = vitePluginSVGReact({ optimize: { removeViewBox: {} } });
        const configResolved = plugin.configResolved as (
            config: Pick<ResolvedConfig, 'command'>,
        ) => Promise<void>;
        await expect(configResolved({ command: 'build' })).rejects.toThrow(
            /OXVG rejected the optimize config/,
        );
    });

    it('rejects an unmatched brace inside a regex literal or comment', () => {
        // known and accepted: the balance check is a scanner, not a
        // tokenizer. Letting a slash abandon the scan would let a truncated
        // `{props.width / 2` through to fail inside oxc blaming the SVG,
        // which is the failure this check exists to prevent — and a regex or
        // comment in an svgProps value is theoretical next to a typo’d one
        for (const height of ['{/}/.test(x) ? 1 : 2}', '{props.width /* } */}']) {
            expect(() => vitePluginSVGReact({ svg: { svgProps: { height } } })).toThrow(
                /isn’t a balanced \{expression\}/,
            );
        }
    });
});
