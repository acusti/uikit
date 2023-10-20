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

const { Fragment, useCallback, useState } = React;

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
    const [month, setMonth] = useState(initialMonth);
    // In two-up view we see 1 more month, so monthLimitLast needs to be 1 less
    if (isTwoUp && monthLimitLast != null) {
        monthLimitLast -= 1;
    }

    const handleClickLeftArrow = useCallback(() => {
        setMonth((existingMonth) =>
            monthLimitFirst == null || existingMonth > monthLimitFirst
                ? existingMonth - 1
                : existingMonth,
        );
    }, [monthLimitFirst]);

    const handleClickRightArrow = useCallback(() => {
        setMonth((existingMonth) =>
            monthLimitLast == null || existingMonth < monthLimitLast
                ? existingMonth + 1
                : existingMonth,
        );
    }, [monthLimitLast]);

    return (
        <Fragment>
            <Style>{STYLES}</Style>
            <div
                className={clsx(ROOT_CLASS_NAME, className, {
                    'two-up': isTwoUp,
                })}
            >
                <div className={`${ROOT_CLASS_NAME}-range-arrow-wrap`}>
                    <div
                        className={clsx(`${ROOT_CLASS_NAME}-range-arrow left-arrow`, {
                            disabled: monthLimitFirst != null && month <= monthLimitFirst,
                        })}
                        onClick={handleClickLeftArrow}
                    />
                    <div
                        className={clsx(`${ROOT_CLASS_NAME}-range-arrow right-arrow`, {
                            disabled: monthLimitLast != null && month >= monthLimitLast,
                        })}
                        onClick={handleClickRightArrow}
                    />
                </div>
                <div className={`${ROOT_CLASS_NAME}-month-container`}>
                    <MonthCalendar
                        dateEnd={dateEnd}
                        dateStart={dateStart}
                        month={month}
                        title={
                            useMonthAbbreviations
                                ? getAbbreviatedMonthTitle(month)
                                : undefined
                        }
                    />
                    {isTwoUp ? (
                        <MonthCalendar
                            dateEnd={dateEnd}
                            dateStart={dateStart}
                            month={month + 1}
                            title={
                                useMonthAbbreviations
                                    ? getAbbreviatedMonthTitle(month + 1)
                                    : undefined
                            }
                        />
                    ) : null}
                </div>
            </div>
        </Fragment>
    );
}
