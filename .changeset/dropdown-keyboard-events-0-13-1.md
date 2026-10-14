---
'@acusti/dropdown': patch
---

Fix the keyboard in a dropdown inside a frame with its own document

`@acusti/dropdown` now requires `@acusti/use-keyboard-events` 0.13.1. In
Chrome, a dropdown rendered into a same-origin frame that had loaded a
document of its own (a `srcdoc`, for example) ignored the keyboard if a
component using the hook had mounted while the frame was still blank.
