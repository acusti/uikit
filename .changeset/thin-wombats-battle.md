---
'@acusti/input-text': patch
---

Update InputText to emit a change event when discarding via Escape with
discardOnEscape set to true if the action results in a value change (plus
new tests verifying the behavior)
