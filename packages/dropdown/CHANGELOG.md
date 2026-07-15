# @acusti/dropdown

## 1.0.0-alpha.4

### Major Changes

- 2e7d1f1: Rename the body’s `@position-try` fallback blocks from
  `--uktdd-top-left` / `--uktdd-top-right` / `--uktdd-bottom-left` /
  `--uktdd-bottom-right` to `--uktdd-top-start` / `--uktdd-top-end` /
  `--uktdd-bottom-start` / `--uktdd-bottom-end`, and switch their
  `position-area` values (and the default `--uktdd-body-position-area`)
  from physical `top`/`bottom` + `span-left`/`span-right` to logical
  `block-start`/`block-end` + `span-inline-start`/`span-inline-end`.

    The old names described the direction the body extends toward, which
    reads backwards from what they actually mean: each block is named for
    the edge that stays flush with the trigger, not the direction the body
    grows — `top-left` opened above the trigger with their **left** edges
    flush, so the body extended toward the right. Renaming to `start`/`end`
    removes that ambiguity and matches the submenu’s fallback
    (`--uktdd-submenu-inline-start`), which already used logical keywords.

    Switching to logical values also makes the default direction (and all
    four named recipes) RTL-correct: the body now opens toward the
    trigger’s actual inline-end edge in RTL instead of always opening
    toward the physical right. This is a no-op for LTR documents, where
    `inline-end` is `right`. `block-start`/`block-end` replace
    `top`/`bottom` rather than mixing with the logical inline keywords —
    `position-area` doesn’t allow pairing a physical keyword on one axis
    with a logical one on the other — and read as `top`/`bottom` in the
    near-universal horizontal-tb writing mode.

    **Migration:** if you referenced any of the renamed `@position-try`
    block names in `--uktdd-body-position-try-fallbacks`, or set
    `--uktdd-body-position-area`/`--uktdd-submenu-position-area` directly
    with `top`/`bottom`/`span-left`/`span-right`, update them:

    ```css
    /* before */
    .my-dropdown {
        --uktdd-body-position-area: bottom span-left;
        --uktdd-body-position-try-fallbacks:
            --uktdd-top-right, --uktdd-bottom-left, --uktdd-top-left;
    }

    /* after */
    .my-dropdown {
        --uktdd-body-position-area: block-end span-inline-start;
        --uktdd-body-position-try-fallbacks:
            --uktdd-top-end, --uktdd-bottom-start, --uktdd-top-start;
    }
    ```

    See the README’s
    [Changing the Default Direction](https://github.com/acusti/uikit/blob/main/packages/dropdown/README.md#changing-the-default-direction)
    section for the full cheatsheet of the four direction pairs.

## 1.0.0-alpha.3

### Minor Changes

- 2b4001c: Add an `openOnHover` prop to open a Dropdown on pointer hover

    Setting `openOnHover` opens the dropdown as soon as the pointer hovers
    the trigger. It closes a short moment after the pointer leaves the
    trigger and body entirely — the close is delayed so crossing the gap
    between them, or a placement fallback moving the body somewhere the
    pointer briefly leaves, doesn’t flicker-close it. Click and keyboard
    opening (Enter/Space while focused) keep working as usual alongside it.
    The prop only applies to a top-level Dropdown; a submenu already
    discloses on hover intent, so `openOnHover` is ignored (and warns) on a
    nested Dropdown.

## 1.0.0-alpha.2

### Patch Changes

- ca0f949: Keep a Menubar engaged when the pointer moves onto a non-menu
  control

    A `Menubar` now tracks an explicit menu-mode: opening a trigger’s menu
    (by click or keyboard) engages the bar, and it stays engaged until a
    deliberate dismissal (Escape, a click outside the bar, or selecting an
    item). While engaged, hovering a non-menu control placed alongside the
    dropdowns — e.g. a plain button — closes the open menu but keeps the
    bar engaged, so hovering back onto a trigger reopens a menu without
    another click. Previously such a hover did nothing (the open menu
    stayed put), and the bar was only ever “active” while a menu happened
    to be open. Sliding across the gaps between triggers still leaves the
    open menu alone, so menu-to-menu hovering stays seamless.

## 1.0.0-alpha.1

### Patch Changes

- fb4531d: Let a Dropdown nested inside a non-menu dropdown be an
  independent menu

    A `Dropdown` nested inside another `Dropdown`'s body was promoted to a
    submenu whenever it was itself a menu, regardless of the outer dropdown
    — so an independent, click-to-select picker embedded in a
    `hasItems={false}` dialog had no way to work (as a submenu it needed
    hover-intent to open, and the `hasItems={false}` escape hatch also
    disables item selection). Submenu context is now provided only by
    _menu_ dropdowns, so a `Dropdown` nested inside a `hasItems={false}`
    dropdown renders as an independent anchored dropdown with normal
    click-to-open and click-to-select on its `data-ukt-value` items. Nested
    submenus (menu-in-menu) and info popovers (`hasItems={false}` nested
    anywhere) are unchanged.

## 1.0.0-alpha.0

### Major Changes

- 9ef9990: Remove the `minHeightBody` and `minWidthBody` props

    These props were only sugar for the `--uktdd-body-min-height` /
    `--uktdd-body-min-width` CSS custom properties, and they had no `max`
    counterparts (max sizing was already CSS-only), so they left the sizing
    API half in props and half in CSS. Placement and sizing are customized
    in CSS, so set the body’s minimum size with the CSS variables directly
    — e.g. `style={{ '--uktdd-body-min-width': '180px' }}` or a rule on the
    dropdown’s class. The `style` prop’s type now accepts the component’s
    CSS custom properties, so that inline form type-checks without a cast.

- a14147e: Render the dropdown body in the top layer and add margin-based
  gap knobs for robust anchor positioning

    The dropdown body now renders in the top layer via `popover="manual"`.
    A top-layer element’s containing block is always the viewport, so an
    ancestor with a `transform`, `scale`, `filter`, `backdrop-filter`,
    `perspective`, `will-change: transform`, or `contain` can no longer
    capture the `position: fixed` body and break its placement —
    `position-try` fallbacks that used to stop firing (and base
    `position-area` directions that could resolve to the wrong side) now
    work regardless of a consumer’s ancestors, so consumer-side
    de-transforming workarounds are no longer needed.
    - Dismissal stays under the component’s control (`popover="manual"`
      plus the existing `mousedown`/`mouseup`/`focusin` listeners on
      `document` and the owner document), so outside-click, focus, and
      iframe handling are unchanged and searchable/text-input triggers —
      whose input sits outside the body — keep the body open while you
      interact with them, which native light-dismiss (`popover="auto"`)
      would not
    - Submenus still anchor to their parent item and escape the body’s
      `overflow: hidden` in the top layer; the body’s `z-index` is dropped
      since the top layer handles stacking, and the UA popover box resets
      (`inset`/`block-size`/`margin`/`border`/`padding`) are applied at a
      specificity that also overrides a consuming app’s global `[popover]`
      styles, so neither the UA defaults nor a consumer’s popover CSS can
      break the anchor-positioning layout
    - New `--uktdd-body-gap` and `--uktdd-submenu-gap` custom properties
      (default `0`) express the space between the trigger and the body (as
      a symmetric `margin-block`) and between a parent item and its submenu
      (as `margin-inline`). A margin auto-reverses to the attached side
      when `position-try` flips the box and establishes no containing
      block, so it is safe on dropdowns with submenus
    - **Breaking:** the `--uktdd-body-translate` and
      `--uktdd-submenu-translate` custom properties are removed.
      `--uktdd-body-gap`/`--uktdd-submenu-gap` cover the trigger↔body and
      item↔submenu spacing; for an offset a gap can’t express (a horizontal
      nudge or a deliberate overlap), set `translate` on
      `.uktdropdown-body` directly
    - README documents the top-layer rendering, the gap knobs, and that a
      `center` `position-area` tile never flips (use a full-width
      `span-all` tile to center over the trigger instead)

### Minor Changes

- 9f9e85f: Add nested submenus and the Menubar component

    Dropdowns now compose: nesting a `Dropdown` inside another dropdown’s
    body renders it as a parent item that discloses a submenu, and the new
    `Menubar` named export combines sibling dropdowns into a macOS-style
    menu bar.
    - Submenus nest to arbitrary depth and are declared either by nesting
      `Dropdown` components or by authoring the `data-ukt-submenu` markup
      protocol directly — the component form compiles to the attribute form
    - Parent items disclose and never submit; `onSubmitItem` fires only for
      leaf items, and the `Item` payload gains a `path` array reporting the
      leaf’s ancestor parent items (empty for top-level items)
    - macOS-style disclosure: a parent item highlights immediately when it
      becomes active (pointer or arrow keys) and discloses its submenu
      after a short intent delay with the highlight staying on the parent;
      → dives into the submenu, ← surfaces back out, and Escape closes the
      whole menu and returns focus to the trigger
    - The active path is one `data-ukt-active` item per open level, with
      the deepest item getting the primary highlight and ancestors a muted
      one (new `--uktdd-body-bg-color-path`/`--uktdd-body-color-path`
      custom properties); parent-item open state is carried by
      `aria-expanded`
    - Submenus reuse the anchor-positioning layout model (the expanded
      parent item is the anchor) with new `--uktdd-submenu-position-area`,
      `--uktdd-submenu-position-try-fallbacks`, and
      `--uktdd-submenu-translate` custom properties; parent items render a
      macOS-style disclosure chevron (drawn in CSS, restylable via
      `[aria-haspopup='menu']::after`), and submenu bodies get an explicit
      text color via the new `--uktdd-body-color` custom property (default
      `canvastext`) so an active parent’s highlight color can’t inherit
      into its submenu’s items
    - The `--uktdd-body-translate` default changed from `0 0` to the
      rendering-identical `none`: any other value makes the body a
      containing block for its fixed-position submenus, which constrains
      and clips them, so translate nudges are now opt-in per dropdown and
      documented as incompatible with submenus
    - Parent items and submenus get ARIA filled in automatically
      (`aria-haspopup`/`aria-expanded`/`aria-controls` and
      `role="menu"`/`id`), only where the consumer hasn’t set it
    - `Menubar` renders `role="menubar"`, keeps at most one menu open,
      switches menus on hover once any menu is open, roves focus between
      triggers with ←/→ (sliding the open menu when one is open, wrapping
      at the ends), gives the open menu’s trigger an active-state
      background (new `--uktdd-menubar-trigger-bg-color-active` custom
      property, tinting over the trigger’s own background), and supersedes
      the `group` prop, which was declared in the `Props` type but never
      implemented and has been removed
    - A `Dropdown` nested with `hasItems={false}` isn’t a submenu — it
      renders as an independent anchored dropdown inside the outer body
      (e.g. an ℹ️ info popover next to an input in a form dropdown);
      interacting with it doesn’t close or submit the outer dropdown, and
      Escape closes the innermost open dropdown first

- 38c4851: Add mouse-intent (safe-area) tracking so submenus don't close
  when the pointer cuts diagonally toward them

    When a submenu is open and the pointer moves diagonally from the parent
    item toward the submenu, its path often crosses sibling items in the
    parent menu. Previously that collapsed the submenu the instant the
    pointer touched a sibling. Now the dropdown tracks the triangle from
    where the pointer left the parent item to the open submenu's two near
    corners (the macOS "diagonal" behavior): while the pointer stays inside
    that triangle it's heading toward the submenu, so the submenu stays
    open even over sibling items. A pause inside the triangle (rather than
    continued motion) gives up and switches to the item under the pointer,
    and a direct move onto a sibling (outside the triangle) switches
    immediately as before. Pointer-only; keyboard navigation is unaffected.

## 0.57.0

### Minor Changes

- cc77ba4: Stop firing onSubmitItem with an empty value when a
  non-searchable dropdown is submitted with no item active

    A menu-style (non-searchable) Dropdown defaults to `allowEmpty`, so
    pressing Enter/Space with nothing highlighted — or releasing the
    pointer on non-item menu chrome (a title, padding, the list gap) —
    fired `onSubmitItem({ value: '' })`. Consumers that pass the submitted
    value straight through (for example casting it to an enum) could
    persist that empty value and trip downstream validation. An empty value
    is now only emitted when the dropdown has a text input to source it
    from — a searchable dropdown's input, or a text input inside a custom
    trigger; a dropdown with no input and nothing selected is a no-op.
    Submitting an item whose `data-ukt-value` is explicitly empty still
    works. `allowEmpty` is now also enforced when `allowCreate` is set:
    submitting a cleared input with no active item no longer emits an empty
    value when `allowEmpty={false}`.

### Patch Changes

- f86e693: Rebuild with the modernized build pipeline

    The published artifacts are now built with @vitejs/plugin-react v6 (oxc
    JSX transform) with the React Compiler applied via
    @rolldown/plugin-babel and `reactCompilerPreset`, replacing the
    previous plugin-react v5 Babel pipeline; type declarations are emitted
    by the native TypeScript 7 compiler instead of unplugin-dts. Output is
    verified equivalent: React Compiler memoization is present with zero
    compiler bailouts, and declarations are unchanged apart from preserving
    inline `type` qualifiers on imports. No API or behavior changes.

- Updated dependencies [f86e693]
    - @acusti/use-keyboard-events@0.11.1

## 0.56.0

### Minor Changes

- ddef614: Add ARIA wiring to the trigger and body so screen readers can
  associate them. The trigger automatically receives `aria-haspopup`,
  `aria-expanded`, and `aria-controls`, and the open body element receives
  a matching `role` and an `id`. The popup role adapts to the dropdown’s
  mode: `listbox` for `isSearchable`, `menu` for the default item-selection
  mode, and `dialog` when `hasItems={false}` (interactive form content).
  Consumer-provided triggers are cloned with these props only when they
  haven’t already been set, so existing ARIA overrides win.

    Also: replace the `JSX.Element` type in the `Props.children` union with
    `ReactElement` (identical at runtime, more portable across React 19+
    type setups), and improve README docs — stronger "don’t double-pad"
    guidance for `.uktdropdown-content`, a callout explaining _why_
    `hasItems={false}` matters on the Interactive Content example, and a
    cross-link from the Layout Model to the End-Aligned placement recipe.

## 0.55.1

### Patch Changes

- d358734: Polish dropdown sizing defaults by removing
  `scrollbar-gutter: stable` from `.uktdropdown-content` and by only
  emitting `--uktdd-body-min-height` when `props.minHeightBody` is
  explicitly provided. This avoids reserving an empty gutter for
  always-visible scrollbars when the dropdown isn’t scrollable and keeps
  the default `30px` min-height in the CSS and not as inline styles.

## 0.55.0

### Minor Changes

- be600a5: Improve `Dropdown` fit-available-space behavior by moving to a
  more CSS-first anchor-positioning model.

    The dropdown body now behaves as a content-sized anchored shell with an
    internal content region:
    - uses `position: fixed` with CSS anchor positioning
    - uses `position-area` plus `position-try-order: most-height`
    - prefers sizing from content, then constrains to available space
    - scrolls internally when contents exceed the available space
    - removes the previous JS-based ancestor clipping / max-height
      measurement logic and dependency on @acusti/use-bounding-client-rect

    This makes dropdown placement and sizing faster, more reliable, and
    less sensitive to intermediate overflow containers/scroll regions (e.g.
    a kanban column).

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
      `bottom`, or `anchor()` inset overrides on `.uktdropdown-body`,
      replace those with the new CSS variables instead.
    - If you added padding or overflow styles directly to
      `.uktdropdown-body`, move them to `.uktdropdown-content`.
    - Styles affecting placement, width, min/max sizing, shadow, or
      background should remain on `.uktdropdown-body`.
    - If you relied on the old behavior that constrained dropdown height to
      the nearest overflow ancestor, note that this logic has been removed.
      Dropdowns now size against available viewport space and scroll
      internally.
    - If you need an edge-aligned menu, prefer setting placement/alignment
      only and let the body remain content-sized.
    - The high-level tuple API is unchanged: continue passing
      `[trigger, body]` for custom triggers, with the trigger first and the
      body second.

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

## 0.54.1

### Patch Changes

- ab39855: Allow non-string (i.e. ReactNode) `props.label` values for
  Dropdown

## 0.54.0

### Minor Changes

- 8a6fd7f: Refactor CSS handling to minify styles in the prod build via
  lightningcss and remove now useless @acusti/styling dependency (no
  benefit from its minification functionality)

## 0.53.0

### Minor Changes

- 48c735b: Use CSS anchor-scope to dramatically simplify Dropdown anchor
  positioning and avoid the need for custom styles for each Dropdown
  instance rendered on the page

### Patch Changes

- f578799: Remove auto-width constraints functionality that was causing
  buggy behavior in some edge cases

## 0.52.0

### Minor Changes

- 1f2f96f: **Breaking:** Dropdown now automatically invokes click events on
  buttons and links within dropdown items when triggered via keyboard
  navigation or mouse. When a dropdown item contains exactly one `button`,
  `a[href]`, `input[type="button"]`, or `input[type="submit"]` element,
  that element's click handler will be invoked in addition to the
  `onSubmitItem` callback. This ensures buttons and links within dropdown
  items work consistently whether activated by mouse or keyboard.

    This is considered breaking because the automatic click delegation may
    trigger navigation or other side effects in existing dropdowns that
    contain buttons or links, though in most cases this will be the desired
    behavior.

## 0.51.0

### Minor Changes

- c7e0e28: Add support for `onActiveItem` prop (mirroring the existing
  `onSubmitItem` prop) that is triggered whenever the active Dropdown item
  changes

### Patch Changes

- 0d6411e: Prevent theoretical edge cases when handling active item change
  that could clear active item state erroneously

## 0.50.1

### Patch Changes

- e4f91f3: Fix dropdown hydration errors by using react’s useId hook

## 0.50.0

### Minor Changes

- b587309: Update all React components to use the modern (v17+)
  [React JSX transform](https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html)

### Patch Changes

- Updated dependencies [b587309]
    - @acusti/styling@2.1.0

## 0.49.0

### Minor Changes

- f16767f: Introduce optional `minHeightBody` and `minWidthBody` props to
  limit how small the automatically calculated max-width and max-height
  dimensions can be, and default them to 30 (min-height) and 100
  (min-width)
- adb5bc9: Round the dropdown body max-width and max-height to the nearest
  integer
- ed100d7: Improve positioning reliability and flexibility by explicitly
  setting the values for top, bottom, left, and right for all anchored
  positions
- c8f92a8: Improve type ergonomics by allowing Dropdown’s `props.children`
  to be a readonly array (enables `['trigger', 'body'] as const`)
- 86b1448: Pass-in an explicit `href` prop for the anchoring `<style>`
  element to avoid the need to dynamically calculate one based on the style
  contents

## 0.48.1

### Patch Changes

-   - Updated dependencies
        - @acusti/styling@2.0.1

## 0.48.0

### Minor Changes

- f87de22: Refactor @acusti/dropdown off of @acusti/use-is-out-of-bounds by
  implementing support for CSS anchor positioning as the way to support
  collision detection. This includes some fundamental changes to the base
  styles applied to `.uktdropdown`, including that it is no longer
  `position:relative` and no longer `display: inline-block`. All of the
  positioning and anchoring logic is implemented via plain CSS with useful
  defaults, so updating the behavior is as simple as providing your own
  styles to override the low-specificity styles rendered by the component.
  See `packages/docs/stories/Dropdown.stories.tsx` and
  `packages/docs/stories/Dropdown.css` for examples of how that works.

### Patch Changes

- Updated dependencies [3f2cee2]
    - @acusti/use-bounding-client-rect@2.0.1

## 0.47.0

### Minor Changes

- e42f474: Use vite in library mode to build all packages and cleanup the
  build artifacts to only include required files. This means no more test
  files in the build and no more src/ directory.
- d328a73: Adapt package to use react-compiler as part of vite build
  process and to remove all manual memoization. Also includes some small
  changes to strictly follow react-compiler’s rules of react and to
  workaround as-of-yet unimplemented features involving mutating
  destructured component props and the nullish coalescing assignment
  operator.

    **Note:** this is a breaking change because the packages now depend on
    react v19+ and are no longer compatible with anything before the
    introduction of the react/compiler-runtime.

### Patch Changes

- Updated dependencies [e42f474]
- Updated dependencies [d328a73]
    - @acusti/matchmaking@0.10.0
    - @acusti/styling@2.0.0
    - @acusti/use-is-out-of-bounds@0.15.0
    - @acusti/use-keyboard-events@0.11.0

## 0.46.1

### Patch Changes

- 29e79c3: Update react peerDependencies to include experimental releases
  of react so it can be used with the new Activity and ViewTransition
  components
  ([reference](https://react.dev/blog/2025/04/23/react-labs-view-transitions-activity-and-more))
- Updated dependencies [29e79c3]
    - @acusti/styling@1.1.1
    - @acusti/use-is-out-of-bounds@0.14.1
    - @acusti/use-keyboard-events@0.10.1

## 0.46.0

### Minor Changes

- Update all NPM and CI dependencies to latest, including eslint,
  typescript (v5.8.3), vitest, babel, and node-gyp, resolving all known
  security vulnerabilities, and adopt the eslint canonical plugin and
  enable new rules.

### Patch Changes

- Updated dependencies
    - @acusti/matchmaking@0.9.0
    - @acusti/styling@1.1.0
    - @acusti/use-is-out-of-bounds@0.14.0
    - @acusti/use-keyboard-events@0.10.0

## 0.45.0

### Minor Changes

- 7e9f68d Allow @acusti/styling ^0.7.2 to support react previous react
  versions (less than v19)
- Upgrade @acusti/use-is-out-of-bounds dependency to latest v1.13.1
- Remove dependency on `@acusti/input-text` from `<Dropdown>` component by
  using a plain uncontrolled `<input>` as the trigger for searchable
  dropdowns when no trigger is passed in.

## 0.44.1

### Patch Changes

- 3f3d39d: Switch over all eslint sorting and organizing rules to use the
  Perfectionist plugin and enable the eslint no-duplicate-imports rule
- Updated dependencies [3f3d39d]
    - @acusti/use-keyboard-events@0.9.1
    - @acusti/input-text@1.9.1
    - @acusti/styling@1.0.1
