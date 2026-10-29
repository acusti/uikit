---
'@acusti/parsing': patch
---

Improve performance on long runs of whitespace

A long run of spaces in a text that `parseAsJSON` has to repair (a trailing
comma, say) is now read in time that grows with its length, where it took
seconds. The `value`, `preamble` and `postscript` it returns are unchanged.
