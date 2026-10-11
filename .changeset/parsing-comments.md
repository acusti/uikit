---
'@acusti/parsing': minor
---

Read JSON that has comments in it

`//` and `/* */` comments in the JSON are now left out when it is read. A
comment after a member (`"timeout": 30, // seconds`) used to end the
`value` at that member, with the rest of the JSON in the `postscript`, and
one after the opening brace put the brace in the `preamble`. A `//` in a
string, as in a URL, is not a comment.
