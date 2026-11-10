---
'@acusti/dropdown': minor
---

Add a chevron to the generated trigger button

A dropdown whose trigger is the generated button now shows a down chevron
after the button’s text, painted in the trigger’s text color. Searchable
and `Menubar` triggers don’t get one, nor does a custom trigger unless it
uses the `uktdropdown-trigger` class. Style it with
`--uktdd-trigger-icon-size`, `--uktdd-trigger-icon-stroke`,
`--uktdd-trigger-icon-gap`, and `--uktdd-trigger-icon-rotate` (set it to
`180deg` on a dropdown that opens upward). The stroke applies to the
built-in chevron only, and only in browsers that support `shape()`.

To use your own icon instead, set `--uktdd-trigger-icon` to an SVG `url()`
or a gradient, used as a mask. To have no icon, set it to `none`. If your
triggers already show an open indicator, you’ll now see the built-in
chevron next to it (or in its place, if yours is drawn on `::after`), so
move your icon into `--uktdd-trigger-icon` or set it to `none`.

The trigger is now `white-space: nowrap`, like a native `<select>`, so the
chevron stays beside the label. A trigger with a fixed width needs room for
it (about 1.2em at the default size and gap); a label that no longer fits
overflows instead of wrapping. To let a long label wrap with the chevron in
its own column, see the README’s flex recipe.
