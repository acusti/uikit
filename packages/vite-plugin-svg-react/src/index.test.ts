import type { ResolvedConfig } from 'vite';

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import vitePluginSVGReact, { type Options } from './index.js';

const SVG = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h1v1H0z"/></svg>';

type ResolveIdHook = (
    this: { resolve: (source: string) => Promise<null | { id: string }> },
    source: string,
    importer: string | undefined,
    options: object,
) => Promise<null | { id: string }>;

async function loadSVGComponent({
    command,
    svgrOptions,
}: {
    command: 'build' | 'serve';
    svgrOptions?: Options['svgrOptions'];
}) {
    const plugin = vitePluginSVGReact({ svgrOptions });
    const configResolved = plugin.configResolved as (
        config: Pick<ResolvedConfig, 'command'>,
    ) => void;
    configResolved({ command });

    const directory = await mkdtemp(join(tmpdir(), 'vite-plugin-svg-react-'));
    try {
        const filePath = join(directory, 'icon.svg');
        await writeFile(filePath, SVG);

        const load = plugin.load as (
            id: string,
        ) => Promise<{ code: string; map: unknown }>;
        const result = await load(`\0vite-plugin-svg-react:${filePath}`);
        return result;
    } finally {
        await rm(directory, { force: true, recursive: true });
    }
}

describe('vite-plugin-svg-react', () => {
    // The dep scanner treats .svg imports as assets and never crawls these
    // virtual modules, so any dep they alone import is discovered
    // mid-first-request on a cold optimizer cache, forcing a re-optimization
    // under the in-flight SSR render (see “Why the dev JSX runtime in dev
    // matters” in the README). Matching the main pipeline's jsx transform
    // (dev runtime outside `vite build`) keeps them off that path.
    it('emits the dev jsx runtime when serving', async () => {
        const { code } = await loadSVGComponent({ command: 'serve' });
        expect(code).toContain('react/jsx-dev-runtime');
        // Bare specifier (no quotes) so a quote-style change in the emitted
        // import can't make this pass vacuously; it can't match
        // react/jsx-dev-runtime, which diverges after "react/jsx-".
        expect(code).not.toContain('react/jsx-runtime');
    });

    it('emits the production jsx runtime when building', async () => {
        const { code, map } = await loadSVGComponent({ command: 'build' });
        expect(code).toContain('react/jsx-runtime');
        expect(code).not.toContain('react/jsx-dev-runtime');
        // the oxc compile's sourcemap is forwarded, never dropped to null
        expect(map).not.toBeNull();
    });

    it('shallow-merges svgrOptions over the defaults', async () => {
        const { code } = await loadSVGComponent({
            command: 'build',
            svgrOptions: { exportType: 'named' },
        });
        expect(code).toContain('ReactComponent');
        expect(code).not.toContain('export default');
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
        // the id is a virtual module, not a fake path to a file that doesn't
        // exist on disk (the v1 `.tsx`-suffix hack died under workerd)
        expect(resolved?.id.endsWith('.tsx')).toBe(false);
    });

    it('ignores ids that aren’t its own', async () => {
        const plugin = vitePluginSVGReact();
        const resolveId = plugin.resolveId as ResolveIdHook;
        const context = {
            resolve: (source: string) => Promise.resolve({ id: source }),
        };
        // plain .svg imports stay on Vite's asset pipeline
        await expect(
            resolveId.call(context, '/project/icon.svg', '/project/app.tsx', {}),
        ).resolves.toBeNull();

        const load = plugin.load as (id: string) => Promise<unknown>;
        await expect(load('/project/icon.svg')).resolves.toBeUndefined();
    });
});
