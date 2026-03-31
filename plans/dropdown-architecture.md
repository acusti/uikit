# Modern Dropdown Architecture

## Goal

Define the cleanest dropdown/menu architecture if backwards compatibility is not a concern and the component can fully target the latest HTML, CSS, and JavaScript platform features.

## Core Position

Do not build one generic `Dropdown` component that tries to cover every use case.

Instead, build:

- A low-level `AnchoredPopover` primitive for surface rendering and positioning
- A higher-level `ActionMenu` for command menus
- A higher-level `NavDropdown` for link/navigation flyouts
- A separate `Listbox` or `Combobox` for selection UIs

The visual shape may look similar across these components, but the semantics and keyboard behavior are different enough that they should not be collapsed into one abstraction.

## Platform-First Stack

### 1. Surface Rendering

Use native popovers for the floating surface:

- Trigger is a real `<button>`
- Panel is a sibling element with `[popover="auto"]`
- Let the browser handle top-layer rendering
- Let the browser handle light-dismiss and `Esc`

This removes most of the historical fragility around portals, z-index wars, clipping, and outside-click bookkeeping.

### 2. Positioning

Use CSS anchor positioning for layout:

- `position-anchor`
- `position-area`
- `anchor()`
- `anchor-size()`
- `position-try`
- `@position-try`

That should be the default positioning system instead of JS measurements. The browser can handle collision-aware placement declaratively, which is simpler and more reliable than running layout math in userland.

### 3. State Ownership

Let the browser own open/closed state whenever possible:

- Use `popovertarget` for declarative trigger wiring
- Use `showPopover()`, `hidePopover()`, or `togglePopover()` when imperative control is needed
- React to `beforetoggle` and `toggle` instead of duplicating state unnecessarily in app code

JS should augment browser behavior, not replace it.

### 4. Behavior Layer

Use JavaScript only for behavior the platform does not provide natively:

- Arrow-key navigation
- Home/End behavior
- Typeahead
- Submenu open/close policy
- Focus return
- Focus wrapping rules

For true menus, prefer roving tabindex with real focus movement unless there is a strong need for `aria-activedescendant`.

## Semantic Split

### Action Menu

Use `role="menu"` and `role="menuitem"` only for true action menus such as:

- File menus
- Overflow action menus
- Context menus

Expected behavior:

- `Enter` or `Space` opens from the trigger
- `ArrowDown` and `ArrowUp` can optionally open directly into the first or last item
- Arrow keys move between menu items
- `Home` and `End` jump within the menu
- `Esc` closes and returns focus to the trigger

### Navigation Dropdown

Do not force navigation flyouts into ARIA menu semantics if they are just groups of links.

Use:

- A button or link trigger, depending on product needs
- A popover surface
- Plain link semantics inside

This is usually simpler and more correct than turning site navigation into an application menu.

### Selection UI

A picker should not be an action menu just because it looks like one.

Use:

- `listbox` for single/multi selection lists
- `combobox` when text input and filtering are involved

Those should be separate components layered on the same floating-surface primitive.

## Primitive Shape

### `AnchoredPopover`

Responsibilities:

- Render a surface in the top layer using the Popover API
- Connect trigger and surface declaratively when possible
- Expose imperative methods only when necessary
- Apply anchor-based placement styles
- Support placement preferences and fallback strategies
- Expose hooks for open/close lifecycle events

Non-responsibilities:

- Menu keyboard logic
- Listbox semantics
- Option selection state
- App-specific command handling

## Submenus

Model submenus as nested popovers anchored to the parent menu item.

Rules:

- Opening one submenu closes sibling submenus
- Closing a parent closes all descendants
- Hover intent can open submenus for pointer users
- Keyboard users should open submenus with arrow keys
- Focus should move predictably into and out of child menus

Using nested popovers keeps the layering model consistent and avoids building a second overlay mechanism for flyouts.

## Animation

Animate using the platform instead of JS animation orchestration:

- `:popover-open`
- `@starting-style`
- `transition-behavior: allow-discrete`
- Transitions on `display` and `overlay` where appropriate

This keeps open/close animations aligned with top-layer behavior and avoids race conditions between animation state and visibility state.

## Fit Available Space

If the menu should not only choose the side with the most available space, but also expand to fill that available space up to its content size and then scroll when needed, structure it as two layers:

- A positioned outer shell that participates in anchor positioning
- An inner scrollport that owns overflow behavior

### Recommended Shape

- `MenuSurface`: placement, sizing constraints, visual chrome
- `MenuScrollport`: `overflow: auto`, scroll behavior, scrollbar handling
- `MenuContent`: actual menu items

This separation matters because placement and overflow are different responsibilities. The outer surface should determine the available rectangle. The inner scrollport should absorb overflow once content exceeds that rectangle.

### Sizing Strategy

Use anchor positioning to choose the side with the most room, then cap the menu to the size of the chosen position area.

Practical rules:

- Prefer content-sized menus by default
- Apply `max-block-size: 100%` so the surface cannot exceed the available block dimension of its active position area
- Apply a reasonable `max-inline-size` so menus do not become excessively wide
- Put `overflow: auto` on an inner scrollport, not the outer shell

This allows the menu to:

- Stay small when content is small
- Grow until it reaches the available real estate
- Become scrollable only when necessary

### Example CSS Pattern

```css
.menu {
  position: fixed;
  position-anchor: --trigger;
  position-area: bottom span-inline-end;
  position-try: most-height top span-inline-end, bottom span-inline-end;

  inline-size: max-content;
  max-inline-size: min(100%, 40rem);
  max-block-size: 100%;
}

.menu__scrollport {
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  max-block-size: inherit;
}
```

### Why This Works

The platform pieces fit together in a useful way:

- `position-try` with `most-height` can prefer the side offering more available block space
- `position-area` defines the area the positioned element is placed inside
- The positioned element can then use size constraints such as `max-block-size` relative to that area

The result is a menu that is still content-driven, but naturally constrained by the available viewport real estate on the selected side.

### Anchored Container Queries

Use anchored container queries when the active fallback position should influence styling.

Examples:

- Different transform origin when opening above vs. below
- Different shadows or border treatment for edge-adjacent placement
- Slight layout adjustments when the active fallback indicates constrained space

This keeps placement-sensitive styling declarative instead of coupling it to JS placement state.

### JS Policy

The default policy should remain CSS-first.

Use JavaScript only if product requirements go beyond the platform behavior, for example:

- Maintaining a specific focused item within the visible scroll range
- Custom scroll alignment rules on open
- Special treatment for very large virtualized menus
- Non-standard width heuristics based on content or surrounding layout

Even then, JS should refine the result rather than replace browser-managed placement and sizing.

## Suggested Markup Shape

```html
<button id="file-button" aria-haspopup="menu" popovertarget="file-menu">
  File
</button>

<div id="file-menu" popover="auto" role="menu" aria-labelledby="file-button">
  <button role="menuitem">New</button>
  <button role="menuitem">Open</button>
  <button role="menuitem" popovertarget="export-menu">Export</button>
</div>

<div id="export-menu" popover="auto" role="menu">
  <button role="menuitem">PDF</button>
  <button role="menuitem">HTML</button>
</div>
```

## Why This Architecture

This approach is preferable because it:

- Uses browser-managed primitives for the hardest overlay concerns
- Minimizes JS layout work and event plumbing
- Avoids generic abstractions that blur semantics
- Produces better accessibility defaults
- Reduces failure modes around clipping, stacking, and dismissal
- Keeps advanced behavior isolated to thin component-specific layers

## Implementation Guidance

If this were implemented as a component system, the layering would be:

1. `AnchoredPopover`
2. `ActionMenu`, `NavDropdown`, `ListboxSurface`, `ComboboxSurface`
3. Product-specific components built on those higher-level primitives

That keeps the base primitive small and stable while allowing each semantic widget to own its own keyboard model and state rules.

## Sources

These sources support the platform choices described above:

- [MDN: HTML `popover` global attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/popover)
- [MDN: `HTMLButtonElement.popoverTargetElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLButtonElement/popoverTargetElement)
- [MDN: `HTMLElement.showPopover()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/showPopover)
- [MDN: `HTMLElement.togglePopover()`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/togglePopover)
- [MDN: `HTMLElement` `beforetoggle` event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/beforetoggle_event)
- [MDN: Using CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning/Using)
- [MDN: CSS anchor positioning overview](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning)
- [MDN: `position-try`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position-try)
- [MDN: `@position-try`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40position-try)
- [MDN: `position-area`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position-area)
- [MDN: Handling overflow with anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning/Try_options_hiding)
- [MDN: Anchored container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning/Anchored_container_queries)
- [MDN: `transition-behavior`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/transition-behavior)
- [MDN: `max-height`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/max-height)
- [WAI-ARIA APG: Menu Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)

## Notes

This recommendation assumes a modern-browser-only target. It intentionally favors the latest platform primitives over compatibility layers or legacy positioning libraries.
