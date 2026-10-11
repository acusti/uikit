---
'@acusti/parsing': patch
---

Parse valid JSON that follows a preamble as it is

A whole, valid JSON value after a preamble went through the repairs, which
misread spacing they don’t expect: `Here it is: {"a": "b" , "c": "d"}`
returned a `value` of `null`. It is now parsed as it is.
