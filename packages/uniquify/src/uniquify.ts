import escapeRegExp from 'lodash.escaperegexp';

type GenericObject = Record<string, unknown>;
type Items = Array<string | null | undefined> | Array<GenericObject | null | undefined>;
type StringKeyPath = Array<string>;

const getIn = (item: unknown, path: Array<string>) => {
    let value = item;
    for (let i = 0; i < path.length && value != null; i++) {
        value = (value as GenericObject)[path[i]];
    }
    return value;
};

const propertyValueExists = ({
    caseSensitive,
    items,
    propertyPath,
    propertyPathAlternate,
    value,
}: {
    caseSensitive: boolean;
    items: Items;
    propertyPath: StringKeyPath | undefined;
    propertyPathAlternate: StringKeyPath | undefined;
    value: string;
}) => {
    value = caseSensitive ? value : value.toLowerCase();
    return items.some((item) => {
        if (item == null) return false;

        let itemPropertyValue = propertyPath ? getIn(item, propertyPath) : item;

        if (itemPropertyValue == null && propertyPathAlternate) {
            itemPropertyValue = getIn(item, propertyPathAlternate);
        }

        if (typeof itemPropertyValue !== 'string') {
            return false;
        }

        if (caseSensitive) {
            return itemPropertyValue === value;
        }

        return itemPropertyValue.toLowerCase() === value;
    });
};

// Valid counter is any number between 2-99
const counterRegexString = '(?:[1-9][0-9]|[2-9])';
const counterFromOneRegexString = '(?:[1-9][0-9]|[1-9])';

const otherInstanceExists = ({
    caseSensitive,
    items,
    propertyPath,
    propertyPathAlternate,
    separator,
    value,
    valueStem,
}: {
    caseSensitive: boolean;
    items: Items;
    propertyPath: StringKeyPath | undefined;
    propertyPathAlternate: StringKeyPath | undefined;
    separator: string;
    value: string;
    valueStem: string;
}) => {
    const existingRegexString = `^${escapeRegExp(
        valueStem,
    )}(?:${separator}${counterRegexString})?$`;
    const existingRegex = caseSensitive
        ? new RegExp(existingRegexString)
        : new RegExp(existingRegexString, 'i');

    return items.some((item) => {
        if (!item) return false;

        let itemPropertyValue = propertyPath ? getIn(item, propertyPath) : item;

        if (itemPropertyValue == null && propertyPathAlternate) {
            itemPropertyValue = getIn(item, propertyPathAlternate);
        }

        if (typeof itemPropertyValue !== 'string') {
            return false;
        }

        // Don't check exact match of existing value (looking for other counters)
        if (itemPropertyValue.toLowerCase() === value) {
            return false;
        }

        return existingRegex.test(itemPropertyValue);
    });
};

const uniquify = ({
    caseSensitive = false,
    identify1AsCounter = false,
    isSuffixOptional = false,
    items,
    propertyPath,
    propertyPathAlternate,
    separator = ' ',
    suffix = '',
    value,
}: {
    caseSensitive?: boolean;
    identify1AsCounter?: boolean;
    isSuffixOptional?: boolean;
    items: Items;
    propertyPath?: StringKeyPath;
    propertyPathAlternate?: StringKeyPath;
    separator?: string;
    suffix?: string;
    value: string;
}) => {
    const valueIdxRegexString = `${separator}${
        identify1AsCounter ? counterFromOneRegexString : counterRegexString
    }$`;
    const valueIdxRegex = caseSensitive
        ? new RegExp(valueIdxRegexString)
        : new RegExp(valueIdxRegexString, 'i');

    let suffixRegexString = '';
    let suffixRegex = null;
    if (suffix) {
        const optionalValueIdxRegexString = `(?:${valueIdxRegexString.slice(0, -1)})?$`;
        suffixRegexString = `${separator}${escapeRegExp(
            suffix,
        )}${optionalValueIdxRegexString}`;
        suffixRegex = caseSensitive
            ? new RegExp(suffixRegexString)
            : new RegExp(suffixRegexString, 'i');

        // If there is no number counter at end of value, append suffix
        if (!suffixRegex.test(value) && !valueIdxRegex.test(value)) {
            // If suffix is optional, first try the value as is
            if (
                isSuffixOptional &&
                !propertyValueExists({
                    caseSensitive,
                    items,
                    propertyPath,
                    propertyPathAlternate,
                    value,
                })
            ) {
                return value;
            }

            value += `${separator}${suffix}`;
        }
    }

    // Counter starts at 2, but will be incremented first
    let valueIdx = 1;
    while (
        propertyValueExists({
            caseSensitive,
            items,
            propertyPath,
            propertyPathAlternate,
            value,
        })
    ) {
        if (valueIdx === 1) {
            const existingValueMatch = value.match(valueIdxRegex);
            if (existingValueMatch) {
                const existingValueIdx = parseInt(
                    existingValueMatch[0].substr(separator.length),
                    10,
                );

                if (identify1AsCounter) {
                    valueIdx = existingValueIdx;
                } else {
                    // Try to determine if existing value is content or counter by
                    // Checking for other matching values with a counter or just the stem
                    const valueStem = value.replace(valueIdxRegex, '');
                    if (
                        otherInstanceExists({
                            caseSensitive,
                            items,
                            propertyPath,
                            propertyPathAlternate,
                            separator,
                            value,
                            valueStem,
                        })
                    ) {
                        valueIdx = existingValueIdx;
                    } else {
                        // If existing value seems to be content, it should be preserved
                        // Add a placeholder counter to value to ensure that is the case
                        value += `${separator}2`;
                    }
                }
            }

            // If a suffix was passed and the value doesn’t yet have it, add it here
            if (suffix && suffixRegex && !suffixRegex.test(value)) {
                value = value.replace(valueIdxRegex, `${separator}${suffix}$&`);
            }
        }

        valueIdx++;
        value = `${value.replace(valueIdxRegex, '')}${separator}${valueIdx}`;
    }
    return value;
};

export default uniquify;
