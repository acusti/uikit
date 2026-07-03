---
'@acusti/css-value-input': minor
---

Type CSSValueInput's event handler props with InputText's `InputElement`
union instead of `HTMLInputElement`

`onBlur`, `onChange`, `onFocus`, `onKeyDown` and `onKeyUp` now receive
events typed as `InputElement` (`HTMLInputElement | HTMLTextAreaElement`,
exported by `@acusti/input-text`), matching what the underlying InputText
component declares. Runtime behavior is unchanged — CSSValueInput always
renders a single-line input, so events only ever originate from an
`HTMLInputElement`.

Handlers with inferred parameter types (inline arrow functions) are
unaffected. Handlers explicitly annotated with `HTMLInputElement` event
types (e.g. `(event: FocusEvent<HTMLInputElement>) => ...`) will no longer
typecheck under TypeScript 6+ (which enables `strictFunctionTypes` by
default); annotate them with `InputElement` instead.
