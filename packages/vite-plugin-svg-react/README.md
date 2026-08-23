# @acusti/vite-plugin-svg-react

[![latest version](https://img.shields.io/npm/v/@acusti/vite-plugin-svg-react?style=for-the-badge)](https://www.npmjs.com/package/@acusti/vite-plugin-svg-react)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/vite-plugin-svg-react?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fvite-plugin-svg-react)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/vite-plugin-svg-react?style=for-the-badge)](https://www.npmjs.com/package/@acusti/vite-plugin-svg-react)

A [Vite][] plugin that turns SVG files into typed React components:

```tsx
import Icon from './icon.svg?react';

<Icon className="icon" aria-hidden />;
```

It was extracted from the build tooling of [Outlyne][], where it runs in
production.

[vite]: https://vite.dev
[outlyne]: https://outlyne.io

## Why Vite ≥ 8 only?

This plugin requires Vite 8 and is rolldown-native, on purpose. The Vite 8
/ [rolldown-vite][] transition left no working [SVGR][] option:
[vite-plugin-svgr][] runs its own esbuild transform to compile the JSX that
SVGR emits, reintroducing esbuild into an otherwise oxc/rolldown pipeline.
This plugin instead generates each component module directly and compiles
it with Vite 8’s exported `transformWithOxc`, so SVG-to-React conversion is
oxc/rolldown end to end: no esbuild fallback, no version matrix, no
compatibility shims for older Vite versions. If you are on Vite < 8, use
[vite-plugin-svgr][].

[rolldown-vite]: https://vite.dev/guide/rolldown
[svgr]: https://react-svgr.com
[vite-plugin-svgr]: https://github.com/pd4d10/vite-plugin-svgr

## Babel-free (and dependency-free)

The plugin converts SVG to a React component module itself — parsing the
SVG as XML and emitting the component as JSX source — instead of delegating
to SVGR, which parses and re-prints the module through Babel. Attribute
conversion matches what SVGR produced (kebab-case presentation attributes
to camelCase, `class` → `className`, `xlink:*`/`xml:*` to their React prop
names, `data-*`/`aria-*` passed through, `style` strings to style objects),
so the rendered components are the same, apart from the SVGR bugs fixed
below. What consumers get out of it:

- **Zero dependencies:** no `@svgr/*` and no `@babel/*` in the dependency
  tree, which removes dozens of packages from a typical install.
- **Fast cold transforms:** emitting the module as a string takes
  microseconds, and compiling it with oxc takes about a millisecond, so the
  first `.svg?react` import costs single-digit milliseconds instead of the
  hundreds of milliseconds it takes to load and warm up a Babel pipeline.
- **Four SVGR conversion bugs fixed:** CDATA sections are preserved rather
  than dropped; `px` style values stay strings (SVGR’s px-stripping
  corrupted React-unitless properties, turning `line-height: 20px` into a
  multiplier of 20); semicolons inside `url(…)` no longer truncate a style
  value; and attribute values containing double quotes no longer emit
  invalid JSX.

One thing SVGR could do that this plugin doesn’t: run [SVGO][] optimization
via `@svgr/plugin-svgo`. Optimizing SVGs is a build concern you can handle
before they reach the bundler (e.g. `svgo --folder`).

### Future work

An optional pre-optimization pass built on [OXVG][] — the Rust,
SVGO-compatible SVG toolchain — would fit the plugin’s all-native pipeline
and could slot in ahead of component generation without reintroducing a JS
compiler. If you want it, add your 👍 to [this issue][oxvg issue].

[svgo]: https://github.com/svg/svgo
[oxvg]: https://github.com/noahbald/oxvg
[oxvg issue]: https://github.com/acusti/uikit/issues/422

## Usage

```
npm install --save-dev @acusti/vite-plugin-svg-react
# or
yarn add --dev @acusti/vite-plugin-svg-react
```

Add the plugin to your vite config:

```ts
// vite.config.ts
import svgReact from '@acusti/vite-plugin-svg-react';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [svgReact()],
});
```

Then import SVG files with the `?react` query suffix to get a React
component. The default export is a component that spreads its props onto
the root `<svg>` element:

```tsx
import Logo from './logo.svg?react';

export function Header() {
    return <Logo width={32} height={32} role="img" />;
}
```

Note that react isn’t a dependency or peer dependency of this package: the
emitted components import `react/jsx-runtime` (or `react/jsx-dev-runtime`
in dev), which your app provides.

### TypeScript

The package ships a `client.d.ts` that types `*.svg?react` imports as
`React.FC<React.SVGProps<SVGSVGElement>>`. Wire it up either via the
`types` field in your tsconfig:

```json
{
    "compilerOptions": {
        "types": ["@acusti/vite-plugin-svg-react/client"]
    }
}
```

Or via a triple-slash directive in a `.d.ts` file that’s included in your
project (e.g. `src/vite-env.d.ts`):

```ts
/// <reference types="@acusti/vite-plugin-svg-react/client" />
```

### Options

The plugin takes an optional options object with a single property: `svg`,
which shapes the generated `<svg>` element. It supports a deliberately
small subset of the [SVGR options][svgr options], with the same names and
semantics (the nesting keeps the top level free for plugin-level options):

```ts
svgReact({
    svg: {
        icon: true,
        svgProps: { role: 'img' },
    },
});
```

- `dimensions: false` removes `width`/`height` from the root `<svg>`
- `icon` sets `width`/`height` to `1em` (`true`) or to the value you pass
- `svgProps` adds extra props to the root `<svg>` (string values, or
  `{expression}` strings inserted verbatim)

The module wrapper is fixed: a typed component that spreads its props onto
the root `<svg>`, exported as the default export. Any other option throws
at config time — rejecting unknown options loudly beats silently generating
components that don’t match your configuration. That includes the SVGR
options this plugin deliberately doesn’t carry, most of which have direct
replacements:

- `ref`: unnecessary on React 19, where `ref` is a regular prop — the props
  spread already delivers it to the `<svg>` DOM node
- `memo`: wrap at the use site (`memo(Icon)`)
- `exportType`/`namedExport`: the default export is the only export, which
  is also the only shape `client.d.ts` types
- `typescript`: the emitted module is compiled immediately, so this had no
  observable effect
- `jsxRuntime`, `expandProps`, `titleProp`, `descProp`,
  `replaceAttrValues`, and SVGR’s pipeline options (`plugins`, `template`,
  `svgoConfig`): not supported

Migrating from vite-plugin-svgr (or from this plugin’s svgr-based 0.1
release): the old `svgrOptions` key throws with a message pointing here —
move `icon`, `svgProps`, and `dimensions` under `svg` and drop the rest.

[svgr options]: https://react-svgr.com/docs/options/

## Why the dev JSX runtime in dev matters

When serving (`vite dev`), the plugin compiles JSX against
`react/jsx-dev-runtime`; when building, against `react/jsx-runtime`. This
matches what Vite’s main transform pipeline does for your app’s own
components, it isn’t configurable, and it’s the plugin’s hard-won
correctness feature.

Here’s why: Vite’s dependency scanner treats `.svg` imports as assets and
never crawls the virtual modules this plugin creates. If your app imports
React only via JSX, the scanner discovers `react/jsx-dev-runtime` from your
components at startup — but nothing else imports `react/jsx-runtime` in
dev. If the SVG components were compiled against the production runtime,
`react/jsx-runtime` would be a dependency that only these uncrawlable
virtual modules import, so on a cold optimizer cache it gets discovered
mid-first-request, forcing a re-optimization while the first request is in
flight.

In SSR environments (e.g. [@cloudflare/vite-plugin][]’s workerd runtime),
that mid-request re-optimization bumps the `?v=` hash of every optimized
chunk under the in-flight render, splitting React into two module
instances, which fails with errors like
`Cannot read properties of null (reading 'useContext')` — a 500 on the
first cold request. Emitting the dev runtime in dev keeps these modules on
the same optimized dependency graph as the rest of your app, so they never
trigger that path.

As defense in depth, SSR users can additionally pin the React family in
their server environment’s optimizeDeps so the optimizer never discovers
anything React-related late:

```ts
environments: {
    ssr: {
        optimizeDeps: {
            include: [
                'react',
                'react/jsx-runtime',
                'react/jsx-dev-runtime',
                'react-dom/server',
            ],
        },
    },
},
```

[@cloudflare/vite-plugin]:
    https://github.com/cloudflare/workers-sdk/tree/main/packages/vite-plugin-cloudflare

## FAQ

### Why `?react` and not import attributes (`with { type: 'react' }`)?

Three reasons:

1. **TypeScript types modules by their specifier string**, so
   `declare module '*.svg?react'` gives every `?react` import the right
   component type. Import attributes are invisible to the type system:
   there’s no way to say “`*.svg` imported with `type: 'react'` is a
   component, but plain `*.svg` is a URL string.”
2. **Hosts are spec-required to throw on unknown attribute types**, and
   Vite’s dev server serves your modules as near-native ESM, rewriting only
   the specifiers. A custom import attribute would reach the browser intact
   and hard-fail there.
3. **Query suffixes are Vite’s own blessed convention** for import
   transforms (`?url`, `?raw`, `?inline`), so `?react` behaves like the
   rest of the ecosystem and composes with Vite’s asset handling.
