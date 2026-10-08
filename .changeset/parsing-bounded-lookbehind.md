---
'@acusti/parsing': patch
---

Improve performance on long unfinished or invalid text

At a comma that follows a string in an object, `parseAsJSON` now searches
back only as far as the end of the last key, rather than through everything
it has read so far. A long unfinished or invalid text is read in much less
time, and returns the same values.
