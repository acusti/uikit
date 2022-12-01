# @acusti/post

[![latest version](https://img.shields.io/npm/v/@acusti/post?style=for-the-badge)](https://www.npmjs.com/package/@acusti/post)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/post?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fpost)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/post?style=for-the-badge)](https://www.npmjs.com/package/@acusti/post)
[![install size](https://packagephobia.com/badge?p=@acusti/post&style=for-the-badge)](https://packagephobia.com/result?p=@acusti/post)

`post` is a super minimal fetch-inspired API wrapper around node.js’ `http`
and `https` modules for making POST requests. It’s a lean implementation
with no dependencies that covers the most common GraphQL API use cases with
a tiny fraction of the code of a spec-compliant solution like
[node-fetch][]. In addition, the ergonomics of `post` are optimized for
making GraphQL queries.

[node-fetch]: https://www.npmjs.com/package/node-fetch

## Usage

```
npm install @acusti/post
# or
yarn add @acusti/post
```

The package exports `post`, a function that takes similar arguments to
[`window.fetch`][] (note that `method` defaults to `POST` and
`headers.content-type` defaults to `application/json; charset=UTF-8`) and
returns a promise. The promise is resolved with the parsed JSON version of
the request’s response (i.e. `return await response.json()` when using the
Fetch API), because that’s what you wanted anyways.

In addition, the second argument can take a `query` property (string) and a
`variables` property (object), which it will JSON.stringify into a valid
GraphQL request body. You can also pass in `body` as a string directly, but
if you pass in a `query`, the `body` will be overwritten (you will get a
type error in typescript if you try to pass both).

And lastly, if the response is an error (4xx or 5xx), `post` will throw an
Error object with the response HTTP error and message as the Error object
message and with the following additional properties:

-   `Error.response`: the node.js response `IncomingMessage` object
-   `Error.responseJSON`: if the response body can be parsed as JSON, the
    JSON representation returned from calling `JSON.parse()` on it
-   `Error.responseText`: the response body as text

[`window.fetch`]: http://developer.mozilla.org/en-US/docs/Web/API/fetch

```ts
import { post } from '@acusti/post';

type ResponseJSON = {
    data?: {
        country: {
            name: string;
            native: string;
            languages: Array<{
                code: string;
                name: string;
            }>;
        };
    };
    errors?: Array<{ message: string }>;
};

const url = 'https://countries.trevorblades.com/graphql';
const result = await post<ResponseJSON>(url, {
    query: `query Query {
        country(code: "MX") {
            name
            native
            languages {
                code
                name
            }
        }
    }`,
});

console.log(result.data.country.native); // 'México'
```
