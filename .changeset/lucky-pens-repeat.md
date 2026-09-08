---
'@acusti/vite-plugin-svg-react': minor
---

Add an opt-in `optimize` option that shrinks each SVG with
[OXVG](https://github.com/noahbald/oxvg) — the Rust, SVGO-compatible SVG
toolchain — before it’s converted to a component. This is the replacement
for the SVGO pass SVGR offered. It’s off by default, and `@oxvg/napi` is an
optional peer dependency, so nothing changes unless you opt in:

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
working. If you’d rather have the smaller output and don’t reference those
ids from anywhere else, pass an OXVG config object instead of `true`; the
README shows how.

Two things to know before turning it on. Optimization runs on the raw SVG
source, ahead of everything else, so the `svg` options and the components
you get out are unaffected. But OXVG parses the file before this plugin
does and is stricter about XML than this plugin is: an SVG with a doctype
that declares entities (classic Illustrator 10–CS4 did this), an
HTML-flavored entity like `&nbsp;`, or a valueless attribute
(`<svg hidden>`) will now fail the build. Each failure names the file and
the line, and each file still builds with `optimize` off; the README lists
all three.

A missing `@oxvg/napi`, or a config OXVG can’t read, fails when Vite
resolves your config rather than partway through a build, and the message
names the option instead of whichever SVG happened to load first.
