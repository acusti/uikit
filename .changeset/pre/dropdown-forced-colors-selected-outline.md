---
'@acusti/dropdown': patch
---

Give the selected item a forced-colors outline

The persistent tint on `props.value`’s matching item is a 6% `color-mix()`,
subtle by design. Under `forced-colors` mode (Windows High Contrast) that
mix still computes, but leaves next to nothing to distinguish it from the
surface, so the one visual cue for which item is selected disappears. The
item now also gets an inset outline in `currentColor`, scoped to
`@media (forced-colors: active)` so normal rendering is unchanged.
