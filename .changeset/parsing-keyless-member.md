---
'@acusti/parsing': patch
---

Read a member that lost its key or its value, wherever it is in its object

A string that stands alone in an object where a key and its value were due
(the second object in
`[{"category": "hero"}, {"features", "variant": "b"}]`, where a model left
out `"category":`) is now kept as a key with `''` wherever it is in its
object, and the rest of the text is read. It was read that way only right
after another member’s string value, and made the whole `value` `null`
anywhere else. The first member of the root is the exception: `{"a", "b"}`
is a set, and its `value` is still `null`.
