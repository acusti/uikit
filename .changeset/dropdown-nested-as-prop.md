---
'@acusti/dropdown': minor
---

Add an `as` prop to name a nested Dropdown’s parent item element

A nested (submenu) Dropdown picks `<li>` or `<div>` for its parent item by
checking its container once it’s in the DOM, and remounts as a `<div>` when
the container isn’t a list. `as="div"` (or `as="li"`) names the element up
front and skips that check, so the item mounts once and server output
matches the client — for submenu bodies with mount effects of their own, or
SSR-sensitive pages. Detection stays the default; `as` is nested-only and
warns on a top-level Dropdown.
