# @acusti/vite-plugin-react-compiler

[![latest version](https://img.shields.io/npm/v/@acusti/vite-plugin-react-compiler?style=for-the-badge)](https://www.npmjs.com/package/@acusti/vite-plugin-react-compiler)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/vite-plugin-react-compiler?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fvite-plugin-react-compiler)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/vite-plugin-react-compiler?style=for-the-badge)](https://www.npmjs.com/package/@acusti/vite-plugin-react-compiler)

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

Vite/Rolldown decided against shipping the Rust React Compiler integration
in Vite core over the binary size it would add, so the official React
Compiler path for Vite remains Babel: @vitejs/plugin-react’s
`reactCompilerPreset` running babel-plugin-react-compiler via
[@rolldown/plugin-babel][]. That works, but it drags a full Babel
parse/transform/print pipeline through every source file of an otherwise
all-native oxc/rolldown build.

This plugin is the published native alternative: a `transform`-hook plugin
that calls [oxc-transform-react][], the Rust React Compiler bindings the
oxc project publishes. The compiler pass runs with `enforce: 'pre'` (the
same position the Babel pass occupies today) and emits JSX untouched
(`jsx: 'preserve'`), so Vite’s own oxc transform stays in charge of
JSX/refresh/TypeScript handling downstream — the plugin only adds the
compiler pass. (oxc-transform-react does strip TypeScript syntax, which
matches how the Babel path uses @babel/preset-typescript.)

[@rolldown/plugin-babel]:
    https://www.npmjs.com/package/@rolldown/plugin-babel

## Usage

```
npm install --save-dev @acusti/vite-plugin-react-compiler oxc-transform-react
# or
yarn add --dev @acusti/vite-plugin-react-compiler oxc-transform-react
# or
pnpm add --save-dev @acusti/vite-plugin-react-compiler oxc-transform-react
# or
bun add --dev @acusti/vite-plugin-react-compiler oxc-transform-react
```

Note that [oxc-transform-react][] is a peer dependency, not a dependency:
it is on a fast-moving 0.x release train tracking React Compiler main, so
you should pin your own exact version of it to make compiler behavior
changes arrive deliberately, on your schedule.

Like [@acusti/vite-plugin-svg-react][], this plugin requires Vite ≥ 8, on
purpose: its reason for existing is completing the all-native oxc/rolldown
pipeline that Vite 8 introduced. On Vite < 8, the Babel-based
`reactCompilerPreset` path is no slower than the rest of the pipeline.

[@acusti/vite-plugin-svg-react]:
    https://www.npmjs.com/package/@acusti/vite-plugin-svg-react

Add the plugin to your vite config (and remove any Babel-based React
Compiler wiring, e.g. `reactCompilerPreset` + @rolldown/plugin-babel):

```ts
// vite.config.ts
import reactCompiler from '@acusti/vite-plugin-react-compiler';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react(), reactCompiler()],
});
```

### Options

The plugin takes an optional options object with four properties:

- **`include`** / **`exclude`**: standard Vite
  [`createFilter`](https://vite.dev/guide/api-plugin#filtering-include-exclude-pattern)
  patterns selecting which modules get the compiler pass. Defaults:
  `include: /\.[jt]sx?$/`, `exclude: /node_modules/`.
- **`reactCompiler`**: options passed verbatim to React Compiler, using the
  same names as [babel-plugin-react-compiler][compiler options]:
  `compilationMode`, `panicThreshold` (defaults to `'none'`), `target`
  (defaults to `'19'`), `environment` flags like
  `enableTreatRefLikeIdentifiersAsRefs`, and so on. Callback-valued options
  (e.g. `logger`, function-valued `sources`) don’t cross the native
  boundary and aren’t supported; `sources` accepts an array of filename
  substrings instead.
- **`memoize`**: cache transform results per module id, keyed by a content
  hash (bounded to one entry per file). Multi-environment builds (e.g.
  React Router apps building client + SSR environments) run every transform
  once per environment; the cache makes the repeat passes free. Defaults to
  `true`.

```ts
reactCompiler({
    exclude: [/node_modules/, /\.stories\./],
    reactCompiler: {
        environment: { enableTreatRefLikeIdentifiersAsRefs: true },
    },
});
```

If the compiler reports a fatal error (a parse failure or rejected
options), the plugin fails the build via `this.error(...)`, just like a
Babel syntax error would. Nonfatal compiler bail-outs behave as they do
with the Babel plugin under `panicThreshold: 'none'`: the affected function
is left uncompiled and the build continues.

[compiler options]:
    https://react.dev/reference/react-compiler/configuration

## Caveats, and results from production

The Rust port of React Compiler and the oxc-transform-react bindings are
experimental and explicitly labeled as such upstream. Measure and verify
against the Babel plugin before trusting it (the `__COMPILER_RUNTIME.c`
memo cache calls in output are easy to diff).

Verified results from the production Vite 8 + React Router app this plugin
was extracted from, compared against babel-plugin-react-compiler@1.0.0
across 987 source files:

- **Full memoization parity with zero regressions** — every function the
  Babel plugin compiles, the Rust port compiles. It compiles a strict
  superset, since the Rust port tracks React Compiler main rather than the
  latest stable release.
- **The compiler pass is ~16x faster** than the Babel pass.
- **The full production build is ~2.5x faster** (53s → 21s).
