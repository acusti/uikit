import { Meta, Story } from '@storybook/react';
import * as React from 'react';

import CSSValueInput, { Props } from '@acusti/css-value-input';

export default {
    component: CSSValueInput,
    title: '@acusti/css-value-input',
} as Meta;

const Template: Story<Props> = (args) => <CSSValueInput {...args} />;

export const Length = Template.bind({});
Length.args = {
    cssValueType: 'length',
    label: 'Font size',
    onSubmit: () => {},
    placeholder: '24rem',
    unit: 'rem',
};

export const Time = Template.bind({});
Time.args = {
    cssValueType: 'time',
    label: 'Duration',
    onSubmit: () => {},
    placeholder: '0.25s',
    unit: 's',
};

export const Angle = Template.bind({});
Angle.args = {
    cssValueType: 'angle',
    label: 'Rotate Z',
    onSubmit: () => {},
    placeholder: '0deg',
    unit: 'deg',
    value: '90deg',
};

export const Percent = Template.bind({});
Percent.args = {
    cssValueType: 'percent',
    label: 'Width',
    onSubmit: () => {},
    placeholder: '100%',
    unit: '%',
    value: '25%',
};
