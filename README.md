![uikit wordmark](https://raw.githubusercontent.com/acusti/uikit/main/wordmark.svg)

# UIKit

![npm (scoped)](https://img.shields.io/npm/v/@acusti/css-value-input?style=for-the-badge)
![Dependencies status](https://img.shields.io/david/acusti/uikit?path=packages%2Fcss-value-input&style=for-the-badge)
![GitHub top language](https://img.shields.io/github/languages/top/acusti/uikit?style=for-the-badge)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/acusti/uikit?style=for-the-badge)

UI toolkit monorepo containing a React component library, UI utilities, a
drag-and-drop library, and more

## Packages

| NPM Package Name                | Description                                                   |
| ------------------------------- | ------------------------------------------------------------- |
| **[@acusti/css-values][]**      | Utilities for parsing different types of CSS values           |
| **[@acusti/css-value-input][]** | React component that renders a CSS value input                |
| **[@acusti/dropdown][]**        | React component that renders a dropdown UI element            |
| **[@acusti/matchmaking][]**     | Utilities for approximate string matching (i.e. fuzzy search) |
| **[@acusti/styling][]**         | React component that renders a CSS string to the `<head>`     |
| **[@acusti/uikit-docs][]**      | Storybook instance illustrating all components                |

[@acusti/css-values]:
    https://github.com/acusti/uikit/tree/main/packages/css-values
[@acusti/css-value-input]:
    https://github.com/acusti/uikit/tree/main/packages/css-value-input
[@acusti/dropdown]:
    https://github.com/acusti/uikit/tree/main/packages/dropdown
[@acusti/matchmaking]:
    https://github.com/acusti/uikit/tree/main/packages/matchmaking
[@acusti/styling]:
    https://github.com/acusti/uikit/tree/main/packages/styling
[@acusti/uikit-docs]:
    https://github.com/acusti/uikit/tree/main/packages/docs

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
