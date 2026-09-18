---
'@acusti/dropdown': minor
---

Add an `itemAs` prop to name a nested Dropdown’s item element

A nested (submenu) Dropdown picks `<li>` or `<div>` for its item element by
checking its container once it’s in the DOM, and remounts as a `<div>` when
the container isn’t a list. `itemAs="div"` (or `itemAs="li"`) names the
element up front and skips that check, so the item mounts once and server
output matches the client — for submenu bodies with mount effects of their
own, or SSR-sensitive pages. Detection stays the default; `itemAs` is
nested-only and warns anywhere else (a top-level Dropdown, or a nested
`hasItems={false}` one).
