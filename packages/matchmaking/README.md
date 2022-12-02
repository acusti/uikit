# @acusti/matchmaking

[![latest version](https://img.shields.io/npm/v/@acusti/matchmaking?style=for-the-badge)](https://www.npmjs.com/package/@acusti/matchmaking)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/matchmaking?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fmatchmaking)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@acusti/matchmaking?style=for-the-badge)](https://bundlephobia.com/package/@acusti/matchmaking)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/matchmaking?style=for-the-badge)](https://www.npmjs.com/package/@acusti/matchmaking)

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
    items: Array<string>;
    text: string;
};
```

However, `sortByBestMatch` returns an array of items matching the one
passed in but sorted by how close they match the passed-in `text`, while
`getBestMatch` just returns the text of the single closest match found
(i.e. `sortByBestMatch(payload)[0]`);
