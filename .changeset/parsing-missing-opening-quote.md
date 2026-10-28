---
'@acusti/parsing': minor
---

Leave a line of prose after a member of an array or object to the
`postscript`

Where a line of prose follows a member of an array or object, the `value`
now ends at that member: `["a", "b"\nHope this helps!` gives `['a', 'b']`,
and `{"a": {"b": 1}\nHope this helps!` gives `{ a: { b: 1 } }` (previously
`null`). After a key’s colon, such a line leaves the key holding `''`,
whatever the whitespace before it (`{"a": "b", "c":\nHope this helps!`
gives `{ a: 'b', c: '' }`).

A key that has lost its opening quote mark at the start of a line is no
longer read: `{"a": "b"\nc": "d"}` gives `{ a: 'b' }`, and where such a key
is the first of the outermost object, the `value` is `null`.
