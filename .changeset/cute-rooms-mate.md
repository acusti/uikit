---
'@acusti/dropdown': patch
---

Polish dropdown sizing defaults by removing `scrollbar-gutter: stable` from
`.uktdropdown-content` and by only emitting `--uktdd-body-min-height` when
`props.minHeightBody` is explicitly provided. This avoids reserving an
empty gutter for always-visible scrollbars when the dropdown isn’t
scrollable and keeps the default `30px` min-height in the CSS and not as
inline styles.
