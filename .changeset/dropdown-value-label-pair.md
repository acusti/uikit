---
'@acusti/dropdown': minor
---

Accept a `{ label, value }` pair for the value prop so item labels can
differ from values

The `value` prop was a single string doing double duty: the searchable
input’s displayed text _and_ the identity compared against each item’s
`data-ukt-value` for change detection. When an item’s stored value differs
from its human-readable label (e.g. a copy-voice id `warm` shown as “Warm &
Welcoming”), those two roles conflict — displaying the label forces `value`
to _be_ the label, so submitting reports the label and consumers have to
map it back to an id. `value` now also accepts a `{ label, value }` pair —
the same shape `onSubmitItem` reports back, so a controlled consumer can
feed back what it received. `value` drives change detection and item
matching; `label` is shown as the searchable input’s value. A bare string
still works unchanged (its value and label are the same).
