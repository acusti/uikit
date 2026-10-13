---
'@acusti/vite-plugin-react-compiler': minor
---

Bump oxc-transform-react to 0.154.0

A `@__NO_SIDE_EFFECTS__` annotation written after `export`
(`export /* @__NO_SIDE_EFFECTS__ */ function f() {}`) is now kept in the
output, including on compiled components and hooks, so your bundler can
drop unused calls to the function. Only an annotation written before
`export` used to survive.

An enum member initialized with a unary `+`, `-` or `~` applied to a string
(`-'1'`, `~'3'`, `+'1'`) is no longer constant-folded to the wrong value
(`NaN`, `-1` and the string `"1"`). The expression is emitted as written
for the runtime to evaluate, as TypeScript does.
