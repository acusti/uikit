---
'@acusti/vite-plugin-react-compiler': minor
---

Bump oxc-transform-react to 0.150.0

The React Compiler port's classification logic is unchanged (its one commit
in this range reorders a short-circuiting `&&` check for performance,
without affecting which functions are treated as components). The shared
oxc codegen crate fixes one more silent miscompile that reaches the
plugin's output: a private-in expression used as the right operand of a
relational operator lost its parentheses (`#x in a instanceof b`, which
parses as `(#x in a) instanceof b`), completing the left-operand fix from
0.149.0 (oxc-project/oxc#26411).

**Not pinned:** two other confirmed parser fixes never come up in realistic
component code — a `yield` expression losing required parentheses when its
argument contains `in` inside a classic `for` loop's initializer, and a
class expression with a static block being rejected when used as that same
initializer (both oxc-project/oxc#26413 and #26423). A third fix
(recognizing `await`/`yield` as TypeScript binding names in type
lookaheads, #26532) only changes the diagnostic text for
`type Handler = (await: number) => void`, which still fails to parse either
way, since `await` remains contextually reserved at that position.
