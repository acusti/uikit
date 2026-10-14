---
'@acusti/input-text': patch
---

Leave Enter alone in a single-line `submitOnEnter` input that no form owns

With `submitOnEnter`, the Enter keydown is now only prevented where it has
a default action to stop: in a multi-line input, or in an input that a form
owns. In a single-line input with no form it reaches the input’s ancestors
as it would from a plain `<input>`, so a `hasItems={false}`
`@acusti/dropdown` with `keepOpenOnSubmit={false}` now closes on it.

With `keepFocusOnSubmit`, the key there now also does what the browser does
for it: Chromium fires a `type="search"` input’s `search` event. Without
`keepFocusOnSubmit` the input has blurred by then, so it doesn’t.
