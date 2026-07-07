---
'@acusti/dropdown': minor
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
  since the top layer handles stacking, and the UA popover styles
  (`inset`/`margin`/`border`/`padding`/`color`) are reset so they can’t
  override the anchor-positioning layout
- New `--uktdd-body-gap` and `--uktdd-submenu-gap` custom properties
  (default `0`) express the space between the trigger and the body (as a
  symmetric `margin-block`) and between a parent item and its submenu (as
  `margin-inline`). Unlike the `--uktdd-body-translate`/
  `--uktdd-submenu-translate` knobs they supersede, a margin auto-reverses
  to the attached side when `position-try` flips the box, and establishes
  no containing block, so it is safe on dropdowns with submenus; the
  translate knobs remain for legacy 2-D nudges
- README documents the top-layer rendering, the gap knobs, and that a
  `center` `position-area` tile never flips (use a full-width `span-all`
  tile to center over the trigger instead)
