import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ComponentProps, type FormEvent, useEffect, useState } from 'react';
import { fn } from 'storybook/test';

import InputText from '../../input-text/src/InputText.js';

import './InputText.css';

const meta: Meta<typeof InputText> = {
    args: {
        onBlur: fn(),
        onChange: fn(),
        onChangeValue: fn(),
        onFocus: fn(),
        onKeyDown: fn(),
        onKeyUp: fn(),
        onPaste: fn(),
    },
    component: InputText,
    parameters: {
        docs: {
            description: {
                component:
                    '`InputText` is a React component that renders a textual input (`type: "text"|"email"|"number"|"password"|"search"|"tel"|"url"`) that is uncontrolled, but whose value is overwritten whenever `props.initialValue` changes. Also, if `props.selectTextOnFocus` is true, it selects the entire contents of the input whenever the input is focused. And it supports multiline inputs (rendered as a `<textarea>`) that automatically resize vertically to fit their content.',
            },
        },
    },
    //https://storybook.js.org/docs/react/writing-docs/autodocs#setup-automated-documentation
    tags: ['autodocs'],
    title: 'UIKit/Controls/InputText',
};

export default meta;

type Story = StoryObj<typeof InputText>;

export const EmptyInput: Story = {
    args: {
        'aria-label': 'Text',
        className: 'input-text',
        name: 'empty',
        placeholder: 'enter text here…',
    },
};

export const InputWithInitialValue: Story = {
    args: {
        'aria-label': 'Country',
        className: 'input-text',
        initialValue: 'Bolivia',
        placeholder: 'enter country name',
    },
};

export const InputWithInitialValueAndSelectTextOnFocus: Story = {
    args: {
        'aria-label': 'Country',
        className: 'input-text',
        initialValue: 'Bolivia',
        name: 'country',
        placeholder: 'enter country name (selectTextOnFocus)',
        selectTextOnFocus: true,
    },
};

export const MultiLineInputWithInitialValueAndSelectTextOnFocus: Story = {
    args: {
        'aria-label': 'Long text',
        className: 'multi-line-input-text',
        initialValue:
            'The Black Hawk War, or, How to Demolish an Entire Civilization and Still Feel Good About Yourself in the Morning, or, We Apologize for the Inconvenience but You’re Going to Have to Leave Now, or, “I have fought the Big Knives and will continue to fight them until they are off our lands!”',
        maxHeight: 600,
        multiLine: true,
        name: 'multi-line-input',
        placeholder: 'enter text of any length',
        selectTextOnFocus: true,
    },
};

const SUBMIT_ON_ENTER_PROPS = {
    'aria-label': 'Message',
    className: 'multi-line-input-text',
    maxHeight: 600,
    multiLine: true,
    name: 'multi-line-submit-on-enter-input',
    placeholder: 'enter text of any length',
    submitOnEnter: true,
};

const formatDate = new Intl.DateTimeFormat(undefined, {
    timeStyle: 'medium',
}).format;

export const MultiLineInputWithSubmitOnEnter: Story = {
    args: SUBMIT_ON_ENTER_PROPS,
    render(args) {
        const [lastSubmitDate, setLastSubmitDate] = useState<Date | null>(null);
        const lastSubmit = lastSubmitDate ? formatDate(lastSubmitDate) : 'never';

        return (
            <form
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    setLastSubmitDate(new Date());
                }}
            >
                <InputText {...args} />
                <pre>Last submitted: {lastSubmit}</pre>
            </form>
        );
    },
};

export const MultiLineInputWithSubmitOnEnterNoForm: Story = {
    args: {
        ...SUBMIT_ON_ENTER_PROPS,
        name: `${SUBMIT_ON_ENTER_PROPS.name}-no-form`,
    },
    render(args) {
        const [lastSubmitDate, setLastSubmitDate] = useState<Date | null>(null);
        const lastSubmit = lastSubmitDate ? formatDate(lastSubmitDate) : 'never';

        return (
            <>
                <InputText
                    {...args}
                    onKeyDown={(event) => {
                        args.onKeyDown?.(event);
                        if (event.key === 'Enter' && !event.shiftKey && !event.altKey) {
                            setLastSubmitDate(new Date());
                        }
                    }}
                />
                <pre>Last submitted: {lastSubmit}</pre>
            </>
        );
    },
};

function ChatLikeInputDemo(props: ComponentProps<typeof InputText>) {
    const { initialValue, onChangeValue, ...inputProps } = props;
    const [message, setMessage] = useState(initialValue ?? '');
    const [messages, setMessages] = useState<Array<string>>([]);

    useEffect(() => {
        setMessage(initialValue ?? '');
    }, [initialValue]);

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                if (!message.trim()) return;
                setMessages((previousMessages) => [...previousMessages, message.trim()]);
                setMessage('');
            }}
        >
            <pre>{messages.join('\n') || 'No messages yet'}</pre>
            <InputText
                {...inputProps}
                initialValue={message}
                onChangeValue={(value) => {
                    onChangeValue?.(value);
                    setMessage(value);
                }}
            />
        </form>
    );
}

export const ChatLikeInputWithSubmitOnEnter: Story = {
    args: {
        'aria-label': 'Message',
        className: 'input-text',
        keepFocusOnSubmit: true,
        placeholder: 'Type then press Enter',
        submitOnEnter: true,
    },
    render(args) {
        return <ChatLikeInputDemo {...args} />;
    },
};

const DOUBLE_CLICK_TO_EDIT_PROPS = {
    'aria-label': 'Title',
    className: 'input-text-double-click-to-edit',
    doubleClickToEdit: true,
    initialValue: 'Lorem ipsum dolor sit amet',
    name: 'double-click-to-edit-input',
};

export const InputWithDoubleClickToEdit: Story = {
    args: DOUBLE_CLICK_TO_EDIT_PROPS,
};

const DISCARD_ON_ESCAPE_PROPS = {
    'aria-label': 'Title',
    className: 'input-text',
    discardOnEscape: true,
    initialValue: 'Lorem ipsum',
    name: 'discard-on-escape-input',
};

export const InputWithDiscardOnEscape: Story = {
    args: DISCARD_ON_ESCAPE_PROPS,
};

export const InputWithDoubleClickToEditAndDiscardOnEscape: Story = {
    args: {
        ...DISCARD_ON_ESCAPE_PROPS,
        ...DOUBLE_CLICK_TO_EDIT_PROPS,
        name: 'double-click-to-edit-and-discard-on-escape-input',
    },
};

const MULTI_LINE_INPUT_WITH_SUBMIT_ON_ENTER_AND_DOUBLE_CLICK_TO_EDIT_PROPS = {
    ...SUBMIT_ON_ENTER_PROPS,
    'aria-label': 'Note',
    className: 'multi-line-input-double-click-to-edit',
    discardOnEscape: true,
    doubleClickToEdit: true,
    initialValue:
        'Double-click to edit this text, press Enter to submit, or Escape to discard.',
    name: 'multi-line-submit-on-enter-and-double-click-to-edit-input',
};

export const MultiLineInputWithSubmitOnEnterAndDoubleClickToEditAndDiscardOnEscape: Story =
    {
        args: MULTI_LINE_INPUT_WITH_SUBMIT_ON_ENTER_AND_DOUBLE_CLICK_TO_EDIT_PROPS,
        render(args) {
            const [lastSubmitDate, setLastSubmitDate] = useState<Date | null>(null);
            const lastSubmit = lastSubmitDate ? formatDate(lastSubmitDate) : 'never';

            return (
                <form
                    onSubmit={(event: FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                        setLastSubmitDate(new Date());
                    }}
                >
                    <InputText {...args} />
                    <pre>Last submitted: {lastSubmit}</pre>
                </form>
            );
        },
    };

export const InputWithAutoFocus: Story = {
    args: {
        'aria-label': 'Autofocused text',
        autoFocus: true,
        name: 'autofocus-input',
    },
};

export const MultiLineInputWithMinHeight: Story = {
    args: {
        'aria-label': 'Notes',
        className: 'multi-line-input-text',
        initialValue:
            'This textarea has a minHeight of 50px.\n\nTry deleting this text to see that the textarea does not shrink below the minimum height.',
        minHeight: 50,
        multiLine: true,
        name: 'multi-line-min-height-input',
        placeholder: 'enter text of any length',
    },
};

export const MultiLineInputWithMaxHeight: Story = {
    args: {
        'aria-label': 'Notes',
        className: 'multi-line-input-text',
        initialValue:
            'This textarea has a maxHeight of 150px.\n\nLine 3\nLine 4\nLine 5\nLine 6\nLine 7\nLine 8\nLine 9\nLine 10',
        maxHeight: 150,
        multiLine: true,
        name: 'multi-line-max-height-input',
        placeholder: 'enter text of any length',
    },
};

export const MultiLineInputWithMinHeightAndMaxHeight: Story = {
    args: {
        'aria-label': 'Notes',
        className: 'multi-line-input-text',
        initialValue: 'This textarea has minHeight of 100px and maxHeight of 200px.',
        maxHeight: 200,
        minHeight: 100,
        multiLine: true,
        name: 'multi-line-min-max-height-input',
        placeholder: 'enter text of any length',
    },
};

export const MultiLineInputWithCSSTransition: Story = {
    args: {
        'aria-label': 'Quick note',
        className: 'multi-line-input-css-transition',
        multiLine: true,
        name: 'multi-line-input-css-transition',
        placeholder: 'Write a quick note here',
        rows: 4,
    },
};

const MULTI_LINE_INPUT_IN_POPOVER_PROPS = {
    'aria-label': 'Note',
    className: 'multi-line-input-text',
    initialValue:
        'This multi-line input should resize to fit its contents when the popover opens even though it initializes with display: none as a result of being inside a hidden popover element so it doesn’t have any dimensions when the component initially renders.',
    multiLine: true,
    name: 'multi-line-input-in-popover',
    selectTextOnFocus: true,
};

export const MultiLineInputInPopover: Story = {
    args: MULTI_LINE_INPUT_IN_POPOVER_PROPS,
    render(args) {
        return (
            <>
                <button popoverTarget="multi-line-input-popover">Open Popover</button>
                <div
                    className="input-demo-popover"
                    id="multi-line-input-popover"
                    popover="auto"
                >
                    <InputText {...args} />
                </div>
            </>
        );
    },
};

const MULTI_LINE_INPUT_WITH_AUTO_FOCUS_PROPS = {
    'aria-label': 'Note',
    autoFocus: true,
    initialValue: 'This multi-line input should be focused when the popover opens',
    multiLine: true,
    name: 'multi-line-input-with-autofocus-in-popover',
    selectTextOnFocus: true,
};

export const MultiLineInputWithAutoFocusInPopover: Story = {
    args: MULTI_LINE_INPUT_WITH_AUTO_FOCUS_PROPS,
    render(args) {
        return (
            <>
                <button popoverTarget="multi-line-input-with-autofocus-popover">
                    Open Popover
                </button>
                <div
                    className="input-demo-popover"
                    id="multi-line-input-with-autofocus-popover"
                    popover="auto"
                >
                    <InputText {...args} />
                </div>
            </>
        );
    },
};

// A form control needs an accessible name, and a placeholder isn’t one: it
// disappears as soon as the field has a value, and screen readers don’t treat
// it as a label. Every aria-* attribute is forwarded to the underlying
// <input>/<textarea>, so the component can be named and annotated exactly like
// the native element.

export const InputWithVisibleLabel: Story = {
    args: {
        className: 'input-text',
        id: 'labelled-city-input',
        name: 'city',
        placeholder: 'e.g. Montréal',
    },
    parameters: {
        docs: {
            description: {
                story: 'A visible `<label>` tied to the input with `htmlFor`/`id` is the best option: it names the input for assistive tech, and clicking it focuses the input. Prefer this over `aria-label` whenever there is room for a label.',
            },
        },
    },
    render(args) {
        return (
            <div className="input-text-field">
                <label className="input-text-label" htmlFor={args.id}>
                    City
                </label>
                <InputText {...args} />
            </div>
        );
    },
};

export const InputWithAriaLabel: Story = {
    args: {
        'aria-label': 'Search',
        className: 'input-text',
        name: 'search',
        placeholder: 'Search…',
        type: 'search',
    },
    parameters: {
        docs: {
            description: {
                story: 'When a visible label doesn’t fit — a search field in a toolbar, an input beside an icon — `aria-label` names the input instead. It is a fallback for that case, not a replacement for a visible label.',
            },
        },
    },
};

const MIN_PASSPHRASE_LENGTH = 8;

export const InputWithHintAndValidationState: Story = {
    args: {
        className: 'input-text',
        id: 'passphrase-input',
        name: 'passphrase',
        required: true,
        type: 'password',
    },
    parameters: {
        docs: {
            description: {
                story: '`aria-describedby` points at help text so it’s announced along with the label, and `aria-invalid` marks the value as failing validation. The error message is referenced too, and given `role="alert"` so it’s announced when it appears.',
            },
        },
    },
    render(args) {
        const [value, setValue] = useState('');
        const isInvalid = value.length > 0 && value.length < MIN_PASSPHRASE_LENGTH;

        return (
            <div className="input-text-field">
                <label className="input-text-label" htmlFor={args.id}>
                    Passphrase
                </label>
                <InputText
                    {...args}
                    aria-describedby={
                        isInvalid ? 'passphrase-hint passphrase-error' : 'passphrase-hint'
                    }
                    aria-invalid={isInvalid || undefined}
                    onChangeValue={(nextValue) => {
                        args.onChangeValue?.(nextValue);
                        setValue(nextValue);
                    }}
                />
                <p className="input-text-hint" id="passphrase-hint">
                    Use at least {MIN_PASSPHRASE_LENGTH} characters.
                </p>
                {isInvalid ? (
                    <p className="input-text-error" id="passphrase-error" role="alert">
                        {MIN_PASSPHRASE_LENGTH - value.length} more character
                        {MIN_PASSPHRASE_LENGTH - value.length === 1 ? '' : 's'} to go.
                    </p>
                ) : null}
            </div>
        );
    },
};
