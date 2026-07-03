---
'@acusti/css-value-input': patch
'@acusti/date-picker': patch
'@acusti/dropdown': patch
'@acusti/input-text': patch
'@acusti/styling': patch
'@acusti/use-bounding-client-rect': patch
'@acusti/use-keyboard-events': patch
---

Rebuild with the modernized build pipeline

The published artifacts are now built with @vitejs/plugin-react v6 (oxc JSX
transform) with the React Compiler applied via @rolldown/plugin-babel and
`reactCompilerPreset`, replacing the previous plugin-react v5 Babel
pipeline; type declarations are emitted by the native TypeScript 7 compiler
instead of unplugin-dts. Output is verified equivalent: React Compiler
memoization is present with zero compiler bailouts, and declarations are
unchanged apart from preserving inline `type` qualifiers on imports. No API
or behavior changes.
