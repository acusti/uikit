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

- `bun run build` builds workspaces in dependency order and excludes
  `@acusti/uikit-docs`
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

## Dependency upgrades

To pick up the latest in-range versions, regenerate `bun.lock` (delete it
and run `bun install`), then split the result into one commit per direct
dependency (plus the transitive entries only it pulls in):

```bash
bun run lockfile:commits            # dry run: prints the plan, changes nothing
bun run lockfile:commits --commit   # creates the commits
```

- Review the plan first. Entries pulled in by several changed dependencies
  (e.g. `ws`, `magic-string`) are listed under "Warnings" and go to the
  owner with the largest commit; move one with
  `--assign <key>=<dependency>`. Combine commits with `--merge <a>,<b>`.
- `bun.lock` must be the only modified file. If its `workspaces` section
  changed (`package.json` edits, workspace version bumps), commit that
  separately first; the script refuses to run otherwise.
- The script replays the groups on top of `HEAD` and aborts without
  committing unless the result is byte-identical to the regenerated
  lockfile. It also reorders commits to avoid intermediate dependency
  mismatches and warns if it can't.
- Afterwards run the full validation above. Major version jumps (e.g. a
  `vitest` or `vite` major) deserve the full test run, not just
  `bun install --frozen-lockfile`.
- In a sandboxed agent shell, committing writes `.git`, so the script needs
  an unsandboxed terminal. Use `git -c color.ui=never` when filtering diff
  output with `grep`/`sed`, since color codes break line-prefix matches.

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
