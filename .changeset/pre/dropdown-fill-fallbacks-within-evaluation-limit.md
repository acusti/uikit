---
'@acusti/dropdown': minor
---

Budget the last-resort fill placements to the `position-try` evaluation
limit so a too-tall body flips and scrolls instead of opening off-screen
(fixes #399)

A too-tall body falls back to last-resort fill placements, which have to
fit within the `position-try` evaluation limit, or an engine silently drops
one and the body opens toward a viewport edge instead of flipping and
scrolling. The CSS anchor positioning spec lets engines cap the position
options list at an implementation-defined length with a floor of five,
including the element’s base position, so only four fallbacks past it are
guaranteed. In practice Chromium is the tightest, evaluating six options
(five fallbacks past the base) and silently ignoring the rest, while Safari
and Firefox evaluate many more.

The default budget is two author fallbacks plus two named fill options,
`--uktdd-fill-bottom` and `--uktdd-fill-top`, so no engine can silently
drop a fill. The two author fallbacks are the single-axis flips of the
primary (a block flip and an inline flip); the opposite diagonal flip is
dropped to stay within the floor. The cost of dropping the diagonal is that
a trigger crammed into the corner diagonal to the primary opening direction
lands in a fill rather than a fourth natural placement. Each fill pairs a
single-side `position-area` (`block-end`/`block-start`, spanning all inline
tiles so it can never be rejected for horizontal overflow) with
`justify-self: anchor-center`, which centers the body over the trigger and
shifts it inward as needed to stay on-screen (the explicitness matters:
`span-all`’s default alignment centers without that shift, so near a corner
it would overflow and be rejected). A fill is only rejected when its side
is shorter than the body’s `min-block-size` floor, and each fill caps that
floor at the larger side (roughly half the viewport, the most a
block-centered trigger can guarantee), so at least one of the pair always
fits, no additional height cap needed. The pair is appended via the new
`--uktdd-body-fill-fallbacks` custom property, so upward-opening dropdowns
can flip its order to keep the last-resort fill on their preferred side.
(Submenus have their own last-resort fills,
`--uktdd-submenu-fill-fallbacks`, rather than reusing this pair — see the
separate submenu changeset.)

In the fill placements the body spans the trigger instead of keeping the
primary placement’s edge alignment. Consumer overrides stay within the
budget: the two `--uktdd-body-position-try-fallback-1`/`-2` slots plus the
two fills, and the single `--uktdd-submenu-position-try-fallback`.

Also fixes the submenu rule’s `--uktdd-body-gap: 0` override: the unitless
zero made the fill options’ `calc(100% - var(--uktdd-body-gap) * 2)`
block-size invalid (`<percentage> - <number>`), so every fill option was
evaluated at natural size and rejected — submenu fill fallbacks never
applied, and a submenu taller than the space beside its parent item
overflowed the viewport instead of filling and scrolling. The zero now
carries a unit (`0px`).
