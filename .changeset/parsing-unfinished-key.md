---
'@acusti/parsing': minor
---

Leave out a key that the text ends partway through

A text that ended inside an object key (`{"heading": "News", "descr`) had
that key closed where it stopped and given `''`, so the value held a key
the text never meant to write: `descr`, or `''` when only the opening quote
mark had arrived. Where the part that had arrived spelled an earlier key in
the same object (`"button` on the way to `"buttonLink"`), that key’s value
was replaced by `''`. The unfinished key is now left out until it is whole.

A key that is whole but has no value yet (`"description"` or
`"description":`) still holds `''`.
