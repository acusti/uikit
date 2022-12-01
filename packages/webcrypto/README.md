# @acusti/webcrypto

[![latest version](https://img.shields.io/npm/v/@acusti/webcrypto?style=for-the-badge)](https://www.npmjs.com/package/@acusti/webcrypto)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/webcrypto?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fwebcrypto)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/webcrypto?style=for-the-badge)](https://www.npmjs.com/package/@acusti/webcrypto)
[![install size](https://packagephobia.com/badge?p=@acusti/webcrypto&style=for-the-badge)](https://packagephobia.com/result?p=@acusti/webcrypto)

`webcrypto` exports `window.crypto` / `self.crypto` for use in a browser
environment (regular or worker) and the equivalent of
[`require('node:crypto').webcrypto`][node webcrypto] for use in node.js.
When used in node, it requires node.js v15.0.0 or later.

[node webcrypto]: https://nodejs.org/api/webcrypto.html#class-crypto

## Usage

```
npm install @acusti/webcrypto
# or
yarn add @acusti/webcrypto
```

```ts
import webcrypto from '@acusti/webcrypto';

const uuid = webcrypto.randomUUID();

const data = new TextEncoder().encode('data to hash');
const digest = await webcrypto.subtle.digest({ name: 'SHA-256' }, data);
```
