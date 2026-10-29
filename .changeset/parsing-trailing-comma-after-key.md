---
'@acusti/parsing': patch
---

Read on past a trailing comma after a key with no value

Where a key with no value is followed by a trailing comma (`"c",}`), the
key is still given `''`, and the rest of the text is now read too:
`{"x": {"a": 1, "c",}, "y": 2}` gives `{ x: { a: 1, c: '' }, y: 2 }`. After
the root, the `postscript` is the text after its closing brace, as it is
after any other root.
