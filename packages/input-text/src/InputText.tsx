import * as React from 'react';

export type InputElement = HTMLInputElement | HTMLTextAreaElement;

export type Props = {
    autoCapitalize?: 'characters' | 'none' | 'off' | 'sentences' | 'words';
    autoComplete?: HTMLInputElement['autocomplete'];
    autoFocus?: boolean;
    className?: string;
    disabled?: boolean;
    /**
     * If true, input renders as readonly initially and only becomes interactive
     * when double-clicked or when user focuses the readonly input and then
     * presses the enter key. Likewise, the input becomes readonly again when
     * it is blurred or when the user presses enter or escape.
     */
    doubleClickToEdit?: boolean;
    enterKeyHint?: React.InputHTMLAttributes<HTMLInputElement>['enterKeyHint'];
    form?: string;
    id?: string;
    /**
     * The initial value of the text input. If props.initialValue changes at
     * any point, the new value will override the local state of the input.
     */
    initialValue?: string;
    list?: string;
    max?: number;
    maxHeight?: number | string;
    maxLength?: number;
    min?: number;
    minLength?: number;
    /**
     * If true, input renders as a <textarea> that automatically grows and
     * shrinks vertically to adjust to the length of its contents.
     */
    multiLine?: boolean;
    multiple?: boolean;
    name?: string;
    onBlur?: (event: React.FocusEvent<InputElement>) => unknown;
    onChange?: (event: React.ChangeEvent<InputElement>) => unknown;
    /**
     * Custom change handler that only receives the changed value as an argument.
     * Enables passing a state setter function directly, e.g. onChangeValue={setValue}.
     */
    onChangeValue?: (value: string) => unknown;
    onFocus?: (event: React.FocusEvent<InputElement>) => unknown;
    onKeyDown?: (event: React.KeyboardEvent<InputElement>) => unknown;
    onKeyUp?: (event: React.KeyboardEvent<InputElement>) => unknown;
    pattern?: string;
    placeholder?: string;
    readOnly?: boolean;
    required?: boolean;
    rows?: number;
    /** If true, the contents of the input are selected when it’s focused. */
    selectTextOnFocus?: boolean;
    size?: number;
    step?: number;
    style?: React.CSSProperties;
    /**
     * If true, pressing enter/return submits the <form> that the input is a
     * part of, or else blurs the input if no form is found.
     */
    submitOnEnter?: boolean;
    tabIndex?: number;
    title?: string;
    type?: 'email' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url';
};

type InputRef = HTMLInputElement | null;

const { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } = React;

export default React.forwardRef<HTMLInputElement, Props>(function InputText(
    {
        autoCapitalize,
        autoComplete,
        autoFocus,
        className,
        disabled,
        doubleClickToEdit,
        enterKeyHint,
        form,
        id,
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
        onChangeValue,
        onFocus,
        onKeyDown,
        onKeyUp,
        pattern,
        placeholder,
        readOnly,
        required,
        rows = 1,
        selectTextOnFocus,
        size,
        step,
        style,
        submitOnEnter,
        tabIndex,
        title,
        type = 'text',
    }: Props,
    ref,
) {
    const inputRef = useRef<InputRef>(null);
    useImperativeHandle<InputRef, InputRef>(ref, () => inputRef.current);
    const [inputElement, _setInputElement] = useState<InputRef>(null);
    const resizeObserverRef = useRef<null | ResizeObserver>(null);

    const setInputElement = useCallback((element: InputRef) => {
        inputRef.current = element;
        _setInputElement(element);
    }, []);

    if (inputRef.current) {
        if (autoFocus && !inputRef.current.autofocus) {
            inputRef.current.setAttribute('autofocus', 'autofocus');
        } else if (!autoFocus && inputRef.current.autofocus) {
            inputRef.current.removeAttribute('autofocus');
        }
    }

    // If props.initialValue changes, override input value from it
    useEffect(() => {
        if (!inputRef.current) return;
        inputRef.current.value = initialValue ?? '';
    }, [initialValue]);

    const [supportsFieldSizing, setSupportsFieldSizing] = useState(true);

    useEffect(() => {
        if (typeof CSS === 'undefined') return;
        setSupportsFieldSizing(CSS.supports('field-sizing', 'content'));
    }, []);

    const [readOnlyState, setReadOnlyState] = useState<boolean | undefined>(
        readOnly ?? doubleClickToEdit,
    );
    const isInitialSelectionRef = useRef<boolean>(true);

    const startEditing = useCallback(() => {
        if (!doubleClickToEdit) return;
        setReadOnlyState(false);
    }, [doubleClickToEdit]);

    const setInputHeight = useCallback(() => {
        if (!inputElement || supportsFieldSizing) return;

        if (inputElement.style.height) {
            inputElement.style.height = '';
        }
        // Always reset height above to handle multiLine → !multiLine prop change
        if (!multiLine) return;

        const height = Math.min(
            inputElement.scrollHeight,
            typeof maxHeight === 'string' ? parseFloat(maxHeight) : maxHeight,
        );
        if (height) {
            inputElement.style.height = `${height}px`;
        }
    }, [inputElement, maxHeight, multiLine, supportsFieldSizing]);

    // Setup ResizeObserver to detect when element gets layout
    useEffect(() => {
        if (!inputElement || !multiLine || supportsFieldSizing) return;
        // Initialize input height
        setInputHeight();

        resizeObserverRef.current = new ResizeObserver(() => setInputHeight());
        resizeObserverRef.current.observe(inputElement);

        return () => {
            if (!resizeObserverRef.current) return;
            resizeObserverRef.current.disconnect();
            resizeObserverRef.current = null;
        };
    }, [inputElement, multiLine, setInputHeight, supportsFieldSizing]);

    const handleChange = useCallback(
        (event: React.ChangeEvent<InputElement>) => {
            if (onChange) onChange(event);
            if (onChangeValue) onChangeValue(event.target.value);
        },
        [onChange, onChangeValue],
    );

    const handleFocus = useCallback(
        (event: React.FocusEvent<HTMLInputElement>) => {
            if (onFocus) onFocus(event);
            if (multiLine) setInputHeight();
        },
        [multiLine, onFocus, setInputHeight],
    );

    const handleBlur = useCallback(
        (event: React.FocusEvent<HTMLInputElement>) => {
            if (onBlur) onBlur(event);
            if (doubleClickToEdit) {
                setReadOnlyState(true);
            }
            if (!selectTextOnFocus) return;
            setInputElement(event.currentTarget);
            // When input loses focus, reset isInitialSelection to true for next onSelect event
            isInitialSelectionRef.current = true;
        },
        [doubleClickToEdit, onBlur, selectTextOnFocus, setInputElement],
    );

    // NOTE Selecting the contents of the input onFocus makes for the best UX,
    // but it doesn’t work in Safari, so we use the initial onSelect event instead
    const handleSelect = useCallback(
        (event: React.SyntheticEvent<HTMLInputElement>) => {
            if (!selectTextOnFocus) return;
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
        [selectTextOnFocus, setInputElement],
    );

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent<InputElement>) => {
            if (onKeyDown) onKeyDown(event);
            if (
                event.key === 'Enter' &&
                // for multi-line inputs, ⌘-Enter should always submit
                (submitOnEnter || (multiLine && isPrimaryModifierPressed(event))) &&
                // for multi-line inputs, shift/alt/ctrl-Enter should insert newlines
                (!multiLine || (!event.shiftKey && !event.altKey && !event.ctrlKey))
            ) {
                event.preventDefault();
                event.currentTarget.closest('form')?.requestSubmit();
                // always blur input on Enter when submitOnEnter is true
                event.currentTarget.blur();
            } else if (doubleClickToEdit && inputRef.current) {
                if (readOnlyState) {
                    if (event.key === 'Enter') {
                        setReadOnlyState(false);
                    }
                } else if (event.key === 'Enter' || event.key === 'Escape') {
                    inputRef.current.blur();
                }
            }
        },
        [doubleClickToEdit, multiLine, onKeyDown, readOnlyState, submitOnEnter],
    );

    const inputStyle = useMemo(
        () =>
            multiLine && supportsFieldSizing
                ? { ...style, fieldSizing: 'content' }
                : style,
        [multiLine, style, supportsFieldSizing],
    );

    const Element = (multiLine ? 'textarea' : 'input') as unknown as 'input';

    return (
        <Element
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            autoFocus={autoFocus} // eslint-disable-line jsx-a11y/no-autofocus
            className={className}
            defaultValue={initialValue ?? ''}
            disabled={disabled}
            enterKeyHint={enterKeyHint}
            form={form}
            id={id}
            list={list}
            maxLength={maxLength}
            minLength={minLength}
            multiple={multiple}
            name={name}
            onBlur={handleBlur}
            onChange={handleChange}
            onDoubleClick={startEditing}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            onKeyUp={onKeyUp}
            onSelect={handleSelect}
            pattern={pattern}
            placeholder={placeholder}
            readOnly={readOnlyState}
            ref={setInputElement}
            required={required}
            size={size}
            style={inputStyle}
            tabIndex={tabIndex}
            title={title}
            type={type}
            {...(multiLine ? { onInput: setInputHeight, rows } : { max, min, step })}
        />
    );
});

const IS_APPLE_REGEXP = /mac|iphone|ipad|ipod/i;

function isPrimaryModifierPressed(event: React.KeyboardEvent<InputElement>) {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const platform = globalThis.navigator?.platform ?? '';
    return IS_APPLE_REGEXP.test(platform) ? event.metaKey : event.ctrlKey;
}
