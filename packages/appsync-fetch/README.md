# @acusti/appsync-fetch

[![latest version](https://img.shields.io/npm/v/@acusti/appsync-fetch?style=for-the-badge)](https://www.npmjs.com/package/@acusti/appsync-fetch)
[![dependencies status](https://img.shields.io/david/acusti/uikit?path=packages%2Fappsync-fetch&style=for-the-badge)](https://david-dm.org/acusti/uikit?path=packages%2Fappsync-fetch)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/appsync-fetch?style=for-the-badge)](https://www.npmjs.com/package/@acusti/appsync-fetch)

`appsync-fetch` is a simple node and browser-compatible package with
minimal dependencies that exports an `appSyncFetch` function that wraps
[fetch][] to make requests to an AWS AppSync graphql API. It takes an
optional third argument for passing in AWS credentials, as well as the
region. If AWS credentials aren’t provided, it uses
`@aws-sdk/credential-providers`’s [`fromEnv` helper][fromenv] to get
credentials from the standard AWS environment variables made available in
lambdas. It then uses those credentials to construct the appropriate [AWS
SigV4][] authorization headers for IAM-based authorization.

[aws sigv4]:
    https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html
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

The package exports `appSyncFetch`, which takes the same arguments as
[`window.fetch`][fetch], but with a few conveniences for better ergonomics
built-in. To start with, `appSyncFetch` will set all required headers,
including AWS authorization headers, a Date header, and Content-Type. It
will also set `method: 'POST'` (required for all GraphQL requests).

In addition, the second argument (named `init` in the window.fetch docs)
can take a `query: string` property and a `variables: object` property,
which it will JSON.stringify into a valid GraphQL request body. You can
also pass in `body` as a string directly, but if you pass in a `query`, the
`body` will be overwritten (you will get a type error in typescript if you
try to pass both).

The function also takes an optional third argument where you can manually
pass in AWS credentials if you don’t wish to rely on the built-in
credentials handling, which will extract credentials from environment
variables via `process.env`. Usage is illustrated in the code example
below.

In addition, `appSyncFetch` calls `await response.json()` and returns the
result, because that’s what you wanted anyways.

And lastly, if the response is an error (4xx or 5xx), `appSyncFetch` will
throw an Error object with the response HTTP error and message as the Error
object message and with the following additional properties:

-   `Error.response`: the fetch `Response` object
-   `Error.responseJSON`: if the response body can be parsed as JSON, the
    JSON representation returned from calling `await response.json()`
-   `Error.responseText`: the response body as text (e.g. the result of
    `await response.text()`)

```js
import { appSyncFetch } from '@acusti/appsync-fetch';

const appSyncURL =
    'https://abcdefghijklmnopqrstuvwxyz.appsync-api.us-west-2.amazonaws.com/graphql';

// In its simplest usage, environment variables are used for authorization
const itemsResult = await appSyncFetch(appSyncURL, {
    query: `
        query ListItems {
            listItems {
                items {
                    id
                    text
                }
            }
        }`,
});
// itemsResult is the parsed JSON from the response, e.g.:
// const response = await fetch(...);
// const itemsResult = await response.json();

// You can also pass in variables
const createdItemResult = await appSyncFetch(appSyncURL, {
    query: `
        mutation CreateItem($input: CreateItemInput!) {
            createItem(input: $input) {
                id
            }
        }`,
    variables: {
        input: {
            text: 'Here is the text of a new item',
        },
    },
});

// You can also provide the authentication variables manually
const manualAuthenticationResult = await appSyncFetch(
    appSyncURL,
    { query: 'query {...}' },
    {
        accessKeyId,
        secretAccessKey,
        sessionToken,
    },
);
```
