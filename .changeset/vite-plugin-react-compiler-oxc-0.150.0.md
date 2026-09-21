---
'@acusti/vite-plugin-react-compiler': minor
---

Bump oxc-transform-react to 0.150.0

The oxc codegen crate fixes a silent miscompile in the plugin’s output: a
private-in expression’s relational right operand lost its required
parentheses, printing `#x in a instanceof b` instead of
`#x in (a instanceof b)`. Left-associativity then parses that as
`(#x in a) instanceof b`, changing which value the private-field check runs
against.
