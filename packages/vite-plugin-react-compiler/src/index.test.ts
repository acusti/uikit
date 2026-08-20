import type { SourceMap } from 'oxc-transform-react';

import { describe, expect, it } from 'vitest';

import vitePluginReactCompiler, { type Options } from './index.js';

const COMPONENT = `
export function Greeting({ name }: { name: string }) {
    return <div className="greeting">Hello {name}</div>;
}
`;

type TransformResult = null | { code: string; map?: SourceMap };

function createTransformer(options?: Options) {
    // record this.error calls to pin the plugin’s own build-failure path
    // (as opposed to an upstream oxc-transform-react rejection)
    const errorCalls: Array<{ message: string; pos?: number }> = [];
    const plugin = vitePluginReactCompiler(options);
    const transform = plugin.transform as (
        this: { error: (message: string, pos?: number) => never },
        code: string,
        id: string,
    ) => null | Promise<TransformResult>;
    // minimal rollup plugin context: this.error throws like rollup’s does
    const context = {
        error(message: string, pos?: number): never {
            errorCalls.push({ message, pos });
            throw new Error(message);
        },
    };
    return {
        errorCalls,
        transformCode: (code: string, id: string) => transform.call(context, code, id),
    };
}

describe('vite-plugin-react-compiler', () => {
    it('compiles components to memoized output with JSX preserved', async () => {
        const { transformCode } = createTransformer();
        const result = await transformCode(COMPONENT, '/src/Greeting.tsx');
        // memoization via the react 19 compiler runtime (default target)
        expect(result?.code).toContain('react/compiler-runtime');
        // JSX is preserved for vite’s own pipeline …
        expect(result?.code).toContain('<div className="greeting">');
        // … but typescript syntax is stripped (matching the Babel path)
        expect(result?.code).not.toContain('name: string');
    });

    it('normalizes query-suffixed ids to the underlying file', async () => {
        const { transformCode } = createTransformer();
        // a query suffix doesn’t defeat the extension-based include filter
        const result = await transformCode(COMPONENT, '/src/Greeting.tsx?v=abc123');
        expect(result?.code).toContain('react/compiler-runtime');
        // the query is stripped from the filename used in the sourcemap
        expect(result?.map?.sources).toEqual(['/src/Greeting.tsx']);
        // query variants share the underlying file’s cache entry
        const clean = await transformCode(COMPONENT, '/src/Greeting.tsx');
        expect(clean).toBe(result);
    });

    it('respects the include and exclude filters', async () => {
        const { transformCode } = createTransformer();
        expect(await transformCode(COMPONENT, '/node_modules/pkg/Greeting.tsx')).toBe(
            null,
        );
        expect(await transformCode('body { color: red; }', '/src/styles.css')).toBe(null);

        const scoped = createTransformer({ include: /\/compiled\// });
        expect(await scoped.transformCode(COMPONENT, '/src/Greeting.tsx')).toBe(null);
        const result = await scoped.transformCode(
            COMPONENT,
            '/src/compiled/Greeting.tsx',
        );
        expect(result?.code).toContain('react/compiler-runtime');
    });

    it('passes reactCompiler options through to the compiler', async () => {
        // target '18' memoizes via the react-compiler-runtime package
        const { transformCode } = createTransformer({
            reactCompiler: { target: '18' },
        });
        const result = await transformCode(COMPONENT, '/src/Greeting.tsx');
        expect(result?.code).toContain('react-compiler-runtime');

        // annotation mode skips components without a 'use memo' directive
        const annotation = createTransformer({
            reactCompiler: { compilationMode: 'annotation' },
        });
        const annotationResult = await annotation.transformCode(
            COMPONENT,
            '/src/Greeting.tsx',
        );
        expect(annotationResult?.code).not.toContain('react/compiler-runtime');
    });

    it('returns a sourcemap', async () => {
        const { transformCode } = createTransformer();
        const result = await transformCode(COMPONENT, '/src/Greeting.tsx');
        expect(result?.map?.version).toBe(3);
        expect(result?.map?.mappings.length).toBeGreaterThan(0);
    });

    it('errors on fatal input (parse errors) with the error’s location', async () => {
        const { errorCalls, transformCode } = createTransformer();
        // the multi-byte chars before the error ensure the forwarded
        // position is an index into the code string (what rollup expects),
        // not oxc’s utf-8 byte offset, which is 3 higher here
        const broken = "const s = 'héllo💜';\nconst = ;";
        await expect(transformCode(broken, '/src/broken.tsx')).rejects.toThrow();

        expect(errorCalls).toHaveLength(1);
        expect(errorCalls[0].message).toContain('Unexpected token');
        // oxc’s code frame includes the file:line:column of the error …
        expect(errorCalls[0].message).toContain('/src/broken.tsx:2:');
        // … and the first error’s position is forwarded for vite to report
        expect(errorCalls[0].pos).toBe(broken.indexOf('= ;'));

        // failed transforms aren’t cached: an identical retry runs again
        await expect(transformCode(broken, '/src/broken.tsx')).rejects.toThrow();
        expect(errorCalls).toHaveLength(2);
    });

    it('memoizes repeat transforms of identical content', async () => {
        const { transformCode } = createTransformer();
        const first = await transformCode(COMPONENT, '/src/Greeting.tsx');
        const second = await transformCode(COMPONENT, '/src/Greeting.tsx');
        expect(second).toBe(first);

        // overlapping in-flight transforms share a single compiler run
        // (each run creates a fresh result object, so identity proves it)
        const [parallelFirst, parallelSecond] = await Promise.all([
            transformCode(COMPONENT, '/src/Parallel.tsx'),
            transformCode(COMPONENT, '/src/Parallel.tsx'),
        ]);
        expect(parallelSecond).toBe(parallelFirst);

        // changed content busts the cached entry for the module id
        const changed = await transformCode(
            COMPONENT.replace('Hello', 'Bonjour'),
            '/src/Greeting.tsx',
        );
        expect(changed).not.toBe(first);
        expect(changed?.code).toContain('Bonjour');

        const uncached = createTransformer({ memoize: false });
        const uncachedFirst = await uncached.transformCode(
            COMPONENT,
            '/src/Greeting.tsx',
        );
        const uncachedSecond = await uncached.transformCode(
            COMPONENT,
            '/src/Greeting.tsx',
        );
        expect(uncachedSecond).not.toBe(uncachedFirst);
    });
});
