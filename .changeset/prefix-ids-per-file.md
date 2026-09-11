---
'@acusti/vite-plugin-svg-react': minor
---

`optimize: true` now runs OXVG’s full default preset, `cleanupIds`
included, and prefixes each file’s ids with a prefix derived from the file:
its base name, a `-`, and a 4-character hash of its path relative to the
vite root, with `_` between the prefix and the id (`arrow-3f2a_a`). Ids
come out minified, and unique across components inlined on one page, where
0.3.0 left them untouched to avoid the collisions `cleanupIds` alone
causes. Class names still aren’t renamed.

The cost is that an id referenced only from outside its file (app CSS,
`getElementById`, an `aria-labelledby` elsewhere) is unreferenced as far as
`cleanupIds` can tell, and is removed. To keep ids as authored, pass the
default preset minus `cleanupIds` as a config object; the README shows how.

For a job list of your own, a `prefixIds` prefix of `{ type: 'Default' }`
is now resolved to the same per-file prefix rather than reaching OXVG as
the literal `prefix`; an explicit prefix or `{ type: 'None' }` is passed
through unchanged.
