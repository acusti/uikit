---
'@acusti/parsing': patch
---

Read a string’s last line as a key whatever comes before that line

Where a string is cut short by a line break and an object or array opens on
the next line, `parseAsJSON` makes a key of the string’s last line
(`Here is what we offer:`). With no raw line break before that line the key
kept its colon and lost its value, and with more than one the `value` was
`null`. The line is now made a key whatever comes before it.
