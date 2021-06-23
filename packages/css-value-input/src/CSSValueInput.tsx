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

const { useCallback, useEffect, useRef } = React;

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
    const inputRef = useRef<HTMLInputElement | null>(null);

    // If props.value changes, override value from it
    useEffect(() => {
        if (!inputRef.current) return;
        inputRef.current.value = value || '';
    }, [value]);

    const handleBlur = useCallback(() => {
        if (!inputRef.current) return;

        inputRef.current.value = getCSSValueWithUnit({
            cssValueType,
            defaultUnit: unit,
            value: inputRef.current.value,
        });

        onSubmitValue(inputRef.current.value);
    }, [cssValueType, onSubmitValue, unit]);

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
            if (typeof max === 'number' && Number.isFinite(max)) {
                nextValue = Math.min(max, nextValue);
            }
            if (typeof min === 'number' && Number.isFinite(min)) {
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
            const input = event.currentTarget;
            if (event.key === 'Enter' || event.key === 'Escape') {
                input.blur();
                return;
            }

            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

            event.preventDefault();

            const nextValue = getNextValue({
                currentValue: event.currentTarget.value || placeholder || `0${unit}`,
                multiplier: event.shiftKey ? 10 : 1,
                signum: event.key === 'ArrowUp' ? 1 : -1,
            });

            input.value = nextValue;

            if (!event.repeat) {
                onSubmitValue(nextValue);
            }
        },
        [getNextValue, onSubmitValue, placeholder, unit],
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
                    defaultValue={value || placeholder || ''}
                    disabled={disabled}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    ref={inputRef}
                    type="text"
                />
            </div>
        </label>
    );
};

export default CSSValueInput;
