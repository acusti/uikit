// The plugin’s paths on Windows, with `node:path` as it is there. Vite hands
// plugins ids with forward slashes, while `node:path` returns backslashes.
import type * as NodePath from 'node:path';
import type * as Vite from 'vite';

import { describe, expect, it, vi } from 'vitest';

import styleSheets from './vite.js';

vi.mock('node:path', async () => {
    const path = await vi.importActual<typeof NodePath>('node:path');
    return { ...path.win32, default: path.win32 };
});

// Vite’s normalizePath turns backslashes into slashes only on Windows
vi.mock('vite', async () => {
    const vite = await vi.importActual<typeof Vite>('vite');
    const path = await vi.importActual<typeof NodePath>('node:path');
    return {
        ...vite,
        normalizePath: (id: string) => path.posix.normalize(id.replaceAll('\\', '/')),
    };
});

type Hook<Handler> = { handler: Handler };

const ROOT = 'C:/project';
const FILE = 'C:/project/node_modules/@scope/ui/dist/raw/src/card.css';

describe.each(['build', 'dev'] as const)('in %s', (mode) => {
    it('keeps the href a raw library build’s import carries', async () => {
        const plugin = styleSheets({ prefix: '@app/' });
        const resolveId = plugin.resolveId as Hook<
            (this: unknown, source: string, importer: string) => Promise<string>
        >;
        const load = plugin.load as Hook<(this: unknown, id: string) => string>;

        const id = await resolveId.handler.call(
            {
                environment: { config: { root: ROOT }, mode },
                resolve: () => Promise.resolve({ id: FILE }),
            },
            './src/card.css?sheet=%40scope%2Fui%2Fsrc%2Fcard.css',
            'C:/project/node_modules/@scope/ui/dist/raw/index.js',
        );
        const code = load.handler.call(
            { environment: { config: { consumer: 'client', root: ROOT }, mode } },
            id,
        );

        expect(code).toContain('href: "@scope/ui/src/card.css"');
        expect(code).toContain(`"${FILE}?inline"`);
    });
});
