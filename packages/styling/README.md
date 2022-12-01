# @acusti/styling

[![latest version](https://img.shields.io/npm/v/@acusti/styling?style=for-the-badge)](https://www.npmjs.com/package/@acusti/styling)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/styling?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fstyling)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@acusti/styling?style=for-the-badge)](https://bundlephobia.com/package/@acusti/styling)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/styling?style=for-the-badge)](https://www.npmjs.com/package/@acusti/styling)

Exports `Style`, which is a React component that renders a CSS style string
as a `<style>` element in the `<head>` of the document optionally specified
by `props.ownerDocument`. Keeps a per-document global registry of styles
being rendered so that the same string of CSS will only be rendered as a
single `<style>` element, no matter how many times the `<Style>` element
with that string appears in the React component tree.

Also exports useful CSS string literals, such as `SYSTEM_UI_FONT` which can
be used as `font-family: ${SYSTEM_UI_FONT};` to specify the appropriate UI
font for the current OS and browser.
