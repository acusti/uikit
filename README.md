![uikit wordmark](https://raw.githubusercontent.com/acusti/uikit/main/wordmark.svg)

# UIKit

[![Build and Test results](https://img.shields.io/github/workflow/status/acusti/uikit/Build%20and%20Test?style=for-the-badge)](https://github.com/acusti/uikit/actions/workflows/node.js.yml)
[![Top language](https://img.shields.io/github/languages/top/acusti/uikit?style=for-the-badge)](https://github.com/acusti/uikit/search?l=typescript)
[![Commits per week](https://img.shields.io/github/commit-activity/w/acusti/uikit?style=for-the-badge)](https://github.com/acusti/uikit/pulse)

_UI toolkit monorepo containing a React component library, UI utilities, a
drag-and-drop library, an [AWS AppSync](https://aws.amazon.com/appsync/)
fetch utility, and more_

## Packages

| NPM Package Name                         | Version                                                                                                                                                              | Description                                                   |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **[@acusti/appsync-fetch][]**            | [![latest version](https://img.shields.io/npm/v/@acusti/appsync-fetch?style=flat-square)](https://www.npmjs.com/package/@acusti/appsync-fetch)                       | A fetch wrapper for making AWS AppSync API graphql requests   |
| **[@acusti/css-values][]**               | [![latest version](https://img.shields.io/npm/v/@acusti/css-values?style=flat-square)](https://www.npmjs.com/package/@acusti/css-values)                             | Utilities for parsing different types of CSS values           |
| **[@acusti/css-value-input][]**          | [![latest version](https://img.shields.io/npm/v/@acusti/css-value-input?style=flat-square)](https://www.npmjs.com/package/@acusti/css-value-input)                   | React component that renders a CSS value input                |
| **[@acusti/dropdown][]**                 | [![latest version](https://img.shields.io/npm/v/@acusti/dropdown?style=flat-square)](https://www.npmjs.com/package/@acusti/dropdown)                                 | React component that renders a dropdown UI element            |
| **[@acusti/input-text][]**               | [![latest version](https://img.shields.io/npm/v/@acusti/input-text?style=flat-square)](https://www.npmjs.com/package/@acusti/input-text)                             | React component that renders an uncontrolled text input       |
| **[@acusti/matchmaking][]**              | [![latest version](https://img.shields.io/npm/v/@acusti/matchmaking?style=flat-square)](https://www.npmjs.com/package/@acusti/matchmaking)                           | Utilities for approximate string matching (i.e. fuzzy search) |
| **[@acusti/styling][]**                  | [![latest version](https://img.shields.io/npm/v/@acusti/styling?style=flat-square)](https://www.npmjs.com/package/@acusti/styling)                                   | React component that renders a CSS string to the `<head>`     |
| **[@acusti/textual][]**                  | [![latest version](https://img.shields.io/npm/v/@acusti/textual?style=flat-square)](https://www.npmjs.com/package/@acusti/textual)                                   | Utilities for transforming and formatting text                |
| **[@acusti/uniquify][]**                 | [![latest version](https://img.shields.io/npm/v/@acusti/uniquify?style=flat-square)](https://www.npmjs.com/package/@acusti/uniquify)                                 | A function that ensures a string is unique amongst items      |
| **[@acusti/use-bounding-client-rect][]** | [![latest version](https://img.shields.io/npm/v/@acusti/use-bounding-client-rect?style=flat-square)](https://www.npmjs.com/package/@acusti/use-bounding-client-rect) | React hook for getting an element’s `boundingClientRect`      |
| **[@acusti/use-is-out-of-bounds][]**     | [![latest version](https://img.shields.io/npm/v/@acusti/use-is-out-of-bounds?style=flat-square)](https://www.npmjs.com/package/@acusti/use-is-out-of-bounds)         | React hook to check if an element overlaps its bounds         |

[@acusti/appsync-fetch]:
    https://github.com/acusti/uikit/tree/main/packages/appsync-fetch
[@acusti/css-values]:
    https://github.com/acusti/uikit/tree/main/packages/css-values
[@acusti/css-value-input]:
    https://github.com/acusti/uikit/tree/main/packages/css-value-input
[@acusti/dropdown]:
    https://github.com/acusti/uikit/tree/main/packages/dropdown
[@acusti/input-text]:
    https://github.com/acusti/uikit/tree/main/packages/input-text
[@acusti/matchmaking]:
    https://github.com/acusti/uikit/tree/main/packages/matchmaking
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

All components are documented and illustrated in the [storybook
instance][], which is located at [`packages/docs/`][packages/docs] in the
repository.

[storybook instance]: https://acusti-uikit.netlify.app
[packages/docs]: https://github.com/acusti/uikit/tree/main/packages/docs

## Tests

The monorepo uses jest to run its tests. To run tests across all packages,
use `yarn test`. To run them in watch mode, use `yarn test:watch`.

## Building and Publishing

To build all packages, run `yarn build`. This will trigger `tsc --build`
and `yarn flowgen` for all packages.

To build the storybook docs, run `yarn build:stories`, which will run
`yarn build` and then the default storybook `build` command.

To publish all packages, manually update each packages’s `version` field in
their package.json. If any of the packages depends on any of the other
packages being updated, be sure to update the dependency version as well.
Then run `yarn publish`. Publishing will trigger a build before running
`npm publish` to ensure that the latest changes are published. To publish
only a single package, use
`yarn workspace <package-name> npm publish --access public` (e.g.
`yarn workspace @acusti/css-value-input npm publish --access public`), but
note that in that case, you are responsible for running `yarn build`
yourself before triggering the publish.

After publishing the packages, run `yarn` to update the yarn.lock file and
then commit the version updates with a message in the form of:
`:arrow_up: Bump package versions to _._._`.

## Developing

The two main run scripts for developing are `yarn start:watch`, which kicks
off the TypeScript compiler in `--watch` mode, and `yarn start:stories`,
which kicks off the default `storybook` command from packages/docs/. To run
both of those in a single terminal window, use `yarn start`.
