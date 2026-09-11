---
'@acusti/dropdown': patch
---

Correct the README’s prop contracts and add a reference for the CSS API

The README’s `Props` block had drifted from the shipped type: it said
`hasItems` was inferred from the children (it is unconditionally `true`),
typed the single-child form as any `ReactNode` (it must be a React
element), never stated that `keepOpenOnSubmit` defaults to `!hasItems`, and
described `Item.element` as the clicked element without noting it is `null`
for values submitted from a text input. Every prop and `Item` field now
carries the same doc comment in the source, so the emitted declarations say
the same thing as the README.

Also adds a complete reference of every `--uktdd-*` custom property with
its default, the shipped `@position-try` placements, and the class names
and `data-ukt-*` attributes the rendered DOM exposes.
