---
'@acusti/parsing': minor
---

Read a string with a raw line break in it whole

A raw line break before a `{` or `[` in a string (a markdown link, a
placeholder, code) used to cut the string short and make up a `key` for the
bracket. It is now part of the string, as a line break before anything else
is.

Two things can change a `value`:

- In an object, a line that starts with a key and its colon ends a string
  that was never closed, so `{\n"label": "Go\n"rating": 5\n}` now returns
  `{ label: 'Go', rating: 5 }`. A string that holds unescaped,
  pretty-printed JSON ends at such a line too: a text that gave `null` can
  now give what was read before that line, with the rest in the
  `postscript`.
- A string that is never closed no longer ends at a line break before a
  bracket: it runs on to its next quote mark, and an object written on one
  line after it usually leaves a `value` of `null`.
