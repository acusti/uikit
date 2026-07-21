---
'@acusti/dropdown': minor
---

Keep the last-resort fill placements within the `position-try` evaluation
limit so a too-tall body flips and scrolls instead of opening off-screen
(fixes #399)

The CSS anchor positioning spec lets engines cap how many
`position-try-fallbacks` options they evaluate, as low as five — and
Chromium evaluates exactly five, silently ignoring the rest. The body’s
previous list was three author fallbacks plus four `--uktdd-fill` tactic
variants (seven options), so the block-flipped fills that rescue a
near-viewport-height body at a block-axis viewport edge were never
evaluated: the body opened toward the edge and ran off-screen, and
consumers had to cap `--uktdd-body-max-height` to work around it.

The four appended tactic fills are replaced by two new named options —
`--uktdd-fill-bottom` and `--uktdd-fill-top` — bringing the default list to
exactly five. Each fill pairs a single-side `position-area`
(`block-end`/`block-start`, spanning all inline tiles so it can never be
rejected for horizontal overflow) with `justify-self: anchor-center`, which
centers the body over the trigger and shifts it inward as needed to stay
on-screen (the explicitness matters: `span-all`’s default alignment centers
without that shift, so near a corner it would overflow and be rejected). A
fill is only rejected when its side is shorter than the body’s
min-block-size floor — what sends a cramped side’s fill to the roomier
opposite side — and each fill caps that floor at the worst-case larger side
(half the viewport minus the trigger, the most a block-centered trigger can
guarantee), so at least one of the pair always fits — for every trigger
position, including corners and a `--uktdd-body-min-height` above half the
viewport, with no height cap needed. The pair is appended via the new
`--uktdd-body-fill-fallbacks` custom property, so upward-opening dropdowns
can flip its order to keep the last-resort fill on their preferred side.

In the fill placements the body now spans the trigger (anchor-centered,
shifted to fit) instead of keeping the primary placement’s edge alignment.
Consumer fallback lists must stay within the same budget: at most three
options in `--uktdd-body-position-try-fallbacks`, and a single option in
`--uktdd-submenu-position-try-fallbacks` (the submenu list is now its
author fallback, `--uktdd-fill`, `--uktdd-fill flip-inline`, then the two
block-side fills — also exactly five).

Also fixes the submenu rule’s `--uktdd-body-gap: 0` override: the unitless
zero made the fill options’ `calc(100% - var(--uktdd-body-gap) * 2)`
block-size invalid (`<percentage> - <number>`), so every fill option was
evaluated at natural size and rejected — submenu fill fallbacks never
applied, and a submenu taller than the space beside its parent item
overflowed the viewport instead of filling and scrolling. The zero now
carries a unit (`0px`).
