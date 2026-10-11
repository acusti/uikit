---
'@acusti/dropdown': minor
---

Close a `hasItems={false}` dropdown on submit with
`keepOpenOnSubmit={false}`

With `keepOpenOnSubmit={false}`, a `hasItems={false}` dropdown now closes
when a form in its body is submitted, by Enter in one of its inputs or by
its submit button, and stays open while the form’s own validation blocks
the submit. Enter in a single-line input that no form owns closes it too.
Space, and Enter anywhere else in the body, no longer close it. When a
submit closes it while focus is in its body, focus returns to the trigger.
