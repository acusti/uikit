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

Two shapes are deliberately left unnamed, both because the trigger has no
name to give. A text input trigger is one: `aria-labelledby` resolves a
text input to its value, so pointing the popup at one would name it after
whatever the user has typed. That covers a searchable dropdown’s trigger (a
text input by definition, generated or custom) and a custom trigger that is
itself an `<input>` or `<textarea>`; a text input nested inside a custom
trigger leaks its value the same way but isn’t detectable from the element
alone. The other is an empty generated trigger — single-child syntax with
no `props.label` renders an empty `<button>`, which has no name of its own
to lend, and for `hasItems={false}` that leaves an unnamed dialog. In both
cases the trigger is unnamed too, and `props.label` fixes both at once.
