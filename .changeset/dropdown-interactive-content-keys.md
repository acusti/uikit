---
'@acusti/dropdown': patch
---

Fix Space and Enter in the body of a `hasItems={false}` dropdown

Space and Enter pressed in the body of an open `hasItems={false}` dropdown
now go to the control that has focus, where the dropdown used to take them:
a text input or textarea gets its space and line break, a checkbox is
toggled, and a button is pressed. Both keys still work as before on the
trigger. With `keepOpenOnSubmit={false}`, such a dropdown no longer closes
on either key pressed in its body.
