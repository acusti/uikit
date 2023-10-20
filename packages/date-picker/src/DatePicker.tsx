import { Style } from '@acusti/styling';
import clsx from 'clsx';
import * as React from 'react';

import {
    getMonthAbbreviationFromMonth,
    getMonthFromDate,
    getYearFromMonth,
} from './utils.js';
import { ROOT_CLASS_NAME, STYLES } from './styles/date-picker.js';

import MonthCalendar from './MonthCalendar.js';

export type Props = {
    className?: string;
    dateEnd?: Date | string | number;
    dateStart?: Date | string | number;
    initialMonth?: number;
    isTwoUp?: boolean;
    monthLimitFirst?: number;
    monthLimitLast?: number;
    useMonthAbbreviations?: boolean;
};

const { Fragment, useCallback } = React;

const getAbbreviatedMonthTitle = (month: number) =>
    `${getMonthAbbreviationFromMonth(month)} ${getYearFromMonth(month)}`;

export default function DatePicker({
    className,
    dateEnd,
    dateStart,
    isTwoUp,
    initialMonth,
    monthLimitFirst,
    monthLimitLast,
    useMonthAbbreviations,
}: Props) {
    if (initialMonth == null) {
        // Use dateStart if it’s set
        const initialDate = dateStart == null ? new Date() : new Date(dateStart);
        initialMonth = getMonthFromDate(initialDate);
        if (isTwoUp && dateStart == null) {
            initialMonth -= 1;
        }
    }

    return (
        <Fragment>
            <Style>{STYLES}</Style>
            <div className={clsx(ROOT_CLASS_NAME, className)}>
                <div className={`${ROOT_CLASS_NAME}-range-arrow-wrap`}>
                    <div className={`${ROOT_CLASS_NAME}-range-arrow left-arrow`} />
                    <div className={`${ROOT_CLASS_NAME}-range-arrow right-arrow`} />
                </div>
                <div className={`${ROOT_CLASS_NAME}-month-container`}>
                    <MonthCalendar
                        dateEnd={dateEnd}
                        dateStart={dateStart}
                        month={initialMonth}
                        title={
                            useMonthAbbreviations
                                ? getAbbreviatedMonthTitle(initialMonth)
                                : undefined
                        }
                    />
                    {isTwoUp ? (
                        <MonthCalendar
                            dateEnd={dateEnd}
                            dateStart={dateStart}
                            month={initialMonth + 1}
                            title={
                                useMonthAbbreviations
                                    ? getAbbreviatedMonthTitle(initialMonth + 1)
                                    : undefined
                            }
                        />
                    ) : null}
                </div>
            </div>
        </Fragment>
    );
}
