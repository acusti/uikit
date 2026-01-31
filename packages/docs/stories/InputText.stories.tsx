import type { Meta, StoryObj } from '@storybook/react-vite';
import { type FormEvent, useState } from 'react';
import { fn } from 'storybook/test';

import InputText from '../../input-text/src/InputText.js';

import './InputText.css';

const meta: Meta<typeof InputText> = {
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
        className: 'input-text',
        name: 'empty',
        // NOTE spies are a workaround for a bug related to implicit arg detection
        onBlur: fn(),
        onChange: fn(),
        onChangeValue: fn(),
        onFocus: fn(),
        onKeyDown: fn(),
        onKeyUp: fn(),
        placeholder: 'enter text here…',
    },
};

export const InputWithInitialValue: Story = {
    args: {
        className: 'input-text',
        initialValue: 'Bolivia',
        placeholder: 'enter country name',
    },
};

export const InputWithInitialValueAndSelectTextOnFocus: Story = {
    args: {
        className: 'input-text',
        initialValue: 'Bolivia',
        name: 'country',
        placeholder: 'enter country name (selectTextOnFocus)',
        selectTextOnFocus: true,
    },
};

export const MultiLineInputWithInitialValueAndSelectTextOnFocus: Story = {
    args: {
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
    render() {
        const [lastSubmitDate, setLastSubmitDate] = useState<Date | null>(null);
        const lastSubmit = lastSubmitDate ? formatDate(lastSubmitDate) : 'never';

        return (
            <form
                onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    setLastSubmitDate(new Date());
                }}
            >
                <InputText {...SUBMIT_ON_ENTER_PROPS} />
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
};

const DOUBLE_CLICK_TO_EDIT_PROPS = {
    className: 'input-text-double-click-to-edit',
    doubleClickToEdit: true,
    initialValue: 'Lorem ipsum dolor sit amet',
    name: 'double-click-to-edit-input',
};

export const InputWithDoubleClickToEdit: Story = {
    args: DOUBLE_CLICK_TO_EDIT_PROPS,
};

const DISCARD_ON_ESCAPE_PROPS = {
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

export const InputWithAutoFocus: Story = {
    args: {
        autoFocus: true,
        name: 'autofocus-input',
    },
};

export const MultiLineInputWithMinHeight: Story = {
    args: {
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
        className: 'multi-line-input-css-transition',
        multiLine: true,
        name: 'multi-line-input-css-transition',
        placeholder: 'Write a quick note here',
        rows: 4,
    },
};

const MULTI_LINE_INPUT_IN_POPOVER_PROPS = {
    className: 'multi-line-input-text',
    initialValue:
        'This multi-line input should resize to fit its contents when the popover opens even though it initializes with display: none as a result of being inside a hidden popover element so it doesn’t have any dimensions when the component initially renders.',
    multiLine: true,
    name: 'multi-line-input-in-popover',
    selectTextOnFocus: true,
};

export const MultiLineInputInPopover: Story = {
    args: MULTI_LINE_INPUT_IN_POPOVER_PROPS,
    render() {
        return (
            <>
                <button popoverTarget="multi-line-input-popover">Open Popover</button>
                <div id="multi-line-input-popover" popover="auto">
                    <InputText {...MULTI_LINE_INPUT_IN_POPOVER_PROPS} />
                </div>
            </>
        );
    },
};

const MULTI_LINE_INPUT_WITH_AUTO_FOCUS_PROPS = {
    autoFocus: true,
    initialValue: 'This multi-line input should be focused when the popover opens',
    multiLine: true,
    name: 'multi-line-input-with-autofocus-in-popover',
    selectTextOnFocus: true,
};

export const MultiLineInputWithAutoFocusInPopover: Story = {
    args: MULTI_LINE_INPUT_WITH_AUTO_FOCUS_PROPS,
    render() {
        return (
            <>
                <button popoverTarget="multi-line-input-with-autofocus-popover">
                    Open Popover
                </button>
                <div id="multi-line-input-with-autofocus-popover" popover="auto">
                    <InputText {...MULTI_LINE_INPUT_WITH_AUTO_FOCUS_PROPS} />
                </div>
            </>
        );
    },
};
