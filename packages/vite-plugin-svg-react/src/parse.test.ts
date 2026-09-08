import { describe, expect, it } from 'vitest';

import { getRootElementOffset } from './parse.js';

// The offset is what lets the optimizer hand OXVG the root element alone —
// OXVG refuses a document with a DTD, and the rest of the prolog is
// discarded by component generation anyway — so a wrong one either smuggles
// prolog into the optimizer or truncates the document.
describe('getRootElementOffset', () => {
    it('is 0 for a document that starts with its root element', () => {
        expect(getRootElementOffset('<svg/>')).toBe(0);
    });

    it('skips a BOM, the xml prolog, a doctype, and header comments', () => {
        const svg = [
            '﻿<?xml version="1.0" encoding="UTF-8"?>',
            '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
            '<!-- a header comment -->',
            '<svg/>',
        ].join('\n');
        expect(svg.slice(getRootElementOffset(svg))).toBe('<svg/>');
    });

    it('doesn’t end a doctype at a ">" inside a quoted literal', () => {
        const svg = '<!DOCTYPE svg SYSTEM "weird>name.dtd"><svg/>';
        expect(svg.slice(getRootElementOffset(svg))).toBe('<svg/>');
    });

    it('doesn’t end a doctype at a ">" inside its internal subset', () => {
        const svg =
            '<!DOCTYPE svg [ <!ENTITY ns_a "http://a.example"> <!ENTITY gt-ish "a > b"> ]><svg/>';
        expect(svg.slice(getRootElementOffset(svg))).toBe('<svg/>');
    });

    it('doesn’t end an internal subset at a "]" inside a comment', () => {
        const svg = "<!DOCTYPE svg [ <!-- don't strip ] --> ]><svg/>";
        expect(svg.slice(getRootElementOffset(svg))).toBe('<svg/>');
    });

    it('is -1 when there’s no root element to find', () => {
        // parseSVG reports each of these with a position; nothing here needs
        // to duplicate that, so the caller just leaves the source alone
        expect(getRootElementOffset('')).toBe(-1);
        expect(getRootElementOffset('   \n ')).toBe(-1);
        expect(getRootElementOffset('text before the root<svg/>')).toBe(-1);
        expect(getRootElementOffset('<?xml version="1.0"<svg/>')).toBe(-1);
        expect(getRootElementOffset('<!-- unterminated <svg/>')).toBe(-1);
        expect(getRootElementOffset('<!DOCTYPE svg [ ]<svg/>')).toBe(-1);
    });
});
