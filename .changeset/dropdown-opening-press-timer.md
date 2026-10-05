---
'@acusti/dropdown': patch
---

Stop an earlier open’s press timer from closing a later open

When the press that opened a dropdown ended before its release (by
dragging, as in a press-drag-release pick, or by Escape), that press’s
one-second timer kept running. If the trigger was clicked again about a
second after that press began, the timer could go off while the mouse
button was held down, so the menu opened and then closed again on release.
The timer now ends whenever the press does, including when the dropdown
closes.
