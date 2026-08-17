---
'@acusti/dropdown': patch
---

Give the selected item a forced-colors outline

The persistent tint on `props.value`'s matching item is a 6% `color-mix()`,
subtle by design. Under `forced-colors` mode (Windows High Contrast) that
mix still computes, but leaves next to nothing to distinguish it from the
surface, so the one visual cue for which item is selected disappears. The
item now also gets an inset outline, scoped to
`@media (forced-colors: active)` so normal rendering is unchanged.
`currentColor` rather than a fixed system color, since this item can also
be the active/hover target, whose own rule paints the same background
`Highlight` — an outline fixed to that color would vanish into its own
fill. `currentColor` instead tracks whichever color that rule leaves in
effect for this element.
