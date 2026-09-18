---
'@acusti/dropdown': patch
---

Warn that a nested Dropdown ignores `onClick`, `onMouseDown`, and
`onMouseUp`

A nested (submenu) Dropdown renders a parent item rather than a root
element, so the three root-element event props had nowhere to go and were
dropped silently. They now join the props a nested Dropdown warns about
ignoring, and their docs say so.
