---
'@acusti/dropdown': major
---

Rename the root’s `disabled` state class to `is-disabled`

The root element’s other state classes are `is-open` and `is-searchable`
(and the body’s `has-items`), but the disabled state was a bare `disabled`
class — the one class in the set that a consumer’s global stylesheet is
likely to define already. It now follows the same convention.

**Migration:** replace `.uktdropdown.disabled` with
`.uktdropdown.is-disabled` in any selector that targets it.
