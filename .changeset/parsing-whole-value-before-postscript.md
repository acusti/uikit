---
'@acusti/parsing': patch
---

Parse a valid JSON value as it is when text follows it

A whole, valid object or array that a postscript or the end of a code block
followed went through the repairs, which misread spacing they don’t expect:
`{"a": "b" , "c": "d"}` followed by `Hope this helps!` returned a `value`
of `null`. The value is now parsed as it is, and what follows it is the
`postscript`.
