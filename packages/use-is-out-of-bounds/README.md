# @acusti/use-is-out-of-bounds

[![Open on npmx.dev](https://npmx.dev/api/registry/badge/version/@acusti/use-is-out-of-bounds)](https://npmx.dev/package/@acusti/use-is-out-of-bounds)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/size/@acusti/use-is-out-of-bounds)](https://npmx.dev/package/@acusti/use-is-out-of-bounds)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/dependencies/@acusti/use-is-out-of-bounds)](https://npmx.dev/package/@acusti/use-is-out-of-bounds)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/downloads-month/@acusti/use-is-out-of-bounds)](https://npmx.dev/package/@acusti/use-is-out-of-bounds)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/updated/@acusti/use-is-out-of-bounds)](https://npmx.dev/package/@acusti/use-is-out-of-bounds)

`useIsOutOfBounds` is a React hook that returns a
`{ bottom: boolean, left: boolean, right: boolean, top: boolean, hasLayout: boolean }`
object for the passed-in element. The `hasLayout` value represents whether
the element has been laid out yet (i.e. if the browser has computed the
reflow), while the side values indicate whether an element is outside of
its parent’s bounds on that side.
