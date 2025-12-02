---
'@acusti/input-text': patch
'@acusti/css-value-input': patch
---

Added support for React 19 ref callback cleanup functions. Ref callbacks
can now return cleanup functions that will be called when the element is
removed or the ref changes, matching React 19’s native ref behavior.
