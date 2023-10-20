import MonthCalendar from '../../date-picker/src/MonthCalendar.js';
import { getMonthFromDate } from '../../date-picker/src/index.js';

import './MonthCalendar.css';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof MonthCalendar> = {
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
    title: 'UIKit/Controls/MonthCalendar',
};

export default meta;

type Story = StoryObj<typeof MonthCalendar>;

export const ThisMonthsCalendar: Story = {
    args: {
        className: 'month-calendar-story',
        month: getMonthFromDate(new Date()),
    },
};

export const February1985MonthCalendar: Story = {
    args: {
        className: 'february-month-calendar-story',
        month: 181,
    },
};
