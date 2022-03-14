# @acusti/dropdown

[![latest version](https://img.shields.io/npm/v/@acusti/dropdown?style=for-the-badge)](https://www.npmjs.com/package/@acusti/dropdown)
[![dependencies status](https://img.shields.io/librariesio/release/npm/@acusti/dropdown?style=for-the-badge)](https://libraries.io/npm/@acusti%2Fdropdown/sourcerank)
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
       [collection of CSS variables](https://github.com/acusti/uikit/blob/main/packages/dropdown/src/styles.ts#L17-L27)
       used internally to style them if that works best for you, or just
       override the minimal default CSS as appropriate
3. Lightweight bundle size with the bare minimum of dependencies (see
   minzipped size above)
