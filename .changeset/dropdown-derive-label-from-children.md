---
'@acusti/dropdown': minor
---

Derive a bare value’s label from the matching child

Showing the current value’s label in a controlled searchable dropdown
previously meant passing a `{ value, label }` pair or an `options` array.
When you render the body yourself, the dropdown now reads the label from
the child whose `data-ukt-value` matches a bare string `value` — so
`<li data-ukt-value="warm">Warm & Welcoming</li>` with `value="warm"`
displays “Warm & Welcoming” with no extra prop. The derived text
approximates the item’s rendered `innerText`; pass a `{ value, label }`
pair to override it when that isn’t what you want shown.
