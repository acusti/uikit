---
'@acusti/parsing': minor
---

Read a string with a raw line break in it whole

A raw line break before a `{` or `[` in a string (a markdown link, a
placeholder, code) used to cut the string short and make up a `key` for the
bracket. It is now part of the string, as a line break before anything else
is.

A string that is never closed no longer ends at such a line break either:
it runs on to its next quote mark, and an object written on one line after
it usually leaves a `value` of `null`.
