import {
    CSSValueType,
    getCSSValueAsNumber,
    getCSSValueWithUnit,
    getUnitFromCSSValue,
    roundToPrecision,
} from '@acusti/css-values';
import classnames from 'classnames';
import * as React from 'react';

export type Props = {
    className?: string;
    cssValueType?: CSSValueType;
    disabled?: boolean;
    icon?: React.ReactNode;
    label: string | null;
    max?: number;
    min?: number;
    onSubmitValue: (value: string) => unknown;
    placeholder?: string;
    step?: number;
    title?: string;
    unit: string;
    value?: string;
};

const { useCallback, useEffect, useRef, useState } = React;

const DEFAULT_CSS_VALUE_TYPE: CSSValueType = 'length';
const ROOT_CLASS_NAME = 'cssvalueinput';

const CSSValueInput: React.FC<Props> = ({
    className,
    cssValueType = DEFAULT_CSS_VALUE_TYPE,
    disabled,
    icon,
    label,
    max,
    min,
    onSubmitValue,
    placeholder,
    step = 1,
    title,
    unit,
    value,
}) => {
    const defaultValue = placeholder || `0${unit}`;
    const [inputValue, setInputValue] = useState<string>(value || placeholder || '');
    const inputRef = useRef<HTMLInputElement | null>(null);

    // If props.value changes, override value from it
    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

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
        setInputValue(event.currentTarget.value);
    }, []);

    const handleSubmit = useCallback(
        (valueToSubmit) => {
            const valueWithUnit = getValueWithUnit(valueToSubmit);
            setInputValue(valueWithUnit);
            if (onSubmitValue) onSubmitValue(valueWithUnit);
        },
        [getValueWithUnit, onSubmitValue],
    );

    const handleBlur = useCallback(() => {
        handleSubmit(inputValue);
    }, [inputValue]);

    const handleFocus = useCallback(() => {
        const inputElement = inputRef.current;
        if (!inputElement) return;
        // Select contents of input in around 4(ish) frames to allow re-renders
        setTimeout(() => {
            inputElement.select();
        }, 66);
    }, []);

    const getNextValue = useCallback(
        ({
            currentValue,
            multiplier = 1,
            signum = 1,
        }: {
            currentValue: string | number;
            multiplier?: number;
            signum?: number;
        }) => {
            const modifier = multiplier * step * signum;
            let nextValue = roundToPrecision(
                getCSSValueAsNumber(currentValue) + modifier,
                5,
            );
            if (typeof max === 'number') {
                nextValue = Math.min(max, nextValue);
            }
            if (typeof min === 'number') {
                nextValue = Math.max(min, nextValue);
            }

            const nextUnit = getUnitFromCSSValue({
                cssValueType,
                defaultUnit: unit,
                value: currentValue,
            });
            return `${nextValue}${nextUnit}`;
        },
        [cssValueType, max, min, step, unit],
    );

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter' || event.key === 'Escape') {
                if (inputRef.current) inputRef.current.blur();
                return;
            }

            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

            event.preventDefault();

            const nextValue = getNextValue({
                currentValue: event.currentTarget.value || placeholder || defaultValue,
                multiplier: event.shiftKey ? 10 : 1,
                signum: event.key === 'ArrowUp' ? 1 : -1,
            });

            if (event.repeat) {
                setInputValue(nextValue);
                return;
            }

            handleSubmit(nextValue);
        },
        [getNextValue, handleSubmit, placeholder],
    );

    return (
        <label className={classnames(ROOT_CLASS_NAME, className)} title={title}>
            {icon && <div className={`${ROOT_CLASS_NAME}-icon`}>{icon}</div>}
            {label && (
                <div className={`${ROOT_CLASS_NAME}-label`}>
                    <p className={`${ROOT_CLASS_NAME}-label-text`}>{label}</p>
                </div>
            )}
            <div className={`${ROOT_CLASS_NAME}-value`}>
                <input
                    disabled={disabled}
                    onBlur={handleBlur}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                />
            </div>
        </label>
    );
};

export default CSSValueInput;
