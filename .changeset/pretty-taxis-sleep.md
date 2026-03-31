---
'@acusti/dropdown': minor
---

Improve `Dropdown` fit-available-space behavior by moving to a more
CSS-first anchor-positioning model.

The dropdown body now behaves as a content-sized anchored shell with an
internal content region:

- uses `position: fixed` with CSS anchor positioning
- uses `position-area` plus `position-try-order: most-height`
- prefers sizing from content, then constrains to available space
- scrolls internally when contents exceed the available space
- removes the previous JS-based ancestor clipping / max-height measurement
  logic and dependency on @acusti/use-bounding-client-rect

This makes dropdown placement and sizing faster, more reliable, and less
sensitive to intermediate overflow containers/scroll regions (e.g. a kanban
column).

The component now also exposes low-level CSS-variable customization for
placement:

- `--uktdd-body-position-area`
- `--uktdd-body-position-try-fallbacks`
- `--uktdd-body-translate`

The rendered structure now includes:

- `.uktdropdown-body` as the anchored outer shell
- `.uktdropdown-content` as the inner scrollable region

Note that existing sizing props such as `minHeightBody` are still
supported.

Migration:

- If you customized dropdown placement with `top`, `left`, `right`,
  `bottom`, or `anchor()` inset overrides on `.uktdropdown-body`, replace
  those with the new CSS variables instead.
- If you added padding or overflow styles directly to `.uktdropdown-body`,
  move them to `.uktdropdown-content`.
- Styles affecting placement, width, min/max sizing, shadow, or background
  should remain on `.uktdropdown-body`.
- If you relied on the old behavior that constrained dropdown height to the
  nearest overflow ancestor, note that this logic has been removed.
  Dropdowns now size against available viewport space and scroll
  internally.
- If you need an edge-aligned menu, prefer setting placement/alignment only
  and let the body remain content-sized.
- The high-level tuple API is unchanged: continue passing `[trigger, body]`
  for custom triggers, with the trigger first and the body second.

Example migration:

```css
/* before */
.my-dropdown .uktdropdown-body {
    right: anchor(right);
    left: revert;
    margin-right: 12px;
    overflow: auto;
    padding: 16px;
}

/* after */
.my-dropdown {
    --uktdd-body-position-area: bottom span-left;
    --uktdd-body-position-try-fallbacks:
        --uktdd-top-right, --uktdd-bottom-left, --uktdd-top-left;
    --uktdd-body-translate: -12px 0;
}

.my-dropdown .uktdropdown-content {
    padding: 16px;
}
```
