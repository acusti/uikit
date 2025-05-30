![uikit wordmark](https://raw.githubusercontent.com/acusti/uikit/main/wordmark.svg)

# UIKit

[![Build and Test results](https://img.shields.io/github/actions/workflow/status/acusti/uikit/node.js.yml?branch=main&style=for-the-badge)](https://github.com/acusti/uikit/actions/workflows/node.js.yml)
[![Top language](https://img.shields.io/github/languages/top/acusti/uikit?style=for-the-badge)](https://github.com/acusti/uikit/search?l=typescript)
[![Commits per month](https://img.shields.io/github/commit-activity/m/acusti/uikit?style=for-the-badge)](https://github.com/acusti/uikit/pulse)

_UI toolkit monorepo containing a React component library, UI utilities, a
generative AI LLM parser, an [AWS AppSync](https://aws.amazon.com/appsync/)
fetch utility, and more_

## Packages

| NPM Package Name                         | Version                                                                                                                                                              | Description                                                                                              |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **[@acusti/appsync-fetch][]**            | [![latest version](https://img.shields.io/npm/v/@acusti/appsync-fetch?style=flat-square)](https://www.npmjs.com/package/@acusti/appsync-fetch)                       | A promise-based node.js function for making AWS AppSync API graphql requests                             |
| **[@acusti/aws-signature-v4][]**         | [![latest version](https://img.shields.io/npm/v/@acusti/aws-signature-v4?style=flat-square)](https://www.npmjs.com/package/@acusti/aws-signature-v4)                 | An isomorphic module implementing the [AWS Signature V4 (SigV4) signing process][aws sigv4] for requests |
| **[@acusti/css-values][]**               | [![latest version](https://img.shields.io/npm/v/@acusti/css-values?style=flat-square)](https://www.npmjs.com/package/@acusti/css-values)                             | Utilities for parsing different types of CSS values                                                      |
| **[@acusti/css-value-input][]**          | [![latest version](https://img.shields.io/npm/v/@acusti/css-value-input?style=flat-square)](https://www.npmjs.com/package/@acusti/css-value-input)                   | React component that renders a CSS value input                                                           |
| **[@acusti/date-picker][]**              | [![latest version](https://img.shields.io/npm/v/@acusti/date-picker?style=flat-square)](https://www.npmjs.com/package/@acusti/date-picker)                           | React component that renders a date picker with range support                                            |
| **[@acusti/dropdown][]**                 | [![latest version](https://img.shields.io/npm/v/@acusti/dropdown?style=flat-square)](https://www.npmjs.com/package/@acusti/dropdown)                                 | React component that renders a dropdown UI element                                                       |
| **[@acusti/input-text][]**               | [![latest version](https://img.shields.io/npm/v/@acusti/input-text?style=flat-square)](https://www.npmjs.com/package/@acusti/input-text)                             | React component that renders an uncontrolled text input                                                  |
| **[@acusti/matchmaking][]**              | [![latest version](https://img.shields.io/npm/v/@acusti/matchmaking?style=flat-square)](https://www.npmjs.com/package/@acusti/matchmaking)                           | Utilities for approximate string matching (i.e. fuzzy search)                                            |
| **[@acusti/parsing][]**                  | [![latest version](https://img.shields.io/npm/v/@acusti/parsing?style=flat-square)](https://www.npmjs.com/package/@acusti/parsing)                                   | Loosely parse a string as JSON with numerous affordances for syntax errors                               |
| **[@acusti/post][]**                     | [![latest version](https://img.shields.io/npm/v/@acusti/post?style=flat-square)](https://www.npmjs.com/package/@acusti/post)                                         | A promise-based node.js function for making graphql requests                                             |
| **[@acusti/styling][]**                  | [![latest version](https://img.shields.io/npm/v/@acusti/styling?style=flat-square)](https://www.npmjs.com/package/@acusti/styling)                                   | React component that renders a CSS string to the `<head>`                                                |
| **[@acusti/textual][]**                  | [![latest version](https://img.shields.io/npm/v/@acusti/textual?style=flat-square)](https://www.npmjs.com/package/@acusti/textual)                                   | Utilities for transforming and formatting text                                                           |
| **[@acusti/uniquify][]**                 | [![latest version](https://img.shields.io/npm/v/@acusti/uniquify?style=flat-square)](https://www.npmjs.com/package/@acusti/uniquify)                                 | A function that ensures a string is unique amongst items                                                 |
| **[@acusti/use-bounding-client-rect][]** | [![latest version](https://img.shields.io/npm/v/@acusti/use-bounding-client-rect?style=flat-square)](https://www.npmjs.com/package/@acusti/use-bounding-client-rect) | React hook for getting an element’s `boundingClientRect`                                                 |
| **[@acusti/use-is-out-of-bounds][]**     | [![latest version](https://img.shields.io/npm/v/@acusti/use-is-out-of-bounds?style=flat-square)](https://www.npmjs.com/package/@acusti/use-is-out-of-bounds)         | React hook to check if an element overlaps its bounds                                                    |
| **[@acusti/use-keyboard-events][]**      | [![latest version](https://img.shields.io/npm/v/@acusti/use-keyboard-events?style=flat-square)](https://www.npmjs.com/package/@acusti/use-keyboard-events)           | React hook for adding key event listeners to your UI                                                     |
| **[@acusti/webcrypto][]**                | [![latest version](https://img.shields.io/npm/v/@acusti/webcrypto?style=flat-square)](https://www.npmjs.com/package/@acusti/use-is-out-of-bounds)                    | Isomorphic method for accessing the webcrypto API                                                        |

[@acusti/appsync-fetch]:
    https://github.com/acusti/uikit/tree/main/packages/appsync-fetch
[@acusti/aws-signature-v4]:
    https://github.com/acusti/uikit/tree/main/packages/aws-signature-v4
[aws sigv4]:
    https://docs.aws.amazon.com/general/latest/gr/signature-version-4.html
[@acusti/css-values]:
    https://github.com/acusti/uikit/tree/main/packages/css-values
[@acusti/css-value-input]:
    https://github.com/acusti/uikit/tree/main/packages/css-value-input
[@acusti/date-picker]:
    https://github.com/acusti/uikit/tree/main/packages/date-picker
[@acusti/dropdown]:
    https://github.com/acusti/uikit/tree/main/packages/dropdown
[@acusti/input-text]:
    https://github.com/acusti/uikit/tree/main/packages/input-text
[@acusti/matchmaking]:
    https://github.com/acusti/uikit/tree/main/packages/matchmaking
[@acusti/parsing]:
    https://github.com/acusti/uikit/tree/main/packages/parsing
[@acusti/post]: https://github.com/acusti/uikit/tree/main/packages/post
[@acusti/styling]:
    https://github.com/acusti/uikit/tree/main/packages/styling
[@acusti/textual]:
    https://github.com/acusti/uikit/tree/main/packages/textual
[@acusti/uniquify]:
    https://github.com/acusti/uikit/tree/main/packages/uniquify
[@acusti/use-bounding-client-rect]:
    https://github.com/acusti/uikit/tree/main/packages/use-bounding-client-rect
[@acusti/use-is-out-of-bounds]:
    https://github.com/acusti/uikit/tree/main/packages/use-is-out-of-bounds
[@acusti/use-keyboard-events]:
    https://github.com/acusti/uikit/tree/main/packages/use-keyboard-events
[@acusti/webcrypto]:
    https://github.com/acusti/uikit/tree/main/packages/webcrypto

The React components are documented and illustrated in the [storybook
instance][], which is located at [`packages/docs/`][packages/docs] in the
repository.

[storybook instance]: https://uikit.acusti.ca
[packages/docs]: https://github.com/acusti/uikit/tree/main/packages/docs

## Tests

The monorepo uses vitest to run its tests. To run tests across all
packages, use `yarn test`. To run them in watch mode, use
`yarn test:watch`.

## Building and Publishing

We use [changesets][] to maintain a changelog and manage versioning and
publishing. Changesets is supposed to handle automatically updating any
packages that depend on the changed packages, but it isn’t 100% accurate at
that task. Yarn has its own [“Release Workflow” feature][], which will
update versions and dependents with 100% accuracy. As such, the hybrid flow
I have come up with is to first, run the following for each package that I
have directly changed:

```
yarn workspace @acusti/{pkg} version patch
```

Then, make a note of each package that was bumped because the package
depends on one or more of the packages receiving direct updates.

Then run `git checkout .` (or Branch › Discard All Changes…) to undo all of
the local changes.

Now, we turn to changesets. To create a new changeset, run the following
and select all packages identified in the previous step (including ones
that depend on the changed packages):

```
yarn changeset
```

For the contents of the changesets, the format to document updated
dependencies (for the packages that depend on the packages receiving direct
updates) is:

```
- Updated dependencies
    - @acusti/aws-signature-v4@1.1.0
    - @acusti/post@1.1.0
```

When you are ready to do a release, build all packages by running
`yarn build`. This will trigger each packages’ build script in
“topological” order, i.e. yarn will only run the command after all
workspaces that it depends on through the `dependencies` field have
successfully finished executing. You can then update all package versions
automatically by running:

```
yarn changeset version
```

Lastly, to publish the new versions to npm (building all the packages first
if anything has changed), run:

```
yarn build
yarn changeset publish
```

After publishing the packages, run `yarn` to update the yarn.lock file and
then commit the version updates with a message in the form of:
`:arrow_up: Bump package versions to _._._`.

To build the storybook docs, run `yarn build:stories`, which will run
`yarn build` and then the default storybook `build` command.

## Developing

The two main run scripts for developing are `yarn dev:watch`, which kicks
off the TypeScript compiler in `--watch` mode, and `yarn dev:stories`,
which kicks off the default `storybook` command from packages/docs/. To run
both of those in a single terminal window, use `yarn dev`.

[changesets]: https://github.com/changesets/changesets
[“Release Workflow” feature]: https://yarnpkg.com/features/release-workflow
[open issue]: https://github.com/yarnpkg/berry/issues/1510
