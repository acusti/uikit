---
'@acusti/vite-plugin-svg-react': minor
---

The object form of `optimize` is now `{ exclude, include, jobs }`, each
optional. `include` and `exclude` narrow which SVGs the pass runs on — a
glob, a RegExp, or an array of either, matched against the path relative to
the vite root with Vite’s `createFilter` semantics — and `jobs` is the OXVG
job list that the 0.3 release took as the option’s value itself. With no
`jobs`, the default preset runs, so
`optimize: { exclude: ['src/illustrations/**'] }` is the full default minus
those files, which still become components from their source as written.
The `true` short form is not affected by this reshaping (what it runs
changed separately; see the entry above). A job list with `cleanupIds` gets
the per-file `prefixIds` unless it brings its own, so a customized preset
stays as collision-safe as the default, and dropping `cleanupIds` keeps ids
as authored.

Breaking: passing an OXVG job list as `optimize` directly now throws with a
message pointing at `jobs`; move it there.
