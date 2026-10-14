// Collects recorded model responses into the JSONL file that the corpus harness
// reads (PARSING_CORPUS): one `{"text": …}` per line, each response once.
//
//   bun scripts/collect-corpus.ts --out <file.jsonl> --field <path> [--field …] <dir>…
//
// Every .json file under each directory is read (in the order of their names,
// and not through a symbolic link), and each field is a path into it (`raw`, or
// `draft.raw`) whose string value is a response. Files that are not JSON, and
// fields that are not strings, are passed over.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { positionals: dirs, values: options } = parseArgs({
    allowPositionals: true,
    options: {
        field: { multiple: true, type: 'string' },
        out: { type: 'string' },
    },
});
const { field: fields = [], out } = options;
if (out == null || fields.length === 0 || dirs.length === 0) {
    console.error(
        'usage: bun scripts/collect-corpus.ts --out <file.jsonl> --field <path> [--field …] <dir>…',
    );
    process.exit(2);
}

// every .json file under a directory, in the order of their names (so that the
// file made does not depend on the file system), and not through a symbolic
// link (which could lead back up the tree)
function* jsonFiles(dir: string): Generator<string> {
    const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
        a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
    );
    for (const entry of entries) {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) yield* jsonFiles(file);
        else if (entry.isFile() && entry.name.endsWith('.json')) yield file;
    }
}

const get = (object: unknown, fieldPath: string) =>
    fieldPath
        .split('.')
        .reduce<unknown>(
            (value, key) =>
                value !== null && typeof value === 'object'
                    ? (value as Record<string, unknown>)[key]
                    : undefined,
            object,
        );

const texts = new Set<string>();
let files = 0;
for (const dir of dirs) {
    for (const file of jsonFiles(path.resolve(dir))) {
        let data: unknown;
        try {
            data = JSON.parse(readFileSync(file, 'utf8'));
        } catch {
            continue;
        }
        files++;
        for (const field of fields) {
            const text = get(data, field);
            if (typeof text === 'string' && text !== '') texts.add(text);
        }
    }
}
writeFileSync(
    out,
    [...texts].map((text) => JSON.stringify({ text })).join('\n') +
        (texts.size ? '\n' : ''),
);
console.log(`${texts.size} responses from ${files} files, in ${out}`);
