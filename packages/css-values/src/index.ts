const CSS_UNIT_REGEX = Object.freeze({
    // https://developer.mozilla.org/en-US/docs/Web/CSS/angle
    angle: /(deg|grad|rad|turn)\s*$/i,
    // https://developer.mozilla.org/en-US/docs/Web/CSS/integer
    integer: /$/i,
    // https://developer.mozilla.org/en-US/docs/Web/CSS/length with addition of %
    length: /(em|rem|ch|ex|vh|vw|vmin|vmax|px|cm|mm|in|pc|pt|%)\s*$/i,
    // custom (non-spec-defined) value type that only allows percentages
    percent: /(%)\s*$/,
    // https://developer.mozilla.org/en-US/docs/Web/CSS/time
    time: /(s|ms)\s*$/i,
});

// CSS value types https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Values_and_Units#Dimensions
export type CSSValueType = 'angle' | 'integer' | 'length' | 'percent' | 'time';

export const DEFAULT_CSS_VALUE_TYPE: CSSValueType = 'length';

export const DEFAULT_UNIT_BY_CSS_VALUE_TYPE = Object.freeze({
    angle: 'deg',
    integer: '',
    length: 'px',
    percent: '%',
    time: 's',
});

export type Payload = {
    cssValueType: CSSValueType;
    defaultUnit?: string;
    value: string | number;
};

export const roundToPrecision = (value: number, precision: number): number =>
    parseFloat(value.toFixed(precision));

export const getUnitFromCSSValue = ({
    cssValueType,
    defaultUnit = DEFAULT_UNIT_BY_CSS_VALUE_TYPE[cssValueType],
    value,
}: Payload) => {
    // If value is a number, return the defaultUnit
    if (typeof value === 'number') return defaultUnit;

    const matchedUnit = CSS_UNIT_REGEX[cssValueType].exec(value);
    return matchedUnit === null || !matchedUnit[1] ? defaultUnit : matchedUnit[1];
};

export const getCSSValueAsNumber = (value: string | number): number =>
    typeof value === 'number' ? value : parseFloat(value);

export const getCSSValueWithUnit = (payload: Payload): string => {
    const valueAsNumber = getCSSValueAsNumber(payload.value);
    // If value is not a number, don’t try to add a unit
    if (Number.isNaN(valueAsNumber)) return payload.value.toString().trim();

    return `${valueAsNumber}${getUnitFromCSSValue(payload)}`;
};

export const getMillisecondsFromCSSValue = (value: string | number): number => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (!CSS_UNIT_REGEX.time.test(value)) return 0;

    const valueAsNumber = getCSSValueAsNumber(value);
    if (Number.isNaN(valueAsNumber)) return 0;

    const multiplier = /[^m]s/i.test(value) ? 1000 : 1;
    return valueAsNumber * multiplier;
};
