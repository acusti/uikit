# @acusti/vite-plugin-svg-react

[![latest version](https://img.shields.io/npm/v/@acusti/vite-plugin-svg-react?style=for-the-badge)](https://www.npmjs.com/package/@acusti/vite-plugin-svg-react)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/vite-plugin-svg-react?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fvite-plugin-svg-react)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/vite-plugin-svg-react?style=for-the-badge)](https://www.npmjs.com/package/@acusti/vite-plugin-svg-react)

A [Vite][] plugin that turns SVG files into typed React components using
[SVGR][]:

```tsx
import Icon from './icon.svg?react';

<Icon className="icon" aria-hidden />;
```

It was extracted from the build tooling of [Outlyne][], where it runs in
production.

[vite]: https://vite.dev
[svgr]: https://react-svgr.com
[outlyne]: https://outlyne.io

## Why Vite ≥ 8 only?

This plugin requires Vite 8 and is rolldown-native, on purpose. The Vite 8
/ [rolldown-vite][] transition left no working SVGR option:
[vite-plugin-svgr][] runs its own esbuild transform to compile the JSX that
SVGR emits, reintroducing esbuild into an otherwise oxc/rolldown pipeline.
This plugin instead compiles the JSX with Vite 8’s exported
`transformWithOxc`, so SVG-to-React conversion is oxc/rolldown end to end:
no esbuild fallback, no version matrix, no compatibility shims for older
Vite versions. If you are on Vite < 8, use vite-plugin-svgr.

[rolldown-vite]: https://vite.dev/guide/rolldown
[vite-plugin-svgr]: https://github.com/pd4d10/vite-plugin-svgr

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

The plugin takes an optional options object with a single property:
`svgrOptions`, which is passed to [@svgr/core’s `transform`][svgr options]
and shallow-merged over the defaults (`exportType: 'default'`,
`jsxRuntime: 'automatic'`, `plugins: [jsx]`, `typescript: true`). Use it to
add [svgo][], change the export type, set default props, and so on:

```ts
svgReact({
    svgrOptions: {
        icon: true,
        svgProps: { role: 'img' },
    },
});
```

Note that the merge is shallow, so if you pass `plugins`, include
`@svgr/plugin-jsx` (and put it last) to keep JSX output working:

```ts
import svgReact from '@acusti/vite-plugin-svg-react';
import jsx from '@svgr/plugin-jsx';
import svgo from '@svgr/plugin-svgo';

svgReact({ svgrOptions: { plugins: [svgo, jsx] } });
```

[svgr options]: https://react-svgr.com/docs/options/
[svgo]: https://github.com/svg/svgo

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
