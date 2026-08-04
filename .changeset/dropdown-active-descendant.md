---
'@acusti/dropdown': minor
---

Expose the active item to screen readers with aria-activedescendant

DOM focus stays on the trigger while the dropdown is open — the highlight
moves via `data-ukt-active` rather than by moving focus — and nothing
conveyed that to assistive technology. A screen reader announced the
trigger and then went silent for every arrow key, typeahead jump, hover,
and submenu dive, which left the component’s keyboard navigation
effectively invisible.

The trigger now carries `aria-activedescendant` pointing at the highlighted
item, kept in sync wherever active state changes: arrow keys, Home/End,
typeahead, hover, diving into and out of submenus, and the reveal of
`props.value` on open. It’s removed when nothing is highlighted and when
the dropdown closes, so it never points at an item that has unmounted.

Items need ids to be pointed at, and they’re derived from the same `useId`
behind the trigger and body ids, suffixed with the item’s index path — its
index at each level from the root level down, so `<bodyId>-2-1` is the
second item of the submenu belonging to the third top-level item. That’s
deterministic and collision-free without a module-level counter. An item
carrying an `id` of its own keeps it.

Ids are minted when an item becomes active rather than during the open-time
annotation pass, which means items rendered into an already-open body
(async-loaded, or filtered by a consumer’s own search) get one too, even
though that pass doesn’t reach them. Indices come from the navigable items,
so a disabled item shifts the ids after it; they’re minted and consumed
within a single open and rewritten on every move, so nothing depends on
them being stable.
