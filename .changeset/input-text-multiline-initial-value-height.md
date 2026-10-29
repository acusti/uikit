---
'@acusti/input-text': patch
---

Resize a `multiLine` input to fit a new `initialValue`

In browsers without `field-sizing: content`, a `multiLine` input now
resizes to fit a new `initialValue` before the browser paints it. A note
field that its parent empties after saving, for example, shrinks back to
the height of an empty field, and an edit form’s field grows to fit the
record it loads.
