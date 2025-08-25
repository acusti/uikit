# @acusti/matchmaking

[![latest version](https://img.shields.io/npm/v/@acusti/matchmaking?style=for-the-badge)](https://www.npmjs.com/package/@acusti/matchmaking)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/matchmaking?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fmatchmaking)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/matchmaking?style=for-the-badge)](https://www.npmjs.com/package/@acusti/matchmaking)
[![bundle size](https://deno.bundlejs.com/badge?q=@acusti/matchmaking)](https://bundlejs.com/?q=%40acusti%2Fmatchmaking)

**Intuitive approximate string matching (fuzzy search) with intelligent
scoring**

A lightweight, zero-dependency fuzzy string matching library that provides
intelligent approximate matching with a best-effort scoring algorithm that
balances package weight and performance (< 1KB) with UX. Perfect for
search-as-you-type interfaces, autocomplete functionality, and filtering
large datasets.

## Features

- **Intelligent scoring**: Advanced algorithm that considers exact matches,
  partial matches, consecutive character matches, and character proximity
- **Case-insensitive**: Automatically handles case differences
- **Flexible matching**: Supports both exact substring matches and fuzzy
  character-based matching
- **Configurable filtering**: Option to exclude poor matches below a
  quality threshold
- **TypeScript support**: Fully typed with comprehensive TypeScript
  definitions
- **Zero dependencies**: Lightweight with no external dependencies
- **Universal**: Works in Node.js, browsers, and edge environments

## Installation

```bash
npm install @acusti/matchmaking
# or
yarn add @acusti/matchmaking
```

## Quick Start

```js
import { getBestMatch, sortByBestMatch } from '@acusti/matchmaking';

const items = ['apple', 'banana', 'cherry', 'date'];

// Get the single best match
const best = getBestMatch({ items, text: 'app' });
console.log(best); // 'apple'

// Get all items sorted by match quality
const sorted = sortByBestMatch({ items, text: 'a' });
console.log(sorted); // ['apple', 'banana', 'date', 'cherry']
```

## API Reference

### `sortByBestMatch(options)`

Sorts an array of strings by how closely they match the search text, with
best matches first.

#### Parameters

```ts
type Options = {
    items: Array<string>; // Array of strings to search through
    text: string; // Search query text
    excludeMismatches?: boolean; // Filter out poor matches (default: false)
};
```

#### Returns

`Array<string>` - Items sorted by match quality, best matches first.

#### Examples

```js
const states = [
    'California',
    'Colorado',
    'Connecticut',
    'Maine',
    'Maryland',
];

// Basic sorting - all items returned, sorted by relevance
sortByBestMatch({ items: states, text: 'ma' });
// → ['Maine', 'Maryland', 'California', 'Colorado', 'Connecticut']

// Exclude poor matches - only returns good matches
sortByBestMatch({ items: states, text: 'ma', excludeMismatches: true });
// → ['Maine', 'Maryland']

// Empty or whitespace text returns original array
sortByBestMatch({ items: states, text: '' });
// → ['California', 'Colorado', 'Connecticut', 'Maine', 'Maryland']
```

### `getBestMatch(options)`

Returns the single best match from the array of strings.

#### Parameters

Same as `sortByBestMatch` - see above.

#### Returns

`string | undefined` - The best matching string, or `undefined` if no items
provided.

#### Examples

```js
const fontWeights = [
    '100',
    '200',
    '300',
    '400',
    '500',
    '600',
    '700',
    '800',
    '900',
];

getBestMatch({ items: fontWeights, text: '3' });
// → '300'

getBestMatch({ items: fontWeights, text: '9' });
// → '900'

// Handles fuzzy matching
const values = ['7px', '11px', '18px', '36px', '128px'];
getBestMatch({ items: values, text: '1' });
// → '11px'
```

## Advanced Usage

### Filtering with `excludeMismatches`

The `excludeMismatches` option filters out matches below a quality
threshold, useful for autocomplete and search interfaces where you only
want to show relevant results:

```js
const states = [
    'Alabama',
    'Alaska',
    'Arizona',
    'Arkansas',
    'California',
    'Colorado',
    'Connecticut',
    'Delaware',
    'Florida',
    'Georgia',
    'Hawaii',
    'Idaho',
    'Illinois',
    'Indiana',
    'Iowa',
    'Kansas',
    'Kentucky',
    'Louisiana',
    'Maine',
    'Maryland',
    'Massachusetts',
    'Michigan',
    'Minnesota',
    'Mississippi',
    'Missouri',
    'Montana',
    'Nebraska',
    'Nevada',
    'New Hampshire',
    'New Jersey',
    'New Mexico',
    'New York',
    // ... more states
];

// With excludeMismatches: false (default) - returns all items, sorted
sortByBestMatch({ items: states, text: 'ma' }).length;
// → 32 (all states, sorted by relevance)

// With excludeMismatches: true - only returns good matches
const matches = sortByBestMatch({
    items: states,
    text: 'ma',
    excludeMismatches: true,
});
console.log(matches);
// → [
//     'Maine',          // exact match at start
//     'Maryland',       // exact match at start
//     'Massachusetts',  // exact match at start
//     'Kansas',         // contains 'ma' with good proximity
//     'Hawaii',         // contains 'ma'
//     'Alabama',        // ends with 'ma'
//     'Oklahoma',       // ends with 'ma'
//     // ... other quality matches
//   ]
```

### Matching Algorithm Details

The matching algorithm implements best-effort scoring that considers:

1. **Exact matches**: Perfect matches score highest (score = 1.0)
2. **Partial exact matches**: Substrings get high scores with
   position-based penalties
3. **Character proximity**: Similar characters (e.g., 'a' and 'b') score
   better than distant ones
4. **Consecutive matches**: Consecutive character matches from the start
   get bonus scoring
5. **Case insensitivity**: All matching is case-insensitive
6. **Number-letter proximity**: Special handling for mixed alphanumeric
   content

#### Scoring Examples

First argument is the search string, second argument is the text in which
to search.

```js
// Perfect exact match
getMatchScore('apple', 'apple'); // → 1.0

// Partial exact match (substring)
getMatchScore('app', 'application'); // → ~0.999999 (very high)

// Character proximity matching
getMatchScore('abd', 'abc'); // → ~0.99999 (high, 'c' and 'd' are close)
getMatchScore('axz', 'abc'); // → ~0.4222 (lower, 'b'→'x', 'c'→'z' are distant)

// Bonus for matching closer to the start of the string
getMatchScore('es', 'test'); // → ~0.924999
getMatchScore('st', 'test'); // → 0.849999
```

## Common Use Cases

### Autocomplete Search

```js
function createAutocomplete(items) {
    return function search(query) {
        if (!query.trim()) return [];

        return sortByBestMatch({
            items,
            text: query,
            excludeMismatches: true, // Only show good matches
        }).slice(0, 10); // Limit to top 10 results
    };
}

const searchStates = createAutocomplete(states);
searchStates('new'); // → ['New York', 'New Jersey', 'New Mexico', 'New Hampshire']
```

### Search-as-you-type

```js
function handleSearchInput(event) {
    const query = event.target.value;
    const results = sortByBestMatch({
        items: allProducts.map((p) => p.name),
        text: query,
        excludeMismatches: true,
    });

    displaySearchResults(results.slice(0, 20));
}
```

### Fuzzy Command Palette

```js
const commands = [
    'Open File',
    'Save File',
    'Copy',
    'Paste',
    'Find and Replace',
    'Toggle Sidebar',
    'Open Terminal',
    'Close Tab',
];

function searchCommands(input) {
    return sortByBestMatch({
        items: commands,
        text: input,
        excludeMismatches: true,
    });
}

searchCommands('open'); // → ['Open File', 'Open Terminal']
searchCommands('cls'); // → ['Close Tab'] (fuzzy match)
```

## Performance Characteristics

- **Bundle Size**: < 1KB minified and gzipped
- **Dependencies**: Zero external dependencies

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```ts
import {
    getBestMatch,
    sortByBestMatch,
    getMatchScore,
} from '@acusti/matchmaking';

interface SearchOptions {
    items: string[];
    text: string;
    excludeMismatches?: boolean;
}

// All functions are fully typed
const result: string[] = sortByBestMatch(options);
const best: string | undefined = getBestMatch(options);
const score: number = getMatchScore('string1', 'string2');
```

## Browser Support

Works in all modern browsers and Node.js environments:

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Node.js 16+

## Testing

See the [comprehensive test suite][tests] to understand the matching
behavior and evaluate if it fits your needs.

[tests]:
    https://github.com/acusti/uikit/blob/main/packages/matchmaking/src/index.test.ts
