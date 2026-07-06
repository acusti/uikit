---
'@acusti/dropdown': minor
---

Add mouse-intent (safe-area) tracking so submenus don't close when the
pointer cuts diagonally toward them

When a submenu is open and the pointer moves diagonally from the parent
item toward the submenu, its path often crosses sibling items in the parent
menu. Previously that collapsed the submenu the instant the pointer touched
a sibling. Now the dropdown tracks the triangle from where the pointer left
the parent item to the open submenu's two near corners (the macOS
"diagonal" behavior): while the pointer stays inside that triangle it's
heading toward the submenu, so the submenu stays open even over sibling
items. A pause inside the triangle (rather than continued motion) gives up
and switches to the item under the pointer, and a direct move onto a
sibling (outside the triangle) switches immediately as before.
Pointer-only; keyboard navigation is unaffected.
