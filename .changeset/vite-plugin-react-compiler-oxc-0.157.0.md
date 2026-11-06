---
'@acusti/vite-plugin-react-compiler': minor
---

Bump oxc-transform-react to 0.157.0

Some components and hooks that compiled before are now left uncompiled in
two cases where a callback inside them reassigns a variable declared in
another callback rather than in the component or hook itself:

- An async function that reassigns such a variable (“Cannot reassign
  variable in async function”), as in an effect that keeps a connection for
  its cleanup:
  `let socket; (async () => { socket = await connect(url); })();`.
- A function that returns the result of passing a callback that reassigns
  one of the function’s parameters or locals (“Cannot reassign variable
  after render completes”), as in
  `return items.map((item) => { n += 1; … })` or
  `return fetchPage(page).then((next) => { rows = rows.concat(next); … })`.

With `panicThreshold` set to `'critical_errors'` or `'all_errors'`, these
diagnostics fail the build instead. Set
`compiler: { reportDiagnostics: true }` to see which ones it skips. Where a
new `const` can replace the reassignment (`const all = rows.concat(next)`),
the function compiles again. Upstream has since limited the check to
variables declared in the component or hook itself (oxc-project/oxc#28820),
so a later release should compile these as before.

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

A member chain longer than 500 links, as in generated code, is now left
uncompiled. Chains that long used to compile slowly, or crash the process
at around 5,000 links. A loop around a `try` whose branches copy variables
into each other no longer takes seconds and gigabytes of memory to compile.
