---
'@acusti/input-text': minor
---

Introduce a `discardOnEscape` prop that resets the input value to
`initialValue` and blurs the input when the Escape key is pressed to
provide users with a way to quickly revert changes and exit editing mode.
The `discardOnEscape` prop also blurs the input on Enter, so when
`discardOnEscape` is true, the component consumer can use `onBlur` to
handle “submit” and the input’s value will either be the `initialValue` if
the user hit Escape or the new value if they hit Enter.
