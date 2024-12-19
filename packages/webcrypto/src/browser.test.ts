// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import webcrypto from './browser.js';

describe('@acusti/webcrypto', () => {
    describe('browser.ts', () => {
        it('exports the browser’s global crypto object', () => {
            expect(webcrypto).toBe(window.crypto);
        });
    });
});
