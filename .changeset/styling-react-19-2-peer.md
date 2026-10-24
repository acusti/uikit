---
'@acusti/styling': patch
---

Require React 19.2 or later in the `react` and `react-dom` peer ranges

`useStyles` (and so `Style`) has called React’s `useEffectEvent` since
2.1.1, but stable React only exports that hook from 19.2 onward, while the
peer ranges still accepted React 19.1.x and 19.0.x.
