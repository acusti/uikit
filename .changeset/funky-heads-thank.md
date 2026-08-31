---
'@acusti/vite-plugin-react-compiler': patch
---

Bump oxc-transform-react to 0.147.0

No behavior changes for this plugin: 0.146.0 and 0.147.0 are internal
minifier/codegen/parser releases upstream, with nothing touching React
Compiler transform behavior. The pinned upstream-behavior test suite
(`src/upstream.test.ts`) passes unchanged.
