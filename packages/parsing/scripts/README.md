# Harnesses for `parseAsJSON`

Most of what `parseAsJSON` does is repair text that is not valid JSON, by
rules that meet one another. A change to one rule shifts how other text
reads, often text that no test has. These scripts compare two versions of
the parser over millions of texts, so that each such shift is found and
accounted for before a pull request.

They are not part of `bun run test`, and CI does not run them, but
`bun run lint` and `bun run tsc` check them. Run them from
`packages/parsing`.

`compare`, `perf` and `size` compare two versions. A version is a git ref,
or the working tree with what is not yet committed. The base is
`origin/main` unless `--base` says otherwise, and the branch is the working
tree unless `--branch` says otherwise. Each of the three saves a copy of
both versions (the parser, its tests and README, and the other files in its
`src`, which the tests may import) in a directory of its own under
`scripts/runs/`, and writes what it finds there. Git ignores that
directory, and old runs can be deleted: nothing reads them but you. The
parser has to be one file, `src/parse-as-json.ts`, since that is what is
saved and loaded.

`mutate` changes the working tree's parser and puts it back.
`collect-corpus` writes the one file that it is given.

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
every input that they pass to `parseAsJSON`. It stops there if either
version's tests fail, do not load, or pass no string to `parseAsJSON`: the
comparison would leave out the tests that the change is about. Texts over
20,000 characters (a timing test's) are left out, since most harnesses cut
each text at every length. Then the harnesses run in parallel, each in a
process of its own. `--only` takes their names, separated by commas, and
`--run` runs them again on a run directory that has been made already.

A reading that throws in the branch fails every harness. One that throws in
the base alone is a change like any other (`throwsToValue`).

These have no known answer. They write each difference between base and
branch to `<name>.jsonl`, with both readings, for you to account for. Each
input is read once, in a row named by whose tests pass it: both versions',
or only the base's or the branch's.

- `differential`: every input that either version's tests pass, cut at
  every length (the empty text too), and the inputs that are not strings
  (`parseAsJSON()` and `parseAsJSON(null)`).
- `fuzz-structural`: each input with one change to its structure (a comma
  before or after a bracket, a raw line break in a word, an escaped
  backslash before a closing quote mark, a punctuation mark deleted or
  doubled or with one of `,[]{}` put before it, and more), read whole and
  cut at each of the 40 lengths after the change and at 6 more.
- `fuzz-preamble`: each input after a preamble (prose with braces, brackets
  or quoted words in it, code, a citation, a task list, a markdown table, a
  lone bracket), read whole and cut around where the JSON starts.

These have a known answer. They count each text that either version reads
wrong, and write a few of each kind to `<name>.jsonl`.

- `code-block-before`: a value in a code block (with the language `json`,
  or none), after text with something JSON-like in it, reads as the block
  alone does.
- `code-block-after`: a code block after the answer leaves the answer as it
  is, unless the block takes its place: one whose fence has no language or
  `json`, `jsonc`, `json5` or `jsonl`, and that starts with JSON. A block
  in any other language never does. A block with no language does only once
  its first line is whole, since a line of brackets alone may yet be JSON.
- `code-block-in-string`: a code block in one of the JSON's strings is part
  of the string: the whole text reads as all of the outer value, and each
  cut as the outer value as far as it goes. The block's JSON and the prose
  before it have their quote marks escaped and their line breaks raw, as a
  model writes them. In the rows named `COST` their quote marks are not
  escaped: the first that a colon follows (or an inches mark, which ends
  the string early) ends the string, so the outer value is not read.
- `root-before-answer`: an answer after an object or array that cannot be
  read reads as it does alone.

The first four fail where the branch reads a text wrong that the base read
right. Some of their rows are wrong in both versions by design (costs that
a release accepted, named `COST`, and known gaps, named `OPEN`). A change
in them is counted (`changed`, or `fixed`) but does not fail. The values
that they put in their texts are the objects and arrays that the recorded
test inputs read as, in either version.

- `readme`: every example in the branch's README returns what the README
  says. It fails wherever the branch reads one otherwise, whatever the base
  reads. The base's readings are listed too, so the examples of what the
  branch adds show as such.

`SEED` (1234 by default) sets where the fuzzers' and the corpus harness's
random choices start.

### Recorded responses

`corpus` reads recorded model responses: whole, at up to 340 lengths of
each (its first 40, and `CUTS` more drawn at random, 300 by default, less
those that fall on a length already drawn), and at every length of one that
the two versions read differently. A response that is valid JSON has to
read as `JSON.parse` reads it. It also counts, for each version, how often
a reading goes from a value to `null`, or gets smaller, as the text grows.
It is skipped unless `PARSING_CORPUS` names a file of responses, one
`{"text": …}` per line, which `collect-corpus.ts` makes from saved results:

```sh
bun scripts/collect-corpus.ts --out <file.jsonl> --field <path> [--field …] <dir>…
```

Every `.json` file under each directory is read, in the order of their
names and not through a symbolic link, and each field is a path in it
(`raw`, or `draft.raw`) to a response. Recorded responses are not ours to
publish. What this harness writes holds no response text (only which
response and which length each difference is at), and an example in an
issue or a pull request has to be made up, in the same shape.

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

Each mutant is written into the parser, exactly as `new` has it, and the
package's tests are run, then the file is put back (on Ctrl-C too). So the
script will not start while that file has changes that are not committed.
Each mutant is listed as:

- `KILLED`: a test of how a text reads fails;
- `SURVIVED`: every test passes;
- `TIMING ONLY`: only a timing test fails, which under load it does for no
  fault of the mutant's;
- `TIMED OUT`: the tests ran for more than a minute;
- `DOES NOT LOAD`: the test file fails with no test failing, which is a
  mistake in the mutant, not a gap in the tests;
- `NOT APPLIED`: `old` does not occur exactly once in the parser, or `new`
  is the same as `old`.

It exits with 0 only where every mutant selected is killed, and at least
one is. Each run has a process group of its own, which is killed when the
run ends, so that no test worker is left spinning in a mutant's loop. The
script checks that none is running before it starts and after it ends.

## `perf` and `size`

```sh
bun run perf [--base <ref>] [--branch <ref>] [--runs <n>] [--cases <cases.ts>]
bun run size [--base <ref>] [--branch <ref>]
```

`perf` times both versions on long texts: thousands of brackets and code
fences before the JSON, texts that need a repair, and valid JSON for scale.
The two take turns, each going first on every other run, and the best of
`--runs` (7) is shown. `--cases` names a module whose default export is
more cases, as a list of `[label, text]`.

`size` builds each version as the package does, then minifies the result
with bun and gzips it.
