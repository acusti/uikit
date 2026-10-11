---
'@acusti/parsing': minor
---

Return the first JSON value in the text

`parseAsJSON` could return a later value in place of the first: the larger
of two objects, or a fragment from past a mistake in place of the
document’s root (`{"a": ["b"\n-1, {"name": "Ann"` returned
`{ name: 'Ann' }`). The first object or array in the text is now the
`value`, and what follows it is the `postscript`. If you want a later
value, call `parseAsJSON` on the `postscript`.
