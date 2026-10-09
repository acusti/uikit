---
'@acusti/parsing': patch
---

Read a string that ends after a comma and an escaped quote mark

A text that ended inside a string with a comma and then an escaped quote
mark in it (`"quote": "Honestly, \"the best`) made `parseAsJSON` return a
`value` of `null`, as did one that ended on a key with an escaped quote
mark in it (`"q\"k"`). Both are now read.
