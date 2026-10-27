---
'@acusti/vite-plugin-react-compiler': minor
---

Bump oxc-transform-react to 0.156.0

A component or hook whose `useMemo` or `useCallback` dependency list is
missing a dependency or lists an extra one is now left uncompiled, as on
React Compiler main, so its memoization updates exactly as written. With
`panicThreshold` set to `'critical_errors'` or `'all_errors'`, its
diagnostic fails the build instead. Set
`compiler: { reportDiagnostics: true }` to see which ones it skips, as
build warnings, or
`compiler: { environment: { validateExhaustiveMemoizationDependencies: false } }`
to compile them with the inferred dependencies instead.

A memoized value read through an optional chain, as in
`page?.sections.map(…)`, now has its cache checked against that same chain.
When `page` changes from undefined to an object without `sections`, the
component throws as it does uncompiled, instead of rendering the value
cached on the earlier render.

An optional chain continued through a non-null assertion
(`users?.find(…)!.name`) now keeps its `?.`. A value that a `try`/`catch`
picks based on props now updates when they change. A component with a `try`
whose `catch` can never run (its risky call commented out, say) now
compiles instead of aborting the process or rendering nothing. With
`enableJsxOutlining` on, outlined JSX with hyphenated props like
`aria-label` now compiles to valid code.
