---
'@acusti/parsing': patch
---

Improve performance on long strings with unescaped quote marks

A long string with many unescaped quote marks in it is now read in time
that grows with its length, where tens of thousands of them took seconds.
The `value`, `preamble` and `postscript` it returns are unchanged.
