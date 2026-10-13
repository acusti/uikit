---
'@acusti/dropdown': patch
---

Fix a dropdown acting on the keys of an IME composition

A dropdown now ignores the keys an IME takes while text is being composed,
so that the Enter that commits a composition doesn’t also submit the
dropdown, the arrow keys don’t move the dropdown highlight, and Escape
doesn’t close it.
