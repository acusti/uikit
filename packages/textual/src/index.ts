const WORDS_REGEX = /\b([a-zA-Z0-9])([^\s.-]*)([\s.-]*)/g;

// Returns text with equivalent formatting to text-transform: capitalize
export const capitalize = (text: string) =>
    text.replace(WORDS_REGEX, (match, firstLetter, restOfWord, separator) => {
        if (!firstLetter) return match;
        return firstLetter.toUpperCase() + restOfWord + separator;
    });

export const getInitials = (name: string, maxLength: number = 3) =>
    name.replace(WORDS_REGEX, '$1').trim().substring(0, maxLength).toUpperCase();

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
