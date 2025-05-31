import type { Meta, StoryObj } from '@storybook/react-vite';

import { DatePicker, getMonthFromDate } from '@acusti/date-picker';
import * as React from 'react';

import './DatePicker.css';

const { useState } = React;

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

const DATE_RANGE_NAVIDAD_DIA_DE_LOS_REYES_PROPS = {
    className: 'date-range-date-picker-story',
    dateEnd: new Date(2024, 0, 6).toISOString(),
    dateStart: new Date(2023, 11, 25).toISOString(),
    isTwoUp: true,
};

export const DateRangeNavidadDiaDeLosReyesDatePicker: Story = {
    args: DATE_RANGE_NAVIDAD_DIA_DE_LOS_REYES_PROPS,
    render() {
        const [dateStart, setDateStart] = useState(
            DATE_RANGE_NAVIDAD_DIA_DE_LOS_REYES_PROPS.dateStart,
        );
        const [dateEnd, setDateEnd] = useState(
            DATE_RANGE_NAVIDAD_DIA_DE_LOS_REYES_PROPS.dateEnd,
        );

        return (
            <DatePicker
                {...DATE_RANGE_NAVIDAD_DIA_DE_LOS_REYES_PROPS}
                dateEnd={dateEnd}
                dateStart={dateStart}
                onChange={(update) => {
                    if (update.dateEnd != null) setDateEnd(update.dateEnd);
                    if (update.dateStart != null) setDateStart(update.dateStart);
                }}
            />
        );
    },
};

export const NoFutureTwoUpDatePicker: Story = {
    args: {
        className: 'no-future-two-up-date-picker-story',
        isTwoUp: true,
        monthLimitLast: getMonthFromDate(new Date()),
    },
};

export const ShowEndInitiallyDatePicker: Story = {
    args: {
        className: 'no-future-two-up-date-picker-story',
        dateEnd: new Date(1234, 0, 1).toISOString(),
        dateStart: new Date(1233, 0, 1).toISOString(),
        isTwoUp: true,
        showEndInitially: true,
    },
};
