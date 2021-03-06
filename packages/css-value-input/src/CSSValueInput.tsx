import {
    CSSValueType,
    DEFAULT_CSS_VALUE_TYPE,
    DEFAULT_UNIT_BY_CSS_VALUE_TYPE,
    getCSSValueAsNumber,
    getCSSValueWithUnit,
    getUnitFromCSSValue,
    roundToPrecision,
} from '@acusti/css-values';
import InputText from '@acusti/input-text';
import classnames from 'classnames';
import * as React from 'react';

export type Props = {
    /** Boolean indicating if the user can submit an empty value (i.e. clear the value); defaults to true */
    allowEmpty?: boolean;
    className?: string;
    cssValueType?: CSSValueType;
    disabled?: boolean;
    getValueAsNumber?: (value: string | number) => number;
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
    tabIndex?: number;
    title?: string;
    unit?: string;
    /** Regex or validator function to validate non-numeric values */
    validator?: RegExp | ((value: string) => boolean);
    value?: string;
};

type InputRef = HTMLInputElement | null;

const { useCallback, useImperativeHandle, useRef } = React;

const ROOT_CLASS_NAME = 'cssvalueinput';

const CSSValueInput: React.FC<Props> = React.forwardRef<HTMLInputElement, Props>(
    (
        {
            allowEmpty = true,
            className,
            cssValueType = DEFAULT_CSS_VALUE_TYPE,
            disabled,
            getValueAsNumber = getCSSValueAsNumber,
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
            tabIndex,
            title,
            unit = DEFAULT_UNIT_BY_CSS_VALUE_TYPE[cssValueType],
            validator,
            value,
        },
        ref,
    ) => {
        const inputRef = useRef<InputRef>(null);
        useImperativeHandle<InputRef, InputRef>(ref, () => inputRef.current);

        const submittedValueRef = useRef<string>(value || '');

        const handleSubmitValue = useCallback(() => {
            if (!inputRef.current) return;
            // If value hasn???t changed, do not trigger onSubmitValue
            const currentValue = inputRef.current.value;
            if (currentValue === submittedValueRef.current) return;

            let isValid =
                (allowEmpty && !currentValue) ||
                Number.isFinite(getValueAsNumber(currentValue));

            if (!isValid && validator) {
                isValid =
                    validator instanceof RegExp
                        ? validator.test(currentValue)
                        : validator(currentValue);
            }
            // If current value isn???t valid, revert to last submitted value
            if (!isValid) {
                inputRef.current.value = submittedValueRef.current;
                return;
            }

            submittedValueRef.current = currentValue;
            onSubmitValue(currentValue);
        }, [allowEmpty, onSubmitValue, validator]);

        const handleBlur = useCallback(() => {
            if (!inputRef.current) return;

            inputRef.current.value = getCSSValueWithUnit({
                cssValueType,
                defaultUnit: unit,
                value: inputRef.current.value,
            });
            handleSubmitValue();
        }, [cssValueType, handleSubmitValue, unit]);

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
                const currentValueAsNumber = getValueAsNumber(currentValue);
                // If currentValue isn???t numeric, don???t try to increment/decrement it
                if (
                    typeof currentValue === 'string' &&
                    Number.isNaN(currentValueAsNumber)
                ) {
                    return currentValue;
                }

                let nextValue = roundToPrecision(currentValueAsNumber + modifier, 5);

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
                const currentValue = input.value || placeholder || `0${unit}`;
                let nextValue = '';

                switch (event.key) {
                    case 'Escape':
                    case 'Enter':
                        if (event.key === 'Escape') {
                            input.value = submittedValueRef.current;
                        }
                        input.blur();
                        return;
                    case 'ArrowUp':
                    case 'ArrowDown':
                        nextValue = getNextValue({
                            currentValue,
                            multiplier: event.shiftKey ? 10 : 1,
                            signum: event.key === 'ArrowUp' ? 1 : -1,
                        });

                        if (nextValue === currentValue) return;

                        event.stopPropagation();
                        event.preventDefault();

                        input.value = nextValue;
                        return;
                    default:
                    // No default key handling
                }
            },
            [getNextValue, onKeyDown, placeholder, unit],
        );

        const handleKeyUp = useCallback(
            (event: React.KeyboardEvent<HTMLInputElement>) => {
                if (onKeyUp) onKeyUp(event);
                // If this is the key up from ??? or ??? keys, time to handleSubmitValue
                if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                    handleSubmitValue();
                }
            },
            [handleSubmitValue, onKeyUp],
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
                    <InputText
                        disabled={disabled}
                        initialValue={value}
                        onBlur={handleBlur}
                        onChange={onChange}
                        onKeyDown={handleKeyDown}
                        onKeyUp={handleKeyUp}
                        placeholder={placeholder}
                        ref={inputRef}
                        tabIndex={tabIndex}
                    />
                </div>
            </label>
        );
    },
);

export default CSSValueInput;
