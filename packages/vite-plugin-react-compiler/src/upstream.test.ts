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

type Transform = (
    this: { error: (message: string) => never; warn: (message: string) => void },
    code: string,
    id: string,
) => Promise<null | { code: string }>;

const plugin = vitePluginReactCompiler();
const transform = plugin.transform as Transform;
const context = {
    error(message: string): never {
        throw new Error(message);
    },
    // by default the plugin only warns about oxc’s own non-fatal
    // diagnostics, and no input here should have one; fail readably if one
    // does
    warn(message: string) {
        throw new Error(`Unexpected warning: ${message}`);
    },
};
const transformCode = (code: string, id: string) => transform.call(context, code, id);

describe('oxc-transform-react upstream behavior', () => {
    // babel-plugin-react-compiler@1.0.0 (stable) bails on a value block (a
    // conditional, logical or optional-chain expression) inside try/catch
    // (“Support value blocks … within a try/catch statement”), but React
    // Compiler main — which the Rust port tracks — supports them: upstream
    // confirmed the compiled output conforms to the unpublished Babel
    // compiler and dropped the bailout-restoration attempt
    // (https://github.com/oxc-project/oxc/issues/25343 closed as not
    // planned; https://github.com/oxc-project/oxc/pull/25409 closed
    // unmerged), so compiling is the supported behavior and this pins it
    it('compiles value blocks inside try/catch, which the stable Babel plugin bails on', async () => {
        const result = await transformCode(
            `
export function SafeParse({ json }: { json: string }) {
    let value = null;
    try {
        value = json ? JSON.parse(json) : null;
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

    // babel-plugin-react-compiler@1.0.0 bails on a computed object key that
    // isn’t an identifier, a member expression or a string literal
    // (“Expected Identifier, got TemplateLiteral key in ObjectExpression”),
    // such as the template literal naming a CSS custom property here
    it('compiles template-literal object keys the Babel plugin bails on', async () => {
        const result = await transformCode(
            `
export function Swatch({ prop, value }: { prop: string; value: string }) {
    const style = { [\`--\${prop}\`]: value };
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

    // oxc_codegen dropped the parentheses around a relational expression
    // used as the right operand of a private-in expression, printing
    // `#x in a instanceof b`; `in` and `instanceof` share precedence and
    // associate left-to-right, so that parses as `(#x in a) instanceof b`,
    // changing which value the private-field check runs against; fixed
    // upstream in 0.150.0 (https://github.com/oxc-project/oxc/pull/26411)
    it('parenthesizes relational right operands of private-in expressions', async () => {
        const result = await transformCode(
            `
export function Comp({ o }: { o: object }) {
    const Local = class {
        #x = 1;
        test(a: object, b: Function) {
            return #x in (a instanceof b);
        }
    };
    return <div>{new Local().test(o, Object)}</div>;
}
`,
            '/src/Comp.tsx',
        );
        expect(result?.code).toContain('#x in (a instanceof b)');
    });

    // oxc_parser accepted modifiers on an `import x = …` alias and ignored
    // them (`public import a = b.c;` compiled to a plain `var a = b.c;`)
    // instead of failing like TypeScript and Babel; rejected upstream since
    // 0.151.0 (https://github.com/oxc-project/oxc/pull/26622). Each modifier
    // below gets a distinct diagnostic; the rest (`static`, `readonly`, …)
    // share `public`’s message
    it.each(['declare', 'public', 'abstract'])(
        'rejects the %s modifier on an import alias',
        async (modifier) => {
            await expect(
                transformCode(
                    `
namespace b {
    export const c = 1;
}
${modifier} import a = b.c;

export function Comp() {
    return <div>{a}</div>;
}
`,
                    '/src/Comp.tsx',
                ),
            ).rejects.toThrow(`'${modifier}' modifier`);
        },
    );

    // oxc_parser accepted TypeScript-only class modifiers in JavaScript
    // files and printed them back out (`public items;` stayed in the
    // output, a syntax error for everything downstream) instead of failing
    // like TypeScript (TS8009) and Babel; rejected upstream since 0.153.0
    // (https://github.com/oxc-project/oxc/pull/27312). Every modifier gets
    // the same diagnostic (`private`, `protected` and `override` too), so
    // these three are a sample
    it.each(['public', 'readonly', 'declare'])(
        'rejects the %s class modifier in a JavaScript file',
        async (modifier) => {
            await expect(
                transformCode(
                    `
export class Store {
    ${modifier} items;
}

export function Comp() {
    return <div />;
}
`,
                    '/src/Comp.jsx',
                ),
            ).rejects.toThrow(
                `'${modifier}' modifier can only be used in TypeScript files`,
            );
        },
    );

    // oxc_parser accepted type members with no separator between them
    // (`label: string onClick(): void`) and silently erased the type;
    // TypeScript (TS1005) and Babel both reject it; rejected upstream since
    // 0.153.0 (https://github.com/oxc-project/oxc/pull/27222)
    it('rejects type members without a separator', async () => {
        await expect(
            transformCode(
                `
export interface Props {
    label: string onClick(): void;
}

export function Comp({ label }: Props) {
    return <div>{label}</div>;
}
`,
                '/src/Comp.tsx',
            ),
        ).rejects.toThrow('Expected a semicolon');
    });

    // oxc_parser dropped a `@__NO_SIDE_EFFECTS__` annotation written after
    // `export` (`export /* @__NO_SIDE_EFFECTS__ */ function f() {}`), on
    // compiled components and hooks too, so a bundler could not drop
    // unused calls to the function; only an annotation before `export`
    // survived. Kept upstream since 0.154.0
    // (https://github.com/oxc-project/oxc/pull/27504)
    it('keeps a no-side-effects annotation written after export', async () => {
        const result = await transformCode(
            `
import { useState } from 'react';

export /* @__NO_SIDE_EFFECTS__ */ function useCount() {
    const [count, setCount] = useState(0);
    return [count, () => setCount(count + 1)] as const;
}

export /* @__NO_SIDE_EFFECTS__ */ const Label = ({ text }: { text: string }) => (
    <span>{text}</span>
);
`,
            '/src/Comp.tsx',
        );
        // both annotated functions were compiled (each opens with the
        // compiler’s memo cache), and still carry the annotation
        expect(result?.code).toMatch(
            /\/\* @__NO_SIDE_EFFECTS__ \*\/\s*export function useCount\(\) \{\s*const \$ = _c\(/,
        );
        expect(result?.code).toMatch(
            /export const Label = \/\* @__NO_SIDE_EFFECTS__ \*\/ \([^)]*\) => \{\s*const \$ = _c\(/,
        );
    });

    // the compiler printed a string literal holding a lone surrogate
    // ('\ud800') as U+FFFD followed by the text `d800`, so a component or
    // hook testing for the surrogate range, e.g. to truncate text without
    // splitting an emoji, compared against garbage. Kept upstream since
    // 0.155.0, when string literals moved to a UTF-16-exact type
    // (https://github.com/oxc-project/oxc/pull/26548)
    it('keeps lone surrogates in string literals of compiled functions', async () => {
        const result = await transformCode(
            `
export function Truncated({ text, max }: { text: string; max: number }) {
    const last = text.charAt(max - 1);
    const end = last >= '\\ud800' && last <= '\\udbff' ? max - 1 : max;
    return <span title={text}>{text.slice(0, end)}</span>;
}
`,
            '/src/Truncated.tsx',
        );
        expect(result?.code).toContain('react/compiler-runtime');
        expect(result?.code).toContain('last >= "\\ud800" && last <= "\\udbff"');
    });

    // the compiler dropped the `?.` from an optional chain continued
    // through a non-null assertion, printing `users?.find(…)!.name` as
    // `users.find(…).name`, which throws while `users` is undefined;
    // babel-plugin-react-compiler@1.0.0 keeps it. Kept upstream since
    // 0.156.0 (https://github.com/oxc-project/oxc/pull/28144)
    it('keeps an optional chain continued through a non-null assertion', async () => {
        const result = await transformCode(
            `
type User = { id: string; name: string };

export function UserName({ users, userId }: { users?: User[]; userId: string }) {
    const name = users?.find((user) => user.id === userId)!.name;
    return <span>{name}</span>;
}
`,
            '/src/UserName.tsx',
        );
        expect(result?.code).toContain('react/compiler-runtime');
        expect(result?.code).toContain('users?.find((user) => user.id === userId).name');
    });

    // a value that a branch inside `try` picks from props, with a constant
    // on each side, was treated as a constant itself, so the element built
    // from it was cached once per mount and kept rendering the first value
    // after the prop changed; babel-plugin-react-compiler@1.0.0 caches it
    // the same way. Recomputed upstream since 0.156.0
    // (https://github.com/oxc-project/oxc/pull/27817)
    it('recomputes a value that a branch inside try picks from props', async () => {
        const result = await transformCode(
            `
declare function track(event: string): void;

export function Banner({ isSignedIn }: { isSignedIn: boolean }) {
    let message;
    try {
        if (isSignedIn) {
            message = 'Welcome back';
        } else {
            message = 'Sign in to continue';
        }
        track('banner-view');
    } catch {
        message = 'Welcome';
    }
    return <p>{message}</p>;
}
`,
            '/src/Banner.tsx',
        );
        expect(result?.code).toContain('react/compiler-runtime');
        // the element is cached against message instead of once per mount
        expect(result?.code).toMatch(/\$\[\d+\] !== message\b/);
        expect(result?.code).not.toContain('react.memo_cache_sentinel');
    });

    // a value that `catch` assigns when a call inside `try` throws on a
    // prop was treated as a constant, so the element built from it was
    // cached once per mount: a link that started out valid kept rendering
    // as valid after its href became invalid;
    // babel-plugin-react-compiler@1.0.0 caches it the same way. Recomputed
    // upstream since 0.156.0 (https://github.com/oxc-project/oxc/pull/28005)
    it('recomputes a value that catch assigns when a prop makes try throw', async () => {
        const result = await transformCode(
            `
export function LinkStatus({ href }: { href: string }) {
    let isValid = true;
    try {
        new URL(href);
    } catch {
        isValid = false;
    }
    return <span>{isValid ? 'Valid link' : 'Invalid link'}</span>;
}
`,
            '/src/LinkStatus.tsx',
        );
        expect(result?.code).toContain('react/compiler-runtime');
        expect(result?.code).not.toContain('react.memo_cache_sentinel');
    });

    // once a `try` holds nothing that can throw, such as when its risky
    // call is commented out, its `catch` can never run, and the compiler
    // panicked on a component like the first one below, which aborts the
    // whole process (a dev server included), or silently compiled one
    // like the second, whose `catch` branches, to a function that renders
    // nothing, dropping everything after the `try`;
    // babel-plugin-react-compiler@1.0.0 skips the first and also empties
    // the second. Both compile upstream since 0.156.0
    // (https://github.com/oxc-project/oxc/pull/28066)
    it('compiles a try whose catch can never run', async () => {
        const reassigns = await transformCode(
            `
declare function parse(json: string, options: object): unknown;

export function Preview({ json }: { json: string }) {
    let isValid = true;
    try {
        const options = { strict: true };
        // parse(json, options);
    } catch {
        isValid = false;
    }
    return <pre className={isValid ? 'valid' : 'invalid'}>{json}</pre>;
}
`,
            '/src/Preview.tsx',
        );
        expect(reassigns?.code).toContain('react/compiler-runtime');
        expect(reassigns?.code).toContain('className={isValid ? "valid" : "invalid"}');

        const branches = await transformCode(
            `
declare function parse(json: string, options: object): unknown;

export function Preview({ json }: { json: string }) {
    try {
        const options = { strict: true };
        // parse(json, options);
    } catch (error) {
        if (error instanceof SyntaxError) {
            console.warn(error.message);
        } else {
            throw error;
        }
    }
    return <pre>{json}</pre>;
}
`,
            '/src/Preview.tsx',
        );
        expect(branches?.code).toContain('react/compiler-runtime');
        expect(branches?.code).toContain('<pre>{json}</pre>');
    });

    // a component or hook whose useMemo or useCallback dependency list is
    // missing a dependency or lists an extra one is left uncompiled, with
    // its manual memoization as written, matching React Compiler main.
    // babel-plugin-react-compiler@1.0.0 and the bindings from 0.144.0
    // through 0.155.0 compile it with the dependencies they infer instead,
    // so the value updates on a different schedule than the uncompiled
    // code’s: below, sorting again whenever sortKey changes, and ignoring
    // label
    // (https://github.com/oxc-project/oxc/pull/28101)
    it('leaves manual memoization with missing or extra dependencies as written', async () => {
        const reporting = vitePluginReactCompiler({
            compiler: { reportDiagnostics: true },
        });
        // oxc ignores unknown environment keys, so a rename upstream would
        // turn the opt-out the README documents into a silent no-op; passing
        // it here fails tsc on a rename and this test on a no-op
        const optedOut = vitePluginReactCompiler({
            compiler: {
                environment: { validateExhaustiveMemoizationDependencies: false },
            },
        });
        // asserts the input is skipped for this reason alone (an input can be
        // skipped for others, like “Existing memoization could not be
        // preserved”) and compiles once the check is off
        const expectSkipped = async (code: string, id: string, diagnostic: string) => {
            const result = await transformCode(code, id);
            expect(result?.code).not.toContain('react/compiler-runtime');

            const warnings: Array<string> = [];
            const recording = {
                ...context,
                warn(message: string) {
                    warnings.push(message);
                },
            };
            await (reporting.transform as Transform).call(recording, code, id);
            expect(warnings).toEqual([expect.stringContaining(diagnostic)]);

            const compiled = await (optedOut.transform as Transform).call(
                context,
                code,
                id,
            );
            expect(compiled?.code).toContain('react/compiler-runtime');
            return result?.code;
        };

        const missing = await expectSkipped(
            `
import { useMemo } from 'react';

declare function sortBy<T>(items: T[], key: string): T[];

export function SortedList({ items, sortKey }: { items: string[]; sortKey?: string }) {
    const sorted = useMemo(() => sortBy(items, sortKey ?? 'name'), [items]);
    return <ul>{sorted.map((item) => <li key={item}>{item}</li>)}</ul>;
}
`,
            '/src/SortedList.tsx',
            'Found missing memoization dependencies',
        );
        expect(missing).toContain('useMemo(');

        const extra = await expectSkipped(
            `
import { useCallback } from 'react';

export function Row({ id, label, onSelect }: { id: string; label: string; onSelect: (id: string) => void }) {
    const handleClick = useCallback(() => onSelect(id), [onSelect, id, label]);
    return <button onClick={handleClick}>{label}</button>;
}
`,
            '/src/Row.tsx',
            'Found extra memoization dependencies',
        );
        expect(extra).toContain('useCallback(');
    });

    // a memo block that clamps a prop in place, as below, stored the
    // clamped value as its cache key, so a later render whose prop equaled
    // it reused the earlier output: a quantity of 3 after a quantity of 5
    // (with 3 in stock) still read “Only 3 in stock”. A prop defaulted by
    // reassignment (`title = title ?? …`) missed the cache on every render
    // instead. babel-plugin-react-compiler@1.0.0 keys it the same way.
    // Keyed on the value from before the block upstream since 0.157.0
    // (https://github.com/oxc-project/oxc/issues/27420)
    it('keys a memo block that reassigns a prop on its value before the block', async () => {
        const result = await transformCode(
            `
export function CartQuantity({ quantity, stock }: { quantity: number; stock: number }) {
    const notes: string[] = [];
    if (quantity > stock) {
        notes.push(\`Only \${stock} in stock\`);
        quantity = stock;
    }
    return (
        <p>
            Qty {quantity} {notes.join(' ')}
        </p>
    );
}
`,
            '/src/CartQuantity.tsx',
        );
        expect(result?.code).toContain('react/compiler-runtime');
        // the key is a copy of quantity taken before the block clamps it
        expect(result?.code).toMatch(
            /const (\w+) = quantity;[^]*?if \([^)]*\$\[\d+\] !== \1\b/,
        );
    });

    // a variable declared before a memo block and reassigned in a loop
    // inside it wasn't restored from the cache when the block was skipped,
    // so it kept its initial value from the second render with the same
    // props on: below, the link pointed at “#” instead of the first invalid
    // field; babel-plugin-react-compiler@1.0.0 does the same. Restored
    // upstream since 0.157.0 (https://github.com/oxc-project/oxc/issues/27421)
    it('restores a variable a memo block reassigns in a loop', async () => {
        const result = await transformCode(
            `
type Field = { name: string; error?: string };

export function FormErrors({ fields }: { fields: Field[] }) {
    let firstInvalid = '';
    const errors: string[] = [];
    for (const field of fields) {
        if (field.error) {
            firstInvalid = field.name;
            break;
        }
    }
    for (const field of fields) {
        if (field.error) errors.push(field.error);
    }
    return (
        <div>
            <a href={\`#\${firstInvalid}\`}>Go to first error</a>
            <p>{errors.join(' ')}</p>
        </div>
    );
}
`,
            '/src/FormErrors.tsx',
        );
        expect(result?.code).toContain('react/compiler-runtime');
        expect(result?.code).toMatch(/\bfirstInvalid = \$\[\d+\];/);
    });

    // a value assigned in a branch on a prop was treated as a constant when
    // that branch also returned early on a condition that isn't reactive
    // (a feature flag, `typeof window`), so the element built from it was
    // cached once per mount: below, the status kept saying “Saving” after
    // saving finished; babel-plugin-react-compiler@1.0.0 caches it the same
    // way. Recomputed upstream since 0.157.0
    // (https://github.com/oxc-project/oxc/issues/27418)
    it('recomputes a value a branch on a prop assigns after an early return', async () => {
        const result = await transformCode(
            `
import { features } from './features';

export function SaveStatus({ isSaving }: { isSaving: boolean }) {
    let label = 'All changes saved';
    if (isSaving) {
        if (!features.saveIndicator) return null;
        label = 'Saving';
    }
    return <span role="status">{label}</span>;
}
`,
            '/src/SaveStatus.tsx',
        );
        expect(result?.code).toContain('react/compiler-runtime');
        expect(result?.code).toMatch(/\$\[\d+\] !== label\b/);
        expect(result?.code).not.toContain('react.memo_cache_sentinel');
    });

    // an allocation inside a useMemo result that depends on nothing, like
    // the Set below, was cached once per mount, so the result was rebuilt
    // when its dependencies changed but kept sharing the first Set: after
    // the page changed, impressions on the new page were never tracked;
    // babel-plugin-react-compiler@1.0.0 caches it the same way. Recreated
    // with the result upstream since 0.157.0
    // (https://github.com/oxc-project/oxc/issues/27427)
    it('recreates an allocation in a useMemo result when its dependencies change', async () => {
        const result = await transformCode(
            `
import { useMemo } from 'react';

export function useImpressions(page: string, track: (page: string, id: string) => void) {
    const session = useMemo(() => ({ page, seen: new Set<string>() }), [page]);
    return (id: string) => {
        if (session.seen.has(id)) return;
        session.seen.add(id);
        track(session.page, id);
    };
}
`,
            '/src/useImpressions.ts',
        );
        expect(result?.code).toContain('react/compiler-runtime');
        expect(result?.code).toContain('seen: new Set()');
        expect(result?.code).not.toContain('react.memo_cache_sentinel');
    });

    // a value that is only compared and passed to a state setter during
    // render, as in the “adjust state when a prop changes” pattern below,
    // lost its memoization, so a new object every render never equaled the
    // stored one and the component crashed with “Too many re-renders”;
    // babel-plugin-react-compiler@1.0.0 compiles it the same way. Memoized
    // upstream since 0.157.0 (https://github.com/oxc-project/oxc/issues/27426)
    it('memoizes a value passed to a state setter during render', async () => {
        const result = await transformCode(
            `
import { useMemo, useState } from 'react';

type Filters = { query: string; status: string };

export function Pager({ query, status }: Filters) {
    const filters = useMemo(() => ({ query, status }), [query, status]);
    const [prevFilters, setPrevFilters] = useState<Filters | null>(null);
    const [page, setPage] = useState(1);
    if (filters !== prevFilters) {
        setPrevFilters(filters);
        setPage(1);
    }
    return <button onClick={() => setPage(page + 1)}>Page {page}</button>;
}
`,
            '/src/Pager.tsx',
        );
        expect(result?.code).toContain('react/compiler-runtime');
        expect(result?.code).not.toContain('const filters = {');
        expect(result?.code).toMatch(/\$\[\d+\] !== query \|\| \$\[\d+\] !== status\)/);
    });

    // a callback reading `ref.current`, when the compiler can’t tell the
    // value is a ref (a ref prop with a fallback, `boxRef ?? ownRef`), was
    // cached against `ref.current.offsetWidth`, a guard that reads the ref
    // during render, so the component threw on its first render, before the
    // ref was attached; babel-plugin-react-compiler@1.0.0 guards it the same
    // way. Cached against the ref upstream since 0.157.0
    // (https://github.com/oxc-project/oxc/issues/27423)
    it('caches a callback reading ref.current against the ref', async () => {
        const result = await transformCode(
            `
import { useLayoutEffect, useRef, type RefObject } from 'react';

export function MeasuredBox({
    boxRef,
    onMeasure,
}: {
    boxRef?: RefObject<HTMLDivElement | null>;
    onMeasure: (width: number) => void;
}) {
    const ownRef = useRef<HTMLDivElement>(null);
    const ref = boxRef ?? ownRef;
    useLayoutEffect(() => {
        onMeasure(ref.current!.offsetWidth);
    }, [ref, onMeasure]);
    return <div ref={ref} />;
}
`,
            '/src/MeasuredBox.tsx',
        );
        expect(result?.code).toContain('react/compiler-runtime');
        expect(result?.code).toContain('onMeasure(ref.current.offsetWidth)');
        expect(result?.code).not.toContain('!== ref.current');
    });

    // a property read inside a JSX callback was hoisted into the cache
    // guard, which runs during render, so a component threw (“Cannot read
    // properties of null”) as soon as the object was null, even though the
    // callback, behind a disabled button, never ran;
    // babel-plugin-react-compiler@1.0.0 guards it the same way. Cached
    // against the object upstream since 0.157.0
    // (https://github.com/oxc-project/oxc/issues/27070)
    it('caches a JSX callback against the object it reads from', async () => {
        const result = await transformCode(
            `
type User = { id: string; name: string };

export function FollowButton({ user, onFollow }: { user: User | null; onFollow: (id: string) => void }) {
    return (
        <button disabled={!user} onClick={() => onFollow(user!.id)}>
            Follow
        </button>
    );
}
`,
            '/src/FollowButton.tsx',
        );
        expect(result?.code).toContain('react/compiler-runtime');
        expect(result?.code).toMatch(/\$\[\d+\] !== user\b(?!\.)/);
        expect(result?.code).not.toContain('!== user.id');
    });

    // a postfix increment of a property, like an id counter in a ref,
    // was compiled to `ref.current = ref.current + 1` followed by a read of
    // the new value, so `nextId.current++` handed out 1, 2, … instead of
    // 0, 1, …, and a bigint counter threw (“Cannot mix BigInt and other
    // types”); babel-plugin-react-compiler@1.0.0 compiles it the same way.
    // Kept as an increment of the old value upstream since 0.157.0
    // (https://github.com/oxc-project/oxc/issues/27424)
    it('returns the old value from a postfix increment of a property', async () => {
        const result = await transformCode(
            `
import { useRef, useState } from 'react';

export function TodoList() {
    const nextId = useRef(0);
    const [todos, setTodos] = useState<Array<{ id: number; text: string }>>([]);
    const addTodo = () => {
        const id = nextId.current++;
        setTodos((todos) => [...todos, { id, text: \`Todo \${id}\` }]);
    };
    return (
        <>
            <button onClick={addTodo}>Add</button>
            <ul>
                {todos.map((todo) => (
                    <li key={todo.id}>{todo.text}</li>
                ))}
            </ul>
        </>
    );
}
`,
            '/src/TodoList.tsx',
        );
        expect(result?.code).toContain('react/compiler-runtime');
        expect(result?.code).toMatch(
            /let (\w+) = nextId\.current;\s+const (\w+) = \1\+\+;\s+nextId\.current = \1;\s+const id = \2;/,
        );
    });

    // every BigInt literal in a compiled component or hook was printed as
    // `undefined`, so arithmetic on it threw (“Cannot mix BigInt and other
    // types”) and `useRef(0n)` started out undefined;
    // babel-plugin-react-compiler@1.0.0 leaves such a function uncompiled
    // (“Handle BigIntLiteral expressions”). Kept upstream since 0.157.0
    // (https://github.com/oxc-project/oxc/issues/26161)
    it('keeps BigInt literals in compiled functions', async () => {
        const result = await transformCode(
            `
export function Duration({ nanoseconds }: { nanoseconds: bigint }) {
    const milliseconds = (nanoseconds + 500000n) / 1000000n;
    return <span>{milliseconds.toString()} ms</span>;
}
`,
            '/src/Duration.tsx',
        );
        expect(result?.code).toContain('react/compiler-runtime');
        expect(result?.code).toContain('(nanoseconds + 500000n) / 1000000n');
    });

    // a component defined inside a factory function had a callback that
    // only uses the factory’s arguments hoisted to a module-level
    // function, outside their scope, so it threw “renderItem is not
    // defined” on its first render; babel-plugin-react-compiler@1.0.0
    // hoists it the same way. Kept in scope upstream since 0.157.0
    // (https://github.com/oxc-project/oxc/issues/26519)
    it('keeps a callback using a factory’s arguments inside the factory', async () => {
        const result = await transformCode(
            `
import type { ReactNode } from 'react';

export function createList<T>(getKey: (item: T) => string, renderItem: (item: T) => ReactNode) {
    const List = ({ items }: { items: T[] }) => (
        <ul>
            {items.map((item) => (
                <li key={getKey(item)}>{renderItem(item)}</li>
            ))}
        </ul>
    );
    return List;
}
`,
            '/src/createList.tsx',
        );
        expect(result?.code).toContain('react/compiler-runtime');
        expect(result?.code).toContain(
            '(item) => <li key={getKey(item)}>{renderItem(item)}</li>',
        );
        expect(result?.code).not.toMatch(/function _temp\d*\(/);
    });

    // a hook whose memoized callbacks read the same ref in different places,
    // with one stored as a property of the other, like a debounced callback
    // with a cancel method, was left uncompiled (“Ref type environment did
    // not converge”); babel-plugin-react-compiler@1.0.0 compiles it.
    // Compiled upstream since 0.157.0
    // (https://github.com/oxc-project/oxc/issues/26181)
    it('compiles a hook whose callbacks read a ref in different places', async () => {
        const result = await transformCode(
            `
import { useMemo, useRef } from 'react';

export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, delay: number) {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    return useMemo(() => {
        const cancel = () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
        const debounced = (...args: A) => {
            cancel();
            timeoutRef.current = setTimeout(() => fn(...args), delay);
        };
        debounced.cancel = cancel;
        return debounced;
    }, [fn, delay]);
}
`,
            '/src/useDebouncedCallback.ts',
        );
        expect(result?.code).toContain('react/compiler-runtime');
    });

    // a component that increments a variable a closure captures, like a
    // count of selected items that an onClick callback reads, was left
    // uncompiled (“Handle UpdateExpression to variables captured within
    // lambdas”), as babel-plugin-react-compiler@1.0.0 leaves it. Compiled
    // upstream since 0.157.0 (https://github.com/oxc-project/oxc/pull/26893)
    it('compiles an increment of a variable a closure captures, which the Babel plugin bails on', async () => {
        const result = await transformCode(
            `
type Item = { id: string; selected: boolean };

export function CheckoutButton({ items, onCheckout }: { items: Item[]; onCheckout: (count: number) => void }) {
    let count = 0;
    for (const item of items) {
        if (item.selected) count++;
    }
    return <button onClick={() => onCheckout(count)}>Checkout ({count})</button>;
}
`,
            '/src/CheckoutButton.tsx',
        );
        expect(result?.code).toContain('react/compiler-runtime');
        expect(result?.code).toContain('count++');
        expect(result?.code).toMatch(/\$\[\d+\] !== count\b/);
    });

    // a callback passing an item to a handler that mutates a global, below
    // `window.location.hash`, was treated as calling the handler during
    // render, so the component was left uncompiled (“This value cannot be
    // modified”), as babel-plugin-react-compiler@1.0.0 leaves it. Compiled
    // upstream since 0.157.0 (https://github.com/oxc-project/oxc/issues/27309)
    it('compiles a callback that passes an item to a handler mutating a global, which the Babel plugin bails on', async () => {
        const result = await transformCode(
            `
type Item = { id: string; label: string };

export function Menu({ items }: { items: Item[] }) {
    function handleClick(id: string) {
        window.location.hash = id;
    }
    return (
        <ul>
            {items.map((item) => (
                <li key={item.id} onClick={() => handleClick(item.id)}>
                    {item.label}
                </li>
            ))}
        </ul>
    );
}
`,
            '/src/Menu.tsx',
        );
        expect(result?.code).toContain('react/compiler-runtime');
    });

    // a TypeScript assertion on that allocation (`[] as string[]`) still
    // hides it from the fix above: the array is cached once per mount and
    // shared by every result, so impressions on a new page are never
    // tracked; babel-plugin-react-compiler@1.0.0 caches it the same way
    it.fails('recreates an asserted allocation in a useMemo result when its dependencies change', async () => {
        const result = await transformCode(
            `
import { useMemo } from 'react';

export function useImpressions(page: string, track: (page: string, id: string) => void) {
    const session = useMemo(() => ({ page, seen: [] as string[] }), [page]);
    return (id: string) => {
        if (session.seen.includes(id)) return;
        session.seen.push(id);
        track(session.page, id);
    };
}
`,
            '/src/useImpressions.ts',
        );
        expect(result?.code).toContain('react/compiler-runtime');
        expect(result?.code).not.toContain('react.memo_cache_sentinel');
    });

    // a component in which a function returns the result of passing a
    // callback that reassigns one of the function’s parameters or locals,
    // like the loader below, was left uncompiled on 0.157.0 (“Cannot
    // reassign variable after render completes”,
    // https://github.com/oxc-project/oxc/pull/26893), which also failed the
    // build with panicThreshold set to 'critical_errors' or 'all_errors'.
    // Each call to load has its own `rows`, so memoizing load is safe, and
    // 0.156.0 and babel-plugin-react-compiler@1.0.0 compile it. Compiled
    // again since 0.158.0, which limits the check to bindings declared in
    // the component or hook (https://github.com/oxc-project/oxc/pull/28820)
    it('compiles a function returning a promise whose callback reassigns its parameter', async () => {
        const result = await transformCode(
            `
declare function fetchPage(page: number): Promise<string[]>;

export function LoadAll({ onLoaded }: { onLoaded: (rows: string[]) => void }) {
    const load = (page: number, rows: string[]) =>
        fetchPage(page).then((next) => {
            rows = rows.concat(next);
            if (next.length === 0) onLoaded(rows);
            else load(page + 1, rows);
        });
    return <button onClick={() => load(0, [])}>Load all</button>;
}
`,
            '/src/LoadAll.tsx',
        );
        expect(result?.code).toContain('react/compiler-runtime');
    });

    // a hook or component in which an async function reassigns a variable
    // declared in another callback, like an effect that stores a
    // connection from an async IIFE for its cleanup, was left uncompiled on
    // 0.157.0 (“Cannot reassign variable in async function”,
    // https://github.com/oxc-project/oxc/pull/26893), which also failed the
    // build with panicThreshold set to 'critical_errors' or 'all_errors'.
    // The variable belongs to one run of the effect, so compiling it is
    // safe, and 0.156.0 and babel-plugin-react-compiler@1.0.0 compile it.
    // Compiled again since 0.158.0
    // (https://github.com/oxc-project/oxc/issues/28401, fixed by
    // https://github.com/oxc-project/oxc/pull/28820)
    it('compiles an effect whose async callback reassigns an effect local', async () => {
        const result = await transformCode(
            `
import { useEffect } from 'react';

declare function connect(url: string): Promise<{ close(): void }>;

export function useSocket(url: string) {
    useEffect(() => {
        let socket: { close(): void } | undefined;
        (async () => {
            socket = await connect(url);
        })();
        return () => socket?.close();
    }, [url]);
}
`,
            '/src/useSocket.ts',
        );
        expect(result?.code).toContain('react/compiler-runtime');
    });

    // a component that keeps the result of a call it passes a callback to,
    // when that callback reassigns one of the component’s own variables, is
    // left uncompiled (“Cannot reassign variable after render completes”)
    // inside an `if`, a loop, a `switch`, a ternary or `&&` since 0.157.0
    // (https://github.com/oxc-project/oxc/pull/26893), as it already was
    // outside them, and the diagnostic fails the build with panicThreshold
    // set to 'critical_errors' or 'all_errors'. 0.156.0,
    // babel-plugin-react-compiler@1.0.0 and its latest experimental build
    // compile it; a discarded result still compiles
    it.fails('compiles a component that keeps, inside an if, a call result whose callback reassigns its variable', async () => {
        const result = await transformCode(
            `
declare function validate(value: string, onWarning: (message: string) => void): boolean;

export function EmailField({ value, touched }: { value: string; touched: boolean }) {
    let warning = '';
    let valid = true;
    if (touched) valid = validate(value, (message) => { warning = message; });
    return <p className={valid ? 'ok' : 'error'}>{warning}</p>;
}
`,
            '/src/EmailField.tsx',
        );
        expect(result?.code).toContain('react/compiler-runtime');
    });
});
