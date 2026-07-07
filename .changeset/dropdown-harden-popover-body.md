---
'@acusti/dropdown': patch
---

Keep the dropdown body’s layout intact under global `[popover]` styles

The body renders in the top layer via the Popover API, so a consuming app’s
global `[popover]` rules (padding, border, etc.) match it and — tying
`.uktdropdown-body` on specificity — could win on source order and break
the dropdown’s geometry. The UA-popover box resets now live in a
`div.uktdropdown-body` rule (specificity `0,1,1`, the lightest bump that
still overrides a bare `[popover]`), so the layout holds regardless of a
consumer’s popover styling. The body’s cosmetics (background, box-shadow,
color) stay at normal specificity and remain overridable.
