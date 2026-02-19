---
'@acusti/input-text': minor
---

Add a `keepFocusOnSubmit` prop for `InputText` so `submitOnEnter` can
submit without blurring, which supports chat-style compose flows where
users send consecutive messages without manually refocusing.
