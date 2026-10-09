---
'@acusti/parsing': minor
---

Read partial text as JSON far more efficiently by closing anything left
incomplete before attempting repairs

`parseAsJSON` now reads a text that is JSON as far as it goes in one pass:
it closes what the text leaves open and parses the result, and only goes on
to its repairs when that doesn’t work. This makes it way more performant
when being used to read a stream incrementally as it arrives.

`parseAsJSON` also reads unfinished text that the repairs got wrong:
unusual spacing (`{"a": "b" , "c": "d`), an array at the root that opens on
a literal (`[true, "a`), a string that ends in an escaped backslash, and a
key that holds an escaped quote mark.
