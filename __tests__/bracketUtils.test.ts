import { computeTop, validateBracket } from '../src/bracketUtils';

const BASE_SPACING = 112; // default itemHeight(100) + gap(12)
const ITEM_HEIGHT = 100;
const NO_OFFSET = 0;

function makeLeagueData(roundSizes: number[]): unknown[][] {
    return roundSizes.map((size) => Array(size).fill({}));
}

// ─── computeTop ──────────────────────────────────────────────────────────────

describe('computeTop — 4-team bracket [2, 1]', () => {
    const data = makeLeagueData([2, 1]);

    it('column 0 positions items linearly', () => {
        expect(computeTop(0, 0, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT)).toBe(0);
        expect(computeTop(0, 1, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT)).toBe(112);
    });

    it('column 1 (final) is centered between its two feeders', () => {
        // top0=0, top1=112 → midCenter=(0+112+100)/2=106 → 106−50=56
        expect(computeTop(1, 0, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT)).toBe(56);
    });
});

describe('computeTop — 8-team bracket [4, 2, 1]', () => {
    const data = makeLeagueData([4, 2, 1]);

    it('column 0 positions items linearly', () => {
        expect(computeTop(0, 0, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT)).toBe(0);
        expect(computeTop(0, 1, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT)).toBe(112);
        expect(computeTop(0, 2, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT)).toBe(224);
        expect(computeTop(0, 3, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT)).toBe(336);
    });

    it('column 1 items are centered between their feeder pairs', () => {
        // pow=2, centerUnit=0.5 → item0=(0·2+0.5)·112=56, item1=(1·2+0.5)·112=280
        expect(computeTop(1, 0, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT)).toBe(56);
        expect(computeTop(1, 1, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT)).toBe(280);
    });

    it('column 2 (final) is centered between its two feeders', () => {
        // top0=56, top1=280 → midCenter=(56+280+100)/2=218 → 218−50=168
        expect(computeTop(2, 0, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT)).toBe(168);
    });
});

describe('computeTop — 16-team bracket [8, 4, 2, 1]', () => {
    const data = makeLeagueData([8, 4, 2, 1]);

    it('column 0 positions all 8 items linearly', () => {
        for (let i = 0; i < 8; i++) {
            expect(computeTop(0, i, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT)).toBe(i * BASE_SPACING);
        }
    });

    it('column 1 items sit between their feeder pairs', () => {
        // pow=2, centerUnit=0.5
        expect(computeTop(1, 0, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT)).toBe(56);
        expect(computeTop(1, 1, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT)).toBe(280);
        expect(computeTop(1, 2, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT)).toBe(504);
        expect(computeTop(1, 3, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT)).toBe(728);
    });

    it('column 2 items are positioned correctly', () => {
        // pow=4, centerUnit=1.5 → item0=(0·4+1.5)·112=168, item1=(1·4+1.5)·112=616
        expect(computeTop(2, 0, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT)).toBe(168);
        expect(computeTop(2, 1, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT)).toBe(616);
    });

    it('column 3 (final) is vertically centred within content bounds', () => {
        const result = computeTop(3, 0, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT);
        const totalHeight = 8 * BASE_SPACING;
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result + ITEM_HEIGHT).toBeLessThanOrEqual(totalHeight);
    });
});

describe('computeTop — 32-team bracket [16, 8, 4, 2, 1]', () => {
    const data = makeLeagueData([16, 8, 4, 2, 1]);

    it('column 0 positions all 16 items linearly', () => {
        for (let i = 0; i < 16; i++) {
            expect(computeTop(0, i, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT)).toBe(i * BASE_SPACING);
        }
    });

    it('final round item is within content bounds', () => {
        const result = computeTop(4, 0, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT);
        const totalHeight = 16 * BASE_SPACING;
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result + ITEM_HEIGHT).toBeLessThanOrEqual(totalHeight);
    });

    it('each successive column top is between its two feeder items', () => {
        // Col 1 item 0 must sit between col 0 items 0 and 1
        const col0_0 = computeTop(0, 0, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT);
        const col0_1 = computeTop(0, 1, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT);
        const col1_0 = computeTop(1, 0, data, NO_OFFSET, BASE_SPACING, ITEM_HEIGHT);
        expect(col1_0).toBeGreaterThan(col0_0);
        expect(col1_0).toBeLessThan(col0_1 + ITEM_HEIGHT);
    });
});

describe('computeTop — empty data', () => {
    it('falls back to linear positioning', () => {
        expect(computeTop(0, 3, [], NO_OFFSET, BASE_SPACING, ITEM_HEIGHT)).toBe(3 * BASE_SPACING);
    });
});

// ─── validateBracket ─────────────────────────────────────────────────────────

describe('validateBracket', () => {
    it('returns null for a valid 4-team bracket', () => {
        expect(validateBracket(makeLeagueData([2, 1]))).toBeNull();
    });

    it('returns null for a valid 8-team bracket', () => {
        expect(validateBracket(makeLeagueData([4, 2, 1]))).toBeNull();
    });

    it('returns null for a valid 16-team bracket', () => {
        expect(validateBracket(makeLeagueData([8, 4, 2, 1]))).toBeNull();
    });

    it('returns null for a valid 32-team bracket', () => {
        expect(validateBracket(makeLeagueData([16, 8, 4, 2, 1]))).toBeNull();
    });

    it('returns null for a single-round bracket', () => {
        expect(validateBracket(makeLeagueData([4]))).toBeNull();
    });

    it('returns an error message when a round has the wrong match count', () => {
        // 8→3 is wrong (should be 4)
        const result = validateBracket(makeLeagueData([8, 3, 1]));
        expect(result).not.toBeNull();
        expect(result).toContain('Round 1');
    });

    it('returns null for empty data', () => {
        expect(validateBracket([])).toBeNull();
    });
});
