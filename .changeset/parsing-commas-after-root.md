---
'@acusti/parsing': minor
---

Leave out every comma after the JSON’s closing bracket

A text that needs a repair and has two or more commas after its closing
bracket now gets its `value`: `{"a": "b",},,` gives `{ a: 'b' }`. Look out
for code that takes a `value` of `null` to mean that a text has no JSON in
it, since these texts now have one. A text that already had a `value` reads
as it did, and no `postscript` or `preamble` changes.
