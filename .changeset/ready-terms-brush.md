---
'@acusti/input-text': patch
---

Fix `multiLine` `InputText` keyboard handling when `submitOnEnter` is
combined with `doubleClickToEdit`: `Shift+Enter` now inserts a newline
instead of submitting, and pressing `Enter` on a focused read-only input
now enters edit mode instead of submitting (plus regression tests covering
both keyboard interactions).
