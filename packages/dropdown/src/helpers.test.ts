import { describe, expect, it } from 'vitest';

import { isPointInTriangle, type Point } from './helpers.js';

describe('isPointInTriangle', () => {
    // A right triangle: apex on the left, near edge (base) vertical on the right,
    // like a submenu opening to the inline-end of its parent item
    const apex: Point = { x: 0, y: 5 };
    const nearTop: Point = { x: 10, y: 0 };
    const nearBottom: Point = { x: 10, y: 10 };

    it('includes points inside the triangle', () => {
        expect(isPointInTriangle({ x: 5, y: 5 }, apex, nearTop, nearBottom)).toBe(true);
        expect(isPointInTriangle({ x: 8, y: 5 }, apex, nearTop, nearBottom)).toBe(true);
    });

    it('includes the vertices and edges', () => {
        expect(isPointInTriangle(apex, apex, nearTop, nearBottom)).toBe(true);
        expect(isPointInTriangle(nearTop, apex, nearTop, nearBottom)).toBe(true);
        // Midpoint of the near (base) edge
        expect(isPointInTriangle({ x: 10, y: 5 }, apex, nearTop, nearBottom)).toBe(true);
    });

    it('excludes points outside the triangle', () => {
        // Beyond the near edge (past the submenu edge)
        expect(isPointInTriangle({ x: 12, y: 5 }, apex, nearTop, nearBottom)).toBe(false);
        // Straight up from the apex — a sibling above the parent, not toward the
        // submenu
        expect(isPointInTriangle({ x: 0, y: 0 }, apex, nearTop, nearBottom)).toBe(false);
        // Straight down from the apex — a sibling below the parent
        expect(isPointInTriangle({ x: 3, y: 9 }, apex, nearTop, nearBottom)).toBe(false);
        // Behind the apex
        expect(isPointInTriangle({ x: -5, y: 5 }, apex, nearTop, nearBottom)).toBe(false);
    });

    it('is orientation-independent (works for a mirror triangle opening left)', () => {
        const rightApex: Point = { x: 10, y: 5 };
        const leftTop: Point = { x: 0, y: 0 };
        const leftBottom: Point = { x: 0, y: 10 };
        expect(isPointInTriangle({ x: 5, y: 5 }, rightApex, leftTop, leftBottom)).toBe(
            true,
        );
        expect(isPointInTriangle({ x: -2, y: 5 }, rightApex, leftTop, leftBottom)).toBe(
            false,
        );
    });
});
