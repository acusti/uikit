---
'@acusti/parsing': minor
---

Stop reading a list of keys and values that has no braces

A text of `"key": "value",` lines with no braces around them is no longer
read as an object: the JSON now starts at a `{` or a `[`, never at a quote
mark. A quoted word in a preamble was being taken for a key, which cut the
`preamble` short or returned part of the preamble as the value. A `//`
comment after an object’s opening brace was only read through this path, so
an object with one is no longer read either.
