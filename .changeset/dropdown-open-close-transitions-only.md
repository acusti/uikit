---
'@acusti/dropdown': patch
---

Call `onOpen` and `onClose` only when the dropdown opens or closes

When re-shown by `<Activity>` (or re-run by StrictMode in development), a
dropdown that mounted closed called `onClose`, and one mounted open with
`isOpenOnMount` called `onOpen` again. Both callbacks now fire only on a
real open or close.
