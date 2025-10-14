---
'@acusti/input-text': patch
---

Refactor field sizing support logic in `InputText` to resolve the following
eslint error: “Calling setState synchronously within an effect can trigger
cascading renders”.
