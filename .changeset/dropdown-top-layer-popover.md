---
'@acusti/dropdown': major
---

Render the dropdown body in the top layer and add margin-based gap knobs
for robust anchor positioning

The dropdown body now renders in the top layer via `popover="manual"`. A
top-layer element’s containing block is always the viewport, so an ancestor
with a `transform`, `scale`, `filter`, `backdrop-filter`, `perspective`,
`will-change: transform`, or `contain` can no longer capture the
`position: fixed` body and break its placement — `position-try` fallbacks
that used to stop firing (and base `position-area` directions that could
resolve to the wrong side) now work regardless of a consumer’s ancestors,
so consumer-side de-transforming workarounds are no longer needed.

- Dismissal stays under the component’s control (`popover="manual"` plus
  the existing `mousedown`/`mouseup`/`focusin` listeners on `document` and
  the owner document), so outside-click, focus, and iframe handling are
  unchanged and searchable/text-input triggers — whose input sits outside
  the body — keep the body open while you interact with them, which native
  light-dismiss (`popover="auto"`) would not
- Submenus still anchor to their parent item and escape the body’s
  `overflow: hidden` in the top layer; the body’s `z-index` is dropped
  since the top layer handles stacking, and the UA popover box resets
  (`inset`/`block-size`/`margin`/`border`/`padding`) are applied at a
  specificity that also overrides a consuming app’s global `[popover]`
  styles, so neither the UA defaults nor a consumer’s popover CSS can break
  the anchor-positioning layout
- New `--uktdd-body-gap` and `--uktdd-submenu-gap` custom properties
  (default `0`) express the space between the trigger and the body (as a
  symmetric `margin-block`) and between a parent item and its submenu (as
  `margin-inline`). A margin auto-reverses to the attached side when
  `position-try` flips the box and establishes no containing block, so it
  is safe on dropdowns with submenus
- **Breaking:** the `--uktdd-body-translate` and
  `--uktdd-submenu-translate` custom properties are removed.
  `--uktdd-body-gap`/`--uktdd-submenu-gap` cover the trigger↔body and
  item↔submenu spacing; for an offset a gap can’t express (a horizontal
  nudge or a deliberate overlap), set `translate` on `.uktdropdown-body`
  directly
- README documents the top-layer rendering, the gap knobs, and that a
  `center` `position-area` tile never flips (use a full-width `span-all`
  tile to center over the trigger instead)
