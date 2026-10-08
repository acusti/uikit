---
'@acusti/parsing': patch
---

Read a string in an array as over when a non-string item follows it

In an unfinished or otherwise invalid text, the closing quote mark of a
string in an array was taken for an unescaped quote mark inside that string
when the next item was not a string (`["a", true, "b"]`,
`["a", {"b": 1}]`). The items were merged into one string, and the document
could lose its root. A comma followed by a bare literal, an object, or an
array now ends the string.
