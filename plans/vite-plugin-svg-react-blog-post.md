# The story behind `@acusti/vite-plugin-svg-react`

> Working notes / blog raw material. The actual outline below was drafted
> 2026-07-0X in the claude.ai/code cloud session **"Fix dual-React SSR
> error on cold-cache dev first load"**
> (`claude.ai/code/session_01RHCmxt1eC6fWn99rN8kExL`), spawned as
> background task `task_3f228eed` from the "PR 1741 copilot review
> comments" session. That session fixed the SSR heisenbug, then discussed
> and produced the outline verbatim below, then migrated outlyne onto the
> published `v0.1.0` package (PR #1859, merged). This file replaces an
> earlier reconstruction-from-the-extraction-session version — this is the
> real thing.

## Status

- `@acusti/vite-plugin-svg-react` v0.1.0 published; outlyne migrated onto
  it in PR #1859 (merged). Remaining gate before tagging v1: verify in
  prod, plus the pre-v1 package-hardening checklist below.
- **2026-08-16: v4 rework on branch `svg-react/drop-svgr-babel`** (commit
  `3285c7f`, pending review): the plugin now generates component modules
  directly and drops `@svgr/*` — and with it Babel — entirely. See "v4 —
  dropping svgr" below; it changes the post's framing in a few places.
- **This is set up as two posts.** Post 1 (outlined in full below) is the
  "four scars" origin/design story. Post 2 (not yet outlined) is the deep
  debugging story of the v3 heisenbug specifically — post 1 deliberately
  keeps that era to two paragraphs and teases post 2 rather than spending
  the material twice.

## The organizing principle (the actual question asked and answered)

Prompt that produced this: _"that timeline seems like a natural structure
for the contents of the blog post, like a natural organizing structure. Do
you agree? Are there other changes I should make to make it more
compelling?"_

**Answer: yes, with one amendment.** Pure chronology has a failure mode: a
reader with search intent ("how do I do SVGs in Vite 8") hits 800 words of
history before the answer. The fix is a **hybrid** — answer first (skimmer-
complete in the first screen: install, usage, types), then the chronology
as the body. The history has genuine narrative escalation (build breakage →
test flakiness → environment migration → heisenbug), and each break maps
cleanly onto a design decision the package now encodes: **setup → break →
fix → lesson, four times, with rising stakes.** The honest history _is_ the
best argument for the product — better than "here's a 40-line gist,"
because the gist is v1, and this post is the obituary for v1.

Other structural decisions made along the way:

- **Structure by plugin version, not by commit.** v0 → v1 → v2 → v3 gives
  readers a mental model; dates are asides, SHAs stay out entirely.
- **Open each era with the verbatim failure.** Real error strings are both
  dramatically effective and search magnets (someone googling
  `Cannot read properties of null (reading 'useContext')` should land on
  this post).
- **Show the code shrinking/reshaping** — v1's `.tsx`-suffix hack vs. v2's
  proper virtual module is the best virtual-modules tutorial content in the
  post, disguised as a story beat.
- **End each era with a one-line boxed lesson.** The four lessons,
  collected, become the closing section and the whole "why not just copy a
  gist" case.
- **Keep v3 (the dual-React bug) on a leash** — two paragraphs max, tease
  post 2. It's the climax here but post 2's whole plot; don't spend it
  twice.
- **Resist a fifth section about the future** (import-attributes support,
  RSC, etc.) — the shape is "four scars, four lessons, shipped";
  speculation dilutes the ending.

## The four gotchas (mined from git history, each maps to a design decision)

1. **v0 → v1 break: `vite-plugin-svgr` under Rolldown** (commit
   `667e716df`, "Replace vite-plugin-svgr → new svgr-react-plugin"). Was on
   `vite: npm:rolldown-vite@latest` (pre-Vite-8-stable) with
   `vite-plugin-svgr@4.3.0`; it broke the hosting workspace's build — its
   own esbuild transform is a second parser with its own config surface,
   drifting from the real pipeline. Side wins: dropped a large transitive
   dep tree, replaced a manually-added
   `/// <reference types="vite-plugin-svgr/client" />` with a self-owned
   5-line `svg-react.d.ts`. **Lesson 1: on Rolldown, the transform must be
   oxc or it's a liability.**
2. **v1 win worth its own subsection: delete your SVG mocks** (commit
   `fc34bb82d`, "Render real SVGs in tests instead of mocking"). Per-file
   `vi.mock('*.svg?react')` stubs clobbered each other in the shared module
   registry under `isolate: false` — same icon, different stubs, cross-file
   contamination. Fix: run the real plugin under Vitest, assert on actual
   rendered `<svg>`. Most SVG plugins never mention test behavior — this is
   a genuine differentiator. **Lesson 2: run the real transform everywhere,
   including tests.**
3. **v1 → v2 break: the `.tsx`-suffix hack dies under
   `@cloudflare/vite-plugin`** (commit `9797608d1`, Feb 2026). v1 had no
   virtual module: `resolveId` appended `.tsx` to the real id
   (`icon.svg?react.tsx`) so Vite's own pipeline compiled the svgr output
   by extension-sniffing. Clever, minimal — and a fake path to a file that
   doesn't exist on disk doesn't survive stricter (workerd) environments.
   v2 rewrite: proper `\0` virtual-module prefix, self-contained
   `transformWithOxc` compile, forwarding the options bag through
   `this.resolve` (v1 silently dropped it), real sourcemap instead of
   `map: null`. **Lesson 3: don't fake file paths — mint a virtual module
   and own your whole transform.**
4. **v2 → v3 break: the heisenbug** (this week, relative to the session).
   Already fully documented in the session and in this repo's own
   `notes/react-compiler-rust-oxlint-investigation.md`-style detail — the
   dep scanner never looks inside virtual modules, so the production JSX
   runtime import was invisible to it until a cold-cache first request
   triggered a mid-render re-optimization, splitting React into two
   instances. Fix: emit `jsx-dev-runtime` in dev, matching the main
   pipeline, as a non-configurable default. **Lesson 4: virtual modules are
   invisible to the dep scanner; never let them be the only importer of
   anything.**

Plus the sharing arc as the package's origin story in miniature: commit
`8fe7eb3da` centralized plugin loading into an exported
`importVitePlugins()` specifically so the hosting workspace could reuse it
— two workspaces importing a plugin across package boundaries from
`../main/vite.config.ts` is "a package with commitment issues." Extraction
just finished the thought.

## v4 — dropping svgr (and with it, Babel) — added 2026-08-16

Branch `svg-react/drop-svgr-babel` (commit `3285c7f`, pending review)
reworks the package to emit each component module directly as a string — a
minimal hand-rolled XML parser, the React prop-name mapping tables
extracted from `@svgr/hast-util-to-babel-ast`, and a template-string
emitter — with the JSX still compiled by Vite's `transformWithOxc`. No
`@svgr/*`, no `@babel/*`, zero runtime dependencies. Unlike the four
gotchas, this era didn't open with a failure: svgr worked. It was just
carrying a full Babel parse-and-reprint pipeline to do what is, for
SVG→JSX, a string-to-string conversion with a lookup table.

Raw material worth keeping:

- **Fidelity was verified against svgr itself before deleting it.** Probe
  scripts captured `@svgr/core`'s output for the plugin's defaults and
  every supported option; the new emitter matches byte-for-byte on that
  corpus (modulo quote style). The mapping tables were extracted
  programmatically from `@svgr/hast-util-to-babel-ast` in node_modules, not
  transcribed by hand.
- **Numbers** (representative 20-element fixture, node 22, load hook end to
  end including the oxc compile): cold per-SVG transform 170–280ms → ~6ms;
  warm 5–10ms → ~1.2ms; plugin import chain 385–420ms (`@svgr/*` + Babel +
  vite) → ~235ms (vite alone). 29 packages left this monorepo's lockfile;
  standalone consumers shed the whole `@babel/*` tree on top of that.
- **One behavior improvement:** CDATA sections are preserved as text —
  svgr's svg-parser silently dropped them, so
  `<style><![CDATA[…]]></style>` came out as `<style />`.
- **The API held still:** same `svgrOptions` key (name kept deliberately
  for compat), same defaults, same semantics for exportType / typescript /
  icon / dimensions / svgProps / ref / memo / expandProps / jsxRuntime.
  Options that configured svgr's own pipeline (`plugins`, `template`,
  `svgoConfig`) are gone; the README points at OXVG (the Rust,
  SVGO-compatible toolchain) as the future optional optimizer.
- **Tests now do what Lesson 2 preaches, one level deeper:** fixture SVGs
  run through the real load hook, the compiled modules are imported and
  rendered under happy-dom, and the assertions are on the DOM, not on
  emitted strings.

### What v4 does to the post plan

- The subhead's "a tiny SVGR plugin" and the SVGR leg of the taxonomy need
  retouching: it's now "SVGR-compatible, without SVGR" — arguably a
  stronger hook for the search query the post owns. "70 lines" is stale too
  (~600 including the mapping tables, still zero dependencies).
- This is **not a fifth scar** — no verbatim error string, no break. It
  slots into section 6 (the extraction / ending) as the final beat: the
  package didn't just leave home, it stopped needing its parent. The
  earlier note to "resist a fifth section about the future" was about
  speculation; this is shipped, so it strengthens the ending instead of
  diluting it.
- Candidate closing lesson if a fifth box is wanted: **the transform was
  never the hard part — SVG→JSX is a lookup table and an escape function,
  not a compiler pipeline.** (Lesson 1 said the compile must be oxc; v4
  says the conversion needs no compiler at all.)

## The full merged outline

**Title:** The best way to render SVGs in React with Vite 8 + Rolldown
**Subhead:** 70 lines, four scars — how a tiny SVGR plugin earned its
shape. (Working title alternative considered: "SVGs as React components in
Vite 8" — keep "Vite 8" and "Rolldown" in the title/slug either way, that's
the search query this post owns.)

1. **The answer first** (first screen, skimmer-complete)
    - `import CheckIcon from './check.svg?react'` → typed React component,
      compiled by the same oxc pipeline as the app. Install + two-line
      `vite.config` snippet + tsconfig types line. Vite ≥ 8 only, on
      purpose.
    - One sentence on why components beat `<img>` for icons: props,
      `aria-*`, `currentColor`. Compress the full four-way taxonomy
      (`<img>`/CSS bg, inline-by-hand, sprite sheets, SVGR components) to
      2–3 sentences with the decision rule and move on — cuttable if the
      post runs long.
    - Transition line: _"The rest of this post is why those 70 lines look
      the way they do. Every design decision was paid for."_
2. **v0: `vite-plugin-svgr`, and the Rolldown break** (May–July 2025) —
   gotcha #1 above, Lesson 1.
3. **v1: forty lines and a cute hack** (July 2025) — show the `.tsx`-suffix
   code; the "delete your SVG mocks" win (gotcha #2); the
   `importVitePlugins()` sharing-arc seed. Lesson 2.
4. **v2: the hack meets workerd** (Feb 2026) — gotcha #3 as a mini
   virtual-modules tutorial (the `\0` prefix convention,
   `this.resolve(..., { skipSelf: true })`, `transformWithOxc`, real
   sourcemaps). Includes the `?react`-vs-`with { type: 'react' }` FAQ as a
   sidebar here. Lesson 3.
5. **v3: the heisenbug** (July 2026 — keep this tight) — verbatim error
   string, the two-paragraph version of the
   dep-scanner/cold-cache/dual-React story, tease post 2. Lesson 4.
6. **The extraction — the ending writes itself** — the two-workspace
   sharing arc as "a package with commitment issues";
   `@acusti/vite-plugin-svg-react` as the four lessons shipped as defaults;
   the gist-vs-package pitch restated as the moral.
7. **Closing** — the four lessons as a compact, shareable list; the
   decision rule one-liner; repo/package links; tease post 2; invite
   issues.

## Pre-v1 package hardening checklist (surfaced while migrating outlyne)

- ~~`load()` extracts the file path via a hardcoded `id.slice(23)`~~ —
  **done**: the shipped code uses `id.slice(VIRTUAL_PREFIX.length)`.
- ~~Package test suite should add~~ — **done, all of it, on the v4 branch**
  (`b5eb99e`; outlyne's contract test intentionally stays thin and
  consumer-facing, not a substitute): the virtual-id shape test (`\0`
  prefix, no fake on-disk `.tsx` path); `svgrOptions` merge behavior
  (post-v4 there is no `plugins: [jsx]` to clobber; the merge is over a
  plain options bag); the true integration test — a real `vite build()` of
  an `.svg?react` entry, resolved and transformed by Vite's own pipeline,
  with the bundle imported and rendered to the DOM (the tier that would
  have caught the `id.slice(23)` issue, plus `enforce: 'pre'` ordering);
  sourcemap presence (non-null); non-matching ids pass through undyed. The
  v4 branch also adds the load-hook-to-rendered-DOM tier (fixtures through
  the real load hook, compiled modules rendered under happy-dom). A
  `createServer` dev-server variant was considered and skipped: it
  duplicates the build-test coverage at higher cost, and the dev-runtime
  behavior is asserted directly.

## Open TODOs before drafting

- Decide when to write post 2 (the heisenbug debugging story) — post 1's
  ending explicitly promises it.
- Re-verify in prod, then tag package v1 (post 1's own closing pitch
  depends on the package being real, not just outlyne-internal).
- Once the v4 branch (`svg-react/drop-svgr-babel`) merges and ships: sweep
  the outline for stale svgr framing (subhead, taxonomy, "70 lines"),
  decide whether the ending gets the fifth lesson box, and fold the perf
  numbers into section 6's pitch.
