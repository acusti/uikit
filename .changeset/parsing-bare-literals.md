---
'@acusti/parsing': minor
---

Read `true`, `false`, `null`, and numbers in unfinished and invalid JSON

When `JSON.parse` fails, `parseAsJSON` walks the text to repair it, and
that walk stopped at the first bare literal. The literal’s key was given
`''`, everything after it became the postscript, and whichever of the two
parsed to more keys was returned. For a text read as it streams in, that
meant nothing past the first `"enabled": true` was read until the text was
complete, and once enough text followed the literal, the value returned was
a fragment from the middle of the document.

Bare literals are now read wherever a value is due, as their JSON values,
including negative, decimal, and exponent numbers.

A literal that the text ends partway through (`tr`, `nul`, `-`, `1.`) is
left out, along with its key. The same goes for a number that the text ends
on: `"rating": 4` could still become `4.5` or `45`, so it is read once a
comma, a closing bracket, or whitespace follows it. If you parse complete
responses that may be missing their closing brackets, end the text with a
line break to have a number that it ends on read (see “Reading a response
as it streams in” in the README).
