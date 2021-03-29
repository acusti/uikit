// @flow
import classnames from 'classnames';
import * as React from "react";
import {
    CSSValueType,
    getCSSValueAsNumber,
    getCSSValueWithUnit,
    getUnitForCSSValue,
} from '@acusti/css-values';

type Props = {
    className?: string;
    cssValueType: CSSValueType;
    disabled?: boolean;
    label: string;
    onSubmit: (value: string) => unknown;
    placeholder?: string;
    unit: string;
    value?: string;
};

const { useCallback, useEffect, useState } = React;

const CSSValueInput = ({
    className,
    cssValueType,
    disabled,
    label,
    onSubmit,
    placeholder,
    unit,
    value: valueFromProps = placeholder || '',
}: Props) => {
    const [value, setValue] = useState<string>(valueFromProps);

    // If props.value changes, override value from it
    useEffect(() => {
        setValue(valueFromProps);
    }, [valueFromProps]);

    const getValueWithUnit = useCallback(
        (rawValue = value) =>
            getCSSValueWithUnit({
                cssValueType,
                defaultUnit: unit,
                value: rawValue,
            }),
        [cssValueType, value, unit],
    );

    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.currentTarget.value);
    }, []);

    const handleSubmit = useCallback(() => {
        const valueWithUnit = getValueWithUnit();
        setValue(valueWithUnit);
        if (onSubmit) onSubmit(valueWithUnit);
    }, [getValueWithUnit, onSubmit]);

    const handleKeyDown = useCallback(
        ({
            currentTarget,
            key,
            repeat,
            shiftKey,
        }: React.KeyboardEvent<HTMLInputElement>) => {
            if (key === 'Enter' || key === 'Escape') {
                handleSubmit();
                return;
            }

            if (key !== 'ArrowUp' && key !== 'ArrowDown') return;

            const currentValue = currentTarget.value;
            const currentUnit = getUnitForCSSValue({
                cssValueType,
                defaultUnit: unit,
                value: currentValue,
            });
            const valueAsNumber = getCSSValueAsNumber(currentValue);
            const modifier = key === 'ArrowUp' ? -1 : 1;
            const multiplier = shiftKey ? 10 : 1;
            setValue(`${valueAsNumber + (modifier * multiplier)}${currentUnit}`);
            if (repeat) return;

            handleSubmit();
        },
        [cssValueType, handleSubmit, unit],
    );

    return (
        <div className={classnames('css-value-input', className)}>
            <div className="css-value-input-label">
                <p className="css-value-input-label-text">{label}</p>
            </div>
            <div className="css-value-input-value">
                <input
                    disabled={disabled}
                    onBlur={handleSubmit}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    type="text"
                    value={value}
                />
            </div>
        </div>
    );
};

const DEFAULT_CSS_VALUE_TYPE: CSSValueType = 'length';

CSSValueInput.defaultProps = {
    cssValueType: DEFAULT_CSS_VALUE_TYPE,
};

export default CSSValueInput;
