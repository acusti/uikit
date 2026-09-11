import { describe, expect, it } from 'vitest';

import { getIdPrefix } from './optimize.js';

describe('getIdPrefix', () => {
    it('joins the sanitized base name to a hash of the root-relative path', () => {
        // the first 4 hex chars of sha256('src/icons/arrow-left.svg'), pinned
        // so that a change to the hash source or length fails here
        expect(getIdPrefix('/app/src/icons/arrow-left.svg', '/app')).toBe(
            'arrow-left-' + '0b0a',
        );
    });

    it('depends on the path relative to the root, not the absolute path', () => {
        // the same file in two checkouts optimizes to the same output
        expect(getIdPrefix('/home/a/app/src/icon.svg', '/home/a/app')).toBe(
            getIdPrefix('/ci/build/src/icon.svg', '/ci/build'),
        );
        expect(getIdPrefix('/app/src/icon.svg', '/app')).not.toBe(
            getIdPrefix('/app/src/small/icon.svg', '/app'),
        );
    });

    it('sanitizes the base name to what a CSS id selector takes unescaped', () => {
        expect(getIdPrefix('/app/icon.small@2x.svg', '/app')).toMatch(
            /^icon-small-2x-[0-9a-f]{4}$/,
        );
        // a leading digit would need escaping, and isn’t a valid XML name
        expect(getIdPrefix('/app/24-arrow.svg', '/app')).toMatch(
            /^_24-arrow-[0-9a-f]{4}$/,
        );
    });
});
