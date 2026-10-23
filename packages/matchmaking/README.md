# @acusti/matchmaking

[![Open on npmx.dev](https://npmx.dev/api/registry/badge/version/@acusti/matchmaking)](https://npmx.dev/package/@acusti/matchmaking)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/size/@acusti/matchmaking)](https://npmx.dev/package/@acusti/matchmaking)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/dependencies/@acusti/matchmaking)](https://npmx.dev/package/@acusti/matchmaking)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/downloads-month/@acusti/matchmaking)](https://npmx.dev/package/@acusti/matchmaking)
[![Open on npmx.dev](https://npmx.dev/api/registry/badge/updated/@acusti/matchmaking)](https://npmx.dev/package/@acusti/matchmaking)

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

// Numbers match the nearest number
getBestMatch({ items: values, text: '15' });
// → '18px'
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
//     'Maine',          // starts with 'ma'
//     'Maryland',       // starts with 'ma'
//     'Massachusetts',  // starts with 'ma'
//     'Alabama',        // contains 'ma'
//     'Oklahoma',       // contains 'ma'
//     'Kansas',         // close to 'ma'
//     'Hawaii',         // close to 'ma'
//     // ... other close matches
//   ]
```

### Matching Algorithm Details

The matching algorithm implements best-effort scoring that considers:

1. **Exact matches**: Perfect matches score highest (score = 1.0)
2. **Partial exact matches**: An item that contains the text scores above
   every item that doesn’t, higher when the text starts a word in it
   (`'Wild Cat'` before `'Bobcat'` for `'cat'`), then the earlier in the
   item it starts (a number inside another number still ranks by value; see
   7). Text that contains the whole item (e.g. the item and a stray
   keystroke) scores below every item that contains the text, and lower the
   further into the text the item starts.
3. **Character proximity**: Similar characters (e.g., 'a' and 'b') score
   better than distant ones
4. **Consecutive matches**: Consecutive character matches from the start
   get bonus scoring, so among close matches, the one that matches more of
   the start ranks higher
5. **Case insensitivity**: All matching is case-insensitive
6. **Number-letter proximity**: Special handling for mixed alphanumeric
   content
7. **Numbers**: When the text is a number, with or without a sign or unit
   (`'12'`, `'-5'`, `'12px'`), an item that starts with a different number
   ranks by how near that number is, so `'6'` finds `'7px'` before
   `'36px'`, with the typed unit first between numbers as near as each
   other (`'3px'` finds `'2px'` before `'2em'`). A thousands separator in
   an item is read as part of its number (`'1,000'`). An item where the
   typed number starts a word still contains it (`'1'` finds `'11px'`, and
   `'5'` finds `'2 × 5'`). An item that doesn’t start with a number and
   doesn’t contain it scores a hundredth of what it would otherwise, so
   neither the number’s unit nor a keyword outranks a value of a similar
   size (`'6px'` finds `'4px'` before `'px'` or `'auto'`), while a word
   typed with a digit for its first letter still finds its item (`'0hio'`
   finds `'Ohio'`).

#### Scoring Examples

First argument is the item, second argument is the search text.

```js
// Perfect exact match
getMatchScore('apple', 'apple'); // → 1

// Partial exact match: an item that contains the text scores above every
// item that doesn’t, even one that starts like the text
getMatchScore('application', 'app'); // → 0.999999
getMatchScore('Wild Cat', 'cat'); // → ~0.9999962 (starts a word)
getMatchScore('Bobcat', 'cat'); // → ~0.9999923
getMatchScore('Cart', 'cat'); // → ~0.99998

// Character proximity matching
getMatchScore('abd', 'abc'); // → ~0.99998 (high, 'c' and 'd' are close)
getMatchScore('axz', 'abc'); // → ~0.4222 (lower, 'b'→'x', 'c'→'z' are distant)

// Bonus for matching closer to the start of the item
getMatchScore('test', 'es'); // → ~0.9999934
getMatchScore('test', 'st'); // → ~0.9999923
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
searchStates('new'); // → ['New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'Nevada', …]
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
searchCommands('cls'); // → ['Close Tab', 'Copy'] (fuzzy match)
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

const options: SearchOptions = { items: ['Cart', 'Bobcat'], text: 'cat' };

// All functions are fully typed
const result: string[] = sortByBestMatch(options);
const best: string | undefined = getBestMatch(options);
const score: number = getMatchScore('Bobcat', 'cat'); // the item, then the text
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
