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
                    '`InputText` is a React component that renders a textual input (`type: "text"|"email"|"number"|"password"|"search"|"tel"|"url"`) that is uncontrolled, but whose value is overwritten whenever `props.initialValue` changes. Also, if `props.selectTextOnFocus` is true, it selects the entire contents of the input whenever the input is focused.',
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

// TODO how do i wrap this in a <form onSubmit={() => {console.log('form submitted')}}>?
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