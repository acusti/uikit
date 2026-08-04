---
'@acusti/dropdown': patch
---

Stop a disabled dropdown from opening

`props.disabled` was enforced only by `.uktdropdown.disabled`’s
`pointer-events: none`, which stops the mouse and nothing else: the
generated trigger got no `disabled` attribute, and the key handler never
consulted the prop, so focusing a disabled dropdown’s trigger and pressing
Enter or Space opened it. The generated button now carries the native
`disabled` attribute (as the searchable dropdown’s input already did), and
every path that opens the dropdown checks the prop, so a custom trigger —
which can be any element, and so can’t rely on the native attribute — is
covered too:

- key, mousedown, and `props.openOnHover` hover
- typing in a custom trigger’s text input, which `aria-disabled` doesn’t
  make inert the way the native attribute makes the generated one
- a `Menubar` sliding the open menu onto the member with ←/→, or switching
  to it on hover, neither of which passes through the dropdown’s own
  handlers

A disabled `Menubar` member is now skipped rather than landed on, matching
macOS, and ←/→ keep the current menu open when there’s no enabled member to
move to instead of closing it and opening nothing. A custom trigger
additionally receives `aria-disabled`, filled in like the other trigger
ARIA, so a consumer-set value still wins. Only opening is gated: a dropdown
disabled while already open still closes on Escape.
