---
'@acusti/parsing': patch
---

Improve performance on long texts that need a repair

A long array or object in a text that `parseAsJSON` has to repair (a
missing comma, say, or a trailing comma, even one in each of its objects)
is now read in time that grows with its length, where a few hundred
kilobytes took seconds. This changes no reading.
