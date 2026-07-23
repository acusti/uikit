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

- `load()` extracts the file path via a hardcoded `id.slice(23)` — correct
  for the current `\0vite-plugin-svg-react:` prefix length but silently
  breaks if the prefix ever changes. Switch to
  `id.slice(VIRTUAL_PREFIX.length)`.
- Package test suite should add (outlyne's contract test intentionally
  stays thin and consumer-facing, not a substitute for these): the
  virtual-id shape test (`\0` prefix, no fake on-disk `.tsx` path);
  `svgrOptions` merge behavior (user options shallow-merge over defaults
  without clobbering `plugins: [jsx]`); one true integration test with a
  real Vite `createServer` or fixture build asserting an `.svg?react`
  import transforms end to end (this is the tier that would have caught the
  `id.slice(23)` issue, plus `enforce: 'pre'` ordering and alias-resolution
  issues); sourcemap presence (non-null); non-matching ids pass through
  undyed.

## Open TODOs before drafting

- Decide when to write post 2 (the heisenbug debugging story) — post 1's
  ending explicitly promises it.
- Re-verify in prod, then tag package v1 (post 1's own closing pitch
  depends on the package being real, not just outlyne-internal).
