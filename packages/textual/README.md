# @acusti/textual

[![latest version](https://img.shields.io/npm/v/@acusti/textual?style=for-the-badge)](https://www.npmjs.com/package/@acusti/textual)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/textual?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Ftextual)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/textual?style=for-the-badge)](https://www.npmjs.com/package/@acusti/textual)
[![bundle size](https://deno.bundlejs.com/badge?q=@acusti/textual)](https://bundlejs.com/?q=%40acusti%2Ftextual)

Utilities for transforming and formatting text (i.e. strings).

## Usage

```
npm install @acusti/textual
# or
yarn add @acusti/textual
```

Import the utilities by name. The package only has named exports, making it
maximally tree-shakeable:

```js
import { capitalize, getInitials } from '@acusti/textual';
```

The exported utilities are:

#### `capitalize(text: string)`

returns input text with equivalent formatting to the
`text-transform: capitalize;` CSS property

#### `getInitials(text: string)`

returns uppercase initials from the input string, e.g.
`getInitials('franklin delano Roosevelt') // => 'FDR'`

#### `getNameFromEmail(email: string)`

returns a formatted name from an email address, treating `.` and `+` as
space separators, e.g.
`getNameFromEmail('franklin.delano+roosevelt@gmail.com') // => 'Franklin Delano Roosevelt'`
