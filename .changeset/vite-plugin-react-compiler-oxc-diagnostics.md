---
'@acusti/vite-plugin-react-compiler': minor
---

Warn about oxc’s own non-fatal diagnostics

The plugin now prints the non-fatal diagnostics oxc returns as warnings in
your build or dev server output, with oxc’s code frame and position, and
the build continues. Prepares us to support the `reportDiagnostics`
compiler option.
