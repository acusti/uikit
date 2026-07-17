---
'@acusti/dropdown': major
---

Make the authored placement direction win whenever it fits, instead of
letting `position-try-order: most-height` override it. The body (and each
submenu) now uses its `--uktdd-body-position-area` primary placement — and
then its `--uktdd-body-position-try-fallbacks` in order — accepting the
first that fits at the box’s natural size, and only squeezing-and-scrolling
as a last resort. Previously `position-try-order: most-height` re-sorted
the candidates by available height, so a dropdown told to open above with
ample room above could still open below merely because the viewport had
more empty space there.

Removed `position-try-order: most-height` from `.uktdropdown-body` and
dropped the `100%` term from its base `max-block-size` (a placement is now
accepted only when the body fits it at natural size, so it no longer
silently shrinks under the primary). When the body fits nowhere at natural
size, four appended `--uktdd-fill` fallbacks size it to the available
block-axis space and let `.uktdropdown-content` scroll, staying as close to
the primary placement as possible: same side first, flipping inline
alignment only to escape a horizontal-overflow rejection, and flipping to
the opposite block side only when the preferred side is under
`--uktdd-body-min-height`. Submenus gained a `min-block-size` so the same
too-short-side rejection applies to them.

**Migration:** if you relied on `most-height` to auto-open a dropdown
toward whichever side had more room (for example the README’s centered-menu
recipe, which flipped `bottom span-all` to `top span-all` on the taller
side), it now stays on its primary side while that side can hold the body
and flips only when the body doesn’t fit there. Set
`--uktdd-body-position-area` to the side you actually want as the default,
and list the flipped side first in `--uktdd-body-position-try-fallbacks`.
If you referenced `--uktdd-fill` as a custom `@position-try` name, rename
yours — it’s now shipped by the package.
