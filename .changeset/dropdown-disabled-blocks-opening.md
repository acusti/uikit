---
'@acusti/dropdown': patch
---

Stop a disabled dropdown from opening via the keyboard

`props.disabled` was enforced only by `.uktdropdown.disabled`’s
`pointer-events: none`, which stops the mouse and nothing else: the
generated trigger got no `disabled` attribute, and the key handler never
consulted the prop, so focusing a disabled dropdown’s trigger and pressing
Enter or Space opened it. The generated button now carries the native
`disabled` attribute (as the searchable dropdown’s input already did), and
the paths that open the dropdown — key, mousedown, and `props.openOnHover`
hover — check the prop, so a custom trigger (which can be any element, and
so can’t rely on the native attribute) is covered too. A custom trigger
additionally receives `aria-disabled`, filled in like the other trigger
ARIA, so a consumer-set value still wins. Only opening is gated: a dropdown
disabled while already open still closes on Escape.
