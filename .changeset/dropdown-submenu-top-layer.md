---
'@acusti/dropdown': major
---

Render submenus in the top layer via `popover="manual"`, the same way the
body already is, so no ancestor — including the body’s own top-layer
popover box — can become the containing block for a submenu and shift its
anchor placement. Previously each submenu was a plain `position: fixed`
element, so its placement depended on which box the browser treated as its
containing block. In Safari (which, per spec, shifts a `position-area` box
back inside its containing block on both axes) the submenu was clamped into
the parent menu’s box and rendered overlapping its parent item instead of
flush to the item’s inline-end edge; Chrome happened to look correct only
because of a Chromium bug that skips the inline-axis shift.

The submenu’s disclosure is now driven by its popover open state
(`showPopover`/`hidePopover`, tracked to the parent item’s expanded state)
rather than a CSS `display` toggle, matching the body. This also makes
submenus immune to a transformed/filtered/contained ancestor becoming their
containing block, the same guarantee the body gained from top-layer
rendering. Consumers styling `[data-ukt-submenu]` should not set `display`
on it (the popover open state controls visibility) and should expect it to
render in the top layer.
