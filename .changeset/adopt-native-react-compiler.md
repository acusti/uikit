---
'@acusti/date-picker': patch
'@acusti/dropdown': patch
'@acusti/input-text': patch
'@acusti/styling': patch
'@acusti/use-bounding-client-rect': patch
'@acusti/use-keyboard-events': patch
---

Rebuild with a new React Compiler toolchain

The published build now runs through a different React Compiler toolchain
internally. Output is verified equivalent to the previous build: React
Compiler memoization is unchanged, with zero compiler bailouts. No API or
behavior changes.
