import { Story } from '@storybook/addon-docs/blocks';
import { Meta } from '@storybook/react';
import * as React from 'react';

import CSSValueInput, { Props } from '@acusti/css-value-input';

export default {
    component: CSSValueInput,
    title: 'UIKit/Inputs/CSSValueInput',
} as Meta;

const Template: Story<Props> = (args) => <CSSValueInput {...args} />;

export const Length = Template.bind({});
Length.args = {
    className: 'my-special-input',
    cssValueType: 'length',
    label: 'Font size',
    onSubmit: () => {},
    placeholder: '24rem',
    unit: 'rem',
};

export const Time = Template.bind({});
Time.args = {
    className: 'my-panel-input',
    cssValueType: 'time',
    label: 'Duration',
    onSubmit: () => {},
    placeholder: '0.25s',
    unit: 's',
};

export const Angle = Template.bind({});
Angle.args = {
    className: 'flex-item-example',
    cssValueType: 'angle',
    label: 'Rotate Z',
    onSubmit: () => {},
    placeholder: '0deg',
    unit: 'deg',
    value: '90deg',
};

export const Percent = Template.bind({});
Percent.args = {
    className: 'highlighted',
    cssValueType: 'percent',
    label: 'Width',
    onSubmit: () => {},
    placeholder: '100%',
    unit: '%',
    value: '25%',
};
