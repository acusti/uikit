---
'@acusti/parsing': minor
---

Keep a raw tab or carriage return in a string

A string with a raw tab or carriage return in it (tab-indented code, a CRLF
line break) is now read whole, as a raw line break is, and so is one with
any other control character that JSON leaves out of a string (previously
`value` was `null`, also while the text streamed in).
