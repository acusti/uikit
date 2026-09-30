---
'@acusti/vite-plugin-react-compiler': minor
---

Report the compiler’s recoverable diagnostics as build warnings with
`compiler: { reportDiagnostics: true }`

React Compiler silently leaves a function uncompiled when it bails out (a
ref read during render, a conditional hook, a react-hooks lint
suppression). With this option turned on, the plugin now prints each of
those diagnostics as a warning in your build or dev server output, with the
compiler’s code frame and its position in the file, so you can see what was
skipped and why. The build continues, and bail-outs stay silent unless you
set the option.
