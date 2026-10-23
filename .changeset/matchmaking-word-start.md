---
'@acusti/matchmaking': minor
---

Rank a match at the start of a word above one inside a word

Among items that contain the search text, one where it starts a word now
ranks first: for `'cat'`, `getBestMatch` returns `'Wild Cat'` over
`'Bobcat'`, and for `'ang'`, `'America/Los_Angeles'` over `'Asia/Bangkok'`.
