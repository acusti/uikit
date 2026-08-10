---
'@acusti/use-keyboard-events': minor
---

Export NON_TEXT_INPUT_TYPES

The input types that hold no user-entered text — the ones behind
`isEventTargetUsingKeyEvent` — are now exported, so consumers can share
that notion of what counts as a text input instead of keeping a copy in
sync by hand. It’s a frozen `readonly string[]`, since every consumer
shares the one instance.
