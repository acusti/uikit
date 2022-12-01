# @acusti/use-is-out-of-bounds

[![latest version](https://img.shields.io/npm/v/@acusti/use-is-out-of-bounds?style=for-the-badge)](https://www.npmjs.com/package/@acusti/use-is-out-of-bounds)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/use-is-out-of-bounds?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fuse-is-out-of-bounds)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@acusti/use-is-out-of-bounds?style=for-the-badge)](https://bundlephobia.com/package/@acusti/use-is-out-of-bounds)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/use-is-out-of-bounds?style=for-the-badge)](https://www.npmjs.com/package/@acusti/use-is-out-of-bounds)

`useIsOutOfBounds` is a React hook that returns a
`{ bottom: boolean, left: boolean, right: boolean, top: boolean, hasLayout: boolean }`
object for the passed-in element. The `hasLayout` value represents whether
the element has been laid out yet (i.e. if the browser has computed the
reflow), while the side values indicate whether an element is outside of
its parent’s bounds on that side.
