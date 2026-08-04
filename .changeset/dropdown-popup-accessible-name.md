---
'@acusti/dropdown': minor
---

Give the popup body an accessible name

The open body carried a `role` but no name, so a `hasItems={false}`
dropdown rendered a `role="dialog"` with nothing naming it — a dialog
without an accessible name is an ARIA violation, and menus and listboxes
were announced as a bare “menu”/“listbox” too. The body now takes
`aria-labelledby` pointing at whatever names the trigger: the `props.label`
text when there is one (always text, and the same name the trigger itself
takes), otherwise the trigger element, whose accessible name the body then
inherits.

To point at the trigger the component fills in its `id`, derived from the
same `useId` that already produced the body’s. A custom trigger that
carries its own `id` keeps it, and the body points at that one instead.

A searchable dropdown with no `props.label` is deliberately left unnamed:
`aria-labelledby` resolves a text input to its value, so pointing the
listbox at the generated input would name it after whatever the user has
typed. Such a dropdown has no accessible name for its trigger either, so
`props.label` — or a custom trigger carrying its own `aria-label` — is the
fix for both.
