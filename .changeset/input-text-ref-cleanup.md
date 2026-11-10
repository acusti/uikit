---
'@acusti/input-text': patch
---

Clear a multi-line `InputText`’s `ref` when its textarea is removed

In browsers without `field-sizing: content` support, a `ref` passed to a
`multiLine` `InputText` kept pointing at its `<textarea>` after it was
removed. An object ref is now set to `null`, and a callback ref is called
with `null` unless it returned a cleanup function, as React does for a ref
on a DOM element.
