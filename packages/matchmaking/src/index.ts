const FIRST_NUMBER = 48; // '0'.charCodeAt(0);
const LAST_NUMBER = 57; // '9'.charCodeAt(0);
const FIRST_LETTER = 65; // 'A'.charCodeAt(0);

// Consider every distance greater than or equal to 15 to be functionally equivalent
const MAX_DISTANCE = 15;
const MAX_INEXACT_SCORE = 0.99999;
const MIN_CLOSE_SCORE = 0.9999; // an inexact match whose distance is outweighed by its exact matches
// An item that contains the text scores above MAX_INEXACT_SCORE, up to this
const MAX_PARTIAL_EXACT_SCORE = 0.999999;
const MIN_MATCH_SCORE = 0.81; // cut-off for match vs mismatch
// A number with an optional sign and unit, e.g. '12', '-1.5' or '12px' (once uppercased)
const NUMBER_TEXT = /^-?\d+(?:\.\d+)?[A-Z%]*$/;
// The number a string starts with, with an optional sign, e.g. '-1.5' in '-1.5REM'
const LEADING_NUMBER = /^-?\d[\d.]*/;
// A comma between thousands, as in '1,000'
const THOUSANDS_SEPARATOR = /,(?=\d{3})/g;
// The most an item scores for its number in a unit other than the typed one, just
// below MAX_INEXACT_SCORE so that the typed unit breaks a tie
const OTHER_UNIT_SCORE = 0.9999;
// A letter (with any combining mark) or digit, which continues a word rather than starting one
const WORD_CHARACTER = /[\p{L}\p{M}\p{N}]/u;

/**
 * Scores how well the item `strA` matches the search text `strB`, from 0
 * (no match) to 1 (exact match, ignoring case and surrounding whitespace).
 */
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

    // Look for a match at the start of a word (-1 if there is none), counting a
    // minus sign that starts the item as part of the number after it
    let matchStart = strA.indexOf(strB);
    let wordStart = matchStart;
    while (
        wordStart > 0 &&
        (WORD_CHARACTER.test(strA[wordStart - 1]) || (wordStart === 1 && strA[0] === '-'))
    ) {
        wordStart = strA.indexOf(strB, wordStart + 1);
    }

    // If the text is a number (e.g. '12', '-5' or '12px') that doesn’t start a word
    // in the item, an item that starts with a number scores by how near its number is
    const isNumberText = NUMBER_TEXT.test(strB);
    if (isNumberText && LEADING_NUMBER.test(strA) && wordStart < 0) {
        const textNumber = parseFloat(strB);
        const itemText = strA.replace(THOUSANDS_SEPARATOR, '');
        const difference = Math.abs(parseFloat(itemText) - textNumber);
        const isTypedUnit = itemText
            .replace(LEADING_NUMBER, '')
            .startsWith(strB.replace(LEADING_NUMBER, ''));
        // From the top score for the same number toward 0 the further away it is
        const scale = Math.abs(textNumber) || 1;
        const topScore = isTypedUnit ? MAX_INEXACT_SCORE : OTHER_UNIT_SCORE;
        return (topScore * scale) / (scale + difference);
    }

    // An item that contains the text is the next best match to an exact match,
    // above every other match, with a penalty for how far into the item it starts
    if (matchStart > -1) {
        // A match at the start of a word scores in the upper half of the range
        // and one inside a word in the lower half, each lower the later it starts
        const halfRange = (MAX_PARTIAL_EXACT_SCORE - MAX_INEXACT_SCORE) / 2;
        const position =
            wordStart > -1 ? wordStart / strALength : 1 + matchStart / strALength;
        return MAX_PARTIAL_EXACT_SCORE - halfRange * position;
    }

    // A number matches any other item at a hundredth of its score, so neither its
    // unit ('px' in '6px') nor a keyword ('auto') outranks a value of a similar
    // size, while such items still rank among themselves ('0hio' finds 'Ohio')
    const weight = isNumberText ? 0.01 : 1;

    // Text that contains the item (e.g. the item and a stray keystroke) scores up
    // to the best inexact score, with a penalty for how far into the text it starts
    matchStart = strB.indexOf(strA);
    if (matchStart > -1) {
        const penalty = (0.15 * matchStart) / strBLength;
        return weight * Math.min(MAX_PARTIAL_EXACT_SCORE - penalty, MAX_INEXACT_SCORE);
    }

    // To proportionally weight consecutive exact matches, increase bonus relative to total length
    const bonusMultiplier = Math.min(0.4, 3 / shortestLength);
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

    // If score came to 0 or less, the exact matches outweigh the distance, so
    // score it from MIN_CLOSE_SCORE up toward MAX_INEXACT_SCORE the further
    // below 0 it came (e.g. the longer the exact match from the start)
    if (score <= 0) {
        return (
            weight *
            (MAX_INEXACT_SCORE - (MAX_INEXACT_SCORE - MIN_CLOSE_SCORE) / (1 - score))
        );
    }
    // Invert score and normalize into a range based on worst possible score
    score = (worstPossibleScore - score) / worstPossibleScore;
    // Keep it below every inexact match whose score came to 0 or less
    return weight * Math.min(MIN_CLOSE_SCORE, score);
};

type Payload = {
    excludeMismatches?: boolean;
    items: Array<string>;
    text: string;
};

export const sortByBestMatch = ({ excludeMismatches, items, text }: Payload) => {
    text = text.trim().toUpperCase();
    if (!text || !items.length) return items;

    const initialValues: [Array<string>, Array<number>] = [[], []];
    const [sortedItems] = items.reduce(([sorted, scores], item) => {
        const itemScore = getMatchScore(item.trim().toUpperCase(), text, true);
        if (excludeMismatches && itemScore < MIN_MATCH_SCORE) {
            return [sorted, scores];
        }

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
