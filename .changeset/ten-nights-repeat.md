---
'@acusti/dropdown': minor
---

Add ARIA wiring to the trigger and body so screen readers can associate
them. The trigger automatically receives `aria-haspopup`, `aria-expanded`,
and `aria-controls`, and the open body element receives a matching `role`
and an `id`. The popup role adapts to the dropdown’s mode: `listbox` for
`isSearchable`, `menu` for the default item-selection mode, and `dialog`
when `hasItems={false}` (interactive form content). Consumer-provided
triggers are cloned with these props only when they haven’t already been
set, so existing ARIA overrides win.

Also: replace the `JSX.Element` type in the `Props.children` union with
`ReactElement` (identical at runtime, more portable across React 19+ type
setups), and improve README docs — stronger "don’t double-pad" guidance for
`.uktdropdown-content`, a callout explaining _why_ `hasItems={false}`
matters on the Interactive Content example, and a cross-link from the
Layout Model to the End-Aligned placement recipe.
