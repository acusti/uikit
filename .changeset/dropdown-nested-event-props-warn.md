---
'@acusti/dropdown': patch
---

Warn that a nested Dropdown ignores `onClick`, `onMouseDown`, and
`onMouseUp`

A nested (submenu) Dropdown renders a parent item rather than a root
element, so the three root-element event props had nowhere to go and were
dropped silently. They now join the props a nested Dropdown warns about
ignoring, and their docs say so.

These ignored-prop warnings (including the one for `itemAs` outside a
submenu) are advisory, so they now go to `console.warn` rather than
`console.error`, as does the message for more than two children (logged
once per mount rather than on every render). Rendering a Dropdown with no
children still throws.
