---
'@acusti/css-value-input': minor
---

Forward aria-\* attributes and role to the underlying input

`Props` didn’t include any of the ARIA attributes, so annotating the input
— `aria-describedby` for a hint, `aria-invalid` on a rejected value —
wasn’t possible. The only name the input could get came from `label` or,
for the icon-only case, the `aria-label` the component puts on its wrapping
`<label>` from `title`, neither of which the consumer could override.

`Props` now intersects React’s `AriaAttributes` and adds `role`, and any of
those props not consumed by the component are spread onto the nested input.
An `aria-label` passed in names the input and, by the accessible name
precedence, wins over the wrapper’s label text or title.
