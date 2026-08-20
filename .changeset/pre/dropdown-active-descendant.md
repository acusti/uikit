---
'@acusti/dropdown': minor
---

Expose the active item to screen readers with aria-activedescendant

The trigger now points at the highlighted item, kept in sync as the
highlight moves and cleared when the dropdown closes. Focus stays on the
trigger while a dropdown is open, so without this, arrowing through a menu
was silent to assistive tech.

Items need ids to be pointed at, and get generated ones derived from the
body’s id plus their index path. Treat them as internal: they are
re-derived whenever an item becomes active, so filtering or reordering an
open body reassigns them. Ids you set yourself are never touched.
