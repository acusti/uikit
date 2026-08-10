---
'@acusti/use-keyboard-events': minor
---

Export NON_TEXT_INPUT_TYPES

The set of input types that hold no user-entered text — the one behind
`isEventTargetUsingKeyEvent` — is now exported, so consumers can share its
notion of what counts as a text input instead of keeping a copy in sync by
hand.
