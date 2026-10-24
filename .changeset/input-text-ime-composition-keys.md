---
'@acusti/input-text': patch
---

Fix `InputText` acting on the keys of an IME composition

`InputText` now ignores the Enter and Escape that an IME takes while text
is being composed, so that the Enter that commits a composition doesn’t
also submit, blur the input or finish a `doubleClickToEdit` edit, and the
Escape that cancels one doesn’t also discard the changes
(`discardOnEscape`) or end the edit. Both keys still reach `onKeyDown`.
