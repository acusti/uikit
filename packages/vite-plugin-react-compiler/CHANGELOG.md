# @acusti/vite-plugin-react-compiler

## 0.12.0

### Minor Changes

- 145294f: Bump oxc-transform-react to 0.158.0

    A component or hook that keeps the result of a call it passes a
    callback to, when that callback reassigns one of the component’s own
    variables, is now left uncompiled inside an `if`, a loop, a `switch`, a
    ternary or `&&` too, as it already was outside them, as in
    `if (touched) valid = validate(value, (message) => { warning = message; });`
    (“Cannot reassign variable after render completes”). With
    `panicThreshold` set to `'critical_errors'` or `'all_errors'`, its
    diagnostic fails the build instead. Set
    `compiler: { reportDiagnostics: true }` to see which ones it skips.

    Compiled components and hooks no longer render stale values or throw
    where the uncompiled code doesn’t, in these cases:

    - A memo block that reassigns one of its inputs, like
      `quantity = stock` to clamp a prop, is now keyed on the input’s value
      from before the block, so it no longer reuses the output of an
      earlier render.
    - A variable that a memo block reassigns in a loop now keeps its value
      when the block is skipped.
    - A value set in a branch on a prop now updates when the prop changes
      even when that branch returns early on a condition like a feature
      flag.
    - A hook called inline in a memoized object (`{ ref: useRef(null) }`)
      now runs on every render, so React no longer throws “Should have a
      queue”.
    - An allocation in a `useMemo` result (`{ page, seen: new Set() }`) is
      now recreated with the result instead of shared across dependency
      changes. One wrapped in a type assertion (`[] as string[]`) is still
      shared.
    - A value that is only compared and passed to a state setter during
      render is now memoized, so adjusting state when a prop changes no
      longer fails with “Too many re-renders”.
    - A callback’s cache check no longer reads `ref.current`, or a property
      of an object that can be null, during render.
    - A callback in a component defined inside a factory function can now
      call the factory’s arguments instead of throwing a ReferenceError.
    - `ref.current++` now evaluates to the old value, a compound assignment
      like `totals[i++ % columns] += x` evaluates its target once, a
      computed `['__proto__']` key now creates an own property, and BigInt
      literals are no longer printed as `undefined`.

    Some components and hooks that were skipped now compile: those that
    increment a variable a closure captures (`count++` in a loop, with the
    count read by an `onClick` callback), those that pass an item to a
    handler that mutates a global (`window.location.hash = id`), and hooks
    whose callbacks read a ref in different places, like a debounced
    callback with a `cancel` method.

    A ref-like name that starts with a non-ASCII letter, like `élanRef`, no
    longer aborts the process. A member chain longer than 500 links, as in
    generated code, is now left uncompiled. Chains that long used to
    compile slowly, or crash the process at around 5,000 links. A loop
    around a `try` whose branches copy variables into each other no longer
    takes seconds and gigabytes of memory to compile.

## 0.11.0

### Minor Changes

- 06cb454: Bump oxc-transform-react to 0.156.0

    A component or hook whose `useMemo` or `useCallback` dependency list is
    missing a dependency or lists an extra one is now left uncompiled, as
    on React Compiler main, so its memoization updates exactly as written.
    With `panicThreshold` set to `'critical_errors'` or `'all_errors'`, its
    diagnostic fails the build instead. Set
    `compiler: { reportDiagnostics: true }` to see which ones it skips, as
    build warnings, or
    `compiler: { environment: { validateExhaustiveMemoizationDependencies: false } }`
    to compile them with the inferred dependencies instead.

    A memoized value read through an optional chain, as in
    `page?.sections.map(…)`, now has its cache checked against that same
    chain. When `page` changes from undefined to an object without
    `sections`, the component throws as it does uncompiled, instead of
    rendering the value cached on the earlier render.

    An optional chain continued through a non-null assertion
    (`users?.find(…)!.name`) now keeps its `?.`. A value that a
    `try`/`catch` picks based on props now updates when they change. A
    component with a `try` whose `catch` can never run (its risky call
    commented out, say) now compiles instead of aborting the process or
    rendering nothing. With `enableJsxOutlining` on, outlined JSX with
    hyphenated props like `aria-label` now compiles to valid code.

## 0.10.0

### Minor Changes

- ef139d9: Bump oxc-transform-react to 0.155.0

    A string literal containing a lone surrogate (`'\ud800'`), such as the
    bounds of a surrogate-range check, now survives inside a compiled
    component or hook. It used to come out as a garbled character followed
    by the text `d800`.

## 0.9.0

### Minor Changes

- bcfaed3: Bump oxc-transform-react to 0.154.0

    A `@__NO_SIDE_EFFECTS__` annotation written after `export`
    (`export /* @__NO_SIDE_EFFECTS__ */ function f() {}`) is now kept in
    the output, including on compiled components and hooks, so your bundler
    can drop unused calls to the function. Only an annotation written
    before `export` used to survive.

    An enum member initialized with a unary `+`, `-` or `~` applied to a
    string (`-'1'`, `~'3'`, `+'1'`) is no longer constant-folded to the
    wrong value (`NaN`, `-1` and the string `"1"`). The expression is
    emitted as written for the runtime to evaluate, as TypeScript does.

## 0.8.0

### Minor Changes

- 426fdd4: Warn about oxc’s own non-fatal diagnostics

    The plugin now prints the non-fatal diagnostics oxc returns as warnings
    in your build or dev server output, with oxc’s code frame and position,
    and the build continues. Prepares us to support the `reportDiagnostics`
    compiler option.

- 3d1c7aa: Report the compiler’s recoverable diagnostics as build warnings
  with `compiler: { reportDiagnostics: true }`

    React Compiler silently leaves a function uncompiled when it bails out
    (a ref read during render, a conditional hook, a react-hooks lint
    suppression). With this option turned on, the plugin now prints each of
    those diagnostics as a warning in your build or dev server output, with
    the compiler’s code frame and its position in the file, so you can see
    what was skipped and why. The build continues, and bail-outs stay
    silent unless you set the option.

## 0.7.0

### Minor Changes

- a95aa9d: Bump oxc-transform-react to 0.153.0

    The oxc parser is stricter about invalid input that previous versions
    accepted and compiled anyway. It now rejects:

    - modifiers on a TypeScript import alias (`declare`, `public`,
      `abstract`, `static`, and so on before `import a = b.c`), which were
      ignored
    - TypeScript-only class modifiers in JavaScript files (`public`,
      `readonly`, `declare`, and so on before a class member), which were
      printed back out, a syntax error for everything downstream
    - type members with no separator between them
      (`interface Props { label: string onClick(): void }`), which compiled
      with the type silently erased

    TypeScript and Babel reject all three.

    Two other changes follow TypeScript or Babel more closely.
    `abstract async` methods are now rejected, which TypeScript does (Babel
    accepts them), and tuple types with a rest element after another rest
    element, or an optional element after a rest element, now compile; only
    TypeScript’s type checker reports those, and Babel accepts them.

## 0.6.0

### Minor Changes

- b48897a: Bump oxc-transform-react to 0.149.0

    The React Compiler port itself is unchanged, but the shared oxc parser
    and codegen crates fix three silent miscompiles that showed up in the
    plugin’s output: a private-in expression used as a binary operand lost
    its parentheses (`#x in v + 1`), a string-literal import specifier
    bound to a matching local name was printed as invalid syntax
    (`import { "foo" }`), and hex/binary/octal literals beyond 2^53 were
    rounded incorrectly. Two inputs that previously compiled silently are
    now parse errors, matching Babel: a labeled `break`/`continue` inside
    an arrow function (the compiler used to hoist the closure with the jump
    dropped) and `export { a } from;`.

- 15e5466: Bump oxc-transform-react to 0.150.0

    The oxc codegen crate fixes a silent miscompile in the plugin’s output:
    a private-in expression’s relational right operand lost its required
    parentheses, printing `#x in a instanceof b` instead of
    `#x in (a instanceof b)`. Left-associativity then parses that as
    `(#x in a) instanceof b`, changing which value the private-field check
    runs against.

## 0.5.0

### Minor Changes

- 502fb7a: Bump oxc-transform-react to 0.148.0 (no behavior changes)

## 0.4.0

### Minor Changes

- cfb7b2ab: Bump oxc-transform-react to 0.147.0 (no behavior changes)

## 0.3.0

### Major Changes

- 6675992: Rename the `reactCompiler` option to `compiler`, matching the
  option name `@vitejs/plugin-react@6.1.0` uses for its own native React
  Compiler support. Update `reactCompiler: {...}` to `compiler: {...}` in
  your plugin config.

## 0.2.0

### Patch Changes

- f9ff279: Bump oxc-transform-react to 0.145.0

    Fixes a React Compiler bailout on reassigning a destructured prop that
    a nested closure also captures (the compiler previously bailed out in
    it with `Todo: Support destructuring of context variables` and
    `Immutability: This value cannot be modified`). Also adopts
    oxc-transform-react’s default `node_modules` filter (a substring match)
    instead of enforcing our own `node_modules` exclusion logic.

## 0.1.0

### Minor Changes

- c11f19b: Initial release of @acusti/vite-plugin-react-compiler, a Vite
  plugin that runs React Compiler via oxc-transform-react (the native Node
  bindings for the oxc project’s Rust port of the compiler) as a drop-in
  alternative to the Babel-based build path. The plugin runs the compiler
  pass in a `transform` hook with `enforce: 'pre'` and `jsx: 'preserve'`,
  so Vite’s own oxc pipeline stays in charge of JSX/refresh/TypeScript
  handling downstream, and memoizes transform results by module id +
  content hash so multi-environment builds only compile each file once.
  Fatal compiler errors (parse failures, rejected options) fail the build
  like a Babel syntax error would. The plugin depends on an exact, tested
  version of oxc-transform-react — the bindings track React Compiler main
  on a fast-moving 0.x release train, so updates ship as regular plugin
  releases after passing this repo’s test suite.
