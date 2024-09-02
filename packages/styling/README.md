# @acusti/styling

[![latest version](https://img.shields.io/npm/v/@acusti/styling?style=for-the-badge)](https://www.npmjs.com/package/@acusti/styling)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/styling?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fstyling)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@acusti/styling?style=for-the-badge)](https://bundlephobia.com/package/@acusti/styling)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/styling?style=for-the-badge)](https://www.npmjs.com/package/@acusti/styling)

This package exports `Style`, which is a React component that takes a CSS string as its children, minifies it, and renders it using the react v19+ `<style>` element’s [special rendering behavior](https://react.dev/reference/react-dom/components/style#special-rendering-behavior):

> React will move `<style>` components to the document’s `<head>`, de-duplicate identical stylesheets, and suspend while the stylesheet is loading.

This behavior is SSR-friendly (no server hydration errors), and the suspense behavior ensures any assets used by the CSS styles that must be fetched and parsed (e.g. fonts or images) can do so with a loading behavior as-good or better than the way regular CSS stylesheets or inline styles are handled by the browser.

The CSS minification means that insignifant differences between styles (e.g. varying whitespace or empty declarations) won’t result in sthyle duplication. Also, the component maintains an internal global cache of the minified styles to avoid unnecessary re-calculations.

Lastly, this package exports useful CSS string literals, such as `SYSTEM_UI_FONT` which can
be used as `font-family: ${SYSTEM_UI_FONT};` to specify the appropriate UI
font for the current OS and browser.
