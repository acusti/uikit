# @acusti/dropdown

[![latest version](https://img.shields.io/npm/v/@acusti/dropdown?style=for-the-badge)](https://www.npmjs.com/package/@acusti/dropdown)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/dropdown?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fdropdown)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@acusti/dropdown?style=for-the-badge)](https://bundlephobia.com/package/@acusti/dropdown)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/dropdown?style=for-the-badge)](https://www.npmjs.com/package/@acusti/dropdown)

`Dropdown` is a React component that renders a menu-like UI with a trigger
that the user clicks to disclose a dropdown positioned below the trigger.
The body of the dropdown can include any DOM, and many dropdowns can be
combined to form a multi-item menu, like the system menu in the top toolbar
of macOS.

The three primary design goals for the existence of this component:

1. Best-in-class UX (inspired by macOS native menus) with excellent
   keyboard support
2. Best-in-class DX with the simplest possible API:
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
       [collection of CSS custom properties](https://github.com/acusti/uikit/blob/main/packages/dropdown/src/styles.ts#L21-L32)
       used internally to style them if that works best for you, or just
       override the minimal default CSS as appropriate
3. Lightweight bundle size with the bare minimum of dependencies (see
   minzipped size above)

See the [storybook docs and demo][] to get a feel for what it can do.

[storybook docs and demo]:
    https://acusti-uikit.netlify.app/?path=/docs/uikit-controls-Dropdown--docs

## Usage

```
npm install @acusti/dropdown
# or
yarn add @acusti/dropdown
```

### Props

This is the type signature for the props you can pass to `Dropdown`. The
unique features provided by the component are called out and explained
above the corresponding prop via JSDoc comments:

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
     */
    className?: string;
    disabled?: boolean;
    hasItems?: boolean;
    isOpenOnMount?: boolean;
    isSearchable?: boolean;
    keepOpenOnSubmit?: boolean;
    label?: string;
    /**
     * Only usable in conjunction with {isSearchable: true}.
     * Used as search input’s name.
     */
    name?: string;
    onClick?: (event: React.MouseEvent<HTMLElement>) => unknown;
    onClose?: () => unknown;
    onMouseDown?: (event: React.MouseEvent<HTMLElement>) => unknown;
    onMouseUp?: (event: React.MouseEvent<HTMLElement>) => unknown;
    onOpen?: () => unknown;
    onSubmitItem?: (payload: Item) => void;
    /**
     * Only usable in conjunction with {isSearchable: true}.
     * Used as search input’s placeholder.
     */
    placeholder?: string;
    style?: React.CSSProperties;
    /**
     * Only usable in conjunction with {isSearchable: true}.
     * Used as search input’s tabIndex.
     */
    tabIndex?: number;
    /**
     * Used as search input’s value if props.isSearchable === true
     * Used to determine if value has changed to avoid triggering onSubmitItem if not
     */
    value?: string;
};
```
