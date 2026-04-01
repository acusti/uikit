# AGENTS.md

Minimal repository-specific guidance for coding agents.

## Commands

Use Bun from the repository root.

```bash
bun install
bun run build
bun run buildall
bun run dev
bun run test
bun run lint
bun run tsc
bun run format
bun run format:check
```

## Repo-specific facts

- Package manager: `bun@1.3.9`
- `bun run build` builds workspaces in dependency order and excludes `@acusti/uikit-docs`
- `bun run buildall` includes the docs package
- `bun run dev` starts Storybook for `@acusti/uikit-docs`
- For a single workspace, use `bun run --filter '@acusti/<pkg>' <script>`

## Validation

- Prefer targeted validation while iterating on one package
- Before handing off broad or cross-package changes, run:

```bash
bun run build
bun run test
bun run lint
bun run tsc
bun run format
```

## Known caveat

- In sandboxed or network-restricted environments, `packages/post/src/index.test.ts` has 2 tests that may fail because they depend on `countries.trevorblades.com`; treat those as expected external failures unless the task is about that integration
