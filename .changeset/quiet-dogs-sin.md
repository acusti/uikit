---
'@acusti/date-picker': minor
---

🐞 Clamp initialMonth within monthLimit bounds, ensuring that the
`initialMonth` value is constrained between `monthLimitFirst` and
`monthLimitLast`, accounting for two-up mode. This prevents the date picker
from initializing outside allowed month limits.
