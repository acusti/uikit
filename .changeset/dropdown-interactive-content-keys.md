---
'@acusti/dropdown': patch
---

Fix Space and Enter around an open `hasItems={false}` dropdown

Space and Enter pressed in the body of an open `hasItems={false}` dropdown
now go to the control that has focus, where the dropdown used to take them:
a text field gets its space (and a textarea its line break), a checkbox is
toggled, and a button is pressed. The same goes for a control outside the
dropdown that keeps focus while it’s open, as when it opened on hover. Both
keys still work as before on the trigger. With `keepOpenOnSubmit={false}`,
such a dropdown no longer closes on either key while one of those controls
has focus.
