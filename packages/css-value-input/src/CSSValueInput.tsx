import {
    CSSValueType,
    DEFAULT_CSS_VALUE_TYPE,
    DEFAULT_UNIT_BY_CSS_VALUE_TYPE,
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
    label?: string;
    max?: number;
    min?: number;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => unknown;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => unknown;
    onKeyUp?: (event: React.KeyboardEvent<HTMLInputElement>) => unknown;
    onSubmitValue: (value: string) => unknown;
    placeholder?: string;
    step?: number;
    title?: string;
    unit?: string;
    /** Regex or validator function to validate non-numeric values */
    validator?: RegExp | ((value: string) => boolean);
    value?: string;
};

const { useCallback, useEffect, useRef } = React;

const ROOT_CLASS_NAME = 'cssvalueinput';

const CSSValueInput: React.FC<Props> = ({
    className,
    cssValueType = DEFAULT_CSS_VALUE_TYPE,
    disabled,
    icon,
    label,
    max,
    min,
    onChange,
    onKeyDown,
    onKeyUp,
    onSubmitValue,
    placeholder,
    step = 1,
    title,
    unit = DEFAULT_UNIT_BY_CSS_VALUE_TYPE[cssValueType],
    validator,
    value,
}) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const submittedValueRef = useRef<string>(value || '');

    // If props.value changes, override input value from it
    useEffect(() => {
        const updatedValue = value || '';
        submittedValueRef.current = updatedValue;
        if (inputRef.current) {
            inputRef.current.value = updatedValue;
        }
    }, [value]);

    const handleSubmitValue = useCallback(() => {
        if (!inputRef.current) return;
        // If value hasn’t changed, do not trigger onSubmitValue
        const currentValue = inputRef.current.value;
        if (currentValue === submittedValueRef.current) return;

        let isValid = Number.isFinite(getCSSValueAsNumber(currentValue));
        if (!isValid && validator) {
            isValid =
                validator instanceof RegExp
                    ? validator.test(currentValue)
                    : validator(currentValue);
        }
        // If current value isn’t valid, revert to last submitted value
        if (!isValid) {
            inputRef.current.value = submittedValueRef.current;
            return;
        }

        submittedValueRef.current = currentValue;
        onSubmitValue(currentValue);
    }, [onSubmitValue, validator]);

    const isInitialSelectionRef = useRef<boolean>(true);

    const handleBlur = useCallback(() => {
        // When input loses focus, reset isInitialSelection to true for next onSelect event
        isInitialSelectionRef.current = true;
        if (!inputRef.current) return;

        inputRef.current.value = getCSSValueWithUnit({
            cssValueType,
            defaultUnit: unit,
            value: inputRef.current.value,
        });

        handleSubmitValue();
    }, [cssValueType, handleSubmitValue, unit]);

    // NOTE Selecting the contents of the input onFocus makes for the best UX,
    // but it doesn’t work in Safari, so we use the initial onSelect event instead
    const handleSelect = useCallback(() => {
        // Do nothing if this isn’t the initial select-on-focus event
        if (!isInitialSelectionRef.current) return;
        // This is the initial select-on-focus event, so reset isInitialSelection to false
        isInitialSelectionRef.current = false;
        const input = inputRef.current;
        // Do nothing if input has no value
        if (!input || !input.value) return;
        // Do nothing if input is no longer the document’s activeElement
        if (input.ownerDocument.activeElement !== input) return;
        // Do nothing if input’s contents are already selected
        const valueLength = input.value.length;
        if (input.selectionStart === 0 && input.selectionEnd === valueLength) return;

        input.selectionStart = 0;
        input.selectionEnd = valueLength;
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
            if (onKeyDown) onKeyDown(event);

            const input = event.currentTarget;

            if (event.key === 'Escape') {
                input.value = submittedValueRef.current;
            }

            if (event.key === 'Escape' || event.key === 'Enter') {
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
                handleSubmitValue();
            }
        },
        [getNextValue, handleSubmitValue, placeholder, unit],
    );

    return (
        <label
            className={classnames(ROOT_CLASS_NAME, className, { disabled })}
            title={title}
        >
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
                    onChange={onChange}
                    onKeyDown={handleKeyDown}
                    onKeyUp={onKeyUp}
                    onSelect={handleSelect}
                    placeholder={placeholder}
                    ref={inputRef}
                    type="text"
                />
            </div>
        </label>
    );
};

export default CSSValueInput;
