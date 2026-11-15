---
'@acusti/input-text': patch
---

Resize a `multiLine` input when its form is reset

In browsers without `field-sizing: content`, a `multiLine` input now
resizes to fit the value that a reset of its form restores, from a
`<button type="reset">` or from `form.reset()`, instead of keeping the
height of the text that the reset cleared.
