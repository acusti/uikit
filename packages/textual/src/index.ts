// Started from https://stackoverflow.com/a/26900132 but replaced ÿ → ž
// based on https://symbl.cc/en/unicode-table/
const WORDS_REGEX = /([0-9A-Za-zÀ-ÖØ-öø-ž])([^\s.-]*)([\s.-]*)/g;
const SINGLE_WORD_NON_INITIALS_REGEX = /(^[^0-9A-Za-zÀ-ÖØ-öø-ž]+|[^A-Z0-9]+)/g;

// Returns text with equivalent formatting to text-transform: capitalize
export const capitalize = (text: string) =>
    text.replace(
        WORDS_REGEX,
        (match: string, firstLetter: string, restOfWord: string, separator: string) => {
            if (!firstLetter) return match;
            return firstLetter.toLocaleUpperCase() + restOfWord + separator;
        },
    );

export const getInitials = (name: string, maxLength = 3) => {
    name = name.trim();
    if (!name) return '';

    let initials = '';
    // for single word names, use uppercase letters and numbers
    if (!name.includes(' ')) {
        initials = name.replace(SINGLE_WORD_NON_INITIALS_REGEX, '');
        // if initials are only numbers, include 1st letter (if present)
        if (!/[A-Za-zÀ-ÖØ-öø-ž]/.test(initials)) {
            initials += name.replace(/[^A-Za-zÀ-ÖØ-öø-ž]+/, '')[0];
        }
        return initials.substring(0, maxLength).toLocaleUpperCase();
    }

    const matches = name.matchAll(WORDS_REGEX);
    for (const match of matches) {
        initials += match[1].toLocaleUpperCase();
        if (initials.length >= maxLength) break;
    }
    return initials;
};

const EMAIL_SEPARATOR_REGEX = /[+.]/g;

// Gets a formatted name from an email address
export const getNameFromEmail = (email: string) =>
    email
        .split('@')[0]
        .toLocaleLowerCase()
        .replace(EMAIL_SEPARATOR_REGEX, ' ')
        .split(' ')
        .reduce((acc, namePart) => {
            const trimmedNamePart = namePart.trim();
            if (!trimmedNamePart) return acc;
            const separator = acc ? ' ' : '';
            return acc + separator + capitalize(trimmedNamePart);
        }, '');
