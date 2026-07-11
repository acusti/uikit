---
'@acusti/dropdown': minor
---

Add an `openOnHover` prop to open a Dropdown on pointer hover

Setting `openOnHover` opens the dropdown as soon as the pointer hovers the
trigger. It closes a short moment after the pointer leaves the trigger and
body entirely — the close is delayed so crossing the gap between them, or a
placement fallback moving the body somewhere the pointer briefly leaves,
doesn’t flicker-close it. Click and keyboard opening (Enter/Space while
focused) keep working as usual alongside it. The prop only applies to a
top-level Dropdown; a submenu already discloses on hover intent, so
`openOnHover` is ignored (and warns) on a nested Dropdown.
