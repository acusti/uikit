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
- `gh pr create`, `gh pr edit` and `gh pr comment` take `--attach` (gh
  2.99+) to upload images and videos into the body; use it rather than
  hosting them on a branch

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
  `git rebase origin/main`). This applies to every branch, whoever created
  it and however many people are working on it, and to every way of
  bringing in the base: resolving a PR’s merge conflicts, a “base branch
  recovered” notice, and `update_pull_request_branch` (which creates a
  merge commit) all get a rebase instead.
- To force-push a rebased or squashed `claude/` branch, write exactly
  `git push --force-with-lease --force-if-includes origin claude/<branch>`,
  with no `-u` and nothing after the branch name. `.claude/settings.json`
  lets Claude Code run that and `git commit --amend …` without a prompt;
  any other form of either still goes through the permission check.

## Changesets

- A changeset answers two questions for someone reading the changelog:
  should I upgrade to this version, and if I do, what should I look out
  for?
- Focus on what the change is and what it means in practice. Explaining the
  previous behavior is rarely helpful; minimize it or leave it out.

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

## Bumping oxc-transform-react

`@acusti/vite-plugin-react-compiler` pins an exact oxc-transform-react, and
its README promises that each release is vetted before a plugin release
ships it. For each bump:

1. **Triage upstream.** List the oxc-project/oxc commits between the two
   `crates_v*` tags that touch `crates/oxc_react_compiler` or
   `napi/transform-react`, plus `fix` commits in the shared crates (parser,
   semantic, transformer, codegen). Diff the bindings’ `index.d.ts` too.
2. **Compare corpora.** Compile every JS/TS file in this repo, in
   `node_modules` and in Outlyne (`outlyne/outlyne`, the production app
   using the plugin, with its own plugin options) with the old and new
   bindings. Use the plugin’s `transform()` options plus
   `reportDiagnostics: true`, in default mode and `compilationMode: 'all'`.
    - Compare code, diagnostics, `fatal`, and whether each file imports
      `react/compiler-runtime`, and attribute every change to an upstream
      commit.
    - Give a dependency file an id outside `node_modules`, which the
      compiler skips.
    - Run each version in its own child process: a native panic aborts it.
3. **Check behavior at runtime.** Render each fix’s input and each newly
   skipped shape in sequence (React 19 on happy-dom) four ways: uncompiled,
   compiled by each version, and compiled by
   babel-plugin-react-compiler@1.0.0. The uncompiled pass has to set
   `reactCompiler: false`, since `transform()` compiles by default.
4. **Pin what matters** in the plugin’s `src/upstream.test.ts`, one commit
   per test.
    - Pin fixes whose shapes are plausible in real code (look for instances
      in the corpora) and every crash, since a panic takes down the dev
      server.
    - Prove each pin fails against the old bindings and passes against the
      new, with a throwaway Vitest config that aliases
      `oxc-transform-react` to an install of the old version.
    - Promote any `it.fails` the bump fixes to a plain test.
5. **Decide.** Skip a release whose regressions (code it newly skips or
   fails without reason, which `panicThreshold` turns into build failures)
   outweigh its fixes, and wait for the one that fixes them. A regression
   that ships anyway gets an `it.fails`, an upstream issue and a changeset
   paragraph.
6. **Write the changeset** for users of the last plugin release: describe
   the change from the bindings version that release shipped, not from a
   skipped one.

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
