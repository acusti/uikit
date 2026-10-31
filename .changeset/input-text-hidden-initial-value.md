---
'@acusti/input-text': patch
---

Keep what was typed in an `InputText` that is hidden and shown again

An `InputText` now applies `initialValue` only when it changes. When an
`<Activity>` around it is hidden and shown again, or a `<Suspense>`
boundary around it shows its fallback and then its content again, the input
keeps what was typed in it, and `discardOnEscape` still resets to
`initialValue` or to the value it had when it was last blurred, whichever
is more recent. An `initialValue` that changed while it was hidden is
applied when it is shown.

This fixes a regression in 2.7.1 for an `InputText` inside a `<Suspense>`
boundary.
