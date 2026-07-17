---
'@acusti/dropdown': minor
---

Reveal the current value when the dropdown opens

A controlled dropdown now opens with the item whose `data-ukt-value`
matches `props.value` made the active item (so keyboard navigation starts
from it) and scrolled into view — so a long list opens showing, and
scrolled to, the current selection instead of the top. In a searchable
(listbox) dropdown the item is also marked `aria-selected` (`aria-selected`
isn’t valid on a `menuitem`, so menus get the active highlight without it).
The persistent selection tint is themeable via the new
`--uktdd-body-bg-color-selected` custom property.
