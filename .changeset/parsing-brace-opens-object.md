---
'@acusti/parsing': minor
---

Take a brace for the start of the JSON only where it opens an object

A `{` in a preamble (`Use {placeholders} like this: {"a": "b"}`, or code
with braces) was taken for the start of the JSON, so the `preamble` was cut
short at it, and a text with no JSON after it returned `{}`. Such a brace
is now part of the preamble: the `preamble` runs up to the object, and a
text with no JSON in it returns a `value` of `null`.
