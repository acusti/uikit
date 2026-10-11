---
'@acusti/parsing': minor
---

Stop converting markdown tables into objects

A two-column markdown table is no longer read as an object of keys and
values. The conversion ran over the whole text, so a table in a preamble
was returned in place of the JSON after it, and one after the JSON was
merged into it. If you need a table read, convert it before calling
`parseAsJSON`.
