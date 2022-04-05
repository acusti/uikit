import * as React from 'react';

export type Props = {
    autoComplete?: string;
    className?: string;
    disabled?: boolean;
    initialValue?: string;
    max?: number;
    maxLength?: number;
    min?: number;
    minLength?: number;
    name?: string;
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => unknown;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => unknown;
    onFocus?: (event: React.FocusEvent<HTMLInputElement>) => unknown;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => unknown;
    onKeyUp?: (event: React.KeyboardEvent<HTMLInputElement>) => unknown;
    pattern?: string;
    placeholder?: string;
    readOnly?: boolean;
    selectTextOnFocus?: boolean;
    step?: number;
    tabIndex?: number;
    title?: string;
    type?: 'text' | 'email' | 'number' | 'password' | 'search' | 'tel' | 'url';
};

type InputRef = HTMLInputElement | null;

const { useCallback, useEffect, useImperativeHandle, useRef } = React;

const InputText = React.forwardRef<HTMLInputElement, Props>(
    (
        {
            autoComplete,
            className,
            disabled,
            initialValue,
            maxLength,
            minLength,
            name,
            onBlur,
            onChange,
            onFocus,
            onKeyDown,
            onKeyUp,
            pattern,
            placeholder,
            readOnly,
            selectTextOnFocus,
            tabIndex,
            title,
            type = 'text',
        }: Props,
        ref,
    ) => {
        const inputRef = useRef<InputRef>(null);
        useImperativeHandle<InputRef, InputRef>(ref, () => inputRef.current);

        // If props.initialValue changes, override input value from it
        useEffect(() => {
            if (!inputRef.current) return;
            inputRef.current.value = initialValue || '';
        }, [initialValue]);

        const isInitialSelectionRef = useRef<boolean>(true);

        const handleBlur = useCallback(
            (event: React.FocusEvent<HTMLInputElement>) => {
                if (onBlur) onBlur(event);
                // When input loses focus, reset isInitialSelection to true for next onSelect event
                isInitialSelectionRef.current = true;
            },
            [onBlur],
        );

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

        return (
            <input
                autoComplete={autoComplete}
                className={className}
                defaultValue={initialValue || ''}
                disabled={disabled}
                maxLength={maxLength}
                minLength={minLength}
                name={name}
                onBlur={selectTextOnFocus ? handleBlur : onBlur}
                onChange={onChange}
                onFocus={onFocus}
                onKeyDown={onKeyDown}
                onKeyUp={onKeyUp}
                onSelect={selectTextOnFocus ? handleSelect : undefined}
                pattern={pattern}
                placeholder={placeholder}
                readOnly={readOnly}
                ref={inputRef}
                tabIndex={tabIndex}
                title={title}
                type={type}
            />
        );
    },
);

export default InputText;
