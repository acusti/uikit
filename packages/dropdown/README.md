# @acusti/dropdown

[![latest version](https://img.shields.io/npm/v/@acusti/dropdown?style=for-the-badge)](https://www.npmjs.com/package/@acusti/dropdown)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/dropdown?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fdropdown)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/dropdown?style=for-the-badge)](https://www.npmjs.com/package/@acusti/dropdown)
[![bundle size](https://deno.bundlejs.com/badge?q=@acusti/dropdown)](https://bundlejs.com/?q=%40acusti%2Fdropdown)

`Dropdown` is a React component that renders a menu-like UI with a trigger
that the user clicks to disclose a dropdown anchored to that trigger. The
body of the dropdown can include any DOM, and many dropdowns can be
combined to form a multi-item menu, like the system menu in the top toolbar
of macOS.

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
    4. To style your dropdowns, use CSS; there are a
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
- `.uktdropdown-content` as the scrollable inner region

Custom padding and overflow styling usually belongs on the content region,
not the outer shell.

For the most reliable anchor-positioning behavior:

- pass exactly two children when you need a custom trigger
- ensure the trigger resolves to a stable DOM element
- keep the trigger first and the dropdown body second
- prefer CSS variable overrides over custom `top`/`left`/`right` inset
  rules

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
     * Boolean indicating if the user can submit an empty value (i.e. clear
     * the value). Defaults to true.
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
     * Group identifier string links dropdowns together into a menu
     * (like macOS top menubar).
     */
    group?: string;
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

```tsx
function InteractiveDropdown() {
    return (
        <Dropdown hasItems={false}>
            <button>Settings</button>
            <div style={{ padding: '16px' }}>
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

## Keyboard Navigation & Accessibility

The dropdown implements full keyboard navigation:

- **Enter/Space**: Open dropdown or select highlighted item
- **Escape**: Close dropdown
- **Arrow Up/Down**: Navigate between items
- **Home/End**: Jump to first/last item
- **Type characters**: Search for items (when searchable)

For accessibility, the component focuses on semantic HTML structure and
keyboard navigation. It works best when you use appropriate HTML elements
in your dropdown content (like `<ul>` and `<li>` for lists, `<button>`
elements for actions, etc.).
