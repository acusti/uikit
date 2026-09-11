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
    // babel-plugin-react-compiler@1.0.0 (stable) bails on try/catch used
    // as a value block, but React Compiler main — which the Rust port
    // tracks — supports them: upstream confirmed the compiled output
    // conforms to the unpublished Babel compiler and dropped the
    // bailout-restoration attempt
    // (https://github.com/oxc-project/oxc/issues/25343 closed as not
    // planned; https://github.com/oxc-project/oxc/pull/25409 closed
    // unmerged), so compiling is the supported behavior and this pins it
    it('compiles try/catch value blocks the stable Babel plugin bails on', async () => {
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
        expect(result?.code).toContain('react/compiler-runtime');
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

    // like the Babel plugin, an eslint suppression of a react-hooks rule
    // opts a function out of compilation — fixed upstream in 0.144.0
    // (https://github.com/oxc-project/oxc/issues/25392), pinned since
    it('skips functions carrying react-hooks lint suppressions', async () => {
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

    // reassigning a destructured prop identifier that a nested closure also
    // captures used to bail the whole component out via two diagnostics —
    // "Todo: Support destructuring of context variables" and "Immutability:
    // This value cannot be modified"; fixed upstream in 0.145.0
    it('compiles reassignment of a destructured prop captured by a closure', async () => {
        const result = await transformCode(
            `
export default function Repro({ value }: { value: string }) {
    value = value + '!';
    return <button onClick={() => console.log(value)}>{value}</button>;
}
`,
            '/src/Repro.tsx',
        );
        expect(result?.code).toContain('react/compiler-runtime');
    });

    // oxc_codegen dropped the parentheses around a private-in expression
    // used as the left operand of a higher-precedence operator, printing
    // `#x in v + 1` (which parses as `#x in (v + 1)` and throws at
    // runtime); fixed upstream in 0.149.0
    // (https://github.com/oxc-project/oxc/pull/26383)
    it('parenthesizes private-in expressions used as binary operands', async () => {
        const result = await transformCode(
            `
export function Comp({ o }: { o: object }) {
    const Local = class {
        #x = 1;
        has(v: object) {
            return (#x in v) + 1;
        }
    };
    return <div>{new Local().has(o)}</div>;
}
`,
            '/src/Comp.tsx',
        );
        expect(result?.code).toContain('(#x in v) + 1');
    });

    // oxc_codegen printed a string-literal import specifier whose binding
    // matched its name as `import { "foo" } from "./m.js"`, which is a
    // syntax error; fixed upstream in 0.149.0
    // (https://github.com/oxc-project/oxc/pull/26386)
    it('prints quoted import specifiers bound to a matching local name as identifiers', async () => {
        const result = await transformCode(
            `
import { "foo" as foo, "bar" as baz } from './m.js';

export function Comp() {
    return <div>{foo()}{baz()}</div>;
}
`,
            '/src/Comp.tsx',
        );
        expect(result?.code).toContain('import { foo, "bar" as baz } from "./m.js"');
    });

    // oxc_parser accumulated rounding error on hex/binary/octal literals
    // beyond 2^53, so 0x10000000000000801 came out as 0x10000000000000000
    // (2^64) rather than the correctly rounded 2^64 + 4096; fixed upstream
    // in 0.149.0 (https://github.com/oxc-project/oxc/pull/26379)
    it('rounds large nondecimal literals correctly', async () => {
        const result = await transformCode(
            `
const BIG = 0x10000000000000801;

export function Comp() {
    return <div>{BIG}</div>;
}
`,
            '/src/Comp.tsx',
        );
        const [, literal] = result?.code.match(/const BIG = ([^;]+);/) ?? [];
        expect(Number(literal)).toBe(2 ** 64 + 4096);
    });

    // a labeled break/continue inside an arrow function is an early error
    // (Babel rejects it too), but the parser used to accept it and the
    // compiler then hoisted the closure with the jump silently dropped;
    // rejected upstream since 0.149.0
    // (https://github.com/oxc-project/oxc/pull/26357)
    it('rejects labeled jumps that cross a closure boundary', async () => {
        await expect(
            transformCode(
                `
export function Comp() {
    outer: for (const x of [1]) {
        const f = () => {
            break outer;
        };
        f();
    }
    return <div />;
}
`,
                '/src/Comp.tsx',
            ),
        ).rejects.toThrow('Jump target cannot cross function boundary');
    });

    // `export { a } from;` used to parse (and compile to `export { a };`,
    // an export of a nonexistent binding) instead of failing like every
    // other parser; rejected upstream since 0.149.0
    // (https://github.com/oxc-project/oxc/pull/26389)
    it('rejects `export … from` without a module source', async () => {
        await expect(
            transformCode(
                `
export { a } from;

export function Comp() {
    return <div />;
}
`,
                '/src/Comp.tsx',
            ),
        ).rejects.toThrow('Unexpected token');
    });
});
