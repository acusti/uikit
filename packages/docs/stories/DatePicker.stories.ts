import { DatePicker, getMonthFromDate } from '../../date-picker/src/index.js';

import './DatePicker.css';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof DatePicker> = {
    argTypes: {
        dateEnd: {
            control: 'date',
            description: '(optional) end date of current date range',
        },
        dateStart: {
            control: 'date',
            description: '(optional) start date of current date range',
        },
    },
    component: DatePicker,
    parameters: {
        docs: {
            description: {
                component:
                    '`DatePicker` is a React component that renders a calendar-based date picker UI with support for date ranges.',
            },
        },
    },
    //https://storybook.js.org/docs/react/writing-docs/autodocs#setup-automated-documentation
    tags: ['autodocs'],
    title: 'UIKit/Controls/DatePicker/DatePicker',
};

export default meta;

type Story = StoryObj<typeof DatePicker>;

export const DefaultDatePicker: Story = {
    args: {
        className: 'default-date-picker-story',
    },
};

export const TwoUpDatePicker: Story = {
    args: {
        className: 'two-up-date-picker-story',
        isTwoUp: true,
    },
};

export const DateRangeNavidadDiaDeLosReyesDatePicker: Story = {
    args: {
        className: 'date-range-date-picker-story',
        dateEnd: new Date(2024, 0, 6),
        dateStart: new Date(2023, 11, 25),
        isTwoUp: true,
    },
};

export const NoFutureTwoUpDatePicker: Story = {
    args: {
        className: 'no-future-two-up-date-picker-story',
        isTwoUp: true,
        monthLimitLast: getMonthFromDate(new Date()),
    },
};
