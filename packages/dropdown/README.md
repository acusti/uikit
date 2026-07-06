# @acusti/dropdown

[![latest version](https://img.shields.io/npm/v/@acusti/dropdown?style=for-the-badge)](https://www.npmjs.com/package/@acusti/dropdown)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/dropdown?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fdropdown)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/dropdown?style=for-the-badge)](https://www.npmjs.com/package/@acusti/dropdown)
[![bundle size](https://deno.bundlejs.com/badge?q=@acusti/dropdown)](https://bundlejs.com/?q=%40acusti%2Fdropdown)

`Dropdown` is a React component that renders a menu-like UI with a trigger
that the user clicks to disclose a dropdown anchored to that trigger. The
body of the dropdown can include any DOM. Dropdowns also compose: nest a
`Dropdown` inside another dropdown’s body to create a submenu, or wrap
sibling dropdowns in the `Menubar` component to combine them into a
multi-menu bar, like the system menu in the top toolbar of macOS.

The three primary design goals for the existence of this component:

1. **Best-in-class UX** (inspired by macOS native menus) with excellent
   keyboard support
2. **Best-in-class DX** with the simplest possible API:
    1. To create a dropdown with a `<button>` trigger, pass in a single
       child element with the body of the dropdown
    2. To create a dropdown with a custom trigger, pass in exactly two
       child elements; the first is the trigger, the second is the body of
       the dropdown
    3. To create a dropdown with a list of items as the body, use the
       `data-ukt-item` boolean to mark dropdown items, or use
       `data-ukt-value="foo"` to specify that an element is a dropdown item
       and the value of that item at the same time (otherwise, the value is
       the text content of the dropdown item element)
    4. To create a submenu, nest a `Dropdown` inside the dropdown body (or
       author the equivalent [`data-ukt-submenu` markup](#submenus)
       directly)
    5. To combine dropdowns into a menubar, wrap them in
       [`<Menubar>`](#menubar)
    6. To style your dropdowns, use CSS; there are a
       [collection of CSS custom properties](https://github.com/acusti/uikit/blob/main/packages/dropdown/src/Dropdown.css)
       used internally to style them if that works best for you, or just
       override the minimal default CSS as appropriate
3. **Lightweight bundle size** with the bare minimum of dependencies (see
   minzipped size above)

See the [storybook docs and demo][] to get a feel for what it can do.

[storybook docs and demo]:
    https://uikit.acusti.ca/?path=/docs/uikit-controls-Dropdown--docs

## Installation

```bash
npm install @acusti/dropdown
# or
yarn add @acusti/dropdown
```

## Quick Start

```tsx
import Dropdown from '@acusti/dropdown';

// Simple dropdown with button trigger
function SimpleDropdown() {
    return (
        <Dropdown>
            <ul>
                <li>Option 1</li>
                <li>Option 2</li>
                <li>Option 3</li>
            </ul>
        </Dropdown>
    );
}

// Custom trigger
function CustomTrigger() {
    return (
        <Dropdown>
            <button>My Custom Button</button>
            <ul>
                <li>Option 1</li>
                <li>Option 2</li>
            </ul>
        </Dropdown>
    );
}
```

```tsx
import Dropdown, { Menubar } from '@acusti/dropdown';

// Submenus (nested dropdowns) combined into a menubar
function AppMenu() {
    return (
        <Menubar>
            <Dropdown label="File">
                <ul>
                    <li data-ukt-item>New</li>
                    <li data-ukt-item>Open…</li>
                    <Dropdown label="Open Recent">
                        <ul>
                            <li data-ukt-item>project-a</li>
                            <li data-ukt-item>project-b</li>
                        </ul>
                    </Dropdown>
                </ul>
            </Dropdown>
            <Dropdown label="Edit">
                <ul>
                    <li data-ukt-item>Undo</li>
                    <li data-ukt-item>Redo</li>
                </ul>
            </Dropdown>
        </Menubar>
    );
}
```

## Layout Model

`Dropdown` uses CSS anchor positioning for placement and prefers a
CSS-first sizing model:

- The trigger is the anchor
- The dropdown body is an anchored shell
- The inner content region becomes scrollable only when the content exceeds
  the available space
- Placement fallbacks are handled with `position-try-order: most-height`

This means the dropdown tends to:

- stay content-sized when the contents are small
- expand to the available viewport space when more room is needed
- become scrollable when the contents exceed that space

Internally, the dropdown renders:

- `.uktdropdown-body` as the anchored outer shell
- `.uktdropdown-content` as the scrollable inner region with default
  padding

Custom padding and overflow styling belongs on the content region, not the
outer shell. Note that `.uktdropdown-content` already applies default
padding (see the `--uktdd-body-pad-*` variables below), so your body
element does **not** need its own padding:

```tsx
// ✗ Don’t double-pad — the content region already has padding
<Dropdown>
    <button>Open</button>
    <div style={{ padding: 16 }}>…</div>
</Dropdown>

// ✓ Override default padding via CSS variables if needed
// .my-dropdown { --uktdd-body-pad-top: 16px; /* etc */ }
```

For the most reliable anchor-positioning behavior:

- pass exactly two children when you need a custom trigger
- ensure the trigger resolves to a stable DOM element
- keep the trigger first and the dropdown body second
- prefer CSS variable overrides over custom `top`/`left`/`right` inset
  rules

For placement recipes, see
[Placement Customization](#placement-customization-with-css-variables)
below. If your trigger sits near the right edge of the viewport, the
[End-Aligned, Content-Sized Menu](#end-aligned-content-sized-menu) example
is the one you want.

## API Reference

### Props

```ts
type Props = {
    /**
     * Boolean indicating if the user can submit a value not already in the
     * dropdown.
     */
    allowCreate?: boolean;
    /**
     * Boolean indicating if submitting with no item active emits an empty
     * value (i.e. clears the value). Only has an effect when the dropdown has a
     * text input to source that value from — a searchable dropdown’s search
     * input, or a text input inside a custom trigger. With no such input there
     * is no value to submit, so submitting with nothing selected is a no-op
     * regardless; clear such a dropdown with an explicit empty-valued item
     * instead. Defaults to true.
     */
    allowEmpty?: boolean;
    /**
     * Can take a single React element or exactly two renderable children.
     * - Single child: The dropdown body (trigger will be auto-generated button)
     * - Two children: [trigger, body]
     */
    children: ReactNode | [ReactNode, ReactNode];
    className?: string;
    disabled?: boolean;
    /**
     * Whether the dropdown contains items that can be selected.
     * Defaults to true if children contain elements with data-ukt-item or data-ukt-value.
     */
    hasItems?: boolean;
    /**
     * Whether the dropdown should be open when first mounted.
     */
    isOpenOnMount?: boolean;
    /**
     * Whether the dropdown should include a search input for filtering options.
     */
    isSearchable?: boolean;
    /**
     * Whether the dropdown should remain open after selecting an item.
     * Useful for multi-select scenarios.
     */
    keepOpenOnSubmit?: boolean;
    /**
     * Label content for the trigger button (when using single child syntax).
     * For a nested (submenu) Dropdown, this is the parent item’s content.
     */
    label?: ReactNode;
    /**
     * Minimum height for the dropdown body in pixels. Defaults to 30.
     */
    minHeightBody?: number;
    /**
     * Minimum width for the dropdown body in pixels.
     */
    minWidthBody?: number;
    /**
     * Name attribute for the search input (requires isSearchable: true).
     */
    name?: string;
    /**
     * Called when the active (highlighted) item changes. Receives the
     * same payload as onSubmitItem.
     */
    onActiveItem?: (payload: Item) => void;
    onClick?: (event: React.MouseEvent<HTMLElement>) => unknown;
    onClose?: () => unknown;
    onMouseDown?: (event: React.MouseEvent<HTMLElement>) => unknown;
    onMouseUp?: (event: React.MouseEvent<HTMLElement>) => unknown;
    onOpen?: () => unknown;
    /**
     * Called when an item is selected. The payload includes:
     * - element: The DOM element that was clicked
     * - event: The click or keyboard event
     * - label: The visible text of the item
     * - value: The value attribute or text content
     */
    onSubmitItem?: (payload: Item) => void;
    /**
     * Placeholder text for the search input (requires isSearchable: true).
     */
    placeholder?: string;
    style?: React.CSSProperties;
    /**
     * Tab index for the search input (requires isSearchable: true).
     */
    tabIndex?: number;
    /**
     * Current value of the search input (requires isSearchable: true).
     * Used for controlled components and change detection.
     */
    value?: string;
};
```

### Item Type

```ts
type Item = {
    element: HTMLElement | null;
    event: Event | React.SyntheticEvent<HTMLElement>;
    label: string;
    /**
     * Ancestor parent items from the root level down to the item’s
     * immediate parent. Empty for top-level items.
     */
    path: Array<{ label: string; value: string }>;
    value: string;
};
```

## Usage Examples

### Basic List Dropdown

```tsx
import Dropdown from '@acusti/dropdown';

function StatesDropdown() {
    const handleSelection = (item) => {
        console.log('Selected:', item.value);
    };

    return (
        <Dropdown onSubmitItem={handleSelection}>
            <ul>
                <li>California</li>
                <li>New York</li>
                <li>Texas</li>
                <li>Florida</li>
            </ul>
        </Dropdown>
    );
}
```

### Searchable Dropdown

```tsx
function SearchableDropdown() {
    return (
        <Dropdown
            isSearchable
            placeholder="Search states…"
            label="Choose a state"
        >
            <ul>
                <li>Alabama</li>
                <li>Alaska</li>
                <li>Arizona</li>
                {/* ... more states */}
            </ul>
        </Dropdown>
    );
}
```

### Custom Values with Data Attributes

```tsx
function FontWeightDropdown() {
    return (
        <Dropdown onSubmitItem={(item) => setFontWeight(item.value)}>
            <ul>
                <li data-ukt-value="100">Thin (100)</li>
                <li data-ukt-value="400">Regular (400)</li>
                <li data-ukt-value="700">Bold (700)</li>
                <li data-ukt-value="900">Black (900)</li>
            </ul>
        </Dropdown>
    );
}
```

### Allow Creating New Items

```tsx
function TagsDropdown() {
    const [tags, setTags] = useState(['react', 'typescript', 'dropdown']);

    const handleNewTag = (item) => {
        if (!tags.includes(item.value)) {
            setTags([...tags, item.value]);
        }
    };

    return (
        <Dropdown
            isSearchable
            allowCreate
            placeholder="Add or select a tag…"
            onSubmitItem={handleNewTag}
        >
            <ul>
                {tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                ))}
            </ul>
        </Dropdown>
    );
}
```

### Multi-Select with Checkboxes

```tsx
function MultiSelectDropdown() {
    return (
        <Dropdown
            keepOpenOnSubmit
            onSubmitItem={({ label }) => {
                console.log('Selected color:', label);
            }}
        >
            <ul>
                <li>
                    <label>
                        <input type="checkbox" /> Red
                    </label>
                </li>
                <li>
                    <label>
                        <input type="checkbox" /> Blue
                    </label>
                </li>
            </ul>
        </Dropdown>
    );
}
```

### Dropdown with Interactive Content

For dropdowns whose body is a form (inputs, date pickers, buttons that
aren’t meant to submit a value), pass `hasItems={false}`. This disables the
item-selection keyboard model and, importantly, prevents clicks inside the
body from closing the dropdown via `onSubmitItem`.

```tsx
function InteractiveDropdown() {
    return (
        <Dropdown hasItems={false}>
            <button>Settings</button>
            <div>
                <label>
                    Full name:{' '}
                    <input
                        defaultValue=""
                        onChange={(value) =>
                            console.log('Full name:', value)
                        }
                        placeholder="Sally Ride"
                        type="text"
                    />
                </label>
                <label>
                    Email:{' '}
                    <input
                        defaultValue=""
                        onChange={(value) => console.log('Email:', value)}
                        placeholder="sally@ride.com"
                        type="email"
                    />
                </label>
            </div>
        </Dropdown>
    );
}
```

### Placement Customization with CSS Variables

Placement is best customized in CSS instead of props. The component exposes
CSS custom properties for the most common low-level placement controls:

- `--uktdd-body-position-area`
- `--uktdd-body-position-try-fallbacks`
- `--uktdd-body-translate`
- `--uktdd-body-min-height`
- `--uktdd-body-min-width`
- `--uktdd-body-max-height`
- `--uktdd-body-max-width`

Example:

```css
.settings-dropdown {
    --uktdd-body-position-area: bottom span-left;
    --uktdd-body-position-try-fallbacks:
        --uktdd-top-right, --uktdd-bottom-left, --uktdd-top-left;
    --uktdd-body-translate: -8px 0;
}

.settings-dropdown .uktdropdown-body {
    inline-size: 18rem;
}
```

This approach keeps the public React API small while still allowing precise
placement and sizing control when a product surface needs it.

One caveat for dropdowns with submenus: any `--uktdd-body-translate` value
except `none` (the default) makes the dropdown body a containing block for
its fixed-position submenus, which constrains and clips them — only nudge
dropdowns without submenus.

### End-Aligned, Content-Sized Menu

For menus attached to controls near the right edge of the viewport, such as
an avatar menu in a fixed header, prefer customizing alignment only and let
the menu size itself from its contents.

```css
.avatar-menu {
    --uktdd-body-position-area: bottom span-left;
    --uktdd-body-position-try-fallbacks:
        --uktdd-top-right, --uktdd-top-left, --uktdd-bottom-right;
}
```

This keeps the menu:

- aligned to the end edge of the trigger
- content-sized by default
- constrained only by the component’s max available space rules

Avoid hardcoding width for this pattern unless the product explicitly needs
a fixed-size menu.

## Submenus

A `Dropdown` is a disclosure node: a trigger plus a disclosed list.
Disclosure nodes compose — nest them for depth (submenus), or wrap siblings
in [`Menubar`](#menubar) for breadth (a menu bar). A submenu is nothing
more than a `Dropdown` nested inside another dropdown’s body: the nested
dropdown renders as a **parent item**, an item that discloses a child menu
instead of submitting a value.

```tsx
import Dropdown from '@acusti/dropdown';

function FormatMenu() {
    return (
        <Dropdown label="Format" onSubmitItem={applyFormat}>
            <ul>
                <li data-ukt-item>Bold</li>
                <li data-ukt-item>Italic</li>
                <Dropdown label="Align">
                    <ul>
                        <li data-ukt-value="left">Left</li>
                        <li data-ukt-value="center">Center</li>
                        <li data-ukt-value="right">Right</li>
                    </ul>
                </Dropdown>
            </ul>
        </Dropdown>
    );
}
```

Submenu semantics:

- Parent items disclose; they never submit. `onSubmitItem` fires only for
  leaf items, and the payload’s `path` reports the leaf’s ancestor parent
  items (see the [`Item` type](#item-type) above), so leaves with the same
  value in different submenus are distinguishable.
- Submenus nest to arbitrary depth — a submenu body can itself contain
  nested dropdowns.
- A parent item highlights immediately when it becomes active — via pointer
  or arrow keys — and discloses its submenu after a short intent delay,
  with the highlight staying on the parent (macOS-style: moving quickly
  past parent items never flashes their submenus open, but pausing on one
  for even a moment shows its submenu). Activating a sibling closes it. →
  opens the submenu immediately and moves the highlight into it — see
  [Keyboard Navigation](#keyboard-navigation--accessibility).
- A parent item’s open state is carried by its `aria-expanded` attribute,
  which is also the styling hook for submenu visibility.
- With the pointer, an open submenu tracks mouse intent: moving diagonally
  from the parent item toward the submenu keeps it open even as the pointer
  crosses sibling items along the way (the macOS “safe triangle” between
  the pointer and the submenu’s near edge). Moving straight onto a sibling
  — or pausing mid-diagonal — switches to that item as usual.

### The `data-ukt-submenu` protocol

Like items, submenus are ultimately declared in the DOM. A nested
`Dropdown` renders this markup:

```html
<li data-ukt-item aria-haspopup="menu" aria-expanded="false">
    Align
    <ul data-ukt-submenu role="menu">
        …
    </ul>
</li>
```

You can author that markup directly instead of nesting a `Dropdown`
component; the two forms behave identically because the component form
compiles to the attribute form. Rules for direct authoring:

- the `data-ukt-submenu` element must be a descendant of its parent item
  element
- in a level whose items include a submenu, mark all of that level’s items
  explicitly with `data-ukt-item` or `data-ukt-value`; purely flat levels —
  including flat submenu bodies — fall back to the automatic item-detection
  heuristic
- a parent item’s label is its text content excluding the submenu subtree

### Props on a nested Dropdown

Most props keep their meaning, scoped to the submenu:

- `label` (or the first of two children): the parent item’s content
- `onSubmitItem`: fires for submissions within that subtree only
- `onActiveItem`, `onOpen`, `onClose`: scoped to the submenu
- `disabled`: disables the parent item
- `className`/`style`: applied to the parent item element

Props that only make sense at the top level (`allowCreate`, `allowEmpty`,
`isOpenOnMount`, `isSearchable`, `keepOpenOnSubmit`, `minHeightBody`,
`minWidthBody`, `name`, `placeholder`, `tabIndex`, `value`) are ignored on
a nested dropdown and warn (unconditionally, matching the children-count
misuse error).

### Submenu placement and styling

Submenus reuse the dropdown’s anchor-positioning layout model: the expanded
parent item is the anchor, and the submenu opens at its inline-end,
top-aligned, falling back to the opposite side when out of bounds.
Placement custom properties follow the established naming scheme:

- `--uktdd-submenu-position-area` (default: `inline-end span-block-end`)
- `--uktdd-submenu-position-try-fallbacks`
- `--uktdd-submenu-translate` (default: `none`; like
  `--uktdd-body-translate`, any other value makes that box a containing
  block that constrains and clips the submenus nested inside it)

Parent items render a macOS-style disclosure chevron, drawn in CSS with the
item’s `::after` pseudo-element and colored with `currentColor` so it
follows the item’s highlight color. Restyle or remove it by overriding
`[aria-haspopup='menu']::after`.

Submenu bodies set `color: var(--uktdd-body-color)` (default: `canvastext`)
explicitly — without it, an active parent item’s highlight text color would
inherit into its submenu’s items, because the submenu is the parent item’s
DOM child. Set `--uktdd-body-color` alongside `--uktdd-body-bg-color` when
theming menu colors.

The active path is fully styleable: `data-ukt-active` marks one item per
open level (a parent item stays active while you navigate its submenu), and
`aria-expanded="true"` marks open parent items. The default submenu
visibility rule, shown here for reference:

```css
[data-ukt-submenu] {
    display: none;
}

[aria-expanded='true'] > [data-ukt-submenu] {
    display: block;
}
```

Following macOS, the default styles distinguish the deepest active item —
the one keyboard input operates on — from its ancestors on the active path.
The deepest item gets the primary highlight
(`--uktdd-body-bg-color-hover`); an ancestor parent item — active with the
highlight deeper inside its submenu, or with the pointer anywhere inside
its open submenu, even over a separator or disabled item — gets a muted
highlight (`--uktdd-body-bg-color-path`, gray by default). Surfacing back
out with ← closes the submenu and restores the parent’s primary highlight.
The default rule, shown here for reference:

```css
/* an active item is on the path — not deepest — while a deeper
   highlight exists or the pointer is inside its submenu */
[data-ukt-active]:has([data-ukt-submenu] [data-ukt-active]),
[data-ukt-active]:has([data-ukt-submenu]:hover) {
    background-color: var(--uktdd-body-bg-color-path);
    color: var(--uktdd-body-color-path);
}
```

### Nested non-menu dropdowns

Nesting means submenu only for menus. A nested `Dropdown` with
`hasItems={false}` isn’t a menu, so it renders as an independent anchored
dropdown instead of a parent item — for example, an ℹ️ button next to an
input in a form dropdown that opens an info popover about the input:

```tsx
<Dropdown hasItems={false}>
    Preferences
    <div>
        <label>
            Width <input name="width" />
        </label>
        <Dropdown hasItems={false}>
            <button aria-label="About width">ℹ️</button>
            <p>Width accepts any CSS length.</p>
        </Dropdown>
    </div>
</Dropdown>
```

The nested dropdown owns its own interactions: opening it, clicking inside
it, and navigating it never close or submit the outer dropdown, and Escape
closes the innermost open dropdown first — a second Escape closes the outer
one.

## Menubar

`Menubar` combines sibling dropdowns into a single menu, like the system
menu in the top toolbar of macOS. Each dropdown’s trigger becomes a menubar
item. See the [Quick Start](#quick-start) for a complete example:

```tsx
import Dropdown, { Menubar } from '@acusti/dropdown';

<Menubar>
    <Dropdown label="File">…</Dropdown>
    <Dropdown label="Edit">…</Dropdown>
    <Dropdown label="View">…</Dropdown>
</Menubar>;
```

Menubar behaviors:

- renders `role="menubar"`; each dropdown trigger is a menubar item
- at most one menu in the bar is open at a time
- once any menu is open, hovering another trigger switches to that menu
  without a click (matching macOS menubar behavior)
- **←/→** move between menus, wrapping at the ends: with the bar focused
  they move focus between triggers, and while a menu is open they slide the
  open menu to the adjacent trigger — unless the active item is a parent
  item, in which case **→** dives into its submenu instead
- **↓/Enter/Space** open the focused trigger’s menu
- **Escape** closes the open menu — including any open submenus — and
  returns focus to its menubar item

The trigger of the open menu gets an active-state background so it reads as
selected, like the highlighted item in the macOS menu bar. The default
tints over whatever background the trigger already has (via
`--uktdd-menubar-trigger-bg-color-active`, applied to
`.uktmenubar .uktdropdown.is-open .uktdropdown-trigger`), so it works
regardless of how the trigger is styled; override the custom property, or
the rule itself, to restyle it.

`Menubar` supersedes the `group` prop that appeared in earlier versions of
the `Props` type: `group` was a string-ID way to associate dropdowns that
was never wired up, and composition expresses the relationship directly.

## Keyboard Navigation & Accessibility

The dropdown implements full keyboard navigation. The model has one rule:
navigate along the current menu level’s axis, dive into a submenu
perpendicular to it, surface back out with the opposite key. Menus are
vertical, so ↑/↓ navigate and →/← dive/surface; a menubar is horizontal, so
←/→ navigate and ↓ dives.

Keys operate on the **current level**: the level of the deepest highlighted
item. Note that this can be one level shallower than the deepest open
submenu — pausing on a parent item discloses its submenu after a short
intent delay while the highlight stays on the parent, and only → moves the
highlight into it.

- **Enter/Space**: Open the dropdown; with an item highlighted, select it
  (leaf items) or open its submenu (parent items)
- **Escape**: Close the dropdown entirely — including any open submenus —
  and return focus to the trigger (macOS-style; use ← to back out one level
  at a time)
- **Arrow Up/Down**: Navigate between items in the current level
- **Arrow Right**: Open the highlighted parent item’s submenu (if not
  already disclosed) and highlight its first item; in a
  [`Menubar`](#menubar), if the highlighted item is a leaf, slide to the
  next menu instead
- **Arrow Left**: Close the highlighted item’s level and return to its
  parent item; in a `Menubar` with the highlight at the top level of a
  menu, slide to the previous menu
- **Home/End**: Jump to first/last item in the current level
- **Type characters**: Jump to the best-matching item in the current level

For accessibility, the component focuses on semantic HTML structure and
keyboard navigation. It works best when you use appropriate HTML elements
in your dropdown content (like `<ul>` and `<li>` for lists, `<button>`
elements for actions, etc.).

### ARIA attributes

The trigger automatically receives `aria-haspopup`, `aria-expanded`, and
`aria-controls` pointing to the open body. The popup role is chosen based
on the dropdown’s mode:

- `aria-haspopup="listbox"` when `isSearchable` is true (combobox pattern)
- `aria-haspopup="menu"` when `hasItems` is true (the default)
- `aria-haspopup="dialog"` when `hasItems={false}` (interactive content)

The open body element also receives a matching `role` and an `id` so screen
readers can associate the trigger with its popup. If your custom trigger
already specifies any of these ARIA props, your values win — the component
only fills in what you haven’t set.

Submenus and menubars extend the same pattern automatically:

- parent items receive `aria-haspopup="menu"` and `aria-expanded`, and
  their submenu container receives `role="menu"` and a linked `id`
- the `Menubar` container receives `role="menubar"`

As with the trigger, any of these you specify yourself win.

One deliberate deviation from the
[APG menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/): APG
specifies that Escape closes one menu level per press, while this component
closes the whole menu at once (matching macOS native menus and Radix UI).
Level-by-level closing is already covered by ←, so a one-level Escape would
be redundant; closing everything preserves Escape’s universal “dismiss this
context” meaning. The part of the APG guidance that matters for assistive
technology is kept: closing the menu always returns focus to the element
that opened it.
