const OFFSET_COMPRESSION_THRESHOLD = 1.8;

/**
 * Pure function — computes the absolute top position of a match card.
 * Extracted from the component so it can be unit-tested independently.
 */
export function computeTop(
    colIndex: number,
    itemIndex: number,
    leagueData: unknown[][],
    offset: number,
    baseSpacing: number,
    itemHeight: number
): number {
    if (!leagueData.length) return itemIndex * baseSpacing;
    if (colIndex === 0) return itemIndex * baseSpacing;

    const column = leagueData[colIndex] ?? [];

    if (column.length === 1) {
        const prevColIndex = colIndex - 1;
        const prevColumn = leagueData[prevColIndex] ?? [];

        if (prevColumn.length >= 2) {
            const top0 = computeTop(prevColIndex, 0, leagueData, offset, baseSpacing, itemHeight);
            const top1 = computeTop(prevColIndex, 1, leagueData, offset, baseSpacing, itemHeight);
            return (top0 + top1 + itemHeight) / 2 - itemHeight / 2;
        }

        if (prevColumn.length === 1) {
            return computeTop(prevColIndex, 0, leagueData, offset, baseSpacing, itemHeight);
        }

        const firstColumnCount = leagueData[0]?.length || 1;
        return (firstColumnCount * baseSpacing) / 2 - itemHeight / 2;
    }

    const pow = Math.pow(2, colIndex);
    const centerUnit = (pow - 1) / 2;

    if (offset > OFFSET_COMPRESSION_THRESHOLD) {
        return ((itemIndex * pow + centerUnit) * baseSpacing * 2) / offset;
    }
    return (itemIndex * pow + centerUnit) * baseSpacing;
}

/**
 * Validates that each round has roughly half the matches of the previous one.
 * Returns a warning string if invalid, null if OK.
 */
export function validateBracket(leagueData: unknown[][]): string | null {
    for (let i = 0; i < leagueData.length - 1; i++) {
        const current = leagueData[i].length;
        const next = leagueData[i + 1].length;
        const expectedCeil = Math.ceil(current / 2);
        const expectedFloor = Math.floor(current / 2);
        if (next !== expectedCeil && next !== expectedFloor) {
            return `Round ${i + 1} has ${current} matches but round ${i + 2} has ${next} (expected ${expectedCeil}). Bracket sizes must follow powers of 2.`;
        }
    }
    return null;
}
