---
'@acusti/parsing': patch
---

Give a key `''` where the text ends after its colon, whatever the spacing
before the colon

A text that needs a repair and ends after a key and its colon (or stops
there at a value that can’t be read) now leaves the key holding `''` with
any spacing between the key and its colon too:
`{"tags": ["a",], "rating" :` returns `{ tags: ['a'], rating: '' }`
(previously its `value` was `null`).
