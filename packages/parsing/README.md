# @acusti/parsing

[![latest version](https://img.shields.io/npm/v/@acusti/parsing?style=for-the-badge)](https://www.npmjs.com/package/@acusti/parsing)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/parsing?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Funiquify)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@acusti/parsing?style=for-the-badge)](https://bundlephobia.com/package/@acusti/parsing)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/parsing?style=for-the-badge)](https://www.npmjs.com/package/@acusti/parsing)

`@acusti/parsing` exports `asJSON`, a function that takes a string and
attempts to parse it as JSON, returning the resulting JS value, or `null`
if the string defeated all attempts at parsing it. This is especially
useful for generative AI when you prompt an LLM to generate a response in
JSON, because most models are unable to consistently generate valid JSON,
and even when they do, will often have a pre- or post-amble as a part of
the response.

## Usage

```
npm install @acusti/parsing
# or
yarn add @acusti/parsing
```

Import `asJSON` (it’s a named export) and pass a string to it:

````js
import { asJSON } from '@acusti/parsing';

asJSON(`Here is the JSON output for the "About Us" page based on the provided props:
{
"heading": "Our Story",
"subheading": "A Passion for Sourdough"
}
`);
/* results in:
{
    heading: 'Our Story',
    subheading: 'A Passion for Sourdough',
}
*/
```
