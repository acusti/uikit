---
'@acusti/date-picker': minor
---

Parse (validate) `props.month` in `MonthCalendar` by adding checks to
ensure that it’s a finite number within the safe integer range. If invalid,
it defaults to the current month or clamps the value, improving robustness
against incorrect prop values. Prevents error: Array length must be a
positive integer of safe magnitude.
