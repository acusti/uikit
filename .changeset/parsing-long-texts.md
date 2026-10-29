---
'@acusti/parsing': patch
---

Improve performance on long texts that need a repair

A long array or object in a text that `parseAsJSON` has to repair (a
trailing comma, say, or a missing comma) is now read in time that grows
with its length, where a few hundred kilobytes took seconds.
