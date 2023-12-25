import * as React from 'react';
import type { InputHTMLAttributes } from 'react';

type InputElement = HTMLInputElement | HTMLTextAreaElement;

export type Props = {
    autoCapitalize?: 'none' | 'off' | 'sentences' | 'words' | 'characters';
    autoComplete?: HTMLInputElement['autocomplete'];
    className?: string;
    disabled?: boolean;
    enterKeyHint?: InputHTMLAttributes<HTMLInputElement>['enterKeyHint'];
    form?: string;
    initialValue?: string;
    list?: string;
    max?: number;
    maxHeight?: number | string;
    maxLength?: number;
    min?: number;
    minLength?: number;
    multiLine?: boolean;
    multiple?: boolean;
    name?: string;
    onBlur?: (event: React.FocusEvent<InputElement>) => unknown;
    onChange?: (event: React.ChangeEvent<InputElement>) => unknown;
    onFocus?: (event: React.FocusEvent<InputElement>) => unknown;
    onKeyDown?: (event: React.KeyboardEvent<InputElement>) => unknown;
    onKeyUp?: (event: React.KeyboardEvent<InputElement>) => unknown;
    pattern?: string;
    placeholder?: string;
    readOnly?: boolean;
    required?: boolean;
    selectTextOnFocus?: boolean;
    size?: number;
    step?: number;
    style?: React.CSSProperties;
    submitOnEnter?: boolean;
    tabIndex?: number;
    title?: string;
    type?: 'text' | 'email' | 'number' | 'password' | 'search' | 'tel' | 'url';
};

type InputRef = HTMLInputElement | null;

const { useCallback, useEffect, useImperativeHandle, useRef, useState } = React;

export default React.forwardRef<HTMLInputElement, Props>(function InputText(
    {
        autoCapitalize,
        autoComplete,
        className,
        disabled,
        enterKeyHint,
        form,
        initialValue,
        list,
        max,
        maxHeight = Infinity,
        maxLength,
        min,
        minLength,
        multiLine,
        multiple,
        name,
        onBlur,
        onChange,
        onFocus,
        onKeyDown,
        onKeyUp,
        pattern,
        placeholder,
        readOnly,
        required,
        selectTextOnFocus,
        size,
        style,
        step,
        // submitOnEnter,
        tabIndex,
        title,
        type = 'text',
    }: Props,
    ref,
) {
    const inputRef = useRef<InputRef>(null);
    useImperativeHandle<InputRef, InputRef>(ref, () => inputRef.current);
    const [inputElement, _setInputElement] = useState<InputRef>(null);

    const setInputElement = useCallback((element: InputRef) => {
        inputRef.current = element;
        _setInputElement(element);
    }, []);

    // If props.initialValue changes, override input value from it
    useEffect(() => {
        if (!inputRef.current) return;
        inputRef.current.value = initialValue ?? '';
    }, [initialValue]);

    const isInitialSelectionRef = useRef<boolean>(true);

    const handleBlur = useCallback(
        (event: React.FocusEvent<HTMLInputElement>) => {
            setInputElement(event.currentTarget);
            if (onBlur) onBlur(event);
            // When input loses focus, reset isInitialSelection to true for next onSelect event
            isInitialSelectionRef.current = true;
        },
        [onBlur, setInputElement],
    );

    const setInputHeight = useCallback(() => {
        if (!inputElement) return;

        if (inputElement.style.height) {
            inputElement.style.height = '';
        }

        if (!multiLine) return;

        const height = Math.min(
            inputElement.scrollHeight,
            typeof maxHeight === 'string' ? parseFloat(maxHeight) : maxHeight,
        );
        inputElement.style.height = `${height}px`;
    }, [inputElement, maxHeight, multiLine]);

    // Initialize input height in useEffect
    useEffect(setInputHeight, [setInputHeight]);

    // NOTE Selecting the contents of the input onFocus makes for the best UX,
    // but it doesn’t work in Safari, so we use the initial onSelect event instead
    const handleSelect = useCallback(
        (event: React.SyntheticEvent<HTMLInputElement>) => {
            const input = event.currentTarget;
            setInputElement(input);
            // Do nothing if this isn’t the initial select-on-focus event
            if (!isInitialSelectionRef.current) return;
            // This is the initial select-on-focus event, so reset isInitialSelection to false
            isInitialSelectionRef.current = false;
            // Do nothing if input has no value
            if (!input.value) return;
            // Do nothing if input is no longer the document’s activeElement
            if (input.ownerDocument.activeElement !== input) return;
            // Do nothing if input’s contents are already selected
            const valueLength = input.value.length;
            if (input.selectionStart === 0 && input.selectionEnd === valueLength) return;

            input.selectionStart = 0;
            input.selectionEnd = valueLength;
        },
        [setInputElement],
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const Element: 'input' = (multiLine ? 'textarea' : 'input') as any;

    return (
        <Element
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            className={className}
            defaultValue={initialValue ?? ''}
            disabled={disabled}
            enterKeyHint={enterKeyHint}
            form={form}
            list={list}
            maxLength={maxLength}
            minLength={minLength}
            multiple={multiple}
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
            ref={setInputElement}
            required={required}
            size={size}
            style={style}
            tabIndex={tabIndex}
            title={title}
            type={type}
            {...(multiLine ? { onInput: setInputHeight, rows: 1 } : { max, min, step })}
        />
    );
});
