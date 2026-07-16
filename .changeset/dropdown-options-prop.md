---
'@acusti/dropdown': minor
---

Add an `options` prop for a data-driven dropdown body

Rendering the body yourself means writing the `<li data-ukt-value>` items
and, for a controlled searchable dropdown whose labels differ from their
values, resolving the current value’s label to display and mapping the
submitted label back to a value. `options` — a
`ReadonlyArray<{ label, value }>` — does both: the dropdown renders the
list from it and derives the searchable input’s displayed label from the
option matching `props.value`, so `value` can be the bare identifier.
`onSubmitItem` still reports the `{ label, value }` pair. With `options`,
`children` is optional and, if provided, is the trigger. Keep rendering
`children` yourself when items need custom markup, grouping, or submenus.
