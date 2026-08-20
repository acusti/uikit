---
'@acusti/dropdown': patch
---

Fall back to the placeholder for an unmatched searchable value

A searchable dropdown’s displayed label derives from the child whose
`data-ukt-value` matches the `value` prop. When no child matched, it fell
back to rendering the raw `value` string — but a value is an identity, not
display text, so an unmatched value put the identifier (e.g. `warm`) in the
input instead of showing the placeholder. An unmatched `value` now falls
back to the placeholder (an empty input). The exception is `allowCreate`,
where an unmatched value is an entry the user created (a typed value not
among the items) and still displays as typed. Pass a `{ label, value }`
pair to show a specific label for a value with no matching item.
