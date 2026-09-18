---
'@acusti/dropdown': major
---

Render a nested Dropdown’s item element as a `<div>` outside a list

A nested (submenu) `Dropdown` always rendered its item element as an
`<li>`, which is invalid HTML in a body built from `<div data-ukt-item>`
items rather than a `<ul>`. The item element is now an `<li>` when its
container is a `<ul>`, `<ol>`, or `<menu>` and a `<div>` anywhere else, so
once mounted it is valid HTML in either. The container isn’t knowable until
the item is in the DOM, so it mounts as an `<li>` and switches before paint
when the container turns out not to be a list; a nested Dropdown inside a
list renders exactly as before. Server output still carries the `<li>`;
pass `itemAs` when it must be valid too.

A nested Dropdown now also fills in its own ARIA (its `menuitem` role and
disclosure attributes, and its submenu’s) when it registers with the root,
rather than relying only on the once-per-open pass — so one rendered into
an already-open body gets its own roles too (that pass still doesn’t reach
anything else added late, a list wrapper around it included). A `<menu>`
wrapper around items is now neutralized with `role="presentation"` like
`<ul>`/`<ol>`, so it no longer sits between the menu and its items in the
accessibility tree.

**Migration:** a nested Dropdown whose container isn’t a list now renders a
`<div>` item element instead of an `<li>`. Selectors or test queries that
assumed `li` for that case (`li[data-ukt-item]`, `getByRole('listitem')`)
should target `[data-ukt-item]` instead. Inside a `<ul>`, `<ol>`, or
`<menu>` nothing changes.
