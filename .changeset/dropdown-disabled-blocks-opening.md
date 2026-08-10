---
'@acusti/dropdown': patch
---

Stop a disabled dropdown from opening

`props.disabled` was enforced only by `.uktdropdown.disabled`'s
`pointer-events: none`, which stops the mouse and nothing else — a disabled
dropdown still opened from the keyboard, from typing in a custom trigger's
text input, and via `Menubar` navigation. Every path that opens a dropdown
now checks it, and a disabled `Menubar` member is skipped rather than
landed on. A dropdown disabled while already open still closes normally.
