const CSS_UNIT_REGEX = Object.freeze({
    // https://developer.mozilla.org/en-US/docs/Web/CSS/angle
    angle: /(deg|grad|rad|turn)\s*$/i,
    // https://developer.mozilla.org/en-US/docs/Web/CSS/length with addition of %
    length: /(em|rem|ch|ex|vh|vw|vmin|vmax|px|cm|mm|in|pc|pt|%)\s*$/i,
    // https://developer.mozilla.org/en-US/docs/Web/CSS/time
    time: /(s|ms)\s*$/i,
    percent: /%\s*$/,
});

// CSS value types https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Values_and_Units#Dimensions
export type CSSValueType = 'angle' | 'time' | 'length' | 'percent';

export type Payload = {
    cssValueType: CSSValueType;
    defaultUnit: string;
    value: string | number;
};

export const getUnitForCSSValue = ({ cssValueType, defaultUnit, value }: Payload) => {
    // If value is a number, return the defaultUnit
    if (typeof value === 'number') return defaultUnit;

    const matchedUnit = CSS_UNIT_REGEX[cssValueType].exec(value);
    return matchedUnit === null ? defaultUnit : matchedUnit[0];
};

export const getCSSValueAsNumber = (value: string | number): number =>
    typeof value === 'number' ? value : parseFloat(value.trim());

export const getCSSValueWithUnit = (payload: Payload): string => {
    const valueAsNumber = getCSSValueAsNumber(payload.value);
    // If value is not a number, don’t try to add a unit
    if (Number.isNaN(valueAsNumber)) return payload.value.toString();

    return `${valueAsNumber}${getUnitForCSSValue(payload)}`;
};
