import type { SourceMap } from 'oxc-transform-react';

import { describe, expect, it } from 'vitest';

import vitePluginReactCompiler, { type Options } from './index.js';

const COMPONENT = `
export function Greeting({ name }: { name: string }) {
    return <div className="greeting">Hello {name}</div>;
}
`;

// two components the compiler can’t optimize (a ref read during render and
// a conditional hook) followed by one it can; the multi-byte chars ahead of
// them make oxc’s utf-8 byte offsets differ from utf-16 string indexes
const BAILOUTS = `
// héllo💜
import { useRef, useState } from 'react';

export function Clock() {
    const ref = useRef(0);
    return <div>{ref.current}</div>;
}

export function Toggle({ on }: { on: boolean }) {
    if (on) {
        const [label] = useState('on');
        return <div>{label}</div>;
    }
    return null;
}

export function Greeting({ name }: { name: string }) {
    return <div>Hello {name}</div>;
}
`;

type TransformResult = null | { code: string; map?: SourceMap };

function createTransformer(options?: Options) {
    // record this.error and this.warn calls to pin the plugin’s own
    // build-failure and reporting paths (as opposed to an upstream
    // oxc-transform-react rejection)
    const errorCalls: Array<{ message: string; pos?: number }> = [];
    const warnCalls: Array<{ message: string; pos?: number }> = [];
    const plugin = vitePluginReactCompiler(options);
    const transform = plugin.transform as (
        this: {
            error: (message: string, pos?: number) => never;
            warn: (message: string, pos?: number) => void;
        },
        code: string,
        id: string,
    ) => null | Promise<TransformResult>;
    // minimal rollup plugin context: this.error throws like rollup’s does
    const context = {
        error(message: string, pos?: number): never {
            errorCalls.push({ message, pos });
            throw new Error(message);
        },
        warn(message: string, pos?: number): void {
            warnCalls.push({ message, pos });
        },
    };
    return {
        errorCalls,
        transformCode: (code: string, id: string) => transform.call(context, code, id),
        warnCalls,
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

    it('passes compiler options through to React Compiler', async () => {
        // target '18' memoizes via the react-compiler-runtime package
        const { transformCode } = createTransformer({
            compiler: { target: '18' },
        });
        const result = await transformCode(COMPONENT, '/src/Greeting.tsx');
        expect(result?.code).toContain('react-compiler-runtime');

        // annotation mode skips components without a 'use memo' directive
        const annotation = createTransformer({
            compiler: { compilationMode: 'annotation' },
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
        await expect(transformCode(broken, '/src/broken.tsx')).rejects.toThrow(
            'Unexpected token',
        );

        expect(errorCalls).toHaveLength(1);
        expect(errorCalls[0].message).toContain('Unexpected token');
        // oxc’s code frame includes the file:line:column of the error …
        expect(errorCalls[0].message).toContain('/src/broken.tsx:2:');
        // … and the first error’s position is forwarded for vite to report
        expect(errorCalls[0].pos).toBe(broken.indexOf('= ;'));

        // failed transforms aren’t cached: an identical retry runs again
        await expect(transformCode(broken, '/src/broken.tsx')).rejects.toThrow(
            'Unexpected token',
        );
        expect(errorCalls).toHaveLength(2);
    });

    it('warns about compiler bail-outs when reportDiagnostics is on', async () => {
        const { errorCalls, transformCode, warnCalls } = createTransformer({
            compiler: { reportDiagnostics: true },
        });
        const result = await transformCode(BAILOUTS, '/src/Bailouts.tsx');

        // the bail-outs don’t fail the build, and the rest still compiles
        expect(errorCalls).toHaveLength(0);
        expect(result?.code).toContain('react/compiler-runtime');
        expect(result?.code).toContain('function Clock');

        // each diagnostic is its own warning, positioned at the offending
        // code as an index into the code string (not a utf-8 byte offset)
        expect(warnCalls).toHaveLength(2);
        expect(warnCalls[0].message).toContain('Cannot access refs during render');
        // oxc’s code frame includes the file:line:column of the diagnostic
        expect(warnCalls[0].message).toContain('/src/Bailouts.tsx:7:');
        expect(warnCalls[0].pos).toBe(BAILOUTS.indexOf('ref.current'));
        expect(warnCalls[1].message).toContain(
            'Hooks must always be called in a consistent order',
        );
        expect(warnCalls[1].pos).toBe(BAILOUTS.indexOf("useState('on')"));
    });

    it('stays quiet about compiler bail-outs by default', async () => {
        const { transformCode, warnCalls } = createTransformer();
        const result = await transformCode(BAILOUTS, '/src/Bailouts.tsx');
        expect(result?.code).toContain('react/compiler-runtime');
        expect(warnCalls).toHaveLength(0);
    });

    // oxc returns some non-fatal diagnostics of its own whether or not
    // reportDiagnostics is on: it doesn’t fully support a namespace that
    // exports a non-const, and plain vite fails the build on one, but this
    // plugin strips the typescript before vite’s own oxc pass runs, so a
    // warning is the only way that diagnostic gets seen
    it('warns about oxc’s own non-fatal diagnostics by default', async () => {
        const { errorCalls, transformCode, warnCalls } = createTransformer();
        const source = 'export namespace N { export let x = 1; }\n';
        await transformCode(source, '/src/namespace.ts');
        expect(errorCalls).toHaveLength(0);
        expect(warnCalls).toHaveLength(1);
        expect(warnCalls[0].message).toContain('Namespaces exporting non-const');
        expect(warnCalls[0].pos).toBe(source.indexOf('x = 1'));
    });

    it('reports a file’s diagnostics once per content when memoizing', async () => {
        const { transformCode, warnCalls } = createTransformer({
            compiler: { reportDiagnostics: true },
        });
        await transformCode(BAILOUTS, '/src/Bailouts.tsx');
        await transformCode(BAILOUTS, '/src/Bailouts.tsx');
        expect(warnCalls).toHaveLength(2);

        // changed content runs the compiler again, so it reports again
        await transformCode(BAILOUTS.replace('Hello', 'Bonjour'), '/src/Bailouts.tsx');
        expect(warnCalls).toHaveLength(4);

        const uncached = createTransformer({
            compiler: { reportDiagnostics: true },
            memoize: false,
        });
        await uncached.transformCode(BAILOUTS, '/src/Bailouts.tsx');
        await uncached.transformCode(BAILOUTS, '/src/Bailouts.tsx');
        expect(uncached.warnCalls).toHaveLength(4);
    });

    it('fails the build on fatal diagnostics instead of warning about them', async () => {
        // panicThreshold escalates the first bail-out into a hard failure
        const { errorCalls, transformCode, warnCalls } = createTransformer({
            compiler: { panicThreshold: 'all_errors', reportDiagnostics: true },
        });
        await expect(transformCode(BAILOUTS, '/src/Bailouts.tsx')).rejects.toThrow(
            'Cannot access refs during render',
        );
        expect(errorCalls).toHaveLength(1);
        expect(errorCalls[0].pos).toBe(BAILOUTS.indexOf('ref.current'));
        expect(warnCalls).toHaveLength(0);
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
