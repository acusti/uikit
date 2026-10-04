---
'@acusti/styling': patch
---

Require React 19.2 or later in the `react` and `react-dom` peer ranges

`useStyles` (and so `Style`) has called React’s `useEffectEvent` since
2.1.1, but stable React only exports that hook from 19.2 onward, while the
peer ranges still accepted any React 19. On React 19.0 or 19.1 the package
installed cleanly and then threw a `TypeError` when `useStyles` ran. The
peer ranges are now `^19.2` (experimental builds are still accepted), so a
package manager flags the mismatch at install time instead.
