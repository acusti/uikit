# @acusti/vite-plugin-react-compiler

## 0.1.0

### Minor Changes

- c11f19b: Initial release of @acusti/vite-plugin-react-compiler, a Vite
  plugin that runs React Compiler via oxc-transform-react (the native Node
  bindings for the oxc project’s Rust port of the compiler) as a drop-in
  alternative to the Babel-based build path. The plugin runs the compiler
  pass in a `transform` hook with `enforce: 'pre'` and `jsx: 'preserve'`,
  so Vite’s own oxc pipeline stays in charge of JSX/refresh/TypeScript
  handling downstream, and memoizes transform results by module id +
  content hash so multi-environment builds only compile each file once.
  Fatal compiler errors (parse failures, rejected options) fail the build
  like a Babel syntax error would. The plugin depends on an exact, tested
  version of oxc-transform-react — the bindings track React Compiler main
  on a fast-moving 0.x release train, so updates ship as regular plugin
  releases after passing this repo’s test suite.
