import {
    type AriaAttributes,
    type AriaRole,
    type ChangeEvent,
    type ClipboardEvent,
    type CSSProperties,
    type FocusEvent,
    type HTMLInputAutoCompleteAttribute,
    type InputHTMLAttributes,
    type KeyboardEvent,
    type Ref,
    type SyntheticEvent,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

export type InputElement = HTMLInputElement | HTMLTextAreaElement;

/**
 * Every aria-* attribute (and role) is forwarded as-is to the underlying
 * <input>/<textarea>, so the component can be labelled and annotated,
 * including by a parent that clones it to inject combobox semantics, e.g.
 * @acusti/dropdown’s custom trigger.
 */
export type Props = AriaAttributes & {
    autoCapitalize?: 'characters' | 'none' | 'off' | 'sentences' | 'words';
    autoComplete?: HTMLInputAutoCompleteAttribute;
    autoFocus?: boolean;
    className?: string;
    disabled?: boolean;
    /**
     * If true, pressing Escape resets the input’s value to its last committed
     * one (initialValue, or the value it had when it was last blurred,
     * whichever is more recent) and blurs it. The Escape that cancels an IME
     * composition is left to the IME.
     */
    discardOnEscape?: boolean;
    /**
     * If true, the input renders as readonly at first and only becomes editable
     * when it is double-clicked, or when the user focuses it and presses Enter.
     * It becomes readonly again when it is blurred or when the user presses
     * Enter or Escape, except for an Enter or Escape that commits or cancels an
     * IME composition.
     */
    doubleClickToEdit?: boolean;
    enterKeyHint?: InputHTMLAttributes<HTMLInputElement>['enterKeyHint'];
    form?: string;
    id?: string;
    /**
     * The initial value of the text input. If this prop changes value, the
     * input value is updated to match it. Unlike a controlled input,
     * InputText keeps what the user types, but passing each change back
     * from onChangeValue keeps initialValue in step so that setting it
     * later (e.g. to '' to clear the input) updates the input’s value.
     * Doing so also makes each change the value that discardOnEscape
     * resets to, so Escape only blurs the input.
     * @default ''
     */
    initialValue?: string;
    inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
    /**
     * If true, pressing Enter while submitOnEnter is enabled keeps focus on the
     * input instead of blurring it.
     */
    keepFocusOnSubmit?: boolean;
    list?: string;
    max?: number;
    maxHeight?: null | number | string;
    maxLength?: number;
    min?: number;
    minHeight?: null | number | string;
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
     * A change handler that receives only the new value, so that a state setter
     * can be passed to it directly, e.g. onChangeValue={setValue}.
     */
    onChangeValue?: (value: string) => unknown;
    onFocus?: (event: FocusEvent<InputElement>) => unknown;
    onKeyDown?: (event: KeyboardEvent<InputElement>) => unknown;
    onKeyUp?: (event: KeyboardEvent<InputElement>) => unknown;
    onPaste?: (event: ClipboardEvent<InputElement>) => unknown;
    pattern?: string;
    placeholder?: string;
    readOnly?: boolean;
    ref?: Ref<InputElement>;
    required?: boolean;
    role?: AriaRole;
    rows?: number;
    /** If true, the contents of the input are selected when it’s focused. */
    selectTextOnFocus?: boolean;
    size?: number;
    step?: number;
    style?: CSSProperties;
    /**
     * If true, pressing Enter submits the form that owns the input (the one
     * named by the form prop, or else the one the input is inside) and blurs
     * the input, unless keepFocusOnSubmit is set. For multi-line inputs,
     * Cmd/Ctrl+Enter always submits. The Enter keydown is only prevented where
     * it has a default action to stop: in a multi-line input, or in an input
     * that a form owns. The Enter that commits an IME composition is left to
     * the IME.
     */
    submitOnEnter?: boolean;
    tabIndex?: number;
    title?: string;
    type?: 'email' | 'number' | 'password' | 'search' | 'tel' | 'text' | 'url';
};

type InputRef = InputElement | null;

const TRANSITION_TIMING_NAMES = ['transitionDelay', 'transitionDuration'] as const;

type TransitionTimings = Pick<
    CSSStyleDeclaration,
    (typeof TRANSITION_TIMING_NAMES)[number]
>;

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
    inputMode,
    keepFocusOnSubmit,
    list,
    max,
    maxHeight,
    maxLength,
    min,
    minHeight,
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
    onPaste,
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
    ...restProps
}: Props) {
    const inputRef = useRef<InputRef>(null);
    const valueFromProps = initialValue ?? '';
    const committedValueRef = useRef(valueFromProps);
    const transitionTimingsRef = useRef<null | TransitionTimings>(null);
    const fittedValueRef = useRef<null | string>(null);

    const setInputHeight = () => {
        if (!inputRef.current || SUPPORTS_FIELD_SIZING) return;

        if (!multiLine) {
            // Reset height to handle multiLine → !multiLine prop change
            inputRef.current.style.height = '';
            return;
        }

        // Set all CSS transition timings to 0s to prevent endless growing bug,
        // and restore the originals asynchronously to prevent ResizeObserver
        // loop. While a restore is pending, a timing other than the 0s written
        // here is a new original (e.g. from a style prop that changed since),
        // and the restore leaves alone a timing that isn’t 0s anymore
        const elementStyle = inputRef.current.style;
        const pendingTimings = transitionTimingsRef.current;
        const timings = { transitionDelay: '', transitionDuration: '' };
        for (const timingName of TRANSITION_TIMING_NAMES) {
            timings[timingName] =
                pendingTimings && elementStyle[timingName] === '0s'
                    ? pendingTimings[timingName]
                    : elementStyle[timingName];
            elementStyle[timingName] = '0s';
        }
        transitionTimingsRef.current = timings;
        if (!pendingTimings) {
            setTimeout(() => {
                const timingsToRestore = transitionTimingsRef.current;
                transitionTimingsRef.current = null;
                if (!inputRef.current || !timingsToRestore) return;
                for (const timingName of TRANSITION_TIMING_NAMES) {
                    if (inputRef.current.style[timingName] !== '0s') continue;
                    inputRef.current.style[timingName] = timingsToRestore[timingName];
                }
            }, 0);
        }
        elementStyle.height = '';

        const minHeightValue =
            typeof minHeight === 'string' ? parseFloat(minHeight) : minHeight;
        const maxHeightValue =
            typeof maxHeight === 'string' ? parseFloat(maxHeight) : maxHeight;

        const height = Math.max(
            minHeightValue ?? 0,
            Math.min(inputRef.current.scrollHeight, maxHeightValue ?? Infinity),
        );
        if (height) {
            inputRef.current.style.height = `${height}px`;
        }
        fittedValueRef.current = inputRef.current.value;
    };

    const handleRef = (element: InputRef) => {
        inputRef.current = element;

        // Forward the ref and capture any cleanup function it returns
        let cleanup: (() => void) | undefined = undefined;
        if (typeof ref === 'function') {
            const refCleanup = ref(element);
            cleanup = typeof refCleanup === 'function' ? refCleanup : undefined;
        } else if (ref) {
            ref.current = element;
        }

        // Setup ResizeObserver for multiLine inputs
        if (!element || !multiLine || SUPPORTS_FIELD_SIZING) {
            // Return ref cleanup if present
            return cleanup;
        }

        // Initialize input height
        setInputHeight();

        const observer = new ResizeObserver(setInputHeight);
        observer.observe(element);

        // Return cleanup function that disconnects observer and calls ref cleanup
        return () => {
            observer.disconnect();
            if (typeof cleanup === 'function') {
                cleanup();
            }
        };
    };

    // a layout effect, so the input shows a new initialValue in the same commit
    // as the rest of the render that sets it: React only runs passive effects
    // in the commit’s own task for an update from flushSync or straight from a
    // discrete event (a click, a keypress), so after a timer, a response, a
    // transition or a pointermove, the input would show its old value until
    // they ran
    useLayoutEffect(() => {
        committedValueRef.current = valueFromProps;
        if (!inputRef.current) return;
        // if props.initialValue changes, override input value with it, unless
        // the input already has it (e.g. a controlled-input-style parent):
        // writing it anyway moves the caret to the end and ends an IME
        // composition in Safari
        if (inputRef.current.value === valueFromProps) return;
        inputRef.current.value = valueFromProps;
    }, [valueFromProps]);

    // fit a multiLine input to a value that nothing has fitted it to: one the
    // effect above wrote, which fires no input event (and, with the height
    // set, no resize), or one React showed by updating the defaultValue of a
    // textarea that hasn’t been typed in (e.g. one mounted empty, or after its
    // form was reset). It runs after every commit, but only measures a value
    // it hasn’t fitted, so a keystroke that onInput fitted costs it nothing
    useLayoutEffect(() => {
        if (!inputRef.current || !multiLine || SUPPORTS_FIELD_SIZING) return;
        if (inputRef.current.value === fittedValueRef.current) return;
        setInputHeight();
    });

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
        // a key that an IME is taking (the Enter that commits a composition,
        // the Escape that cancels it) is the IME’s
        if (isIMEKeyEvent(event)) return;
        const isPlainEnter =
            event.key === 'Enter' &&
            !event.shiftKey &&
            !event.altKey &&
            !event.ctrlKey &&
            !event.metaKey;
        const isPrimaryModifierEnter =
            event.key === 'Enter' &&
            multiLine &&
            isPrimaryModifierPressed(event) &&
            !hasNonPrimaryModifier(event);

        if (doubleClickToEdit && readOnlyState && isPlainEnter) {
            event.preventDefault();
            setReadOnlyState(false);
            return;
        }

        if (
            // Plain Enter submits when submitOnEnter is enabled.
            (submitOnEnter && isPlainEnter) ||
            // For multi-line inputs, the primary modifier + Enter should always submit.
            isPrimaryModifierEnter
        ) {
            // The form that owns the input is the one the browser would submit:
            // the one named by the form prop if there is one (wherever the
            // input is), and otherwise the form the input is inside
            const formElement = event.currentTarget.form;
            // Only prevent the key where it has a default action to stop: a
            // line break in a multi-line input, or the browser’s own submission
            // of the form, which is submitted from here instead (blurring the
            // input would keep the browser from doing it). In a single-line
            // input that no form owns, Enter has neither, and leaving it alone
            // lets an ancestor tell it from an Enter that a handler has taken
            // for something else (e.g. @acusti/dropdown, to close on submit)
            if (multiLine || formElement) {
                event.preventDefault();
            }
            formElement?.requestSubmit();
            if (!keepFocusOnSubmit) {
                event.currentTarget.blur();
            }
            return;
        }

        if (event.key === 'Escape') {
            if (!discardOnEscape && !doubleClickToEdit) return;
            // reset input to last “committed” value
            if (
                discardOnEscape &&
                event.currentTarget.value !== committedValueRef.current
            ) {
                event.currentTarget.value = committedValueRef.current;
                // a write fires no input event, so fit a multiLine input to it
                if (multiLine) setInputHeight();
                // if the value changed, manually trigger onChange handlers
                handleChange(event as unknown as ChangeEvent<InputElement>);
            }
            event.currentTarget.blur();
            return;
        }

        if (!doubleClickToEdit || !isPlainEnter) return;

        // While editing in doubleClickToEdit mode, plain Enter finishes editing.
        event.currentTarget.blur();
    };

    const inputStyle =
        multiLine && SUPPORTS_FIELD_SIZING
            ? {
                  ...style,
                  fieldSizing: 'content' as const,
                  maxHeight: isHeightEmpty(maxHeight) ? undefined : maxHeight,
                  minHeight: isHeightEmpty(minHeight) ? undefined : minHeight,
              }
            : style;

    const Element = (multiLine ? 'textarea' : 'input') as unknown as 'input';

    return (
        <Element
            {...restProps}
            autoCapitalize={autoCapitalize}
            autoComplete={autoComplete}
            autoFocus={autoFocus} // eslint-disable-line jsx-a11y/no-autofocus
            className={className}
            defaultValue={valueFromProps}
            disabled={disabled}
            enterKeyHint={enterKeyHint}
            form={form}
            id={id}
            inputMode={inputMode}
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
            onPaste={onPaste}
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

function hasNonPrimaryModifier(event: KeyboardEvent<InputElement>) {
    return (
        event.shiftKey ||
        event.altKey ||
        (!isPrimaryModifierPressed(event) && (event.ctrlKey || event.metaKey))
    );
}

function isHeightEmpty(
    value?: null | number | string,
): value is '' | null | typeof Infinity | undefined {
    return value == null || value === '' || value === 0 || value === Infinity;
}

// Whether a key event is of a key that an IME is taking: Enter to commit a
// composition, the arrows to move through its candidates, Escape to cancel
// it. isComposing says so while the composition is under way. Where it has
// already ended by the time of a keydown, only keyCode 229 still gives it
// away; a keyup has no such keyCode, so only isComposing marks one, and it is
// false on the keyup of a key that ended the composition
export function isIMEKeyEvent(event: KeyboardEvent<InputElement>) {
    // eslint-disable-next-line typescript/no-deprecated
    return event.nativeEvent.isComposing || event.keyCode === 229;
}

function isPrimaryModifierPressed(event: KeyboardEvent<InputElement>) {
    // eslint-disable-next-line typescript/no-deprecated
    const platform = globalThis.navigator?.platform ?? '';
    return IS_APPLE_REGEXP.test(platform) ? event.metaKey : event.ctrlKey;
}
