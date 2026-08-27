---
'@acusti/dropdown': patch
---

Keep the menubar’s ←/→ out of a searchable member’s input

A `Menubar` member whose popup is a menu joins the bar’s roving tabindex; a
searchable member is a `combobox` instead, and the role, tab stop, and
`menuitem` semantics all already exempted it. The bar’s own ←/→ handler
didn’t: it matched any member containing the event target and skipped only
disabled ones, so pressing ← or → in a searchable member’s search input was
consumed by the bar and moved focus to the next menu trigger instead of
moving the caret. Roving in the other direction landed on the combobox that
never participates in the bar.

←/→ now stand down while a text input has focus — a searchable member’s own
input, or one inside a custom trigger — matching the rule the members’ own
key handling already followed, and the bar’s navigation passes over any
member that isn’t a menu item.
