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
| **[@acusti/vite-plugin-svg-react][]**    | [![latest version](https://img.shields.io/npm/v/@acusti/vite-plugin-svg-react?style=flat-square)](https://www.npmjs.com/package/@acusti/vite-plugin-svg-react)       | Vite ≥ 8 rolldown-native plugin that imports SVGs as typed React components                              |

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
[@acusti/vite-plugin-svg-react]:
    https://github.com/acusti/uikit/tree/main/packages/vite-plugin-svg-react
[@acusti/webcrypto]:
    https://github.com/acusti/uikit/tree/main/packages/webcrypto

The React components are documented and illustrated in the [storybook
instance][], which is located at [`packages/docs/`][packages/docs] in the
repository.

[storybook instance]: https://uikit.acusti.ca
[packages/docs]: https://github.com/acusti/uikit/tree/main/packages/docs

## Tests

The monorepo uses vitest to run its tests. To run tests across all
packages, use `bun run test`.

## Building and Publishing

We use [changesets][] to maintain a changelog and manage versioning and
publishing.

To create a new changeset, run:

```bash
bun changeset
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
`bun run build`. This uses the repo’s workspace runner to build packages in
dependency order. You can then update all package versions automatically by
running:

```bash
bun changeset version
```

Next, commit the version updates (don’t run `bun install` yet — saving the
lockfile refresh for after publishing keeps the release tags that
`bun changeset publish` creates pointing at the version commit).

Then, to publish the new versions to npm (building all the packages first
if anything has changed), run:

```bash
bun run build
bun changeset publish
git push --follow-tags
```

Lastly, run `bun install` to update any internal workspace dependency
ranges in `bun.lock` and, if it produces changes, commit and push the
refreshed lockfile. When a release bumps no internal dependency ranges,
this is a no-op: bun skips the lockfile write when only workspace `version`
fields changed (publishing doesn’t read them — versions come from each
`package.json` — and they sync on the next real lockfile write).

### Prereleases (alpha)

To ship a prerelease instead of a stable version, enter changesets’
prerelease (`pre`) mode first — from `main`, once every changeset file
(`.changeset/*.md`) you want in the release has merged there.
`bun changeset version` (below) consumes all pending changeset files at
once, so anything still on an unmerged branch won’t be included.

```bash
bun changeset pre enter alpha   # writes .changeset/pre.json — commit it
bun changeset version           # applies pending changesets, e.g. → 1.0.0-alpha.0
bun run build
bun changeset publish --tag alpha
```

Iterate by adding changesets and re-running `bun changeset version` (→
`1.0.0-alpha.1`, `…alpha.2`). To graduate to a stable release, exit
prerelease mode, then version and publish as usual:

```bash
bun changeset pre exit
bun changeset version           # drops the suffix, e.g. → 1.0.0
bun changeset publish
```

Three things worth knowing:

- **Pass `--tag` when publishing a prerelease.** `bun changeset publish`
  targets the `latest` dist-tag by default even for a `-alpha` version, so
  without `--tag alpha` (or `next`) the prerelease lands on `latest` and a
  plain `npm install` would pull it.
- **Prerelease mode is repo-wide.** `.changeset/pre.json` puts the whole
  monorepo into prerelease mode; while it’s active, every package with a
  pending changeset versions as a prerelease. Finish a package’s
  alpha→stable cycle and `bun changeset pre exit` before releasing
  unrelated packages normally.
- **A `major` changeset takes `0.x` straight to `1.0.0`.** Changesets
  applies the literal semver bump regardless of being pre-1.0 — there’s no
  “0.x major = minor” downgrade.

## Developing

The run script for developing is `bun run dev`, which kicks off the default
`storybook` command from `packages/docs/package.json` and runs storybook in
watch mode. Changes to the source files (e.g.
`packages/dropdown/src/Dropdown.tsx`) should trigger a rebuild, but if not,
run `bun run build` to ensure it’s picked up.

[changesets]: https://github.com/changesets/changesets
