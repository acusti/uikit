# @acusti/appsync-fetch

[![latest version](https://img.shields.io/npm/v/@acusti/appsync-fetch?style=for-the-badge)](https://www.npmjs.com/package/@acusti/appsync-fetch)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/appsync-fetch?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fappsync-fetch)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/appsync-fetch?style=for-the-badge)](https://www.npmjs.com/package/@acusti/appsync-fetch)
[![install size](https://packagephobia.com/badge?p=@acusti/appsync-fetch&style=for-the-badge)](https://packagephobia.com/result?p=@acusti/appsync-fetch)

`appsync-fetch` is a lightweight node.js module that uses [@acusti/post][]
to make requests to an AWS AppSync graphql API. It expands on
@acusti/post’s API with an optional third argument for passing in AWS
credentials, as well as the region. If AWS credentials aren’t provided, it
uses the same algorithm as `@aws-sdk/credential-providers`’s [`fromEnv`
helper][fromenv] to get credentials from the standard AWS environment
variables made available in lambdas. It then uses those credentials to
construct the appropriate [AWS SigV4][] authorization headers for IAM-based
authorization.

There are two primary reasons it’s worth using:

1. it relies on the native node.js `http`/`https` modules for fetching (via
   @acusti/post) and on the native node.js `crypto` module for its
   cryptographic logic; this makes it way lighter weight than alternatives
   and results in faster start times in your lambdas
2. its DX ergonomics are carefully tuned for interacting with AppSync
   GraphQL APIs

[@acusti/post]: https://github.com/acusti/uikit/tree/main/packages/post
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
yarn add @acusti/appsync-fetch
```

The package exports `appsyncFetch`, a function that takes similar arguments
to [`window.fetch`][] (note that `method` is always `POST`) and returns a
promise. The promise is resolved with the parsed JSON version of the
request’s response (i.e. `return await response.json()` when using the
Fetch API), because that’s what you wanted anyways. It also sets all
required headers, including AWS authorization headers, a Date header, and
Content-Type.

In addition, the second argument can take a `query` property (string) and a
`variables` property (object), which it will JSON.stringify into a valid
GraphQL request body. You can also pass in `body` as a string directly, but
if you pass in a `query`, the `body` will be overwritten (you will get a
type error in typescript if you try to pass both).

The function also takes an optional third argument where you can manually
pass in AWS credentials if you don’t wish to rely on the built-in
credentials handling, which will extract credentials from environment
variables via `process.env`. Usage is illustrated in the code example
below.

And lastly, if the response is an error (4xx or 5xx), `appsyncFetch` will
throw an Error object with the response HTTP error and message as the Error
object message and with the following additional properties:

-   `Error.response`: the node.js response `IncomingMessage` object
-   `Error.responseJSON`: if the response body can be parsed as JSON, the
    JSON representation returned from calling `JSON.parse()` on it
-   `Error.responseText`: the response body as text

[`window.fetch`]: http://developer.mozilla.org/en-US/docs/Web/API/fetch

```js
import { appsyncFetch } from '@acusti/appsync-fetch';

const appsyncURL = 'https://_.appsync-api.us-west-2.amazonaws.com/graphql';

// In its simplest usage, environment variables are used for authorization
const itemsResult = await appsyncFetch(appsyncURL, {
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
const createdItemResult = await appsyncFetch(appsyncURL, {
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
const manualAuthenticationResult = await appsyncFetch(
    appsyncURL,
    { query: 'query {...}' },
    {
        accessKeyId,
        secretAccessKey,
        sessionToken,
    },
);
```

### With TypeScript

You can pass in the expected `data` result from the GraphQL query as a
generic to `appsyncFetch`. This works very well with the [codegen GraphQL
API types][] provided by AWS amplify:

```ts
import { ListItemsQuery } from 'API';

const itemsResult = await appsyncFetch<ListItemsQuery>(appsyncURL, {
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
```

The type of `itemsResult` will be
`{ data?: ListItemsQuery, errors?: GraphQLResponseError[] }`, where
`GraphQLResponseError` is the shape of GraphQL errors returned by appsync
as illustrated [in the docs][].

[codegen graphql api types]:
    https://docs.amplify.aws/cli/graphql/client-code-generation/
[in the docs]:
    https://docs.aws.amazon.com/appsync/latest/devguide/troubleshooting-and-common-mistakes.html
