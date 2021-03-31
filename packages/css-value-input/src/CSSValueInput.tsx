import classnames from 'classnames';
import * as React from 'react';
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

const { useCallback, useEffect, useRef, useState } = React;

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
    const inputRef = useRef<HTMLInputElement | null>(null);

    // If props.value changes, override value from it
    useEffect(() => {
        setValue(valueFromProps);
    }, [valueFromProps]);

    const getValueWithUnit = useCallback(
        (rawValue) =>
            getCSSValueWithUnit({
                cssValueType,
                defaultUnit: unit,
                value: rawValue,
            }),
        [cssValueType, unit],
    );

    const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.currentTarget.value);
    }, []);

    const handleSubmit = useCallback(
        (valueToSubmit) => {
            const valueWithUnit = getValueWithUnit(valueToSubmit);
            setValue(valueWithUnit);
            if (onSubmit) onSubmit(valueWithUnit);
        },
        [getValueWithUnit, onSubmit],
    );

    const handleBlur = useCallback(() => {
        handleSubmit(value);
    }, [value]);

    const handleFocus = useCallback(() => {
        const inputElement = inputRef.current;
        if (!inputElement) return;
        inputElement.select();
    }, []);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter' || event.key === 'Escape') {
                if (inputRef.current) inputRef.current.blur();
                return;
            }

            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

            event.preventDefault();
            const currentValue = event.currentTarget.value;
            const currentUnit = getUnitForCSSValue({
                cssValueType,
                defaultUnit: unit,
                value: currentValue,
            });
            const valueAsNumber = getCSSValueAsNumber(currentValue);
            const signum = event.key === 'ArrowUp' ? 1 : -1;
            const modifier = signum * (event.shiftKey ? 10 : 1);
            const nextValue = `${valueAsNumber + modifier}${currentUnit}`;
            if (event.repeat) {
                setValue(nextValue);
                return;
            }

            handleSubmit(nextValue);
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
                    onBlur={handleBlur}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    ref={inputRef}
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
