---
'@acusti/vite-plugin-svg-react': minor
---

A boolean attribute such as `hidden` is no longer dropped when its value is
empty (`<svg hidden>`, `hidden=""`) or `0`, so an `<svg hidden>` now
matches a stylesheet’s `[hidden]` rule. With `optimize`, OXVG’s default
preset still removes `hidden`, `inert`, and most empty attributes; the
README shows how to keep them.
