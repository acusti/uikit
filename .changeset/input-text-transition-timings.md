---
'@acusti/input-text': patch
---

Keep the transition timings in a `multiLine` input’s `style`

In browsers without `field-sizing: content`, a `multiLine` input now keeps
the transition timings from its `style` prop when it resizes. They were
erased on each keystroke when typing re-rendered an input whose callback
ref is written inline, and a `style` change made while it resized was
undone.
