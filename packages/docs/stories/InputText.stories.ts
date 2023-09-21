import InputText from '../../input-text/src/InputText.js';

import './InputText.css';

import type { Meta, StoryObj } from '@storybook/react';

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
        initialValue: 'Concerning the UFO Sighting near Highland, Illinois',
        maxHeight: 600,
        multiLine: true,
        name: 'multi-line-input',
        placeholder: 'enter text of any length',
        selectTextOnFocus: true,
    },
};
