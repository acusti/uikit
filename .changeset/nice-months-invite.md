---
'@acusti/vite-plugin-react-compiler': patch
---

Bump oxc-transform-react to 0.145.0

Fixes a React Compiler bailout on reassigning a destructured prop that a
nested closure also captures (the compiler previously bailed out in it with
`Todo: Support destructuring of context variables` and
`Immutability: This value cannot be modified`). Also adopts
oxc-transform-react’s default `node_modules` filter (a substring match)
instead of enforcing our own `node_modules` exclusion logic.
