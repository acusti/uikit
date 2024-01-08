import * as React from 'react';

import CSSValueInput from '../../css-value-input/src/CSSValueInput.js';

import './CSSValueInput.css';
import './InputText.css';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof CSSValueInput> = {
    component: CSSValueInput,
    parameters: {
        docs: {
            description: {
                component:
                    '`CSSValueInput` is a React component that renders a text input that can take and update a CSS value of a particular type with a default unit. The input’s behavior is similar to those in design applications such as Adobe Illustrator or XD.',
            },
        },
    },
    //https://storybook.js.org/docs/react/writing-docs/autodocs#setup-automated-documentation
    tags: ['autodocs'],
    title: 'UIKit/Controls/CSSValueInput',
};

export default meta;

type Story = StoryObj<typeof CSSValueInput>;

export const Length: Story = {
    args: {
        className: 'my-special-input',
        cssValueType: 'length',
        label: 'Font size',
        name: 'fontsize',
        placeholder: '1rem',
        tabIndex: 1,
        unit: 'rem',
        validator:
            /^(xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large|inherit)$/,
        value: '24px',
    },
};

export const Time: Story = {
    args: {
        className: 'my-panel-input',
        cssValueType: 'time',
        label: 'Duration',
        max: 20,
        min: 0,
        name: 'duration',
        placeholder: '0.25s',
        step: 0.1,
        unit: 's',
    },
};

export const Angle: Story = {
    args: {
        className: 'flex-item-example',
        cssValueType: 'angle',
        icon: (
            <svg
                width="100px"
                height="100px"
                viewBox="0 0 100 100"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
            >
                <g stroke="none" strokeWidth="1" fill="none">
                    <g transform="translate(2, 2)" stroke="#222F3E" strokeWidth="4">
                        <path
                            d="M56.5106952,10.5464071 C60.8135865,11.5200327 64.8423906,13.2161538 68.4628809,15.5005439 L76.8618891,8.97963811 L87.0203619,19.1381109 L80.4994561,27.5371191 C82.7838462,31.1576094 84.4799673,35.1864135 85.4535929,39.4893048 L96,40.816875 L96,55.183125 L85.4535929,56.5106952 C84.4799673,60.8135865 82.7838462,64.8423906 80.4994561,68.4628809 L87.0203619,76.8618891 L76.8618891,87.0203619 L68.4628809,80.4994561 C64.8423906,82.7838462 60.8135865,84.4799673 56.5106952,85.4535929 L55.183125,96 L40.816875,96 L39.4893048,85.4535929 C35.1864135,84.4799673 31.1576094,82.7838462 27.5371191,80.4994561 L19.1381109,87.0203619 L8.97963811,76.8618891 L15.5005439,68.4628809 C13.2161538,64.8423906 11.5200327,60.8135865 10.5464071,56.5106952 L0,55.183125 L0,40.816875 L10.5464071,39.4893048 C11.5200327,35.1864135 13.2161538,31.1576094 15.5005439,27.5371191 L8.97963811,19.1381109 L19.1381109,8.97963811 L27.5371191,15.5005439 C31.1576094,13.2161538 35.1864135,11.5200327 39.4893048,10.5464071 L40.816875,0 L55.183125,0 L56.5106952,10.5464071 Z"
                            id="Layer-1"
                        ></path>
                        <circle cx="48" cy="48" r="14.4"></circle>
                    </g>
                </g>
            </svg>
        ),
        label: 'Rotate Z',
        name: 'rotatez',
        placeholder: '0deg',
        step: 45,
        unit: 'deg',
        value: '90deg',
    },
};

export const Percent: Story = {
    args: {
        cssValueType: 'percent',
        label: 'Width',
        min: 0,
        name: 'width',
        placeholder: '100%',
        step: 10,
        unit: '%',
        value: '30%',
    },
};

export const LabelLess: Story = {
    args: {
        className: 'my-special-input',
        cssValueType: 'length',
        name: 'labelless',
        placeholder: '1rem',
        title: 'No label',
        unit: 'rem',
        value: '24px',
    },
};

export const CustomGetValueAsNumber: Story = {
    args: {
        className: 'letter-spacing',
        getValueAsNumber: (value) => {
            if (typeof value === 'number') return value;
            // “normal” for letter-spacing is effectively equivalent to 0
            if (typeof value === 'string' && value.toLowerCase() === 'normal') {
                return 0;
            }
            return parseFloat(value);
        },
        label: 'Letter spacing',
        name: 'letterspacing',
        placeholder: 'normal',
        tabIndex: 2,
    },
};

export const BackgroundSize: Story = {
    args: {
        className: 'background-size',
        label: 'Background Size',
        name: 'backgroundsize',
        unit: '%',
        validator: /^(auto|contain|cover)$/,
        value: 'cover',
    },
};

export const ZIndex: Story = {
    args: {
        cssValueType: 'integer',
        label: 'z-index',
        name: 'zindex',
        value: '0',
    },
};

export const NumberValue: Story = {
    args: {
        cssValueType: 'integer',
        label: 'opacity',
        name: 'opacity',
        value: 0,
    },
};

export const LineHeight: Story = {
    args: {
        cssValueType: 'length',
        label: 'line height',
        name: 'line-height',
        step: 0.1,
        unit: '',
        value: 1.4,
    },
};
