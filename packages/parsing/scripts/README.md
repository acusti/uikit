# Harnesses for `parseAsJSON`

Most of what `parseAsJSON` does is repair text that is not valid JSON, by
rules that meet one another. A change to one rule shifts how other text
reads, often text that no test has. These scripts compare two versions of
the parser over millions of texts, so that each such shift is found and
accounted for before a pull request.

They are not part of `bun run test`, and CI does not run them. Run them
from `packages/parsing`. Each one saves a copy of both versions, and writes
what it finds to a directory of its own under `scripts/runs/`, which git
ignores.

A version is a git ref, or the working tree with what is not yet committed.
The base is `origin/main` unless `--base` says otherwise, and the branch is
the working tree unless `--branch` says otherwise.

## Before a pull request that changes `parseAsJSON`

1. `bun run compare` runs every harness (see below). It exits with 1 where
   something failed. Account for every other difference it writes out, by
   kind, in the pull request.
2. `bun run mutate <mutants.ts>` checks that a test fails for each change
   to the code. Run it with nothing else using the machine.
3. `bun run perf` and `bun run size` give the timings and the bundle size.

A harness only sees the shapes its texts have. List where the text that the
change reads can stand: before the answer, after it, in one of its strings,
in an earlier object that cannot be read, with the answer bare and in a
code block. If no harness puts it there, write one for the change. The
surest check is one with a known answer, such as the same text with the
repair written in by hand, read whole and cut at every length.

## `compare`

```sh
bun run compare [--base <ref>] [--branch <ref>] [--only <names>] [--run <dir>]
```

First it runs each version's own tests against its own parser, and records
every input that they pass to `parseAsJSON`. Texts over 20,000 characters
(a timing test's) are left out, since most harnesses cut each text at every
length. Then the harnesses run in parallel, each in a process of its own.
`--only` takes their names, separated by commas, and `--run` runs them
again on a run directory that has been made already.

These have no known answer. They write each difference between base and
branch to `<name>.jsonl`, and fail only where a reading throws.

- `differential`: every input that each version's tests pass, cut at every
  length.
- `fuzz-structural`: each input with one change to its structure (a comma
  before or after a bracket, a raw line break, a punctuation mark deleted,
  doubled or swapped, and more), read whole and cut just after it.
- `fuzz-preamble`: each input after a preamble (prose with braces, brackets
  or quoted words in it, code, a citation, a task list, a markdown table, a
  lone bracket), read whole and cut around where the JSON starts.

These have a known answer. They count each text that either version reads
wrong, and fail where the branch reads one wrong that the base read right.
Some rows are wrong in both versions by design (costs that a release
accepted), and only a change in them counts. A few of each kind of text are
written to `<name>.jsonl`.

- `code-block-before`: a value in a code block, after text with something
  JSON-like in it, reads as the block alone does.
- `code-block-after`: a code block after the answer leaves the answer as it
  is, unless the block is JSON.
- `code-block-in-string`: a code block in one of the JSON's strings is part
  of the string.
- `root-before-answer`: an answer after an object or array that cannot be
  read reads as it does alone.
- `readme`: every example in the branch's README returns what the README
  says. The base's readings are listed too, so the examples of what the
  branch adds show as such.

The values that these put in their texts are the objects and arrays that
the recorded test inputs read as.

### Recorded responses

`corpus` reads recorded model responses: whole, at 340 lengths of each, and
at every length of one that the two versions read differently. A response
that is valid JSON has to read as `JSON.parse` reads it. It also counts,
for each version, how often a reading goes from a value to `null`, or gets
smaller, as the text grows. It is skipped unless `PARSING_CORPUS` names a
file of responses, one `{"text": …}` per line, which `collect-corpus.ts`
makes from saved results:

```sh
bun scripts/collect-corpus.ts --out <file.jsonl> --field <path> [--field …] <dir>…
```

Every `.json` file under each directory is read, and each field is a path
in it (`raw`, or `draft.raw`) to a response. Recorded responses are not
ours to publish. What this harness writes holds no response text, and an
example in an issue or a pull request has to be made up, in the same shape.

## `mutate`

```sh
bun run mutate <mutants.ts> [names…]
```

The mutants file's default export is a list of `{ name, old, new }`. `old`
is text that occurs once in `src/parse-as-json.ts`, and `new` what it
becomes:

```ts
export default [
    {
        name: 'the colon check, deleted',
        old: "        !isPreceededBy({ char: ':', index: stringIndex, text }) &&\n",
        new: '',
    },
];
```

Give each changed condition its plain deletion as well as its inversions.
Bend each character class toward what the README says of it. Move each new
branch past the nearest `continue` or `break` in its block.

Each mutant is written into the parser and the package's tests are run,
then the file is put back. So the script will not start while that file has
changes that are not committed. A mutant counts as killed where a test of
how a text reads fails. One that only a timing test kills, or that times
out, is listed as such: under load, a timing test fails for no fault of the
mutant's. Each run has a process group of its own, which is killed when the
run ends, so that no test worker is left spinning in a mutant's loop. The
script checks that none is running before it starts and after it ends.

## `perf` and `size`

```sh
bun run perf [--base <ref>] [--branch <ref>] [--runs <n>] [--cases <cases.ts>]
bun run size [--base <ref>] [--branch <ref>]
```

`perf` times both versions on long texts: thousands of brackets and code
fences before the JSON, texts that need a repair, and valid JSON for scale.
The two take turns, and the best of `--runs` (7) is shown. `--cases` names
a module whose default export is more cases, as a list of `[label, text]`.

`size` builds each version as the package does, then minifies the result
with bun and gzips it.
