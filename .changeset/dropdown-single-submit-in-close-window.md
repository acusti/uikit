---
'@acusti/dropdown': patch
---

Fix a double press of Enter or Space submitting a dropdown item twice

A dropdown that closes on submit now ignores any other submit in the 90ms
before it closes, so two quick presses of Enter or Space on the active item
call `onSubmitItem` once and click the item’s button or link once. A form
in a `hasItems={false}` body still gets every `submit` event, and a
dropdown with `keepOpenOnSubmit` still submits on every press.
