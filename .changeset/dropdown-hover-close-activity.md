---
'@acusti/dropdown': patch
---

Fix an `openOnHover` Dropdown coming back open after `<Activity>` hides it

A Dropdown that `<Activity mode="hidden">` hides within 150ms of the
pointer leaving it now closes as it is hidden, so it is closed when shown
again.
