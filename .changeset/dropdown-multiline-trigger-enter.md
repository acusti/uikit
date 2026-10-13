---
'@acusti/dropdown': patch
---

Fix Enter in a text field trigger of a `hasItems={false}` dropdown

Enter pressed in a textarea or an editable element that is the trigger of
an open `hasItems={false}` dropdown now adds a line break there, where the
dropdown used to take the key. In a single-line input trigger, an Enter
that a handler has prevented is no longer a submit, so it doesn’t close a
`keepOpenOnSubmit={false}` dropdown.
