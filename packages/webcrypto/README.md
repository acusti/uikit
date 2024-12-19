# @acusti/webcrypto

[![latest version](https://img.shields.io/npm/v/@acusti/webcrypto?style=for-the-badge)](https://www.npmjs.com/package/@acusti/webcrypto)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/webcrypto?style=for-the-badge)](https://www.npmjs.com/package/@acusti/webcrypto)
[![bundle size](https://deno.bundlejs.com/badge?q=@acusti/webcrypto)](https://bundlejs.com/?q=%40acusti%2Fwebcrypto)
[![supply chain security](https://socket.dev/api/badge/npm/package/@acusti/webcrypto/1.1.0)](https://socket.dev/npm/package/@acusti/webcrypto/overview/1.1.0)

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
