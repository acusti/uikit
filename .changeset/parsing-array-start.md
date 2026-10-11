---
'@acusti/parsing': minor
---

Find a root array whatever its first item is, and pass over brackets in
prose

An array that opens on a number, a literal or a line break was taken for
preamble whenever the text needed a repair: `[1, 2]` with a line of text
after it returned a `value` of `null`, and a pretty-printed array of
objects lost its root. Both are now read. An empty array or object, or an
array that opens on a number or literal, is only taken for the JSON if it
starts a line or follows a colon, and nothing follows it on its line but a
full stop, a comma or a semicolon. So `As in [1], …`, a list of references
or `- [ ] todo` before the JSON stays in the `preamble`, and
`The answer is [1, 2, 3].` now returns `null`.
