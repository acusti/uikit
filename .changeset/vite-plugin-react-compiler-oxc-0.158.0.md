---
'@acusti/vite-plugin-react-compiler': minor
---

Bump oxc-transform-react to 0.158.0

A component or hook that keeps the result of a call it passes a callback
to, when that callback reassigns one of the component’s own variables, is
now left uncompiled inside an `if`, a loop, a `switch`, a ternary or `&&`
too, as it already was outside them, as in
`if (touched) valid = validate(value, (message) => { warning = message; });`
(“Cannot reassign variable after render completes”). With `panicThreshold`
set to `'critical_errors'` or `'all_errors'`, its diagnostic fails the
build instead. Set `compiler: { reportDiagnostics: true }` to see which
ones it skips.

Compiled components and hooks no longer render stale values or throw where
the uncompiled code doesn’t, in these cases:

- A memo block that reassigns one of its inputs, like `quantity = stock` to
  clamp a prop, is now keyed on the input’s value from before the block, so
  it no longer reuses the output of an earlier render.
- A variable that a memo block reassigns in a loop now keeps its value when
  the block is skipped.
- A value set in a branch on a prop now updates when the prop changes even
  when that branch returns early on a condition like a feature flag.
- A hook called inline in a memoized object (`{ ref: useRef(null) }`) now
  runs on every render, so React no longer throws “Should have a queue”.
- An allocation in a `useMemo` result (`{ page, seen: new Set() }`) is now
  recreated with the result instead of shared across dependency changes.
  One wrapped in a type assertion (`[] as string[]`) is still shared.
- A value that is only compared and passed to a state setter during render
  is now memoized, so adjusting state when a prop changes no longer fails
  with “Too many re-renders”.
- A callback’s cache check no longer reads `ref.current`, or a property of
  an object that can be null, during render.
- A callback in a component defined inside a factory function can now call
  the factory’s arguments instead of throwing a ReferenceError.
- `ref.current++` now evaluates to the old value, a compound assignment
  like `totals[i++ % columns] += x` evaluates its target once, a computed
  `['__proto__']` key now creates an own property, and BigInt literals are
  no longer printed as `undefined`.

Some components and hooks that were skipped now compile: those that
increment a variable a closure captures (`count++` in a loop, with the
count read by an `onClick` callback), those that pass an item to a handler
that mutates a global (`window.location.hash = id`), and hooks whose
callbacks read a ref in different places, like a debounced callback with a
`cancel` method.

A ref-like name that starts with a non-ASCII letter, like `élanRef`, no
longer aborts the process. A member chain longer than 500 links, as in
generated code, is now left uncompiled. Chains that long used to compile
slowly, or crash the process at around 5,000 links. A loop around a `try`
whose branches copy variables into each other no longer takes seconds and
gigabytes of memory to compile.
