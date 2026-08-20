---
'@acusti/dropdown': patch
---

Let a Dropdown nested inside a non-menu dropdown be an independent menu

A `Dropdown` nested inside another `Dropdown`'s body was promoted to a
submenu whenever it was itself a menu, regardless of the outer dropdown —
so an independent, click-to-select picker embedded in a `hasItems={false}`
dialog had no way to work (as a submenu it needed hover-intent to open, and
the `hasItems={false}` escape hatch also disables item selection). Submenu
context is now provided only by _menu_ dropdowns, so a `Dropdown` nested
inside a `hasItems={false}` dropdown renders as an independent anchored
dropdown with normal click-to-open and click-to-select on its
`data-ukt-value` items. Nested submenus (menu-in-menu) and info popovers
(`hasItems={false}` nested anywhere) are unchanged.
