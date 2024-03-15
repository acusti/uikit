const WORDS_REGEX = /\b([a-zA-Z0-9])([^\s.-]*)([\s.-]*)/g;
const SINGLE_WORD_NON_INITIALS_REGEX = /(^[^A-Za-z0-9]+|[^A-Z0-9]+)/g;

// Returns text with equivalent formatting to text-transform: capitalize
export const capitalize = (text: string) =>
    text.replace(
        WORDS_REGEX,
        (match: string, firstLetter: string, restOfWord: string, separator: string) => {
            if (!firstLetter) return match;
            return firstLetter.toUpperCase() + restOfWord + separator;
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
        if (!/[a-zA-Z]/.test(initials)) {
            initials += name.replace(/[^A-Za-z]+/, '')[0];
        }
        return initials.substring(0, maxLength).toUpperCase();
    }

    const matches = name.matchAll(WORDS_REGEX);
    for (const match of matches) {
        initials += match[1].toUpperCase();
        if (initials.length >= maxLength) break;
    }
    return initials;
};

const EMAIL_SEPARATOR_REGEX = /[+.]/g;

// Gets a formatted name from an email address
export const getNameFromEmail = (email: string) =>
    email
        .split('@')[0]
        .toLowerCase()
        .replace(EMAIL_SEPARATOR_REGEX, ' ')
        .split(' ')
        .reduce((acc, namePart) => {
            const trimmedNamePart = namePart.trim();
            if (!trimmedNamePart) return acc;
            const separator = acc ? ' ' : '';
            return acc + separator + capitalize(trimmedNamePart);
        }, '');
