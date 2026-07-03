# @acusti/vite-plugin-svg-react

## 0.1.0

### Minor Changes

- 64827ae: Initial release of @acusti/vite-plugin-svg-react, a Vite ≥ 8
  (rolldown-native) SVGR plugin extracted from Outlyne’s build tooling.
  `import Icon from './icon.svg?react'` returns a typed React component.
  JSX is compiled with Vite 8’s exported `transformWithOxc` (no esbuild
  fallback), emitting the dev JSX runtime when serving and the production
  runtime when building so the virtual SVG modules stay on the same
  optimized dependency graph as the rest of the app. Ships consumer types
  via `@acusti/vite-plugin-svg-react/client` and supports a `svgrOptions`
  passthrough for @svgr/core configuration.
