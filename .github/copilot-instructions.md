# Copilot Instructions

Keep repository context minimal.

## Repo-specific rules

- Use Bun from the repository root
- Use the Bun version `packageManager` pins
- `bun run build` builds workspaces in dependency order and excludes
  `@acusti/uikit-docs`
- `bun run buildall` includes the docs package
- `bun run dev` starts Storybook for `@acusti/uikit-docs`
- For one workspace, use `bun run --filter '@acusti/<pkg>' <script>`

## Common commands

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

## Validation

- Prefer targeted validation while iterating
- Before handing off broad or cross-package changes, run:

```bash
bun run build
bun run test
bun run lint
bun run tsc
bun run format
```

## Known caveat

- In sandboxed or network-restricted environments,
  `packages/post/src/index.test.ts` has 2 tests that may fail because they
  depend on `countries.trevorblades.com`; treat those as expected external
  failures unless the task is about that integration
