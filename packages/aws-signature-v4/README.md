# @acusti/aws-signature-v4

[![latest version](https://img.shields.io/npm/v/@acusti/aws-signature-v4?style=for-the-badge)](https://www.npmjs.com/package/@acusti/aws-signature-v4)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/aws-signature-v4?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Faws-signature-v4)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/aws-signature-v4?style=for-the-badge)](https://www.npmjs.com/package/@acusti/aws-signature-v4)
[![install size](https://packagephobia.com/badge?p=@acusti/aws-signature-v4&style=for-the-badge)](https://packagephobia.com/result?p=@acusti/aws-signature-v4)

`aws-signature-v4` is a lightweight isomorphic module that generates
request headers to fulfill the [AWS SigV4][] signing process.

[aws sigv4]:
    https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html

## Usage

```
npm install @acusti/aws-signature-v4
# or
yarn add @acusti/aws-signature-v4
```

The primary export is `getHeadersWithAuthorization`, an async function that
takes three arguments: a `resource` (i.e. request URL), a fetch init object
(i.e. request options), and an AWS options object where you can pass
credentials, the region, and the service name (see the [type
definition][]). If the AWS region isn’t passed and can be derived from the
resource URL, it will be. The function’s return promise is resolved with a
plain JS object of the request’s headers with all required authorization
headers merged in over top of any existing headers passed to the function.

[type definition]:
    https://github.com/acusti/uikit/tree/main/packages/aws-signature-v4/src/types.ts

```js
import { getHeadersWithAuthorization } from '@acusti/aws-signature-v4';

const resource = 'https://_.appsync-api.us-west-2.amazonaws.com/graphql';
const body = `{"query": "query { listItems { items { id } } }"}`;

const headers = await getHeadersWithAuthorization(
    resource,
    { body, headers: { method: 'POST' } },
    {
        accessKeyId: '…',
        region: 'us-west-2',
        secretAccessKey: '…',
        service: 'appsync',
        sessionToken: '…',
    },
);

const response = await fetch(resource, { body, headers });
```
