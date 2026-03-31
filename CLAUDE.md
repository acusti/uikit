# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIKit is a TypeScript-based React component library and utilities monorepo containing 17+ packages including UI components, React hooks, AWS utilities, text processing tools, and Storybook docs. The repository uses Bun workspaces, Vite for builds, Vitest for tests, and Storybook for documentation.

## Essential Commands

**Bootstrap the repository:**
```bash
bun install
bun run build
```

**Development workflow:**
```bash
bun run dev
bun run build
bun run test
bun run lint
```

**Run tests:**
```bash
bun run test
```

**Type checking and formatting:**
```bash
bun run tsc
bun run lint
bun run lintfix
bun run format
```

**Changesets:**
```bash
bunx changeset
bunx changeset version
bunx changeset publish
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
- 2 tests in `packages/post/src/index.test.ts` may fail due to network access to `countries.trevorblades.com`

## Repository Structure

- `packages/docs/`: Storybook documentation app
- `vite.config.base.js`: shared Vite build configuration
- `tsconfig.json`: root TypeScript project references
- `eslint.config.js`: ESLint flat config
- `scripts/run-workspaces.mjs`: topological workspace runner used by `bun run build`

## Package Manager Notes

- Root builds use `scripts/run-workspaces.mjs` to preserve dependency order across packages.
- `bun run dev` runs Storybook from `@acusti/uikit-docs`.
- `bun run tsc` uses TypeScript project references from the root `tsconfig.json`.

## Troubleshooting

**If `bun install` fails:**
- Check Node.js version (requires >=20)
- Remove stale PnP artifacts if you are switching an older checkout
- Retry `bun install`

**If build fails:**
- Run `bun run tsc`
- Check an individual package with `bun run --filter @acusti/{pkg} build`

**If tests fail beyond the 2 network errors:**
- Run `bun run --filter @acusti/{pkg} test`
- Verify the affected package builds cleanly first
