---
'@acusti/parsing': patch
---

Read a string that ends partway through an escape sequence

A text that ended inside a string on a backslash (as a stream can, between
the `\` and the `n` of a line break), or partway through a `\uXXXX` escape,
had that string closed on the unfinished escape. That can’t be parsed, so
`parseAsJSON` returned a `value` of `null` for the whole text. It now
leaves the unfinished escape out and reads the string as far as it goes.
