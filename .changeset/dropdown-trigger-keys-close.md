---
'@acusti/dropdown': minor
---

Close a `hasItems={false}` dropdown with Enter or Space on its trigger

Enter and Space pressed on the open trigger of a `hasItems={false}`
dropdown now close it, as a click on the trigger does. They used to leave
it open unless `keepOpenOnSubmit` was false. Space still goes to a text
field or a checkbox in the trigger, and an editable element used as a
trigger now gets it too.
