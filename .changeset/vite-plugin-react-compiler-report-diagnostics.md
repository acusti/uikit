---
'@acusti/vite-plugin-react-compiler': minor
---

Report the compiler’s recoverable diagnostics as build warnings with
`compiler: { reportDiagnostics: true }`

React Compiler silently leaves a function uncompiled when it bails out (a
ref read during render, a conditional hook, a react-hooks lint
suppression). With oxc-transform-react 0.152.0’s `reportDiagnostics` option
turned on, the plugin now passes each of those diagnostics to
`this.warn(...)` with the compiler’s code frame and its position in the
file, so you can see what was skipped and why. The build still continues,
and nothing changes unless you set the option.
