---
'@acusti/input-text': minor
---

Forward aria-\* attributes and role to the underlying input

`Props` didn’t include any of the ARIA attributes, so an `aria-label` or an
`aria-describedby` passed to `InputText` was both a type error and silently
dropped — the only accessible name available was one supplied by a wrapping
`<label>`. It also meant a parent that annotates its trigger by cloning it,
like `@acusti/dropdown`, couldn’t give an `InputText` trigger the combobox
semantics it injects.

`Props` now intersects React’s `AriaAttributes` and adds `role`, and any of
those props not consumed by the component are spread onto the `<input>` or
`<textarea>`. The spread comes first, so the props the component owns
(`readOnly` under `doubleClickToEdit`, `defaultValue`, its event handlers)
still win, and the prop type stays closed: props `InputText` doesn’t model
remain type errors rather than passing through.
