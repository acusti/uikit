# @acusti/vite-plugin-react-compiler

[![Open on npmx.dev](https://npmx.dev/api/registry/badge/version/@acusti/vite-plugin-react-compiler)](https://npmx.dev/package/@acusti/vite-plugin-react-compiler)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/size/@acusti/vite-plugin-react-compiler)](https://npmx.dev/package/@acusti/vite-plugin-react-compiler)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/dependencies/@acusti/vite-plugin-react-compiler)](https://npmx.dev/package/@acusti/vite-plugin-react-compiler)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/downloads-month/@acusti/vite-plugin-react-compiler)](https://npmx.dev/package/@acusti/vite-plugin-react-compiler)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/updated/@acusti/vite-plugin-react-compiler)](https://npmx.dev/package/@acusti/vite-plugin-react-compiler)

A [Vite][] plugin that runs [React Compiler][] via [oxc-transform-react][],
the native Node bindings for the oxc project’s Rust port of the compiler —
a drop-in alternative to the Babel-based React Compiler build path.

It was extracted from the build tooling of [Outlyne][], where it runs in
production.

[vite]: https://vite.dev
[react compiler]: https://react.dev/learn/react-compiler
[oxc-transform-react]: https://www.npmjs.com/package/oxc-transform-react
[outlyne]: https://outlyne.io

## Why this exists

Vite ships a native React Compiler integration now: as of
`@vitejs/plugin-react` 6.1, passing `compiler: true` runs
[oxc-transform-react][] — the same Rust bindings this plugin uses — instead
of Babel. For a plain Vite + React app, that flag is the whole story; this
plugin has nothing to add.

The catch is that `compiler: true` is an option of `@vitejs/plugin-react`
itself, and plenty of setups don’t run that plugin. React Router in
framework mode is the common case: it runs `@react-router/dev/vite` in
place of `@vitejs/plugin-react`, which means no `compiler: true`, and no
`reactCompilerPreset` Babel fallback either, since that’s
`@vitejs/plugin-react`’s too. Swap in a different React/JSX plugin and
native React Compiler support goes with it.

This plugin is the compiler pass, decoupled from `@vitejs/plugin-react` so
it can run under any of them: a `transform`-hook plugin that calls
oxc-transform-react directly, with `enforce: 'pre'` (the position
`@vitejs/plugin-react`’s own native pass occupies) and emits JSX untouched
(`jsx: 'preserve'`), so whatever plugin is handling JSX/refresh downstream
stays in charge of that. (oxc-transform-react strips TypeScript syntax
itself, matching how the Babel path uses @babel/preset-typescript.)

## Usage

```
npm install --save-dev @acusti/vite-plugin-react-compiler
# or
yarn add --dev @acusti/vite-plugin-react-compiler
# or
pnpm add --save-dev @acusti/vite-plugin-react-compiler
# or
bun add --dev @acusti/vite-plugin-react-compiler
```

The plugin depends on an exact, tested version of [oxc-transform-react][]:
the bindings are on a fast-moving 0.x release train tracking React Compiler
main, and new bindings releases are close to 100% bug fixes (the Rust port
chases parity with the existing widely-used Babel plugin), so the plugin
pins the newest version that passes this repo’s test suite and ships it in
regular plugin releases. If you need a different version, use your package
manager’s `overrides` (npm, pnpm, bun) or `resolutions` (yarn) to force it.

Like [@acusti/vite-plugin-svg-react][], this plugin requires Vite ≥ 8: it
plugs into the native oxc/rolldown transform pipeline that Vite 8
introduced, and doesn’t work without it.

[@acusti/vite-plugin-svg-react]:
    https://www.npmjs.com/package/@acusti/vite-plugin-svg-react

Add the plugin to your vite config alongside your other Vite plugins:

```ts
// vite.config.ts
import { reactRouter } from '@react-router/dev/vite';
import reactCompiler from '@acusti/vite-plugin-react-compiler';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [reactRouter(), reactCompiler()],
});
```

### Options

The plugin takes an optional options object with four properties:

- **`include`** / **`exclude`**: standard Vite
  [`createFilter`](https://vite.dev/guide/api-plugin#filtering-include-exclude-pattern)
  patterns selecting which modules get the compiler pass. Defaults:
  `include: /\.[jt]sx?$/`, `exclude: /[/\\]node_modules[/\\]/`.
- **`compiler`**: options passed verbatim to React Compiler, using the same
  names as [babel-plugin-react-compiler][compiler options]:
  `compilationMode`, `panicThreshold` (defaults to `'none'`), `target`
  (defaults to `'19'`), `environment` flags like
  `enableTreatRefLikeIdentifiersAsRefs`, and so on. Callback-valued options
  (e.g. `logger`, function-valued `sources`) don’t cross the native
  boundary and aren’t supported; `sources` accepts an array of filename
  substrings instead, and `reportDiagnostics` (below) covers the common use
  of `logger`, seeing what the compiler skipped.
- **`memoize`**: cache transform results per module id, keyed by a content
  hash (bounded to one entry per file). Multi-environment builds (e.g.
  React Router apps building client + SSR environments) run every transform
  once per environment; the cache makes the repeat passes free. Defaults to
  `true`.

```ts
reactCompiler({
    exclude: [/node_modules/, /\.stories\./],
    compiler: {
        environment: { enableTreatRefLikeIdentifiersAsRefs: true },
    },
});
```

If the compiler reports a fatal error (a parse failure, rejected options,
or a diagnostic escalated by `panicThreshold`), the plugin fails the build
via `this.error(...)`, just like a Babel syntax error would. Nonfatal
compiler bail-outs behave as they do with the Babel plugin under
`panicThreshold: 'none'`: the affected function is left uncompiled and the
build continues.

Those bail-outs are silent by default. To see what the compiler skipped and
why, set `compiler: { reportDiagnostics: true }`: each recoverable
diagnostic (a bail-out, or a react-hooks lint suppression that opts a
function out) is printed as a warning in your build or dev server output,
with the compiler’s code frame and its position in the file, and the build
continues.

```ts
reactCompiler({ compiler: { reportDiagnostics: true } });
```

With `memoize` on, a file’s diagnostics are reported once per distinct
content, not once per environment. With `panicThreshold` set to
`'critical_errors'` or `'all_errors'`, the diagnostic that escalates fails
the build through `this.error(...)` as described above instead of warning.

Like React Compiler main, and unlike babel-plugin-react-compiler@1.0.0, the
compiler also skips a component or hook whose `useMemo` or `useCallback`
dependency list is missing a dependency or lists an extra one, so its
memoization updates exactly as written. With `reportDiagnostics` on, each
one is reported as “Found missing memoization dependencies” or “Found extra
memoization dependencies”; with `panicThreshold` set to `'critical_errors'`
or `'all_errors'`, that diagnostic fails the build. To compile those
components with the dependencies the compiler infers instead, as the Babel
plugin does, turn the check off:

```ts
reactCompiler({
    compiler: {
        environment: { validateExhaustiveMemoizationDependencies: false },
    },
});
```

[compiler options]:
    https://react.dev/reference/react-compiler/configuration

## Caveats, and results from production

The Rust port of React Compiler and the oxc-transform-react bindings are
experimental and explicitly labeled as such upstream. Measure and verify
against the Babel plugin before trusting it (the `__COMPILER_RUNTIME.c`
memo cache calls in output are easy to diff).

Because the Rust port tracks React Compiler main rather than the 1.0.0
release, it differs from babel-plugin-react-compiler@1.0.0 in both
directions: it compiles some code the Babel plugin bails on (computed
object keys, try/catch value blocks), and it skips components and hooks
whose manual memoization has missing or extra dependencies, which the Babel
plugin compiles (see [Options](#options)). Alongside the plugin’s own
tests, this repo runs an upstream-tracking suite against the pinned
bindings version: it pins both kinds of divergence, pins Babel-parity fixes
as they land (react-hooks lint suppressions opt functions out of
compilation since 0.144.0), and tracks known upstream gaps as they arise,
re-verified on every bindings bump before it ships in a plugin release.

Measured at launch, on oxc-transform-react 0.142.0, in the production Vite
8 + React Router app this plugin was extracted from, against
babel-plugin-react-compiler@1.0.0 across 987 source files:

- **Full memoization parity with zero regressions** — every function the
  Babel plugin compiled, the Rust port compiled too, and it compiled a
  strict superset.
- **The compiler pass was ~16x faster** than the Babel pass.
- **The full production build was ~2.5x faster** (53s → 21s).
