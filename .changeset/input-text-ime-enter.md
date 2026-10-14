---
'@acusti/input-text': patch
---

Leave the Enter that commits an IME composition to the IME

`InputText` no longer submits, blurs or finishes a `doubleClickToEdit` edit
on the Enter that commits a composition (e.g. Japanese, Chinese or Korean
input), so the next Enter does. The key still reaches `onKeyDown`.
