# @acusti/vite-plugin-react-compiler

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
