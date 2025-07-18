import {
    type CSSValueType,
    DEFAULT_CSS_VALUE_TYPE,
    DEFAULT_UNIT_BY_CSS_VALUE_TYPE,
    getCSSValueAsNumber,
    getCSSValueWithUnit,
    getUnitFromCSSValue,
    roundToPrecision,
} from '@acusti/css-values';
import InputText from '@acusti/input-text';
import clsx from 'clsx';
import {
    type ChangeEvent,
    type FocusEvent,
    forwardRef,
    type KeyboardEvent,
    type ReactNode,
    type SyntheticEvent,
    useEffect,
    useImperativeHandle,
    useRef,
} from 'react';

export type Props = {
    /**
     * Boolean indicating if the user can submit an empty value (i.e. clear
     * the value). Defaults to true.
     */
    allowEmpty?: boolean;
    className?: string;
    cssValueType?: CSSValueType;
    disabled?: boolean;
    /**
     * Function that receives a value and converts it to its numerical equivalent
     * (i.e. '12px' → 12). Defaults to parseFloat().
     */
    getValueAsNumber?: (value: number | string) => number;
    icon?: ReactNode;
    label?: string;
    max?: number;
    min?: number;
    name?: string;
    onBlur?: (event: FocusEvent<HTMLInputElement>) => unknown;
    onChange?: (event: ChangeEvent<HTMLInputElement>) => unknown;
    onFocus?: (event: FocusEvent<HTMLInputElement>) => unknown;
    onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => unknown;
    onKeyUp?: (event: KeyboardEvent<HTMLInputElement>) => unknown;
    /**
     * Custom event handler triggered when the user presses enter/return
     * or blurs the input after making a change. Hitting esc will restore
     * the previous submitted value or original value.
     */
    onSubmitValue: (value: string) => unknown;
    placeholder?: string;
    step?: number;
    tabIndex?: number;
    title?: string;
    unit?: string;
    /** Regex or validator function to validate non-numeric values */
    validator?: ((value: string) => boolean) | RegExp;
    value?: string;
};

type InputRef = HTMLInputElement | null;

const ROOT_CLASS_NAME = 'cssvalueinput';

export default forwardRef<HTMLInputElement, Props>(function CSSValueInput(
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
        name,
        onBlur,
        onChange,
        onFocus,
        onKeyDown,
        onKeyUp,
        onSubmitValue,
        placeholder,
        step = 1,
        tabIndex,
        title,
        unit = DEFAULT_UNIT_BY_CSS_VALUE_TYPE[cssValueType],
        validator,
        value: valueFromProps,
    }: Props,
    ref,
) {
    const inputRef = useRef<InputRef>(null);
    useImperativeHandle<InputRef, InputRef>(ref, () => inputRef.current);
    // props.value should be a string; if it’s a number, convert it here
    const value =
        typeof valueFromProps === 'number' && !Number.isNaN(valueFromProps)
            ? `${valueFromProps}`
            : valueFromProps;
    const submittedValueRef = useRef<string>(value ?? '');

    useEffect(() => {
        submittedValueRef.current = value ?? '';
    }, [value]);

    const handleSubmitValue = (event: SyntheticEvent<HTMLInputElement>) => {
        const currentValue = event.currentTarget.value;
        // Store last submittedValue (used to reset value on invalid input)
        submittedValueRef.current = currentValue;
        onSubmitValue(currentValue);
    };

    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
        const input = event.currentTarget;
        inputRef.current = input;
        if (onBlur) onBlur(event);

        const currentValue = input.value.trim();

        // If allowEmpty and value is empty, skip all validation + normalization
        if (allowEmpty && !currentValue) {
            handleSubmitValue(event);
            return;
        }

        const currentValueAsNumber = getValueAsNumber(currentValue);
        const isCurrentValueFinite = Number.isFinite(currentValueAsNumber);
        // Inherit unit from last submitted value unless default is unitless;
        // ensures that submitting a new value with no unit doesn’t add a unit
        const defaultUnit = unit
            ? getUnitFromCSSValue({
                  cssValueType,
                  defaultUnit: unit,
                  value: submittedValueRef.current,
              })
            : '';

        if (!isCurrentValueFinite) {
            let isValid = false;
            if (validator instanceof RegExp) {
                isValid = validator.test(currentValue);
            } else if (validator) {
                isValid = validator(currentValue);
            }

            if (isValid) {
                handleSubmitValue(event);
            } else {
                // If current value isn’t valid, revert to last submitted value
                input.value = submittedValueRef.current;
            }

            return;
        }

        // Normalize value by applying min/max and integer constraints
        let normalizedValueAsNumber = currentValueAsNumber;

        if (isCurrentValueFinite) {
            if (min != null && currentValueAsNumber < min) {
                normalizedValueAsNumber = min;
            } else if (max != null && currentValueAsNumber > max) {
                normalizedValueAsNumber = max;
            } else if (cssValueType === 'integer') {
                normalizedValueAsNumber = Math.floor(currentValueAsNumber);
            }
        }

        if (normalizedValueAsNumber !== currentValueAsNumber) {
            const currentUnit = getUnitFromCSSValue({
                cssValueType,
                defaultUnit,
                value: currentValue,
            });
            input.value = normalizedValueAsNumber + currentUnit;
        } else {
            input.value = getCSSValueWithUnit({
                cssValueType,
                defaultUnit,
                value: currentValue,
            });
        }

        handleSubmitValue(event);
    };

    const getNextValue = ({
        currentValue,
        multiplier = 1,
        signum = 1,
    }: {
        currentValue: number | string;
        multiplier?: number;
        signum?: number;
    }) => {
        const modifier = multiplier * step * signum;
        const currentValueAsNumber = getValueAsNumber(currentValue);
        // If currentValue isn’t numeric, don’t try to increment/decrement it
        if (typeof currentValue === 'string' && Number.isNaN(currentValueAsNumber)) {
            return currentValue;
        }

        let nextValue = currentValueAsNumber + modifier;
        if (cssValueType === 'integer') {
            nextValue = Math.floor(nextValue);
        } else {
            nextValue = roundToPrecision(nextValue, 5);
        }

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
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        const input = event.currentTarget;
        inputRef.current = input;
        if (onKeyDown) onKeyDown(event);

        const currentValue = input.value ?? placeholder ?? `0${unit}`;
        let nextValue = '';

        switch (event.key) {
            case 'ArrowDown':
            case 'ArrowUp':
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
            case 'Enter':
            case 'Escape':
                if (event.key === 'Escape') {
                    input.value = submittedValueRef.current;
                }
                input.blur();
                return;
            default:
            // No default key handling
        }
    };

    const handleKeyUp = (event: KeyboardEvent<HTMLInputElement>) => {
        if (onKeyUp) onKeyUp(event);
        // If this is the key up from ↑ or ↓ keys, time to handleSubmitValue
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            handleSubmitValue(event);
        }
    };

    return (
        <label
            aria-label={label ? undefined : title}
            className={clsx(ROOT_CLASS_NAME, className, { disabled })}
            title={title}
        >
            {icon == null ? null : (
                <div className={`${ROOT_CLASS_NAME}-icon`}>{icon}</div>
            )}
            {label ? (
                <div className={`${ROOT_CLASS_NAME}-label`}>
                    <p className={`${ROOT_CLASS_NAME}-label-text`}>{label}</p>
                </div>
            ) : null}
            <div className={`${ROOT_CLASS_NAME}-value`}>
                <InputText
                    disabled={disabled}
                    initialValue={value}
                    name={name}
                    onBlur={handleBlur}
                    onChange={onChange}
                    onFocus={onFocus}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    placeholder={placeholder}
                    ref={inputRef}
                    selectTextOnFocus
                    tabIndex={tabIndex}
                />
            </div>
        </label>
    );
});
