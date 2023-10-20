import { getMonthFromDate, MonthCalendar } from '../../date-picker/src/index.js';

import './MonthCalendar.css';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof MonthCalendar> = {
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
    component: MonthCalendar,
    parameters: {
        docs: {
            description: {
                component:
                    '`MonthCalendar` is a React component that renders a calendar UI for the given month.',
            },
        },
    },
    //https://storybook.js.org/docs/react/writing-docs/autodocs#setup-automated-documentation
    tags: ['autodocs'],
    title: 'UIKit/Controls/DatePicker/MonthCalendar',
};

export default meta;

type Story = StoryObj<typeof MonthCalendar>;

export const ThisMonthsCalendar: Story = {
    args: {
        className: 'month-calendar-story',
        month: getMonthFromDate(new Date()),
    },
};

export const February1985Calendar: Story = {
    args: {
        className: 'february-month-calendar-story',
        month: 181,
    },
};

export const DateRangeDiwaliCalendar: Story = {
    args: {
        className: 'date-range-month-calendar-story',
        dateEnd: new Date(2023, 10, 14),
        dateStart: new Date(2023, 10, 9),
        month: getMonthFromDate(new Date(2023, 10, 1)),
    },
};
