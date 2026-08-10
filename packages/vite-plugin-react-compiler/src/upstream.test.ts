import { describe, expect, it } from 'vitest';

import vitePluginReactCompiler from './index.js';

// This suite tracks the behavior of the pinned oxc-transform-react version
// itself, deliberately breaking the usual rule against testing a
// dependency’s internals: the plugin’s pitch includes how the Rust port
// compares to babel-plugin-react-compiler, so those claims get pinned here
// and re-verified on every bindings bump. Two kinds of tests:
//
// - enabled tests pin improvements over babel-plugin-react-compiler@1.0.0;
//   a bindings bump that regresses one fails the bump PR
// - it.fails tests document known upstream gaps by asserting the desired
//   behavior, which is expected to fail today. When a bindings bump fixes
//   the gap, the assertion starts passing, it.fails turns red on the bump
//   PR, and the test gets promoted to a plain it — a new pinned
//   regression test.

const plugin = vitePluginReactCompiler();
const transform = plugin.transform as (
    this: { error: (message: string) => never },
    code: string,
    id: string,
) => Promise<null | { code: string }>;
const context = {
    error(message: string): never {
        throw new Error(message);
    },
};
const transformCode = (code: string, id: string) => transform.call(context, code, id);

describe('oxc-transform-react upstream behavior', () => {
    // try/catch value blocks are a two-step story. Today the Rust port
    // compiles them, but that is a missing-bailout bug rather than real
    // support (the compiler can’t yet handle them soundly, which is why
    // babel-plugin-react-compiler bails): upstream is restoring the
    // Babel-matching bailout
    // (https://github.com/oxc-project/oxc/issues/25343, fixed by
    // https://github.com/oxc-project/oxc/pull/25409). When a bindings
    // bump picks that up and flips this test red, do NOT pin the
    // bailout — invert this into
    // it.fails('compiles try/catch value blocks') asserting
    // .toContain('react/compiler-runtime'), so the suite starts tracking
    // the shortcoming we actually hope gets fixed (the compiler gaining
    // real try/catch support), and pin compilation when that lands. A
    // single hope-test can’t be written today because “compiles” is
    // observably true in both the buggy present and the fixed future —
    // the suite sees output, not soundness.
    it.fails('bails on try/catch value blocks like the Babel plugin', async () => {
        const result = await transformCode(
            `
export function SafeParse({ json }: { json: string }) {
    let value = null;
    try {
        value = JSON.parse(json);
    } catch {
        value = null;
    }
    return <pre>{JSON.stringify(value)}</pre>;
}
`,
            '/src/SafeParse.tsx',
        );
        expect(result?.code).not.toContain('react/compiler-runtime');
    });

    // babel-plugin-react-compiler@1.0.0 bails on computed object keys
    it('compiles computed object keys the Babel plugin bails on', async () => {
        const result = await transformCode(
            `
export function Swatch({ prop, value }: { prop: string; value: string }) {
    const style = { [prop]: value };
    return <div style={style} />;
}
`,
            '/src/Swatch.tsx',
        );
        expect(result?.code).toContain('react/compiler-runtime');
    });

    // the Babel plugin opts a function out of compilation when it carries
    // an eslint suppression of a react-hooks rule; the Rust port doesn’t
    // respect suppressions yet: https://github.com/oxc-project/oxc/issues/25392
    it.fails('skips functions carrying react-hooks lint suppressions', async () => {
        const result = await transformCode(
            `
import { useEffect, useRef, useState } from 'react';

export function Counter({ step }: { step: number }) {
    const [count, setCount] = useState(0);
    const ref = useRef(step);

    useEffect(() => {
        setCount((c) => c + ref.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div>{count}</div>;
}
`,
            '/src/Counter.tsx',
        );
        expect(result?.code).not.toContain('react/compiler-runtime');
    });
});
