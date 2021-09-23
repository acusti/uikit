# @acusti/uniquify

[![latest version](https://img.shields.io/npm/v/@acusti/uniquify?style=for-the-badge)](https://www.npmjs.com/package/@acusti/uniquify)
[![dependencies status](https://img.shields.io/david/acusti/uikit?path=packages%2Funiquify&style=for-the-badge)](https://david-dm.org/acusti/uikit?path=packages%2Funiquify)
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
//=> 'bear-2'

items = [...items, 'bear-2'];

console.log(uniquify({ items, value: 'bear' }));
//=> 'bear-3'
console.log(uniquify({ items, value: 'bear-2' }));
//=> 'bear-3'
```

### Payload Options

This is the type signature for the payload you pass to `uniquify`. Only
`items` and `value` are required:

```ts
type Payload = {
    caseSensitive?: boolean;
    items: Array<string | object>;
    propertyPath?: Array<string>;
    separator?: string; // defaults to '-'
    value: string;
};
```

They can be used like so:

```ts
import uniquify from '@acusti/uniquify';

let files = [
    { file: { name: 'Ticket Receipt' } },
    { file: { name: 'Manifesto' } },
];

console.log(
    uniquify({
        items: files,
        propertyPath: ['file', 'name'],
        separator: ' ',
        value: 'Ticket Receipt',
    }),
);
//=> 'Ticket Receipt 2'
console.log(
    uniquify({
        items: files,
        propertyPath: ['file', 'name'],
        separator: ' ',
        value: 'ticket receipt',
    }),
);
//=> 'ticket receipt 2'
console.log(
    uniquify({
        caseSensitive: true,
        items: files,
        propertyPath: ['file', 'name'],
        separator: ' ',
        value: 'ticket receipt',
    }),
);
//=> 'ticket receipt'
```
