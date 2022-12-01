# @acusti/uniquify

[![latest version](https://img.shields.io/npm/v/@acusti/uniquify?style=for-the-badge)](https://www.npmjs.com/package/@acusti/uniquify)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/uniquify?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Funiquify)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@acusti/uniquify?style=for-the-badge)](https://bundlephobia.com/package/@acusti/uniquify)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/uniquify?style=for-the-badge)](https://www.npmjs.com/package/@acusti/uniquify)

`uniquify` is a function that takes an array of items and a string and
returns a string that is unique amongst those items, appending a counter
(or incrementing an existing counter) if necessary. Much of the default
behavior is based on how the macOS file system handles filename conflicts
within a folder.

## Usage

```
npm install @acusti/uniquify
# or
yarn add @acusti/uniquify
```

### Default Usage

```ts
import uniquify from '@acusti/uniquify';

let items = ['bear', 'chickaree', 'coyote', 'marmot', 'pika'];

console.log(uniquify({ items, value: 'chipmunk' }));
//=> 'chipmunk'
console.log(uniquify({ items, value: 'bear' }));
//=> 'bear 2'

items = [...items, 'bear 2'];

console.log(uniquify({ items, value: 'bear' }));
//=> 'bear 3'
console.log(uniquify({ items, value: 'bear 2' }));
//=> 'bear 3'
```

### Payload Options

This is the type signature for the payload you pass to `uniquify`. Only
`items` and `value` are required:

```ts
type Payload = {
    items: Array<string> | Array<object>; // for Array<object>, pass propertyPath also
    value: string;
    // Options:
    caseSensitive?: boolean;
    propertyPath?: Array<string>; // the path of the property to compare
    separator?: string; // defaults to ' '
    suffix?: string; // add a suffix to the value (prepended with separator)
    isSuffixOptional?: boolean;
};
```

They can be used like so:

```ts
import uniquify from '@acusti/uniquify';

let routes = ['home', 'about', 'contact'];

console.log(
    uniquify({
        items: routes,
        separator: '-',
        value: 'about',
    }),
);
//=> 'about-2'

let files = [
    { file: { name: 'Ticket Receipt' } },
    { file: { name: 'Manifesto' } },
];

console.log(
    uniquify({
        items: files,
        propertyPath: ['file', 'name'],
        value: 'Ticket Receipt',
    }),
);
//=> 'Ticket Receipt 2'
console.log(
    uniquify({
        items: files,
        propertyPath: ['file', 'name'],
        value: 'ticket receipt',
    }),
);
//=> 'ticket receipt 2'
console.log(
    uniquify({
        caseSensitive: true,
        items: files,
        propertyPath: ['file', 'name'],
        value: 'ticket receipt',
    }),
);
//=> 'ticket receipt'
console.log(
    uniquify({
        items: files,
        propertyPath: ['file', 'name'],
        suffix: 'copy',
        value: 'Ticket Receipt',
    }),
);
//=> 'Ticket Receipt copy'
console.log(
    uniquify({
        items: files,
        propertyPath: ['file', 'name'],
        suffix: 'copy',
        value: 'Ticket Receipt 2',
    }),
);
//=> 'Ticket Receipt 2 copy'
console.log(
    uniquify({
        items: files,
        propertyPath: ['file', 'name'],
        isSuffixOptional: true, // <= changed
        suffix: 'copy',
        value: 'Ticket Receipt 2',
    }),
);
//=> 'Ticket Receipt 2'
```
