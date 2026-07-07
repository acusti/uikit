---
'@acusti/dropdown': major
---

Remove the `minHeightBody` and `minWidthBody` props

These props were only sugar for the `--uktdd-body-min-height` /
`--uktdd-body-min-width` CSS custom properties, and they had no `max`
counterparts (max sizing was already CSS-only), so they left the sizing API
half in props and half in CSS. Placement and sizing are customized in CSS,
so set the body’s minimum size with the CSS variables directly — e.g.
`style={{ '--uktdd-body-min-width': '180px' }}` or a rule on the dropdown’s
class. The `style` prop’s type now accepts the component’s CSS custom
properties, so that inline form type-checks without a cast.
