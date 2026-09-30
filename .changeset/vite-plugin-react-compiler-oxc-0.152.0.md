---
'@acusti/vite-plugin-react-compiler': minor
---

Bump oxc-transform-react to 0.152.0

The oxc parser now rejects modifiers on a TypeScript import alias
(`declare`, `public`, `abstract`, `static`, and so on before
`import a = b.c`), matching TypeScript and Babel. Previous versions
accepted them, ignored the modifier, and compiled the alias as if it were
written plainly.
