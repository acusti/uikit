---
'@acusti/parsing': patch
---

Read an escaped backslash before a closing quote mark or a raw line break

When the text around it needs a repair, such as a missing comma, a string
that ends in an escaped backslash (`"path": "C:\\"`) was never closed,
which left `parseAsJSON` returning a `value` of `null`. That string is now
closed at its quote mark. An escaped backslash before a raw line break in a
string is now kept whole, where the line break after it was read as the
letter `n`.
