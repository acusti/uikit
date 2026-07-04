# AGENTS.md

Minimal repo-specific guidance for coding agents.

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

## Commits

- One commit per logical change, limited to the files it touches — optimize
  for useful `git blame`. Prefer a small commit fixing one thing over one
  commit fixing several unrelated things; bundle only if each fix is
  explained in the message.
- Commit messages say what changed and why, not what prompted it — no
  catch-all "Address review feedback (round 4)" messages.
- Squash a small commit into the one that introduced the feature when
  separate history adds no blame value.
- Never create merge commits. Keep history linear: rebase onto the target
  branch instead of merging it in (e.g. `git pull --rebase`,
  `git rebase origin/main`).

## Pull Request Reviews

- Treat PR review comments as an issue tracker: reply on each actionable
  comment's own thread, documenting how it was addressed — the change that
  was made (a commit reference is helpful), or the rationale if we're not
  making one.

## Known caveat

- In sandboxed or network-restricted environments,
  `packages/post/src/index.test.ts` has 2 tests that may fail because they
  depend on `countries.trevorblades.com`; treat those as expected external
  failures unless the task is about that integration
