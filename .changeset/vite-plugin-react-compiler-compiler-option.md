---
'@acusti/vite-plugin-react-compiler': minor
---

Rename the `reactCompiler` option to `compiler`, matching the option name
`@vitejs/plugin-react@6.1.0` uses for its own native React Compiler
support. Update `reactCompiler: {...}` to `compiler: {...}` in your plugin
config.
