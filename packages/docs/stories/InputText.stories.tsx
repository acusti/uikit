import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

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
        const [lastSubmitDate, setLastSubmitDate] = React.useState(null);
        const lastSubmit = lastSubmitDate ? formatDate(lastSubmitDate) : 'never';

        return (
            <form
                onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
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
        name: SUBMIT_ON_ENTER_PROPS.name + '-no-form',
    },
};

export const InputWithDoubleClickToEdit: Story = {
    args: {
        className: 'input-text-double-click-to-edit',
        doubleClickToEdit: true,
        initialValue: 'Lorem ipsum dolor sit amet',
        name: 'double-click-to-edit-input',
    },
};

export const InputWithAutoFocus: Story = {
    args: {
        autoFocus: true,
        name: 'autofocus-input',
    },
};

const MULTI_LINE_INPUT_WITH_AUTO_FOCUS_PROPS = {
    autoFocus: true,
    initialValue: 'This multi-line input should be focused when the popover opens',
    multiLine: true,
    name: 'autofocus-multi-line-input',
    selectTextOnFocus: true,
};

export const MultiLineInputWithAutoFocusInPopover: Story = {
    args: MULTI_LINE_INPUT_WITH_AUTO_FOCUS_PROPS,
    render() {
        return (
            <>
                <button popoverTarget="multi-line-input-with-autofocus-in-popover">
                    Open Popover
                </button>
                <div id="multi-line-input-with-autofocus-in-popover" popover="auto">
                    <InputText {...MULTI_LINE_INPUT_WITH_AUTO_FOCUS_PROPS} />
                </div>
            </>
        );
    },
};
