---
'@acusti/dropdown': minor
---

Give Menubar real menubar semantics

Each member’s trigger now takes `role="menuitem"`, and the wrapper elements
between it and the bar are neutralized with `role="none"`. Previously the
bar owned only generic elements, so it was reported as a menubar with no
menu items at all. Its menu items also share a single tab stop now (a
roving tabindex that follows the last-focused trigger), where every trigger
used to be its own tab stop.

A searchable member keeps its `combobox` semantics and stays out of the
roving set. Note that a combobox isn’t valid menubar content in the first
place — put a search field outside the `Menubar`.

**Upgrading:** this changes the triggers’ exposed role, so anything
selecting a menubar member’s trigger by role needs `menuitem` rather than
`button`. Standalone dropdowns outside a `Menubar` are unaffected.
