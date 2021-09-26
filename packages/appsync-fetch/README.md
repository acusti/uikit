# @acusti/appsync-fetch

[![latest version](https://img.shields.io/npm/v/@acusti/appsync-fetch?style=for-the-badge)](https://www.npmjs.com/package/@acusti/appsync-fetch)
[![dependencies status](https://img.shields.io/david/acusti/uikit?path=packages%2Fappsync-fetch&style=for-the-badge)](https://david-dm.org/acusti/uikit?path=packages%2Fappsync-fetch)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@acusti/appsync-fetch?style=for-the-badge)](https://bundlephobia.com/package/@acusti/appsync-fetch)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/appsync-fetch?style=for-the-badge)](https://www.npmjs.com/package/@acusti/appsync-fetch)

`appsync-fetch` is a simple node and browser-compatible package with
minimal dependencies that exports an `appSyncFetch` function that wraps
[fetch][] to make requests to an AWS AppSync graphql API. It takes an
optional third argument for passing in AWS credentials, as well as the
region. If AWS credentials aren’t provided, it uses
`@aws-sdk/credential-providers`’s [`fromEnv` helper][fromenv] to get
credentials from the standard AWS environment variables made available in
lambdas. It then uses those credentials to construct request the
appropriate authorization headers for IAM-based authorization.

[fetch]:
    http://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch
[fromenv]:
    https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_credential_providers.html#fromenv

## Usage

```
npm install @acusti/appsync-fetch
# or
yarn add @acusti/uniquify
```

```ts
import { appSyncFetch } from '@acusti/appsync-fetch';
```
