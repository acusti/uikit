---
'@acusti/input-text': patch
---

Fix the caret and IME input in an `InputText` used in the React controlled
input pattern

An `InputText` whose `initialValue` is set from its own `onChangeValue`, as
in a React controlled input, no longer writes that value back into the
input on every keystroke. In Safari, the write moved the caret to the end
of the text after each key, ended an IME composition after one key, and
made the characters typed after it come out doubled.
