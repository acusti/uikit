---
'@acusti/matchmaking': minor
---

Rank close inexact matches instead of tying them

Items that share a long start with the search text no longer all get the
best inexact score, so the one that matches more of it ranks first: for
`'america/new_yrok'`, `getBestMatch` returns `'America/New_York'` from a
list of time zones (previously it returned whichever `America/…` zone came
first).
