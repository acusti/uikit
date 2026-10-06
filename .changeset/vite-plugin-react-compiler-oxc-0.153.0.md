---
'@acusti/vite-plugin-react-compiler': minor
---

Bump oxc-transform-react to 0.153.0

The oxc parser is stricter about invalid input that previous versions
accepted and compiled anyway. It now rejects:

- modifiers on a TypeScript import alias (`declare`, `public`, `abstract`,
  `static`, and so on before `import a = b.c`), which were ignored
- TypeScript-only class modifiers in JavaScript files (`public`,
  `readonly`, `declare`, and so on before a class member), which were
  printed back out, a syntax error for everything downstream
- type members with no separator between them
  (`interface Props { label: string onClick(): void }`), which compiled
  with the type silently erased

TypeScript and Babel reject all three.

Two other changes follow TypeScript or Babel more closely. `abstract async`
methods are now rejected, which TypeScript does (Babel accepts them), and
tuple types with a rest element after another rest element, or an optional
element after a rest element, now compile; only TypeScript’s type checker
reports those, and Babel accepts them.
