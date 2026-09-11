---
'@acusti/dropdown': minor
---

Export `DropdownProps` and `StyleWithCustomProperties`, and let `Menubar`’s
style prop take custom properties

`Props` is now also exported as `DropdownProps`, the name that pairs with
`MenubarProps` (the existing `Props` export is unchanged). The `style`
prop’s type — `React.CSSProperties` extended to accept the `--uktdd-*`
custom properties — is exported as `StyleWithCustomProperties` and is now
the type of `Menubar`’s `style` prop too, which previously rejected them.
