---
'@acusti/css-value-input': major
'@acusti/input-text': major
'@acusti/styling': major
'@acusti/use-bounding-client-rect': major
'@acusti/date-picker': minor
'@acusti/dropdown': minor
'@acusti/use-keyboard-events': minor
---

Adapt package to use react-compiler as part of vite build process and to
remove all manual memoization. Also includes some small changes to strictly
follow react-compiler’s rules of react and to workaround as-of-yet
unimplemented features involving mutating destructured component props and
the nullish coalescing assignment operator.

**Note:** this is a breaking change because the packages now depend on
react v19+ and are no longer compatible with anything before the
introduction of the react/compiler-runtime.
