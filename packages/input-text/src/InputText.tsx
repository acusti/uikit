import {
    type ChangeEvent,
    type CSSProperties,
    type FocusEvent,
    type InputHTMLAttributes,
    type KeyboardEvent,
    type Ref,
    type SyntheticEvent,
    useEffect,
    useRef,
    useState,
} from 'react';

export type InputElement = HTMLInputElement | HTMLTextAreaElement;

export type Props = {
    autoCapitalize?: 'characters' | 'none' | 'off' | 'sentences' | 'words';
    autoComplete?: HTMLInputElement['autocomplete'];
    autoFocus?: boolean;
    className?: string;
    disabled?: boolean;
    /**
     * If true, resets input’s value to initialValue and blurs when user presses
     * the escape key.
     */
    discardOnEscape?: boolean;
    /**
     * If true, input renders as readonly initially and only becomes interactive
     * when double-clicked or when user focuses the readonly input and then
     * presses the enter key. Likewise, the input becomes readonly again when
     * it is blurred or when the user presses enter or escape.
     */
    doubleClickToEdit?: boolean;
    enterKeyHint?: InputHTMLAttributes<HTMLInputElement>['enterKeyHint'];
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
    onBlur?: (event: FocusEvent<InputElement>) => unknown;
    onChange?: (event: ChangeEvent<InputElement>) => unknown;
    /**
     * Custom change handler that only receives the changed value as an argument.
     * Enables passing a state setter function directly, e.g. onChangeValue={setValue}.
     */
    onChangeValue?: (value: string) => unknown;
    onFocus?: (event: FocusEvent<InputElement>) => unknown;
    onKeyDown?: (event: KeyboardEvent<InputElement>) => unknown;
    onKeyUp?: (event: KeyboardEvent<InputElement>) => unknown;
    pattern?: string;
    placeholder?: string;
    readOnly?: boolean;
    ref?: Ref<HTMLInputElement>;
    required?: boolean;
    rows?: number;
    /** If true, the contents of the input are selected when it’s focused. */
    selectTextOnFocus?: boolean;
    size?: number;
    step?: number;
    style?: CSSProperties;
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

export default function InputText({
    autoCapitalize,
    autoComplete,
    autoFocus,
    className,
    disabled,
    discardOnEscape,
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
    ref,
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
}: Props) {
    const inputRef = useRef<InputRef>(null);
    const valueFromProps = initialValue ?? '';
    const committedValueRef = useRef(valueFromProps);

    const setInputHeight = () => {
        if (!inputRef.current || SUPPORTS_FIELD_SIZING) return;

        if (!multiLine) {
            // Reset height to handle multiLine → !multiLine prop change
            inputRef.current.style.height = '';
            return;
        }

        const { transitionDelay, transitionDuration } = inputRef.current.style;
        // Set all CSS transition timings to 0s to prevent endless growing bug
        inputRef.current.style.transitionDelay = '0s';
        inputRef.current.style.transitionDuration = '0s';
        inputRef.current.style.height = '';

        const height = Math.min(
            inputRef.current.scrollHeight,
            typeof maxHeight === 'string' ? parseFloat(maxHeight) : maxHeight,
        );

        if (height) {
            inputRef.current.style.height = `${height}px`;
        }

        // Restore original transition timings asynchronously to prevent ResizeObserver loop
        setTimeout(() => {
            if (!inputRef.current) return;
            inputRef.current.style.transitionDelay =
                transitionDelay === '0s' ? '' : transitionDelay;
            inputRef.current.style.transitionDuration =
                transitionDuration === '0s' ? '' : transitionDuration;
        }, 0);
    };

    const handleRef = (element: InputRef) => {
        inputRef.current = element;
        // Set the forwarded ref
        if (typeof ref === 'function') {
            ref(element);
        } else if (ref) {
            ref.current = element;
        }

        // Setup ResizeObserver for multiLine inputs
        if (!element || !multiLine || SUPPORTS_FIELD_SIZING) return;

        // Initialize input height
        setInputHeight();

        const observer = new ResizeObserver(setInputHeight);
        observer.observe(element);

        // Return cleanup function to disconnect observer
        return () => {
            observer.disconnect();
        };
    };

    useEffect(() => {
        committedValueRef.current = valueFromProps;
        if (!inputRef.current) return;
        // if props.initialValue changes, override input value with it
        inputRef.current.value = valueFromProps;
    }, [valueFromProps]);

    const [readOnlyState, setReadOnlyState] = useState<boolean | undefined>(
        readOnly ?? doubleClickToEdit,
    );
    const isInitialSelectionRef = useRef<boolean>(true);

    const startEditing = () => {
        if (!doubleClickToEdit) return;
        setReadOnlyState(false);
    };

    const handleChange = (event: ChangeEvent<InputElement>) => {
        if (onChange) onChange(event);
        if (onChangeValue) onChangeValue(event.target.value);
    };

    const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
        if (onFocus) onFocus(event);
        if (multiLine) setInputHeight();
    };

    const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
        if (onBlur) onBlur(event);
        committedValueRef.current = event.currentTarget.value;
        if (doubleClickToEdit) {
            setReadOnlyState(true);
        }
        if (!selectTextOnFocus) return;
        // When input loses focus, reset isInitialSelection to true for next onSelect event
        isInitialSelectionRef.current = true;
    };

    // NOTE Selecting the contents of the input onFocus makes for the best UX,
    // but it doesn’t work in Safari, so we use the initial onSelect event instead
    const handleSelect = (event: SyntheticEvent<HTMLInputElement>) => {
        if (!selectTextOnFocus) return;
        const input = event.currentTarget;
        // Do nothing if this isn't the initial select-on-focus event
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
    };

    const handleKeyDown = (event: KeyboardEvent<InputElement>) => {
        if (onKeyDown) onKeyDown(event);
        // special handling is only for Enter and Escape keys
        if (event.key !== 'Enter' && event.key !== 'Escape') return;
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
            return;
        }
        // only discardOnEscape + doubleClickToEdit have custom Enter/Escape behavior
        if (!discardOnEscape && !doubleClickToEdit) return;

        if (event.key === 'Escape' && discardOnEscape) {
            const currentValue = event.currentTarget.value;
            // reset input to last “committed” value
            if (currentValue !== committedValueRef.current) {
                event.currentTarget.value = committedValueRef.current;
                // if the value changed, manually trigger onChange handlers
                handleChange(event as unknown as ChangeEvent<InputElement>);
            }
        } else if (event.key === 'Enter' && doubleClickToEdit && readOnlyState) {
            setReadOnlyState(false);
        }
        // blur the input on Enter and Escape
        event.currentTarget.blur();
    };

    const inputStyle =
        multiLine && SUPPORTS_FIELD_SIZING ? { ...style, fieldSizing: 'content' } : style;

    const Element = (multiLine ? 'textarea' : 'input') as unknown as 'input';

    return (
        <Element
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            autoFocus={autoFocus} // eslint-disable-line jsx-a11y/no-autofocus
            className={className}
            defaultValue={valueFromProps}
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
            ref={handleRef}
            required={required}
            size={size}
            style={inputStyle}
            tabIndex={tabIndex}
            title={title}
            type={type}
            {...(multiLine ? { onInput: setInputHeight, rows } : { max, min, step })}
        />
    );
}

const SUPPORTS_FIELD_SIZING =
    typeof CSS === 'undefined' ? true : CSS.supports('field-sizing', 'content');

const IS_APPLE_REGEXP = /mac|iphone|ipad|ipod/i;

function isPrimaryModifierPressed(event: KeyboardEvent<InputElement>) {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const platform = globalThis.navigator?.platform ?? '';
    return IS_APPLE_REGEXP.test(platform) ? event.metaKey : event.ctrlKey;
}
