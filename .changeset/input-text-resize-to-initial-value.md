---
'@acusti/input-text': patch
---

Size a multi-line `InputText` to a new `initialValue`

In browsers without `field-sizing: content` support, a `multiLine`
`InputText` now resizes to fit a new `initialValue`, e.g. `''` to empty it
once its form is submitted (previously it kept its height until it was next
typed in or focused).
