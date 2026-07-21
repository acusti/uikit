---
'@acusti/dropdown': minor
---

Keep a too-tall submenu beside its parent instead of covering the parent
menu, and give submenus their own last-resort fills decoupled from the
body’s

Previously a submenu that fit nowhere beside its parent fell back to the
body’s block-side fills (`--uktdd-body-fill-fallbacks`), which cover the
anchor — wrong for a submenu, since macOS never covers a parent menu with
its submenu, and it coupled the two: flipping the body’s fill pair for an
upward-opening dropdown silently reordered its submenus’ rescue too. That
list was also five fallbacks, one past the spec’s guaranteed floor.

Submenus now use a new `--uktdd-submenu-fill-fallbacks` (default
`--uktdd-submenu-fill, --uktdd-submenu-fill flip-inline`) and a new
`--uktdd-submenu-fill` placement: a full-height fill on each inline side
that spans the viewport’s block axis (a bare `inline-end` keyword, the
block-axis mirror of `--uktdd-fill-bottom`) and anchor-centers on the block
axis, so a submenu taller than the room beside its parent fills the
viewport height next to the parent item and scrolls — shifting on-screen
even when the parent sits near the block-end edge — rather than covering
the parent menu. The submenu list is now one author fallback plus these two
fills, three past the base and within the spec’s five-option floor (no
reliance on an engine evaluating past it), and independent of
`--uktdd-body-fill-fallbacks`.

The one case this gives up versus covering the parent — a submenu wider
than the space on either side of its parent — is out of scope for the
narrow columns of a macOS-style menu; a consumer who needs it can append
`--uktdd-fill-bottom, --uktdd-fill-top` to `--uktdd-submenu-fill-fallbacks`
(keeping `--uktdd-submenu-position-try-fallbacks` to a single option to
stay within the evaluation limit).
