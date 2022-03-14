# @acusti/use-bounding-client-rect

[![latest version](https://img.shields.io/npm/v/@acusti/use-bounding-client-rect?style=for-the-badge)](https://www.npmjs.com/package/@acusti/use-bounding-client-rect)
[![dependencies status](https://img.shields.io/librariesio/release/npm/@acusti/use-bounding-client-rect?style=for-the-badge)](https://libraries.io/npm/@acusti%2Fuse-bounding-client-rect/sourcerank)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@acusti/use-bounding-client-rect?style=for-the-badge)](https://bundlephobia.com/package/@acusti/use-bounding-client-rect)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/use-bounding-client-rect?style=for-the-badge)](https://www.npmjs.com/package/@acusti/use-bounding-client-rect)

`useBoundingClientRect` is a React hook that returns the
`boundingClientRect` for the passed in HTMLElement and uses
`ResizeObserver` to update the return value and trigger a new render when
the HTMLElement’s `boundingClientRect` changes.
