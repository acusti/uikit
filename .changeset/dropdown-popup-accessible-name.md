---
'@acusti/dropdown': minor
---

Give the popup body an accessible name

The open body now takes `aria-labelledby` pointing at whatever names the
trigger — `props.label` if you pass one, otherwise the trigger element.
Previously it carried a `role` but no name, so `hasItems={false}` rendered
an unnamed `dialog`.

Two shapes stay unnamed, because the trigger has no name to lend: a text
input trigger (`aria-labelledby` resolves one to its value) and an empty
generated trigger (single-child syntax with no `props.label`). Pass
`props.label` to name either.
