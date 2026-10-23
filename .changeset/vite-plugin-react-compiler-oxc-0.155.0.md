---
'@acusti/vite-plugin-react-compiler': minor
---

Bump oxc-transform-react to 0.155.0

A string literal containing a lone surrogate (`'\ud800'`), such as the
bounds of a surrogate-range check, now survives inside a compiled component
or hook. It used to come out as a garbled character followed by the text
`d800`.
