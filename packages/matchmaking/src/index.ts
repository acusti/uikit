const FIRST_NUMBER = '0'.charCodeAt(0);
const LAST_NUMBER = '9'.charCodeAt(0);
const FIRST_LETTER = 'A'.charCodeAt(0);

// Consider every distance greater than or equal to 15 to be functionally equivalent
const MAX_DISTANCE = 15;
const MAX_INEXACT_SCORE = 0.99999;
const MAX_PARTIAL_EXACT_SCORE = 0.999999;

export const getMatchScore = (strA: string, strB: string, isSanitized?: boolean) => {
    if (!isSanitized) {
        strA = strA.trim().toUpperCase();
        strB = strB.trim().toUpperCase();
    }
    // Exact match scores 1
    if (strA === strB) return 1;

    const strALength = strA.length;
    const strBLength = strB.length;
    const shortestLength = Math.min(strALength, strBLength);

    // If one of the texts is empty, they cannot match
    if (!shortestLength) return 0;

    // Exact partial match is the next best score to an exact match with
    // relative length from the beginning applying a penalty to total score
    const [strLonger, strShorter] = strALength > strBLength ? [strA, strB] : [strB, strA];
    const matchStart = strLonger.indexOf(strShorter);
    if (matchStart > -1) {
        // Maximum penalty for distance from beginning is 0.25
        const penaltyPerStep = 0.25 / (strLonger.length - 2);
        const penalty = penaltyPerStep * matchStart;
        return MAX_PARTIAL_EXACT_SCORE - penalty;
    }

    // To proportionally weight consecutive exact matches, increase bonus relative to total length
    const bonusMultiplier = Math.min(0.25, 3 / shortestLength);
    let score = 0;
    let worstPossibleScore = 0;
    let exactMatchBonus = 0;

    for (let index = 0; index < shortestLength; index++) {
        // Build score from distance between original and comparison strings
        const strACharCode = strA.charCodeAt(index);
        const strBCharCode = strB.charCodeAt(index);
        let distance = Math.abs(strACharCode - strBCharCode);
        // If comparing a number to a letter, use minimum distance ('z' should be considered same distance from '3' as 'a')
        if (
            strACharCode >= FIRST_NUMBER &&
            strACharCode <= LAST_NUMBER &&
            strBCharCode > FIRST_LETTER
        ) {
            distance = LAST_NUMBER + 1 - strACharCode;
        }
        score += Math.min(MAX_DISTANCE, distance);
        worstPossibleScore += MAX_DISTANCE;
        if (distance === 0) {
            if (score === exactMatchBonus) {
                // Continuous exact matches from the start get extra weight
                exactMatchBonus += -10 * ((index + 1) * bonusMultiplier);
                score = exactMatchBonus;
            } else {
                // Non-continuous exact match gets the minimum bonus
                score -= 1;
            }
        }
    }

    // If score came to 0 or less, use best possible score for an inexact match
    if (score <= 0) return MAX_INEXACT_SCORE;

    score = (worstPossibleScore - score) / worstPossibleScore;
    // Don’t allow an inexact match to get a score of 1 (reserved for an exact match)
    return Math.min(MAX_INEXACT_SCORE, score);
};

type Payload = {
    items: Array<string>;
    text: string;
};

export const sortByBestMatch = ({ items, text }: Payload) => {
    text = text.trim().toUpperCase();
    if (!text || !items.length) return items;

    const initialValues: [Array<string>, Array<number>] = [[], []];
    const [sortedItems] = items.reduce(([sorted, scores], item) => {
        const itemScore = getMatchScore(item.trim().toUpperCase(), text, true);
        let index = sorted.length;
        if (itemScore > scores[0]) {
            index = 0;
        } else if (itemScore > scores[scores.length - 1]) {
            const insertIndex = scores.findIndex((score) => score < itemScore);
            if (insertIndex !== -1) {
                index = insertIndex;
            }
        }
        sorted.splice(index, 0, item);
        scores.splice(index, 0, itemScore);
        return [sorted, scores];
    }, initialValues);

    return sortedItems;
};

export const getBestMatch = (payload: Payload) => sortByBestMatch(payload)[0];
