# @acusti/matchmaking

## 0.11.0

### Minor Changes

- dfc9617: Rank an item that contains the search text above one that only
  starts like it

    An item that contains the text now outranks one that only starts like
    it (a number inside another number still ranks by value): for `'cat'`,
    `getBestMatch` returns `'Bobcat'` over `'Cart'`, and a two-character
    item like `'px'` no longer sorts last for `'p'`. Fixed a typo in the
    README where the arguments of `getMatchScore` were listed in reverse
    order (it takes the item first, then the search text).

- 655fb32: Rank items by the nearest number when the search text is a
  number

    When the text is a number, with or without a sign or unit, items that
    start with a different number now rank by how near it is, the typed
    unit first among equally near ones: for `'15'`, `getBestMatch` returns
    `'18px'` from `['7px', '11px', '18px', '36px', '128px']` (previously it
    returned `'11px'`) and `excludeMismatches` keeps only items whose
    number is near. An item that starts with the typed digits still ranks
    first.

- 029b573: Rank close inexact matches instead of tying them

    Items that share a long start with the search text no longer all get
    the best inexact score, so the one that matches more of it ranks first:
    for `'america/new_yrok'`, `getBestMatch` returns `'America/New_York'`
    from a list of time zones (previously it returned whichever `America/…`
    zone came first).

- 3c86047: Rank a match at the start of a word above one inside a word

    Among items that contain the search text, one where it starts a word
    now ranks first: for `'cat'`, `getBestMatch` returns `'Wild Cat'` over
    `'Bobcat'`, and for `'ang'`, `'America/Los_Angeles'` over
    `'Asia/Bangkok'`.

## 0.10.0

### Minor Changes

- e42f474: Use vite in library mode to build all packages and cleanup the
  build artifacts to only include required files. This means no more test
  files in the build and no more src/ directory.

## 0.9.0

### Minor Changes

- Update all NPM and CI dependencies to latest, including eslint,
  typescript (v5.8.3), vitest, babel, and node-gyp, resolving all known
  security vulnerabilities, and adopt the eslint canonical plugin and
  enable new rules.
