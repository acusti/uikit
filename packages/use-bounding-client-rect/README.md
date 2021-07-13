# @acusti/use-bounding-client-rect

![latest version](https://img.shields.io/npm/v/@acusti/use-bounding-client-rect?style=for-the-badge)
![dependencies status](https://img.shields.io/david/acusti/uikit?path=packages%2Fuse-bounding-client-rect&style=for-the-badge)
![bundle size](https://img.shields.io/bundlephobia/min/@acusti/use-bounding-client-rect?style=for-the-badge)
![downloads per month](https://img.shields.io/npm/dm/@acusti/use-bounding-client-rect?style=for-the-badge)

`useBoundingClientRect` is a React hook that returns the
`boundingClientRect` for the passed in HTMLElement and uses
`ResizeObserver` to update the return value and trigger a new render when
the HTMLElement’s `boundingClientRect` changes.
