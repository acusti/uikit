![uikit wordmark](https://raw.githubusercontent.com/acusti/uikit/main/wordmark.svg)

# UIKit

[![Build and Test results](https://img.shields.io/github/actions/workflow/status/acusti/uikit/node.js.yml?branch=main&style=for-the-badge)](https://github.com/acusti/uikit/actions/workflows/node.js.yml)
[![Top language](https://img.shields.io/github/languages/top/acusti/uikit?style=for-the-badge)](https://github.com/acusti/uikit/search?l=typescript)
[![Commits per month](https://img.shields.io/github/commit-activity/m/acusti/uikit?style=for-the-badge)](https://github.com/acusti/uikit/pulse)

_UI toolkit monorepo containing a React component library, UI utilities, a
generative AI LLM parser, an [AWS AppSync](https://aws.amazon.com/appsync/)
fetch utility, and more_

## Packages

| NPM Package Name                           | Version                                                                                                                                                   | Description                                                                                              |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **[@acusti/appsync-fetch][]**              | [![version](https://npmx.dev/api/registry/badge/version/@acusti/appsync-fetch)](https://npmx.dev/package/@acusti/appsync-fetch)                           | A promise-based node.js function for making AWS AppSync API graphql requests                             |
| **[@acusti/aws-signature-v4][]**           | [![version](https://npmx.dev/api/registry/badge/version/@acusti/aws-signature-v4)](https://npmx.dev/package/@acusti/aws-signature-v4)                     | An isomorphic module implementing the [AWS Signature V4 (SigV4) signing process][aws sigv4] for requests |
| **[@acusti/css-values][]**                 | [![version](https://npmx.dev/api/registry/badge/version/@acusti/css-values)](https://npmx.dev/package/@acusti/css-values)                                 | Utilities for parsing different types of CSS values                                                      |
| **[@acusti/css-value-input][]**            | [![version](https://npmx.dev/api/registry/badge/version/@acusti/css-value-input)](https://npmx.dev/package/@acusti/css-value-input)                       | React component that renders a CSS value input                                                           |
| **[@acusti/date-picker][]**                | [![version](https://npmx.dev/api/registry/badge/version/@acusti/date-picker)](https://npmx.dev/package/@acusti/date-picker)                               | React component that renders a date picker with range support                                            |
| **[@acusti/dropdown][]**                   | [![version](https://npmx.dev/api/registry/badge/version/@acusti/dropdown)](https://npmx.dev/package/@acusti/dropdown)                                     | React component that renders a dropdown UI element                                                       |
| **[@acusti/input-text][]**                 | [![version](https://npmx.dev/api/registry/badge/version/@acusti/input-text)](https://npmx.dev/package/@acusti/input-text)                                 | React component that renders an uncontrolled text input                                                  |
| **[@acusti/matchmaking][]**                | [![version](https://npmx.dev/api/registry/badge/version/@acusti/matchmaking)](https://npmx.dev/package/@acusti/matchmaking)                               | Utilities for approximate string matching (i.e. fuzzy search)                                            |
| **[@acusti/parsing][]**                    | [![version](https://npmx.dev/api/registry/badge/version/@acusti/parsing)](https://npmx.dev/package/@acusti/parsing)                                       | Loosely parse a string as JSON with numerous affordances for syntax errors                               |
| **[@acusti/post][]**                       | [![version](https://npmx.dev/api/registry/badge/version/@acusti/post)](https://npmx.dev/package/@acusti/post)                                             | A promise-based node.js function for making graphql requests                                             |
| **[@acusti/styling][]**                    | [![version](https://npmx.dev/api/registry/badge/version/@acusti/styling)](https://npmx.dev/package/@acusti/styling)                                       | React component that renders a CSS string to the `<head>`                                                |
| **[@acusti/textual][]**                    | [![version](https://npmx.dev/api/registry/badge/version/@acusti/textual)](https://npmx.dev/package/@acusti/textual)                                       | Utilities for transforming and formatting text                                                           |
| **[@acusti/uniquify][]**                   | [![version](https://npmx.dev/api/registry/badge/version/@acusti/uniquify)](https://npmx.dev/package/@acusti/uniquify)                                     | A function that ensures a string is unique amongst items                                                 |
| **[@acusti/use-bounding-client-rect][]**   | [![version](https://npmx.dev/api/registry/badge/version/@acusti/use-bounding-client-rect)](https://npmx.dev/package/@acusti/use-bounding-client-rect)     | React hook for getting an element’s `boundingClientRect`                                                 |
| **[@acusti/use-is-out-of-bounds][]**       | [![version](https://npmx.dev/api/registry/badge/version/@acusti/use-is-out-of-bounds)](https://npmx.dev/package/@acusti/use-is-out-of-bounds)             | React hook to check if an element overlaps its bounds                                                    |
| **[@acusti/use-keyboard-events][]**        | [![version](https://npmx.dev/api/registry/badge/version/@acusti/use-keyboard-events)](https://npmx.dev/package/@acusti/use-keyboard-events)               | React hook for adding key event listeners to your UI                                                     |
| **[@acusti/vite-plugin-react-compiler][]** | [![version](https://npmx.dev/api/registry/badge/version/@acusti/vite-plugin-react-compiler)](https://npmx.dev/package/@acusti/vite-plugin-react-compiler) | Vite plugin that runs React Compiler natively via oxc-transform-react (no Babel)                         |
| **[@acusti/vite-plugin-svg-react][]**      | [![version](https://npmx.dev/api/registry/badge/version/@acusti/vite-plugin-svg-react)](https://npmx.dev/package/@acusti/vite-plugin-svg-react)           | Vite ≥ 8 rolldown-native plugin that imports SVGs as typed React components                              |

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
[@acusti/vite-plugin-react-compiler]:
    https://github.com/acusti/uikit/tree/main/packages/vite-plugin-react-compiler
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

### Prereleases (for alpha, can substitute for beta or rc)

To ship a prerelease instead of a stable version, enter changesets’
prerelease (`pre`) mode first — from `main`, once every changeset file
(`.changeset/*.md`) you want in the release has merged there.
`bun changeset version` (below) consumes all pending changeset files at
once, so anything still on an unmerged branch won’t be included.

```bash
bun changeset pre enter alpha   # writes .changeset/pre.json — commit it
bun changeset version           # applies pending changesets, e.g. → 1.0.0-alpha.0
bun run build
bun changeset publish           # in pre mode, auto-publishes to the alpha dist-tag
git push --follow-tags
```

Iterate by adding changesets and re-running `bun changeset version` (→
`1.0.0-alpha.1`, `…alpha.2`). To graduate to a stable release, exit
prerelease mode, then version and publish as usual:

```bash
bun changeset pre exit
bun changeset version           # drops the suffix, e.g. → 1.0.0
bun run build
bun changeset publish
git push --follow-tags
```

Three things worth knowing:

- **Don’t pass `--tag` in pre mode** — `bun changeset publish` rejects it
  and publishes to the pre tag (`alpha`) automatically: each package that
  already has a stable release goes to the `alpha` dist-tag and `latest`
  stays put. (A package with no prior stable release is published to
  `latest` instead, so `npm install` still resolves — only relevant when
  prereleasing a brand-new package.)
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
