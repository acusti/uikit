---
'@acusti/parsing': patch
---

Read on past a number, object, or array that follows a string value

In an unfinished or otherwise invalid text, a comma after a number, object,
or array (`"heading":"Hi","rating":5,`) could be mistaken for the end of a
key with no value, which left `parseAsJSON` returning a `value` of `null`.
It now only treats a string as a key that is missing its value.
