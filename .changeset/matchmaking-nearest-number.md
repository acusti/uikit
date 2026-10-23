---
'@acusti/matchmaking': minor
---

Rank items by the nearest number when the search text is a number

When the text is a number, with or without a sign or unit, items that start
with a different number now rank by how near it is, the typed unit first
among equally near ones: for `'15'`, `getBestMatch` returns `'18px'` from
`['7px', '11px', '18px', '36px', '128px']` (previously it returned
`'11px'`) and `excludeMismatches` keeps only items whose number is near. An
item that starts with the typed digits still ranks first.
