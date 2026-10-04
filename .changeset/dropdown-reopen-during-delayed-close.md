---
'@acusti/dropdown': patch
---

Reopen a dropdown pressed or hovered as a delayed close lands

For a moment after a delayed close (the short delay after an item pick, or
an `openOnHover` close), the dropdown still counted itself as open, because
the open state its handlers read lagged a task behind the page. A press on
the trigger, or the pointer returning to an `openOnHover` trigger, landing
in that moment didn’t reopen it. It now does.
