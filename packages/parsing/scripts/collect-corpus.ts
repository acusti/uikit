// Collects recorded model responses into the JSONL file that the corpus harness
// reads (PARSING_CORPUS): one `{"text": …}` per line, each response once.
//
//   bun scripts/collect-corpus.ts --out <file.jsonl> --field <path> [--field …] <dir>…
//
// Every .json file under each directory is read, and each field is a path into
// it (`raw`, or `draft.raw`) whose string value is a response. Files that are not
// JSON, and fields that are not strings, are passed over.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const { positionals: dirs, values: options } = parseArgs({
    allowPositionals: true,
    options: {
        field: { multiple: true, type: 'string' },
        out: { type: 'string' },
    },
});
if (!options.out || !options.field?.length || !dirs.length) {
    console.error(
        'usage: bun scripts/collect-corpus.ts --out <file.jsonl> --field <path> [--field …] <dir>…',
    );
    process.exit(2);
}

function* jsonFiles(dir: string): Generator<string> {
    for (const name of readdirSync(dir)) {
        const file = path.join(dir, name);
        if (statSync(file).isDirectory()) yield* jsonFiles(file);
        else if (name.endsWith('.json')) yield file;
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
        for (const field of options.field) {
            const text = get(data, field);
            if (typeof text === 'string' && text !== '') texts.add(text);
        }
    }
}
writeFileSync(
    options.out,
    [...texts].map((text) => JSON.stringify({ text })).join('\n') +
        (texts.size ? '\n' : ''),
);
console.log(`${texts.size} responses from ${files} files, in ${options.out}`);
