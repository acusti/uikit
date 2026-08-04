---
'@acusti/dropdown': minor
---

Declare the searchable trigger a combobox

A searchable dropdown’s trigger now declares `role="combobox"` and
`aria-autocomplete="list"`. Without the role it was exposed as a `textbox`,
which doesn’t support the `aria-expanded` it was already carrying, so the
open/closed state never reached assistive tech. A custom trigger gets the
same treatment when it _is_ a single-line text input; a wrapper around one
and a `<textarea>` are left alone.

**Upgrading:** this changes the trigger’s exposed role, so anything
selecting it by role needs `combobox` for searchable dropdowns —
`getByRole('textbox')` in tests, `[role]` selectors in CSS or queries.
Non-searchable triggers are unaffected.
