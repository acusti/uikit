---
'@acusti/dropdown': patch
---

Let your own font rules win over the dropdown’s font

The dropdown’s font (`--uktdd-font-family`) now applies at zero specificity
to the wrapper, the trigger and the menu bar, so your own unlayered font
rules, such as one on `button`, now win over it. If you set a font on
buttons globally, your triggers now use it; to keep the dropdown’s font on
them, add
`.uktdropdown-trigger { font-family: var(--uktdd-font-family); }`.
