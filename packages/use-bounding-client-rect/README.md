# @acusti/use-bounding-client-rect

[![latest version](https://img.shields.io/npm/v/@acusti/use-bounding-client-rect?style=for-the-badge)](https://www.npmjs.com/package/@acusti/use-bounding-client-rect)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/use-bounding-client-rect?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fuse-bounding-client-rect)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/use-bounding-client-rect?style=for-the-badge)](https://www.npmjs.com/package/@acusti/use-bounding-client-rect)
[![bundle size](https://deno.bundlejs.com/badge?q=@acusti/use-bounding-client-rect)](https://bundlejs.com/?q=%40acusti%2Fuse-bounding-client-rect)

`useBoundingClientRect` is a React hook that returns the
`boundingClientRect` for the passed in HTMLElement and uses
`ResizeObserver` to update the return value and trigger a new render when
the HTMLElement’s `boundingClientRect` changes.
