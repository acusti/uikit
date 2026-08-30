---
'@acusti/input-text': patch
---

Type props.ref as the element the component actually renders

`props.ref` promised an `HTMLInputElement`, but under `multiLine` the
component renders a `<textarea>` and the ref receives an
`HTMLTextAreaElement`. Anything reading an input-only API off the ref was
unsound in multi-line mode, and the README’s own chat example passes a ref
to a `multiLine` input.

`props.ref` and the internal ref type are now `InputElement`, the union
this package already exports and uses for its event handler types. Existing
refs keep working: a narrowly typed object ref stays assignable, and so
does a narrowly typed callback ref, since React declares `RefCallback` with
the bivariance hack.
