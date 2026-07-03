---
'@acusti/dropdown': minor
---

Stop firing onSubmitItem with an empty value when a non-searchable dropdown
is submitted with no item active

A menu-style (non-searchable) Dropdown defaults to `allowEmpty`, so
pressing Enter/Space with nothing highlighted — or releasing the pointer on
non-item menu chrome (a title, padding, the list gap) — fired
`onSubmitItem({ value: '' })`. Consumers that pass the submitted value
straight through (for example casting it to an enum) could persist that
empty value and trip downstream validation. An empty value is now only
emitted when the dropdown has a text input to source it from — a searchable
dropdown's input, or a text input inside a custom trigger; a dropdown with
no input and nothing selected is a no-op. Submitting an item whose
`data-ukt-value` is explicitly empty still works. `allowEmpty` is now also
enforced when `allowCreate` is set: submitting a cleared input with no
active item no longer emits an empty value when `allowEmpty={false}`.
