# Building a Dropdown on CSS Anchor Positioning and the Popover API

## What this is

A field guide to building a dropdown/menu component on the modern browser
platform — CSS anchor positioning plus the Popover API — written after
actually shipping one (`@acusti/dropdown`). It targets modern browsers only
and deliberately favors platform primitives over compatibility layers and
JS positioning libraries.

Unlike a greenfield design doc, this records what we _tried_, which
assumptions turned out to be wrong, the browser quirks that cost us the
most time, and the tradeoffs behind the design we landed on.

## The thesis

Two platform features do the heavy lifting that used to require a pile of
JavaScript:

- **The Popover API** renders the surface in the top layer. That single
  choice removes the historical fragility around portals, `z-index` wars,
  ancestor `overflow: hidden` clipping, and the containing-block traps that
  break positioning (more on that below). Note it does _not_ hand you
  outside-click dismissal — that’s `popover="auto"`’s light-dismiss, which
  we opted out of (see below); with `manual` you own dismissal.
- **CSS anchor positioning** (`position-anchor`, `position-area`,
  `anchor()`, `anchor-size()`, `@position-try`) places and re-flows the
  surface declaratively, so the browser does collision-aware placement
  instead of a userland measure/reposition loop.

JavaScript is then a thin layer for the things the platform genuinely
doesn’t do: arrow-key navigation, typeahead, submenu intent, focus return.

Everything below is about making those two features actually behave.

## Scope: one component is not one abstraction

A quick note before the mechanics, because it shapes everything: the visual
shape of “a floating panel anchored to a trigger” is shared, but the
_semantics_ are not. An action menu (`role="menu"`, arrow-key roving focus,
Enter to activate), a navigation flyout (just links — don’t force it into
ARIA menu semantics), and a selection UI (`listbox`/`combobox` with
`aria-activedescendant`) have genuinely different keyboard and a11y
contracts. I recommend building them as separate components over one shared
_positioning/surface primitive_, not as one mega-component with a `mode`
prop. This document is about that shared primitive, which is where all the
platform quirks live.

## The surface: Popover, and why `manual` beats `auto`

The panel is a sibling of the trigger with a `popover` attribute, shown in
the top layer. The interesting decision is `auto` vs `manual`.

`popover="auto"` is the obvious choice: the browser gives you light-dismiss
(click outside, `Esc`) and one-open-at-a-time for free. We use
`popover="manual"` instead. Reasons:

- **Searchable / combobox triggers.** `popovertarget` only works on
  button-type controls, so a text-input trigger can’t be wired to a popover
  declaratively, and an `auto` popover opened next to a non-invoker input
  light-dismisses the moment the user clicks into that field. `manual`
  doesn’t light-dismiss, so the options stay open while the user types.
- **Dismissal is a component decision.** Outside-click, focus, and iframe
  handling need to be coordinated with the component’s own model (e.g. a
  nested independent popover shouldn’t dismiss its parent). `manual` hands
  that control back.
- **Submenus.** Each submenu is its own `manual` popover, shown/hidden via
  `showPopover()`/`hidePopover()` as its parent item expands. `auto`’s
  automatic stack management gets in the way of an intent-driven open/close
  policy.

There is a tradeoff: `manual` means you re-implement light-dismiss and
`esc` yourself. For a simple menu, `auto` is less code. For anything with
inputs, nesting, or a bespoke dismissal model, `manual` is worth it.

### Why top layer is so important

The headline benefit of the top layer isn’t stacking, it’s the **containing
block.** A top-layer element’s containing block is always the viewport. A
_normal_ `position: fixed` descendant’s containing block is the nearest
ancestor with a `transform`, `filter`, `backdrop-filter`, `perspective`,
`will-change: transform`, `contain`, etc. Any of those on an ancestor
silently captures the panel, such that `position-try` fallbacks stop firing
and the base `position-area` can resolve against the wrong box. This is the
single most common way anchor positioning broke in our testing.

Because an HTML popover renders in the top layer, none of that applies and
no CSS hierarchy changes are needed. And it dissolved a cross-engine
disagreement we’d been unknowingly working around.

Our first submenus were `position: fixed`, nested inside the (also
`position: fixed`) menu body — and that’s where Chrome and Safari part ways
over the submenu’s _containing block_. Chrome follows the spec: a fixed
element’s containing block is the viewport unless an ancestor has
`transform`/`filter`/`contain`, so the submenu opened beside its parent.
Safari treats the nearest out-of-flow ancestor — any `position: fixed` or
`position: absolute` box — as the containing block, so the submenu was
confined to the body and `position-area: inline-end`, which wants to open
past the body’s edge, got pulled back _inside_, over its parent. Same
markup, opposite placement. (Stranger still: give the body a `transform`,
which per spec _does_ establish a containing block, and the two engines
swap sides — so there’s no "correct" engine to build on.) The fix isn’t to
pick a winner: rendering each submenu as its own top-layer `popover` lifts
it out of that nesting, so it has no out-of-flow ancestor to capture it and
its containing block is the viewport in both engines.

## Placement: anchor positioning

The base setup:

```css
.trigger {
    anchor-name: --trigger;
}

.menu {
    position: fixed;
    position-anchor: --trigger;
    position-area: block-end span-inline-end; /* the default direction */
    position-try-fallbacks: /* ... */;
}
```

Two naming lessons worth stating up front:

- **Use logical keywords, not physical ones.** `block-start`/`block-end` +
  `span-inline-start`/`span-inline-end`, never `top`/`bottom` +
  `span-left`/`span-right`. Logical keeps recipes RTL-correct for free, and
  `position-area` won’t let you mix a physical keyword on one axis with a
  logical one on the other anyway.
- **Name `@position-try` blocks for the aligned edge, not the growth
  direction.** `top-start` opens _above_ the trigger with their
  inline-start edges flush (so the body extends toward inline-end). Naming
  for the flush edge (`start`/`end`), though it wasn’t my first instinct,
  proved less confusing, especially when it comes to RTL.

### The assumption that bit us first: `position-try-order: most-height`

The spec offers `position-try-order: most-height`, which re-sorts the
candidate placements by available space and picks the roomiest. For a menu
that wants to "fit available space," this looks perfect, and it’s the first
thing you reach for.

It’s wrong for a menu. `most-height` overrides the _authored_ direction: a
dropdown told to open downward will open _upward_ merely because the
viewport happens to have more empty space above, even when down fits fine.
Direction becomes a function of scroll position and viewport size instead
of your design. We removed it entirely.

The principle we landed on: **the authored primary placement wins whenever
the body fits there at its natural size.** Only when it fits nowhere do you
fall back — first through other natural placements, then to
squeeze-and-scroll. No re-sorting by available space, ever.

## Fitting available space (the genuinely hard part)

The goal: a menu that stays content-sized when small, grows until it hits
the edge of the viewport on its chosen side, and _only then_ becomes
scrollable — without ever overflowing the screen.

The structural half is easy and matches conventional wisdom: two layers.

- An outer **shell** that participates in anchor positioning and owns the
  sizing constraints.
- An inner **scrollport** (`overflow: auto; overscroll-behavior: contain`)
  that absorbs overflow once content exceeds the shell.

Placement and overflow are different responsibilities; keep them on
different elements.

The sizing half is where the assumptions die.

### Disproved: `max-block-size: 100%` constrains a `position-try` option

The intuitive approach is to let the shell be `max-block-size: 100%` (or
`max-content` capped by the area) and trust `position-try` to pick a side
where it fits. **It doesn’t work**, and the reason is a subtle,
easy-to-miss rule:

> `position-try` evaluates an auto-sized box at its **natural, unclamped**
> size when deciding whether an option overflows.

So a `max-block-size` clamp that _would_ make the box fit is ignored during
the fit check — the box is measured at its full natural height,
"overflows," and the option is rejected. The same quirk rejects intrinsic
keywords like `max-content` set _inside_ an `@position-try`. You cannot
size-to-fit an option into acceptance; the option has to already fit at
natural size, or it loses.

A caveat on the rule itself: we established it empirically — the
`max-block-size` disproof above is exactly how — not from a spec line, and
leaned on it mainly in Chromium. So before you replace a constrained
fallback with a fill on the strength of it, confirm your target engines
really do ignore the clamp during the fit check. A constrained option that
already fits at natural size is still the simpler tool; the fills are the
answer when no constrained option fits, not a blanket replacement for them.

The consequence: "squeeze and scroll" can’t be expressed as a constraint on
the natural placements. It has to be its own set of `@position-try` options
with a **definite** `block-size`.

### The solution: definite-length fill placements as the last resort

After the natural placements come "fill" options — last-resort
`@position-try` blocks that give the box a definite block-size equal to one
side’s space and let the scrollport handle the overflow:

```css
@position-try --fill-bottom {
    position-area: block-end; /* bare keyword: spans all inline tiles */
    block-size: calc(100% - var(--gap, 0px) * 2);
    min-block-size: min(
        var(--min-height),
        var(--max-height),
        /* the cap — see below */
            calc((100dvb - anchor-size(block)) / 2 - var(--gap, 0px) * 2)
    );
    justify-self: anchor-center;
}
/* plus --fill-top, the block-start mirror */
```

Three details, each of which we got wrong at least once:

- **`block-size` must be a definite length**, per the quirk above — not a
  clamp on the auto size.
- **A bare block keyword (`block-end`) spans all inline tiles**, so the
  containing block is viewport-wide and the fill can never be rejected for
  _horizontal_ overflow. Combined with `justify-self: anchor-center` (which
  shifts the trigger-centered box inward to stay on-screen), the fill is
  unrejectable on the inline axis. That’s what makes the bottom/top pair a
  _complete_ rescue: a fill can only be rejected on the block axis, the two
  block sides sum to the viewport, so at least one always fits.

### The `≤50dvb` trap and the min-block-size cap

That "at least one always fits" guarantee has a hole we didn’t see until we
tested it. A fill is rejected when its side is shorter than the box’s
`min-block-size`. At a vertically centered trigger, _both_ sides are about
`50dvb`. So if a consumer sets a `min-height` above half the viewport (say
`300px` on a short viewport), both fills are rejected and the body reverts
to its overflowing primary placement — off-screen.

The fix is to cap the fill’s `min-block-size` floor at the worst-case side
— half of (the viewport block size minus the trigger’s), which is the most
a block-centered trigger can guarantee:

```css
min-block-size: min(
    var(--min-height),
    var(--max-height),
    calc((100dvb - anchor-size(block)) / 2 - var(--gap, 0px) * 2)
);
```

Now the author’s `min-height` is honored by the natural placements but
_capped_ in the fills, so it can never reject both sides. Note this uses
`anchor-size(block)` inside a `@position-try` — the trigger’s own block
size — which was one of the more pleasant surprises: the reference works at
all. It degrades only _partway_ gracefully, though. If an engine drops the
declaration, the fill reverts to the uncapped `min-height`: harmless at the
default (`30px`), but a consumer who raised `min-height` above ~half the
viewport gets the `≤50dvb` off-screen trap back. So it degrades cleanly at
small min-heights and degrades to the very bug it exists to fix at large
ones. (We confirmed the cap resolves in Chromium; for Safari and Firefox we
verified only that they evaluate ≥ 12 options, not that the `anchor-size()`
cap resolves there — worth checking before relying on it cross-engine.)

The cap and the fills are written against `100dvb` — the _dynamic_ viewport
— on purpose. On mobile, that tracks the browser chrome: as the URL bar and
toolbars slide away and back, the available block size changes, and both
the cap’s worst-case-side math and the fills’ reach recompute against the
space that’s actually on screen at that moment rather than a stale `100vh`.

### The unitless-zero calc landmine

A genuinely nasty one. A gap variable defaulting to `0` (unitless) makes
`calc(100% - var(--gap) * 2)` resolve to `<percentage> - <number>`, which
is **invalid**. The whole `block-size` declaration is dropped, every fill
is then evaluated at natural size, and they all get rejected — the entire
fill system silently stops working. The zero has to carry a unit (`0px`): a
custom-property default that stands in for a _length_ inside `calc()` needs
a length unit. (A default that's genuinely a unitless number — a
multiplier, a `line-height` — is right to leave bare; this is only about
values used as lengths.)

## The invisible ceiling: the `position-try` evaluation limit

This one isn’t in most tutorials and it shaped our entire fallback design.

The spec lets an implementation cap how many _position options_ it will
evaluate, and the floor is **five**. Crucially, the "position options list"
_includes the element’s own base position_, so five options means the base
plus **four** fallbacks are guaranteed — no more.

If your `position-try-fallbacks` list is longer than the engine evaluates,
the extra entries are **silently ignored**. For us that meant a
too-tall-body-at-a-viewport-edge rescue fill sat past the cutoff, never
ran, and the body opened off-screen — a bug that only reproduced at
specific trigger positions and looked like anything but a fallback-count
problem.

### Measuring it (and the quirks that made measuring hard)

We wanted the real numbers, so we built a test harness. Two dead ends
taught us how `position-try` acceptance actually works:

- **Off-screen inset options aren’t rejected.** Placing an option far
  off-screen with raw insets (`position-area: none; left: -3000px`) does
  _not_ get it rejected — such options are effectively always accepted. You
  can’t use "position it off-screen" as a proxy for "make it fail."
- **`position-area` boxes get shifted, not rejected.** A `position-area`
  placement that would overflow is nudged back inside the viewport rather
  than rejected — standard `position-area` overflow avoidance, which every
  engine does (not the containing-block disagreement from the submenu story
  earlier; that’s a different mechanism). So it "fits" rather than failing.

Rejection is **size-based**, not position-based: an option fails when the
box’s `min-block-size` exceeds the space the option offers. So the reliable
way to force a rejection — and the mechanism our real fills actually rely
on — is an impossible `min-block-size`. The harness gives each probe option
a `min-block-size` big enough to never fit, so only the target option can
be selected, and reads back how far down the list the engine got.

One sharp edge if you reproduce this: an impossible-`min-block-size` probe
only shows a clean cutoff when the _target_ option is definite-sized too.
Give the target a natural (auto) block size and it can get selected well
past the real limit, smearing the cliff away entirely — the numbers above
are trustworthy because our real fills are definite-size, but a naive
harness can read "no limit at all." The bulletproof recipe: probe with a
_natural-overflow_ option (real content taller than its side, not an
impossible min) and give the target a definite `block-size`; then the
cutoff lands cleanly at the same place regardless of how the target is
sized.

Results, measured directly:

| Engine      | Options evaluated                  |
| ----------- | ---------------------------------- |
| Chromium    | exactly **6** (base + 5 fallbacks) |
| Safari 26.5 | **≥ 12**                           |
| Firefox 152 | **≥ 12**                           |

So Chromium is the binding constraint at six options, and six is a safe
cross-engine baseline — but the _spec_ only guarantees five.

### The budget, and making it structural

Given the ceiling, the budget for the body is: base + **two** author
fallbacks + **two** fills = five options, exactly the spec floor. That’s
why the default has two named author fallbacks (the block flip and the
inline flip of the primary) and drops the both-axes diagonal — keeping the
whole list floor-safe on any conformant engine. (The cost: a trigger
crammed into the corner diagonal to the primary lands in a fill rather than
a fourth natural placement — a re-tune-the-primary case.)

So the default spends **five** — floor-safe everywhere. The sixth option
Chromium (and Safari and Firefox) actually offers is headroom, not
baseline: it’s what an opt-in third fill like `--fill-cover` spends, buying
a cover-the-trigger placement at the price of dropping below the spec
floor’s guarantee. Baseline stays at five; the sixth is a deliberate
opt-in.

The API lesson: we originally exposed the author fallbacks as one
comma-separated custom property. That made the two-option limit a thing you
had to _document_ — and a third entry silently reintroduced the off-screen
bug. Splitting it into two fixed slots (`--…-fallback-1` /
`--…-fallback-2`) makes the budget **structural**: there’s no third slot to
overflow into. (A shipped no-op placement, `--noop`, fills the second slot
for recipes that only have one meaningful fallback, so an unset slot’s
empty `var()` never breaks the declaration.)

## Submenus

Model each submenu as its own nested popover anchored to the parent item.
`anchor-scope` keeps each level’s submenu bound to its own parent so
nesting stays clean. The behavior rules are conventional (open one closes
siblings, closing a parent closes descendants, hover-intent for pointers,
arrow keys for keyboard, a "safe triangle" so a diagonal mouse path toward
the submenu doesn’t dismiss it).

The interesting divergence is the fill behavior. The body’s last-resort
fills sit **above or below the trigger**, spanning the full viewport inline
axis (that’s the inline-unrejectable trick). A submenu can’t borrow it:
spanning the inline axis would drop the submenu on top of its parent menu,
and a submenu must never cover its parent — that’s not how menus work. So
submenus get the mirrored version, staying **beside** the parent:
full-height on the inline side, `anchor-center` on the block axis so they
shift to stay on-screen. It’s the block-axis mirror of the body’s
inline-unrejectable trick.

The honest tradeoff: unlike the body pair, the submenu fills carry **no "at
least one always fits" guarantee** — they're rejected only on the inline
axis, so they assume at least one inline side has room for the submenu’s
width. A submenu both too tall to open beside its parent _and_ too wide for
either side reverts to its (overflowing) primary. For the narrow columns of
a macOS-style menu that never happens, and it’s the right tradeoff for that
target; a consumer who needs the guarantee can append the body-style
block-cover fills.

## Animation

Animate with the platform, not a JS orchestrator: `:popover-open`,
`@starting-style`, `transition-behavior: allow-discrete`, and transitions
on `display`/`overlay`. This keeps the open/close animation in sync with
top-layer promotion and avoids the race conditions you get when animation
state and visibility state are tracked separately in JS.

## Keeping it on screen: regression testing

Every failure mode above is **silent** — a rejected fill, a dropped
`calc()`, a fallback past the evaluation cutoff all just render the body in
the wrong place; nothing throws. So the safety net isn’t a unit test of the
CSS, it’s a geometry assertion on the rendered result: open the dropdown at
each interesting trigger position — an edge, a corner, a vertically
centered trigger — and assert the body’s bounding rect stays inside the
viewport. Add a raised-`min-height` case explicitly, since that’s the one
that re-arms the `≤50dvb` trap if the cap ever regresses. These are the
cases we learned to distrust one at a time; a test that walks all of them
turns "looked fine when I checked" into something that stays true.

## Tradeoffs, collected

| Decision              | We chose                             | Because                                              | Cost                                                        |
| --------------------- | ------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------- |
| Popover mode          | `manual`                             | dismissal control, searchable inputs, submenu policy | re-implement light-dismiss/`Esc`                            |
| Direction selection   | authored primary wins                | predictable, design-driven                           | won’t auto-fill the roomier side (`most-height` rejected)   |
| Fit-to-space          | definite-length fill `@position-try` | `max-block-size` clamps don’t gate option acceptance | one option per side, plus the count against the budget      |
| Fallback config       | two fixed slots                      | makes the option-count budget structural             | breaking API vs. a flexible list                            |
| Option-count baseline | five by default (six is opt-in)      | five is the spec floor, safe everywhere              | cover fill spends a sixth, above the guaranteed floor       |
| Submenu fills         | stay beside the parent               | macOS-faithful, never covers                         | no always-fits guarantee; wide-in-a-narrow-viewport reverts |
| Diagonal fallback     | dropped                              | keeps the list floor-safe                            | corner-diagonal trigger lands in a fill                     |

## tl;dr

- Popover API for the surface; `manual` unless you're sure `auto`’s
  dismissal fits. The top layer’s real gift is escaping the
  containing-block trap.
- Anchor positioning for placement; logical keywords; authored direction
  wins — **not** `most-height`.
- Fit-to-space is _not_ a `max-block-size` clamp; it’s definite-length fill
  options, because `position-try` judges fit at natural size.
- There’s a hard, mostly-undocumented cap on how many `position-try`
  options an engine evaluates (Chromium: six, base included). Budget for
  it, and make the budget structural if you can.
- Rejection is size-based. `anchor-size()` works inside `@position-try`.
  Unitless zeros in `calc()` will silently take down your whole fill
  system.

## Sources

- [MDN: HTML `popover` global attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover)
- [MDN: `HTMLElement.showPopover()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/showPopover)
- [MDN: `HTMLElement.togglePopover()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/togglePopover)
- [MDN: `HTMLElement` `beforetoggle` event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/beforetoggle_event)
- [MDN: Using CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning/Using)
- [MDN: `position-try`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position-try)
- [MDN: `@position-try`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40position-try)
- [MDN: `position-area`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position-area)
- [MDN: `anchor-size()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Functions/anchor-size)
- [MDN: Handling overflow with anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning/Try_options_hiding)
- [MDN: Anchored container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning/Anchored_container_queries)
- [MDN: `transition-behavior`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transition-behavior)
- [CSS Anchor Positioning spec: applying position options](https://drafts.csswg.org/css-anchor-position-1/#fallback-apply)
- [WAI-ARIA APG: Menu Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)

## Notes

Assumes a modern-browser-only target. Numbers (engine option limits) were
measured in mid-2026 against Chromium, Safari 26.5, and Firefox 152; treat
them as a snapshot, not a guarantee.
