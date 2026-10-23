---
'@acusti/matchmaking': minor
---

Rank an item that contains the search text above one that only starts like
it

An item that contains the text now outranks one that only starts like it (a
number inside another number still ranks by value): for `'cat'`,
`getBestMatch` returns `'Bobcat'` over `'Cart'`, and a two-character item
like `'px'` no longer sorts last for `'p'`. Fixed a typo in the README
where the arguments of `getMatchScore` were listed in reverse order (it
takes the item first, then the search text).
