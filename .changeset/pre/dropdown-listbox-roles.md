---
'@acusti/dropdown': minor
---

Add listbox and menu item roles

On open, the dropdown fills in the ARIA roles a consumer hasn’t set:
`option` on items in a searchable (listbox) dropdown and `menuitem` in a
menu — and always `menuitem` inside a submenu, which is itself a menu. The
`<ul>`/`<ol>` wrappers around items get `role="presentation"` so the
listbox/menu owns its items directly instead of through an intervening
list. A natively interactive item (button, link, input) and any item with a
consumer-set role keep their own role, and a submenu parent item in a
listbox gets no role at all (its disclosure ARIA is invalid on an
`option`). (`aria-selected` on the current option is set by the
reveal-on-open behavior — unless aria-selected is consumer-authored, in
which case selection ARIA is left entirely to the consumer.)
