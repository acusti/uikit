---
'@acusti/dropdown': minor
---

Add nested submenus and the Menubar component

Dropdowns now compose: nesting a `Dropdown` inside another dropdown’s body
renders it as a parent item that discloses a submenu, and the new `Menubar`
named export combines sibling dropdowns into a macOS-style menu bar.

- Submenus nest to arbitrary depth and are declared either by nesting
  `Dropdown` components or by authoring the `data-ukt-submenu` markup
  protocol directly — the component form compiles to the attribute form
- Parent items disclose and never submit; `onSubmitItem` fires only for
  leaf items, and the `Item` payload gains a `path` array reporting the
  leaf’s ancestor parent items (empty for top-level items)
- macOS-style disclosure: a parent item highlights immediately when it
  becomes active (pointer or arrow keys) and discloses its submenu after a
  short intent delay with the highlight staying on the parent; → dives into
  the submenu, ← surfaces back out, and Escape closes the whole menu and
  returns focus to the trigger
- The active path is one `data-ukt-active` item per open level, with the
  deepest item getting the primary highlight and ancestors a muted one (new
  `--uktdd-body-bg-color-path`/`--uktdd-body-color-path` custom
  properties); parent-item open state is carried by `aria-expanded`
- Submenus reuse the anchor-positioning layout model (the expanded parent
  item is the anchor) with new `--uktdd-submenu-position-area`,
  `--uktdd-submenu-position-try-fallbacks`, and `--uktdd-submenu-translate`
  custom properties; parent items render a macOS-style disclosure chevron
  (drawn in CSS, restylable via `[aria-haspopup='menu']::after`), and
  submenu bodies get an explicit text color via the new
  `--uktdd-body-color` custom property (default `canvastext`) so an active
  parent’s highlight color can’t inherit into its submenu’s items
- The `--uktdd-body-translate` default changed from `0 0` to the
  rendering-identical `none`: any other value makes the body a containing
  block for its fixed-position submenus, which constrains and clips them,
  so translate nudges are now opt-in per dropdown and documented as
  incompatible with submenus
- Parent items and submenus get ARIA filled in automatically
  (`aria-haspopup`/`aria-expanded`/`aria-controls` and `role="menu"`/`id`),
  only where the consumer hasn’t set it
- `Menubar` renders `role="menubar"`, keeps at most one menu open, switches
  menus on hover once any menu is open, roves focus between triggers with
  ←/→ (sliding the open menu when one is open, wrapping at the ends), gives
  the open menu’s trigger an active-state background (new
  `--uktdd-menubar-trigger-bg-color-active` custom property, tinting over
  the trigger’s own background), and supersedes the `group` prop, which was
  declared in the `Props` type but never implemented and has been removed
- A `Dropdown` nested with `hasItems={false}` isn’t a submenu — it renders
  as an independent anchored dropdown inside the outer body (e.g. an ℹ️
  info popover next to an input in a form dropdown); interacting with it
  doesn’t close or submit the outer dropdown, and Escape closes the
  innermost open dropdown first
