---
'@acusti/input-text': patch
---

Show a new `initialValue` in the same render that sets it

When `initialValue` changes in an update from a timer, a response, a
transition or a pointer drag, the input now applies it in the same commit.
This improves over the previous behavior, in which an input that had been
typed in, or that was created with a non-empty `initialValue`, kept its old
value for the current commit and didn’t update until a task later.
