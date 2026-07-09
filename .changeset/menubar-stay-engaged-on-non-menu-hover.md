---
'@acusti/dropdown': patch
---

Keep a Menubar engaged when the pointer moves onto a non-menu control

A `Menubar` now tracks an explicit menu-mode: opening a trigger’s menu (by
click or keyboard) engages the bar, and it stays engaged until a deliberate
dismissal (Escape, a click outside the bar, or selecting an item). While
engaged, hovering a non-menu control placed alongside the dropdowns — e.g.
a plain button — closes the open menu but keeps the bar engaged, so
hovering back onto a trigger reopens a menu without another click.
Previously such a hover did nothing (the open menu stayed put), and the bar
was only ever “active” while a menu happened to be open. Sliding across the
gaps between triggers still leaves the open menu alone, so menu-to-menu
hovering stays seamless.
