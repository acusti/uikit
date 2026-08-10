---
'@acusti/dropdown': patch
---

Widen the text input selector to match use-keyboard-events

The selector that finds a custom trigger's value-source input excluded only
`radio`, `checkbox`, and `range`, so a `submit`, `button`, `file`, or other
non-text input in a trigger was adopted as the dropdown's value source. It
is now derived from `NON_TEXT_INPUT_TYPES`, the same list
`isEventTargetUsingKeyEvent` uses, so the two agree.
