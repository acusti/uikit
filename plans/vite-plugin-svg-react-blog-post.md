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
- **2026-09-07: thesis correction — `vite-plugin-svgr` now supports
  Vite 8, so gotcha #1 no longer justifies the package's existence.**
  Verified: `vite-plugin-svgr` v5.0.0 (March 28, 2026, "Drop vite 2
  support and add vite compat tests") added a real `vite3`–`vite8`
  compat-test matrix — `scripts/test-vite-compat.js` swaps the `vite`
  symlink and runs `pnpm test:e2e` against each aliased version, it's not
  just a declared peer range — and widened `peerDependencies.vite` from
  `>=2.6.0` to `>=3.0.0`. v5.1.0/v5.2.0 (April 2026) didn't touch that
  matrix. So the v0→v1 Rolldown break (gotcha #1 below) is **history, not
  a standing reason to avoid `vite-plugin-svgr` today** — a reader
  googling "SVGs in Vite 8" now has a mainstream option that works. The
  post's thesis narrows: `@acusti/vite-plugin-svg-react` earns its place
  as the Babel-free, zero-runtime-dependency alternative (v4's rework),
  not as "the only plugin that works on Vite 8." This pushes v4 from a
  closing beat to the post's actual spine — see the retouched outline
  below.
- **2026-09-07: perf comparison lands, confirming the narrowed thesis is
  still worth publishing.** `@acusti/vite-plugin-svg-react` builds
  outlyne's real 135-icon set ~2.1x faster than `vite-plugin-svgr@5.2.0`
  in isolation, with byte-identical output — see "The perf comparison"
  section below for the numbers, methodology, and (important) the caveat
  about not overclaiming beyond the isolated transform step.
- **2026-09-07: post 2 is cancelled — this is one post, full stop.** No
  separate deep-dive on the v3 heisenbug; other things are a better use of
  writing time. This removes the reason v3 was kept to two paragraphs (not
  wanting to spend the material twice) — see the organizing-principle
  bullet and section 5 below, both need a decision on whether v3 expands
  now that its material has nowhere else to go, or stays tight simply
  because tight served the post's pacing regardless. Flagged as an open
  TODO rather than decided here.

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
  twice. (Moot as of 2026-09-07: post 2 isn't happening — see the TODO to
  decide whether v3 should now expand instead of staying deliberately
  short for a payoff that won't exist.)
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
   oxc or it's a liability.** (Correction, 2026-09-07: this was a real gap
   in mid-2025, not a standing one — `vite-plugin-svgr` shipped a real
   `vite3`–`vite8` compat-test matrix in v5.0.0, March 2026. Tell this
   beat as "this is what broke in July 2025," full stop; don't imply it's
   still broken today. The lesson about oxc vs. a second parser stands on
   its own merits — it's just no longer the thing that makes this package
   necessary.)
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
- **The option surface shrank on purpose** (decided during review, not
  drift): full svgr parity was explicitly declared a non-goal — "I want to
  make sure we aren't putting ourselves on the hook for maintaining a
  mature extensive feature surface area." The plugin keeps the three
  options that shape the `<svg>` element itself (`dimensions`, `icon`,
  `svgProps`, now under an `svg` key — the svgrOptions name went with its
  namesake, and the old key throws a migration message) and fixes the
  module wrapper: typed, default export, props spread at the end.
  Everything else — `ref` (React 19 passes ref as a regular prop, so the
  spread already forwards it), `memo` (wrap at the use site), `exportType`,
  `typescript` (no observable effect once oxc compiles the module
  immediately), `jsxRuntime`, `expandProps`, and svgr's pipeline options —
  throws at config time with the replacement named in the README. Good post
  material: the unknown-option validation is what made shrinking safe —
  dropped options fail loudly instead of silently changing behavior. The
  README points at OXVG (the Rust, SVGO-compatible toolchain) as the future
  optional optimizer.
- **Tests now do what Lesson 2 preaches, one level deeper:** fixture SVGs
  run through the real load hook, the compiled modules are imported and
  rendered under happy-dom, and the assertions are on the DOM, not on
  emitted strings.

## The perf comparison (2026-09-07, outlyne/outlyne repo) — hard numbers for the Babel-removal pitch

Source: a perf-testing writeup (`svg-plugin-perf-comparison.md`) run
against outlyne's real icon set (135 files, 317 import sites) once
`vite-plugin-svgr` had a Vite-8-compatible release to test against.
Verdict: keep `@acusti/vite-plugin-svg-react` — no migration warranted.
This is the strongest piece of evidence for the post's post-2026-09-07
thesis: it turns "we didn't want Babel" from an architectural-taste
argument into a measured number.

**Headline number (scope it carefully — see the caveat below): the
isolated SVG transform is ~2.1x faster** than `vite-plugin-svgr@5.2.0`
(2.13x median, 2.10x mean, over 20 interleaved A/B builds each; the two
distributions don't overlap at all — `vite-plugin-svgr`'s fastest run,
705.1ms, was still slower than `@acusti/vite-plugin-svg-react`'s slowest,
513.5ms).

| plugin                                     | median | mean    | stddev |
| ------------------------------------------- | ------ | ------- | ------ |
| `@acusti/vite-plugin-svg-react`             | 365.6ms| 376.6ms | 48.0   |
| `vite-plugin-svgr` (jsxRuntime: automatic)  | 777.3ms| 792.0ms | 72.3   |

**Output size is a wash, slightly in svgr's favor**: 137,798 vs. 137,795
bytes raw (30,816 vs. 30,805 gzipped) once both plugins are configured for
the automatic JSX runtime. Codegen is byte-identical across all 135 real
icons except two cosmetic bytes (a debug-comment path-encoding difference,
and one attribute rendered as a quoted string vs. a bare number literal —
functionally identical either way). This closes off the obvious
counter-argument ("sure it's faster, but is the output bloated?") before a
reader can raise it.

**Methodology worth reusing in the post, not just citing the conclusion:**
- Measured a `vite build` (**lib mode** — a normal app build determined
  all 135 icons were "unused" by the benchmark's own logic and tree-shook
  the whole thing to nothing; lib mode treats every entry export as public
  API, matching how the real app actually renders every icon) of a
  synthetic entry re-exporting every real icon file, plugin swapped via
  env var, fresh process per run.
- `vite-plugin-svgr` was explicitly configured with
  `svgrOptions: { jsxRuntime: 'automatic' }` to match
  `@acusti/vite-plugin-svg-react`'s hardcoded runtime — comparing against
  svgr's classic-runtime default would have been a strawman (an extra,
  irrelevant `import * as React from 'react'` per component).
- 7 warmup + 20 measured builds per plugin, **interleaved** A/B/A/B/…, not
  block-run, so cache warmup / thermal drift over the run hits both
  variants evenly instead of biasing whichever runs second.

**The caveat that has to survive into the post, or the post undercuts its
own numbers:** a full real-app build (`react-router build`: SSR +
Cloudflare Workers + Sentry + React Compiler + LightningCSS) shows the
SVG-transform delta **disappearing into noise** (21.5s vs. 21.3s wall time
for matched configs) — the isolated ~400ms-per-build advantage is real but
small relative to everything else a production build does. **The "2.1x
faster" claim is true and worth leading with, but only when scoped
explicitly to the SVG-transform step itself.** Never phrase it in the post
as "your build will be 2.1x faster" — that's not what was measured, and
the post's own corroboration data would contradict a broader claim.

**Where this slots into the outline:** the headline stat (correctly
scoped) belongs in section 1's `vite-plugin-svgr`-concession bullet; full
methodology, both tables, and the byte-diff detail become section 6's
actual payoff — the receipts for "why not just use `vite-plugin-svgr` now
that it works on Vite 8."

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
- **Superseded by the 2026-09-07 thesis correction above:** v4 is no
  longer just the final beat, it's the reason the post's pitch still
  holds now that `vite-plugin-svgr` supports Vite 8. Section 6 needs more
  weight than "final beat" — it's carrying the post's actual argument.
- Candidate closing lesson if a fifth box is wanted: **the transform was
  never the hard part — SVG→JSX is a lookup table and an escape function,
  not a compiler pipeline.** (Lesson 1 said the compile must be oxc; v4
  says the conversion needs no compiler at all.)

## The full merged outline

**Title (DRAFT, needs the user's own pass):** SVGR-compatible, without
SVGR — a zero-dependency, Babel-free SVG-to-React plugin for Vite 8
**Subhead (DRAFT):** Four scars and a fifth cut — why we still ship our
own SVG plugin even though `vite-plugin-svgr` caught up to Vite 8.
(Retired: "The best way to render SVGs in React with Vite 8 + Rolldown."
That framing implied the package was necessary for Vite-8 compatibility;
it isn't anymore — `vite-plugin-svgr` v5.0.0+ works fine on Vite 8. Don't
let the title/slug promise "the only way" or "the best way" on Vite-8
support specifically; the search intent this post can still legitimately
own is closer to "SVG to React without Babel" / "zero-dependency SVGR
alternative.")

1. **The answer first** (first screen, skimmer-complete)
    - `import CheckIcon from './check.svg?react'` → typed React component,
      compiled by the same oxc pipeline as the app. Install + two-line
      `vite.config` snippet + tsconfig types line. Vite ≥ 8 only, on
      purpose — but say explicitly this isn't a compatibility claim
      (`vite-plugin-svgr` also runs on Vite 8 now); it's a design choice,
      because the whole point is a transform that never leaves oxc.
    - New bullet: **name `vite-plugin-svgr` and concede the point** —
      it works on Vite 8 as of its v5.0.0 (March 2026). If a reader just
      wants SVGs working, that package is a perfectly fine, more
      established choice. The reason to reach for this one instead: zero
      runtime dependencies, no Babel anywhere in the pipeline (v4's
      rework), and — the headline stat from "The perf comparison"
      section — the SVG transform itself runs ~2.1x faster with
      byte-identical output, on outlyne's real 135-icon set. State the
      stat's scope precisely (isolated transform step, not "your build");
      see that section's caveat before drafting this. Say this early and
      plainly — it's a stronger, more honest hook than implying
      exclusivity.
    - One sentence on why components beat `<img>` for icons: props,
      `aria-*`, `currentColor`. Compress the full four-way taxonomy
      (`<img>`/CSS bg, inline-by-hand, sprite sheets, SVGR components) to
      2–3 sentences with the decision rule and move on — cuttable if the
      post runs long.
    - Transition line (needs a rewrite pass, "70 lines" is stale — see v4
      section): something like _"The rest of this post is why this
      package still exists even after the ecosystem caught up. Every
      design decision was paid for."_
2. **v0: `vite-plugin-svgr`, and the Rolldown break** (May–July 2025) —
   gotcha #1 above, Lesson 1. Tell it as dated history — "this is what
   broke in July 2025" — not as a standing knock on `vite-plugin-svgr`;
   say plainly that it's since shipped Vite 8 compat tests (v5.0.0, March
   2026). Don't let a reader who checks npm today catch the post
   overstating a current gap.
3. **v1: forty lines and a cute hack** (July 2025) — show the `.tsx`-suffix
   code; the "delete your SVG mocks" win (gotcha #2); the
   `importVitePlugins()` sharing-arc seed. Lesson 2.
4. **v2: the hack meets workerd** (Feb 2026) — gotcha #3 as a mini
   virtual-modules tutorial (the `\0` prefix convention,
   `this.resolve(..., { skipSelf: true })`, `transformWithOxc`, real
   sourcemaps). Includes the `?react`-vs-`with { type: 'react' }` FAQ as a
   sidebar here. Lesson 3.
5. **v3: the heisenbug** (July 2026) — verbatim error string, the
   dep-scanner/cold-cache/dual-React story. Lesson 4. **Length is an open
   TODO as of 2026-09-07** (post 2 is cancelled): either give this the
   full debugging-story treatment it was originally going to get its own
   post for, or keep it to two paragraphs on pacing grounds alone (it's
   already the climax of a "four scars" structure; a fifth-scar-length
   digression here could unbalance the post even without a sequel to
   protect). No "tease post 2" line either way — nothing to tease.
6. **The extraction — the ending writes itself** — the two-workspace
   sharing arc as "a package with commitment issues";
   `@acusti/vite-plugin-svg-react` as the four lessons shipped as defaults;
   the gist-vs-package pitch restated as the moral. **This section now
   carries the post's actual thesis, not just a closing beat:** v4's
   Babel/`@svgr/*` removal (CDATA fix, the deliberately-shrunk option
   surface with loud failures on dropped options) plus the 2026-09-07 perf
   comparison (both tables, the byte-diff detail, the methodology) are the
   answer to "why not just use `vite-plugin-svgr`, it works on Vite 8 too
   now" — give it real room here, not a paragraph. Preserve the perf
   section's scoping caveat verbatim in spirit, don't let the full-app
   corroboration data get cut for space while the isolated 2.1x number
   stays — that combination is what makes the claim honest.
7. **Closing** — the four lessons as a compact, shareable list; the
   decision rule one-liner (rewrite it now: not "here's the only plugin
   that works on Vite 8" but "use `vite-plugin-svgr` if that's fine for
   you; reach for this one when you want zero deps and no Babel in the
   pipeline"); repo/package links; invite issues. No post-2 tease — cut
   as of 2026-09-07.

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

- ~~Decide when to write post 2 (the heisenbug debugging story)~~ —
  **decided, 2026-09-07: not writing it.** Downstream cleanup done
  (Status, organizing principle, sections 5/7 all had "tease post 2" /
  "keep it short for the sequel" reasoning stripped or flagged). Still
  open: **decide section 5's actual length** now that there's no sequel
  to protect the material for — expand the v3 heisenbug into the full
  debugging story, or keep it tight purely for the post's own pacing. See
  the note on section 5 above.
- Re-verify in prod, then tag package v1 (post 1's own closing pitch
  depends on the package being real, not just outlyne-internal).
- Once the v4 branch (`svg-react/drop-svgr-babel`) merges and ships: sweep
  the outline for stale svgr framing (subhead, taxonomy, "70 lines"), and
  decide whether the ending gets the fifth lesson box.
- ~~fold the perf numbers into section 6's pitch~~ — **done, 2026-09-07**:
  see "The perf comparison" section above.
- **Finalize the title/subhead rewrite** (drafts added 2026-09-07 above
  are placeholders) now that the Vite-8-exclusivity framing is retired —
  land on wording that owns "Babel-free" / "zero-dependency SVGR
  alternative" search intent instead.
- **Write section 1's new `vite-plugin-svgr`-concession bullet and
  section 6's expanded v4 case** for real, in prose — the notes above
  describe the shape but the actual argument (with the v4 perf numbers)
  needs to be drafted out.
- Before publishing, re-check `vite-plugin-svgr`'s latest version and
  peerDependencies once more — its Vite 8 support was verified 2026-09-07
  against v5.2.0; if it's moved further by draft time, re-verify the
  claim still holds.
