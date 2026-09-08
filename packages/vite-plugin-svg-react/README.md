# @acusti/vite-plugin-svg-react

[![Open on npmx.dev](https://npmx.dev/api/registry/badge/version/@acusti/vite-plugin-svg-react)](https://npmx.dev/package/@acusti/vite-plugin-svg-react)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/size/@acusti/vite-plugin-svg-react)](https://npmx.dev/package/@acusti/vite-plugin-svg-react)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/dependencies/@acusti/vite-plugin-svg-react)](https://npmx.dev/package/@acusti/vite-plugin-svg-react)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/downloads-month/@acusti/vite-plugin-svg-react)](https://npmx.dev/package/@acusti/vite-plugin-svg-react)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/updated/@acusti/vite-plugin-svg-react)](https://npmx.dev/package/@acusti/vite-plugin-svg-react)

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
- **Seven SVGR conversion bugs fixed:** CDATA sections are preserved rather
  than dropped; `px` style values stay strings (SVGR’s px-stripping
  corrupted React-unitless properties, turning `line-height: 20px` into a
  multiplier of 20); semicolons inside `url(…)` and inside CSS comments no
  longer truncate a style value, and the comments themselves are removed
  rather than left in as invalid CSS; attribute values containing double
  quotes no longer emit invalid JSX; whitespace between the children of a
  text-content element survives, so `<tspan>A</tspan> <tspan>B</tspan>`
  still renders “A B” rather than “AB”; and attribute values become numbers
  only when that round-trips, so `id="001"` stays `001` rather than turning
  into `1` and breaking the `<use href="#001">` pointing at it.

[SVGO][]-style optimization is available as an opt-in: the `optimize`
option below runs each SVG through [OXVG][] — the Rust, SVGO-compatible SVG
toolchain — ahead of component generation. Its dependency is optional, so
the default install stays dependency-free.

[svgo]: https://github.com/svg/svgo
[oxvg]: https://github.com/noahbald/oxvg

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

The plugin takes an optional options object with two properties:
`optimize`, documented below, and `svg`, which shapes the generated `<svg>`
element. `svg` supports a deliberately small subset of the [SVGR
options][svgr options], with the same names and semantics:

```ts
svgReact({
    svg: {
        icon: true,
        svgProps: { role: 'img' },
    },
});
```

- `dimensions: false` removes `width`/`height` from the root `<svg>`, and
  wins over `icon` if you set both
- `icon` sets `width`/`height` to `1em` (`true`) or to the value you pass,
  and does nothing alongside `dimensions: false`
- `svgProps` adds extra props to the root `<svg>` (string values, or
  `{expression}` strings inserted verbatim)

#### `optimize`

Off by default. Set `optimize: true` to run each SVG through OXVG before
it’s converted to a component:

```
npm install --save-dev @oxvg/napi
```

```ts
svgReact({ optimize: true });
```

`@oxvg/napi` is an optional peer dependency: install it to use `optimize`,
and the plugin stays dependency-free if you don’t. Optimization runs on the
raw SVG source, so the rest of the pipeline is unchanged by it.

The default preset we pass is OXVG’s default preset with `cleanupIds`
dropped. That preset already leaves `viewBox` alone (unlike SVGO’s
`preset-default`), and nothing it runs renames an id or a class.

`cleanupIds` minifies ids and removes unreferenced ones, which is a rename
the optimizer can’t verify: anything pointing at an id from outside the
file — your app’s CSS, `getElementById`, an `aria-labelledby` — breaks
silently. It’s also what makes inlined components collide, since every
file’s ids collapse to the same `a` and `b`, and then an internal
`<use href="#a">` or `fill="url(#a)"` resolves against whichever component
rendered first. `@svgr/plugin-svgo` works around that by adding `prefixIds`
on top, which renames the ids a second time and renames class names with
them; this plugin defaults to not renaming either, so ids stay exactly as
unique as you made them, the way inline SVG written by hand already
behaves.

If you want the smaller output and none of your ids are referenced from
outside their file, pass OXVG’s default preset as it ships and get
`cleanupIds` back:

```ts
import { extend } from '@oxvg/napi';

svgReact({ optimize: extend({ type: 'Default' }) });
```

Passing an object hands it to OXVG’s `optimise` as-is. An OXVG config is
the complete list of the optimizations to run, not a set of overrides on
top of a preset, so this one runs a single optimization and nothing else:

```ts
svgReact({ optimize: { collapseGroups: { field0: true } } });
```

For the default preset with a change to it, build the config with OXVG’s
own `extend`:

```ts
import { extend } from '@oxvg/napi';

svgReact({
    optimize: extend(
        { type: 'Default' },
        { removeDesc: { removeAny: true } },
    ),
});
```

`extend` only adds, so drop a job by leaving it out of the object you pass:

```ts
import { extend } from '@oxvg/napi';

// the plugin’s own default, minus inlineStyles
const { cleanupIds, inlineStyles, ...optimize } = extend({
    type: 'Default',
});

svgReact({ optimize });
```

The option is typed as a plain object rather than as OXVG’s `Jobs`, so that
this package’s types don’t reference a dependency most installs won’t have.
For a typed config, annotate it where you write it:

```ts
import type { Jobs } from '@oxvg/napi';

svgReact({ optimize: { removeDesc: { removeAny: true } } satisfies Jobs });
```

Two more things about OXVG itself:

1. A job name it doesn’t recognize is ignored silently, which is what
   `satisfies Jobs` above is for.
2. `inlineStyles`, in the default preset, folds a rule from an SVG’s own
   `<style>` element into a `style` attribute and drops the `class` that
   matched it — usually a generated name like `.cls-1`, but if you style by
   class name from your app’s CSS and the SVG carries its own rule for that
   class, leave `inlineStyles` out as above.

#### SVG files the `optimize` option rejects

This plugin’s own parser is deliberately tolerant of markup that real SVG
files contain but XML rejects. OXVG’s parser runs first and isn’t, so
turning `optimize` on narrows what builds. Each case fails loudly, naming
the file and the line, and each still builds with `optimize` off:

- **A doctype whose internal subset declares entities the root element
  references** — how classic Illustrator (10–CS4) wrote its Adobe
  namespaces. OXVG rejects any document with a DTD, so the prolog is
  blanked before it gets there, and the references outlive it:
  `unknown entity reference 'ns_extend'`.
- **An unknown entity name** anywhere, such as the HTML-only `&nbsp;`,
  which XML doesn’t define. Without `optimize` these pass through
  literally; with it, `unknown entity reference 'nbsp'`.
- **A minimized attribute** (`<svg hidden>`), which is legal inline in HTML
  but not in XML. Without `optimize` it reads as `hidden=""`; with it,
  `expected '=' not '>'`.

If you hit one of these, it’s the option and not your file: normalize the
SVG once (`svgo`, or any XML formatter) or don’t use the `optimize` option.

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
- `svgoConfig`: the `optimize` option above, in OXVG’s config vocabulary
  rather than SVGO’s
- `jsxRuntime`, `expandProps`, `titleProp`, `descProp`,
  `replaceAttrValues`, and SVGR’s remaining pipeline options (`plugins`,
  `template`): not supported

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
