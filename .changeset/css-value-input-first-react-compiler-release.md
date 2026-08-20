---
'@acusti/css-value-input': patch
---

Compile with React Compiler

CSSValueInput picked up `react: true` (enabling React Compiler) in its vite
config after its last release, so this is the first published build
compiled with React Compiler — via @acusti/vite-plugin-react-compiler,
which runs the compiler through oxc-transform-react (the native Node
bindings for the oxc project's Rust port), rather than the Babel-based
pipeline the sibling packages in this repo are moving off of. Output is
verified equivalent to the Babel-based compiler: React Compiler memoization
is present with zero compiler bailouts. No API or behavior changes.
