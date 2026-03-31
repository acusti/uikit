# UIKit Monorepo Development Guide

UIKit is a TypeScript-based React component library and utilities monorepo containing 17+ packages including UI components, React hooks, AWS utilities, text processing tools, and Storybook docs. The repository uses Bun workspaces, Vite for builds, Vitest for tests, and Storybook for documentation.

Always reference these instructions first and fallback to search or shell commands only when the repo state does not match the guidance here.

## Essential Commands

```bash
bun install
bun run build
bun run dev
bun run test
bun run lint
bun run lintfix
bun run tsc
bun run format
```

## Validation Requirements

After making changes, run:

```bash
bun run build
bun run test
bun run lint
bun run tsc
```

Known expected failures:
- 2 tests in `packages/post/src/index.test.ts` may fail because they hit `countries.trevorblades.com`

## Key Files

- `package.json`: root workspace scripts and Bun package manager declaration
- `scripts/run-workspaces.mjs`: topological workspace runner for package builds
- `packages/docs/`: Storybook app
- `vite.config.base.js`: shared Vite build configuration
- `tsconfig.json`: root TypeScript project references
- `eslint.config.js`: ESLint flat config

## Package Manager Notes

- Use `bun run --filter @acusti/{pkg} <script>` for a single workspace.
- `bun run build` builds packages in dependency order and excludes docs.
- `bun run buildall` includes Storybook docs for deployment.
- `bun run tsc` uses TypeScript project references from the root config.

## Troubleshooting

**If `bun install` fails:**
- Check Node.js version (requires >=20)
- Remove stale Yarn/PnP artifacts from older checkouts
- Retry `bun install`

**If build fails:**
- Run `bun run tsc`
- Check the affected package with `bun run --filter @acusti/{pkg} build`

**If tests fail beyond the expected network errors:**
- Run `bun run --filter @acusti/{pkg} test`
