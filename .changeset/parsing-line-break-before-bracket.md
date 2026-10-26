---
'@acusti/parsing': minor
---

Keep a raw line break in a string whatever follows it

A string with a raw line break before a `{` or `[` (a markdown link, a
citation, a placeholder or code on its second line) was cut short at the
line break, with a `key` made up for the bracket after it. The line break
is now escaped as any other is, and the string is read whole. A string that
is never closed is no longer ended at a line break before a bracket either:
it is read on to its next quote mark, which usually leaves a `value` of
`null` where the next object or array stood on a line of its own.

The search for where the JSON starts no longer stops an object's first key
at such a line break, so an object whose first key holds one starts the
JSON.
