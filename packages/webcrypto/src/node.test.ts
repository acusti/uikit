import crypto from 'node:crypto';

import { describe, expect, it } from 'vitest';

import webcrypto from './node.js';

describe('@acusti/webcrypto', () => {
    describe('node.ts', () => {
        it('exports node:crypto’s webcrypto object', () => {
            expect(webcrypto).toBe(crypto.webcrypto);
        });

        it('works in a node environment (as opposed to browser.js, which throws an error)', async () => {
            await expect(() => import('./browser.js')).rejects.toThrowError(
                'not defined',
            );
        });
    });
});
