import type { SourceMap } from 'oxc-transform-react';

import { describe, expect, it } from 'vitest';

import vitePluginReactCompiler, { type Options } from './index.js';

const COMPONENT = `
export function Greeting({ name }: { name: string }) {
    return <div className="greeting">Hello {name}</div>;
}
`;

type TransformResult = null | { code: string; map?: SourceMap };

function createTransform(options?: Options) {
    const plugin = vitePluginReactCompiler(options);
    const transform = plugin.transform as (
        this: { error: (message: string) => never },
        code: string,
        id: string,
    ) => Promise<TransformResult>;
    // minimal rollup plugin context: this.error throws like rollup’s does
    const context = {
        error(message: string): never {
            throw new Error(message);
        },
    };
    return (code: string, id: string) => transform.call(context, code, id);
}

describe('vite-plugin-react-compiler', () => {
    it('compiles components to memoized output with JSX preserved', async () => {
        const transform = createTransform();
        const result = await transform(COMPONENT, '/src/Greeting.tsx');
        // memoization via the react 19 compiler runtime (default target)
        expect(result?.code).toContain('react/compiler-runtime');
        // JSX is preserved for vite’s own pipeline …
        expect(result?.code).toContain('<div className="greeting">');
        // … but typescript syntax is stripped (matching the Babel path)
        expect(result?.code).not.toContain('name: string');
    });

    it('respects the include and exclude filters', async () => {
        const transform = createTransform();
        expect(await transform(COMPONENT, '/node_modules/pkg/Greeting.tsx')).toBe(null);
        expect(await transform('body { color: red; }', '/src/styles.css')).toBe(null);

        const scopedTransform = createTransform({ include: /\/compiled\// });
        expect(await scopedTransform(COMPONENT, '/src/Greeting.tsx')).toBe(null);
        const result = await scopedTransform(COMPONENT, '/src/compiled/Greeting.tsx');
        expect(result?.code).toContain('react/compiler-runtime');
    });

    it('passes reactCompiler options through to the compiler', async () => {
        // target '18' memoizes via the react-compiler-runtime package
        const transform = createTransform({ reactCompiler: { target: '18' } });
        const result = await transform(COMPONENT, '/src/Greeting.tsx');
        expect(result?.code).toContain('react-compiler-runtime');

        // annotation mode skips components without a 'use memo' directive
        const annotationTransform = createTransform({
            reactCompiler: { compilationMode: 'annotation' },
        });
        const annotationResult = await annotationTransform(
            COMPONENT,
            '/src/Greeting.tsx',
        );
        expect(annotationResult?.code).not.toContain('compiler-runtime');
    });

    it('returns a sourcemap', async () => {
        const transform = createTransform();
        const result = await transform(COMPONENT, '/src/Greeting.tsx');
        expect(result?.map?.version).toBe(3);
        expect(result?.map?.mappings.length).toBeGreaterThan(0);
    });

    it('errors on fatal input (parse errors)', async () => {
        const transform = createTransform();
        await expect(transform('const = ;', '/src/broken.tsx')).rejects.toThrow();
    });

    it('memoizes repeat transforms of identical content', async () => {
        const transform = createTransform();
        const first = await transform(COMPONENT, '/src/Greeting.tsx');
        const second = await transform(COMPONENT, '/src/Greeting.tsx');
        expect(second).toBe(first);

        // changed content busts the cached entry for the module id
        const changed = await transform(
            COMPONENT.replace('Hello', 'Bonjour'),
            '/src/Greeting.tsx',
        );
        expect(changed).not.toBe(first);
        expect(changed?.code).toContain('Bonjour');

        const uncachedTransform = createTransform({ memoize: false });
        const uncachedFirst = await uncachedTransform(COMPONENT, '/src/Greeting.tsx');
        const uncachedSecond = await uncachedTransform(COMPONENT, '/src/Greeting.tsx');
        expect(uncachedSecond).not.toBe(uncachedFirst);
    });
});
