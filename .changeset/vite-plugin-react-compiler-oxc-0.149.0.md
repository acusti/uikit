---
'@acusti/vite-plugin-react-compiler': minor
---

Bump oxc-transform-react to 0.149.0

The React Compiler port itself is unchanged, but the shared oxc parser and
codegen crates fix three silent miscompiles that showed up in the plugin’s
output: a private-in expression used as a binary operand lost its
parentheses (`#x in v + 1`), a string-literal import specifier bound to a
matching local name was printed as invalid syntax (`import { "foo" }`), and
hex/binary/octal literals beyond 2^53 were rounded incorrectly. Two inputs
that previously compiled silently are now parse errors, matching Babel: a
labeled `break`/`continue` inside an arrow function (the compiler used to
hoist the closure with the jump dropped) and `export { a } from;`.
