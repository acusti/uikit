---
'@acusti/vite-plugin-svg-react': minor
---

Generate SVG component modules directly instead of delegating to SVGR,
which drops `@svgr/*` and Babel from the dependency tree: the plugin parses
the SVG as XML and emits the component as a JSX source string for Vite’s
`transformWithOxc` to compile. The package now installs with zero
dependencies (29 fewer packages), and the first `.svg?react` import costs
single-digit milliseconds instead of the hundreds a Babel pipeline needs to
warm up. Your components render as they did under SVGR, with four SVGR bugs
fixed along the way: CDATA sections are preserved rather than dropped; `px`
style values stay strings (SVGR’s px-stripping corrupted React-unitless
properties, turning `line-height: 20px` into a multiplier of 20);
semicolons inside `url(…)` no longer truncate a style value; and attribute
values containing double quotes no longer emit invalid JSX.

Migrating: `svgrOptions` is now `svg`, narrowed to the three options that
shape the generated `<svg>` element — `dimensions`, `icon`, and `svgProps`
— with their SVGR semantics unchanged.

```js
// before
svgReact({ svgrOptions: { icon: true } });
// after
svgReact({ svg: { icon: true } });
```

Every other option throws at config time now rather than being silently
ignored, with a message naming the supported set. `ref` is unnecessary on
React 19, where the props spread already delivers `ref` to the `<svg>` DOM
node; `memo` becomes a wrapper at the use site; `exportType`/`namedExport`
are gone, since the module is default-export only (matching what
`client.d.ts` already typed); and `typescript`, `jsxRuntime`,
`expandProps`, `titleProp`, `descProp`, `replaceAttrValues`, and SVGR’s
pipeline options (`plugins`, `template`, `svgoConfig`) are unsupported. Two
rendering edge cases also changed: an `svgProps` entry that overrides a
root attribute now drops that attribute and appends the prop instead of
substituting in place (same rendered result, no duplicate JSX attribute),
and namespaced element names (`<svg:rect>`) are a build error instead of
compiling to an element React renders as unknown.
