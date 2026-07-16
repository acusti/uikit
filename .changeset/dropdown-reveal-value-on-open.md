---
'@acusti/dropdown': minor
---

Reveal the current value when the dropdown opens

A controlled dropdown now opens with the item whose `data-ukt-value`
matches `props.value` marked `aria-selected`, made the active item (so
keyboard navigation starts from it), and scrolled into view — so a long
list opens showing, and scrolled to, the current selection instead of the
top. The persistent selection tint is themeable via the new
`--uktdd-body-bg-color-selected` custom property.
