---
'@acusti/dropdown': minor
---

Render a nested Dropdown’s parent item as a `<div>` outside a list

A nested (submenu) `Dropdown` always rendered its parent item as an `<li>`,
which is invalid HTML in a body built from `<div data-ukt-item>` items
rather than a `<ul>`. The parent item is now an `<li>` when its container
is a `<ul>`, `<ol>`, or `<menu>` and a `<div>` anywhere else. The container
isn’t knowable until the item is in the DOM, so it mounts as an `<li>` and
switches before paint when the container turns out not to be a list; a
nested Dropdown inside a list renders exactly as before.

A nested Dropdown now also fills in its own ARIA (its `menuitem` role and
disclosure attributes, and its submenu’s) when it registers with the root,
rather than relying only on the once-per-open pass — so one rendered into
an already-open body gets its roles too.
