---
'@acusti/css-value-input': patch
'@acusti/date-picker': patch
'@acusti/dropdown': patch
'@acusti/input-text': patch
'@acusti/styling': patch
'@acusti/use-bounding-client-rect': patch
'@acusti/use-keyboard-events': patch
---

Rebuild with the native React Compiler transform

The published artifacts are now built with
@acusti/vite-plugin-react-compiler, which runs React Compiler via
oxc-transform-react (the native Node bindings for the oxc project's Rust
port of the compiler), replacing the Babel-based pipeline
(@rolldown/plugin-babel + `reactCompilerPreset`). Output is verified
equivalent: React Compiler memoization is present with zero compiler
bailouts. No API or behavior changes.
