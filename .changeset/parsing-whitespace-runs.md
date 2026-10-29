---
'@acusti/parsing': patch
---

Improve performance on long runs of whitespace

A long run of spaces, or of line breaks between members, in a text that
`parseAsJSON` has to repair (a trailing comma, say), or of whitespace
between the JSON and a note after it, is now read in time that grows with
its length, where it took seconds. The `value`, `preamble` and `postscript`
it returns are unchanged.
