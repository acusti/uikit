# @acusti/vite-plugin-svg-react

## 0.3.0

### Minor Changes

- 76108a0: Add an opt-in `optimize` option that shrinks each SVG with
  [OXVG](https://github.com/noahbald/oxvg) — the Rust, SVGO-compatible SVG
  toolchain — before it’s converted to a component. This is the replacement
  for the SVGO pass SVGR offered. It’s off by default, and `@oxvg/napi` is
  an optional peer dependency, so nothing changes unless you opt in:

    ```
    npm install --save-dev @oxvg/napi
    ```

    ```ts
    svgReact({ optimize: true });
    ```

    `optimize: true` is the safe setting: it drops comments, metadata and
    editor cruft, and rewrites path data and colors more compactly, but it
    leaves every `id` and `class` exactly as you authored them, so app CSS,
    `getElementById`, and `aria-labelledby` that point into an SVG keep
    working. If you’d rather have the smaller output and don’t reference
    those ids from anywhere else, pass an OXVG config object instead of
    `true`; the README shows how.

    Two things to know before turning it on. Optimization runs on the raw
    SVG source, ahead of everything else, so the `svg` options and the
    components you get out are unaffected. But OXVG parses the file before
    this plugin does and is stricter about XML than this plugin is: an SVG
    with a doctype that declares entities (classic Illustrator 10–CS4 did
    this), an HTML-flavored entity like `&nbsp;`, or a valueless attribute
    (`<svg hidden>`) will now fail the build. Each failure names the file
    and the line, and each file still builds with `optimize` off; the
    README lists all three.

    A missing `@oxvg/napi`, or a config OXVG can’t read, fails when Vite
    resolves your config rather than partway through a build, and the
    message names the option instead of whichever SVG happened to load
    first.

## 0.2.0

### Minor Changes

- 8c08e99: Generate SVG component modules directly instead of delegating to
  SVGR, which drops `@svgr/*` and Babel from the dependency tree: the
  plugin parses the SVG as XML and emits the component as a JSX source
  string for Vite’s `transformWithOxc` to compile. The package now installs
  with zero dependencies (29 fewer packages), and the first `.svg?react`
  import costs single-digit milliseconds instead of the hundreds a Babel
  pipeline needs to warm up. Your components render as they did under SVGR,
  with seven SVGR bugs fixed along the way: CDATA sections are preserved
  rather than dropped; `px` style values stay strings (SVGR’s px-stripping
  corrupted React-unitless properties, turning `line-height: 20px` into a
  multiplier of 20); semicolons inside `url(…)` and inside CSS comments no
  longer truncate a style value, and the comments themselves are removed
  rather than left in as invalid CSS; attribute values containing double
  quotes no longer emit invalid JSX; whitespace between the children of a
  text-content element survives, so `<tspan>A</tspan> <tspan>B</tspan>`
  still renders “A B” rather than “AB”; and attribute values are only
  converted to numbers when that round-trips, so `id="001"` stays `001`
  instead of becoming `1` and breaking the `<use href="#001">` pointing at
  it (`0x10` and `1e5` likewise).

    Migrating: `svgrOptions` is now `svg`, narrowed to the three options
    that shape the generated `<svg>` element — `dimensions`, `icon`, and
    `svgProps` — with their SVGR semantics unchanged.

    ```js
    // before
    svgReact({ svgrOptions: { icon: true } });
    // after
    svgReact({ svg: { icon: true } });
    ```

    Every other option throws at config time now rather than being silently
    ignored, with a message naming the supported set. `ref` is unnecessary
    on React 19, where the props spread already delivers `ref` to the
    `<svg>` DOM node; `memo` becomes a wrapper at the use site;
    `exportType`/`namedExport` are gone, since the module is default-export
    only (matching what `client.d.ts` already typed); and `typescript`,
    `jsxRuntime`, `expandProps`, `titleProp`, `descProp`,
    `replaceAttrValues`, and SVGR’s pipeline options (`plugins`,
    `template`, `svgoConfig`) are unsupported.

    An `svgProps` entry that overrides a root attribute now drops that
    attribute and appends the prop instead of substituting in place — same
    rendered result, no duplicate JSX attribute. And three kinds of
    malformed input that used to produce a component now fail the build
    with a message naming the file: a namespaced element name
    (`<svg:rect>`), which compiled to an element React renders as unknown;
    a root element that isn’t `<svg>`, which made the component’s
    `SVGProps<SVGSVGElement>` signature a lie; and a character reference
    outside XML’s legal range (`&#0;`), which decoded straight into the
    generated module.

## 0.1.0

### Minor Changes

- 64827ae: Initial release of @acusti/vite-plugin-svg-react, a Vite ≥ 8
  (rolldown-native) SVGR plugin extracted from Outlyne’s build tooling.
  `import Icon from './icon.svg?react'` returns a typed React component.
  JSX is compiled with Vite 8’s exported `transformWithOxc` (no esbuild
  fallback), emitting the dev JSX runtime when serving and the production
  runtime when building so the virtual SVG modules stay on the same
  optimized dependency graph as the rest of the app. Ships consumer types
  via `@acusti/vite-plugin-svg-react/client` and supports a `svgrOptions`
  passthrough for @svgr/core configuration.
