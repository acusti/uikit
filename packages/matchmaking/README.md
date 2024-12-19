# @acusti/matchmaking

[![latest version](https://img.shields.io/npm/v/@acusti/matchmaking?style=for-the-badge)](https://www.npmjs.com/package/@acusti/matchmaking)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/matchmaking?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fmatchmaking)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/matchmaking?style=for-the-badge)](https://www.npmjs.com/package/@acusti/matchmaking)
[![bundle size](https://deno.bundlejs.com/badge?q=@acusti/matchmaking)](https://bundlejs.com/?q=%40acusti%2Fmatchmaking)

Intuitive approximate string matching (i.e. fuzzy searches). See the
[tests][] to understand its behavior and evaluate if it’s what you are
looking for.

[tests]:
    https://github.com/acusti/uikit/blob/main/packages/matchmaking/src/index.test.ts

## Usage

```
npm install @acusti/matchmaking
# or
yarn add @acusti/matchmaking
```

`matchmaking` exports two functions: `getBestMatch` and `sortByBestMatch`.
Import them by name:

```js
import { getBestMatch, sortByBestMatch } from '@acusti/matchmaking';
```

Both functions take the same payload:

```ts
type Payload = {
    excludeMismatches?: boolean;
    items: Array<string>;
    text: string;
};
```

However, `sortByBestMatch` returns an array of items matching the one
passed in but sorted by how close they match the passed-in `text`, while
`getBestMatch` just returns the text of the single closest match found
(i.e. `sortByBestMatch(payload)[0]`).

The `excludeMismatches` option for `sortByBestMatch` allows that function
to also filter the results to only include (partial) matches, where a match
include fuzzy matches that are strong enough to qualify as a partial match.
For example, considering a list of all states in alphabetical order,
searching for the text `"ma"` with `excludeMismatches: true` returns:

```js
[
    'Maine', // exact match
    'Maryland', // exact match
    'Massachusetts', // exact match
    'Kansas', // partial match
    'Hawaii', // partial match
    'Michigan', // partial match (further distance on 2nd letter)
    'Minnesota', // partial match (further distance on 2nd letter)
    'Mississippi', // partial match (further distance on 2nd letter)
    'Missouri', // partial match (further distance on 2nd letter)
    'Alabama', // end-of-text exact match
    'Oklahoma', // end-of-text exact match
    'Nebraska', // short distance from match
    'Nevada', // short distance from match
    'New Hampshire', // short distance from match
    'New Jersey', // short distance from match
    'New Mexico', // short distance from match
    'New York', // short distance from match
];
```
