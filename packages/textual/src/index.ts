const WORDS_REGEX = /\b([a-zA-Z0-9])([^\s.-]*)([\s.-]*)/g;

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
    let initials = '';
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
