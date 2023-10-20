import { Style } from '@acusti/styling';
import clsx from 'clsx';
import * as React from 'react';

import { getMonthFromDate, getMonthNameFromMonth, getYearFromMonth } from './utils.js';
import { ROOT_CLASS_NAME, STYLES } from './styles/month-calendar.js';

export type Props = {
    className?: string;
    dateRangeStart?: Date | string | number;
    dateRangeEnd?: Date | string | number;
    month: number; // a unique numerical value representing the number of months since jan 1970
    onChange?: (event: React.SyntheticEvent<HTMLElement>) => void;
    title?: string;
};

type DateRangeDays = [number | null, number | null];

const { Fragment, useCallback } = React;

const DAYS = Array(7).fill(null);

export default function MonthCalendar({
    className,
    dateRangeEnd,
    dateRangeStart,
    month,
    onChange,
    title,
}: Props) {
    const year = getYearFromMonth(month);
    title = title || `${getMonthNameFromMonth(month)} ${year}`;
    const monthWithinYear = month % 12;
    const firstDate = new Date(year, monthWithinYear, 1);
    const nextMonth = month + 1;
    const lastDate = new Date(getYearFromMonth(nextMonth), nextMonth % 12, 1);
    lastDate.setDate(lastDate.getDate() - 1);
    const totalDays = lastDate.getDate();
    const firstDay = firstDate.getDay();
    const spacesAfterLastDay = 7 - (lastDate.getDay() % 7); // prettier-ignore
    const daySpaces = totalDays + firstDay + spacesAfterLastDay;

    const [dateRangeStartDay, dateRangeEndDay]: DateRangeDays = [
        dateRangeStart,
        dateRangeEnd,
    ].reduce(
        (acc: DateRangeDays, date, index) => {
            if (date != null && !(date instanceof Date)) {
                date = new Date(date);
            }
            if (date == null || Number.isNaN(date.getTime())) return acc;

            const dateMonth = getMonthFromDate(date);
            if (dateMonth < month) acc[index] = -1;
            else if (dateMonth > month) acc[index] = totalDays + 1;
            else acc[index] = date.getDate();
            if (index === 1) {
                const startDay = acc[index - 1];
                const endDay = acc[index];
                // Ensure that end date is after start date and swap them if not
                if (startDay != null && endDay != null && startDay > endDay) {
                    acc[index - 1] = endDay;
                    acc[index] = startDay;
                }
            }

            return acc;
        },
        [null, null],
    );

    const handleClickDay = useCallback(
        (event: React.SyntheticEvent<HTMLElement>) => {
            if (onChange) onChange(event);
        },
        [onChange],
    );

    return (
        <Fragment>
            <Style>{STYLES}</Style>
            <div className={clsx(ROOT_CLASS_NAME, className)}>
                <div className={`${ROOT_CLASS_NAME}-month-title`}>
                    <h3 className={`${ROOT_CLASS_NAME}-month-title-text`}>{title}</h3>
                </div>
                <div className={`${ROOT_CLASS_NAME}-month-week`}>
                    <div className="week-day-item">
                        <span className="week-day-item-text">Su</span>
                    </div>
                    <div className="week-day-item">
                        <span className="week-day-item-text">Mo</span>
                    </div>
                    <div className="week-day-item">
                        <span className="week-day-item-text">Tu</span>
                    </div>
                    <div className="week-day-item">
                        <span className="week-day-item-text">We</span>
                    </div>
                    <div className="week-day-item">
                        <span className="week-day-item-text">Th</span>
                    </div>
                    <div className="week-day-item">
                        <span className="week-day-item-text">Fr</span>
                    </div>
                    <div className="week-day-item">
                        <span className="week-day-item-text">Sa</span>
                    </div>
                </div>
                <div className={`${ROOT_CLASS_NAME}-month-days`}>
                    {Array(Math.floor(daySpaces / 7))
                        .fill(null)
                        .map((_, weekIndex) => (
                            <div
                                className={`${ROOT_CLASS_NAME}-month-row`}
                                key={`MonthRow-${weekIndex}`}
                            >
                                {DAYS.map((_, dayIndex) => {
                                    dayIndex += weekIndex * 7;
                                    const dayNumber = (dayIndex - firstDay) + 1; // prettier-ignore
                                    const isEmpty =
                                        dayNumber < 1 || dayNumber > totalDays;
                                    const isAfterDateRangeStart =
                                        dateRangeStartDay != null &&
                                        dayNumber > dateRangeStartDay;
                                    const isBeforeDateRangeEnd =
                                        dateRangeEndDay == null ||
                                        dayNumber < dateRangeEndDay;

                                    return (
                                        <div
                                            className={clsx(
                                                `${ROOT_CLASS_NAME}-month-day-item`,
                                                {
                                                    'is-empty': isEmpty,
                                                    'is-selected':
                                                        !isEmpty &&
                                                        isAfterDateRangeStart &&
                                                        isBeforeDateRangeEnd,
                                                    'end-date':
                                                        !isEmpty &&
                                                        dayNumber === dateRangeEndDay,
                                                    'start-date':
                                                        !isEmpty &&
                                                        dayNumber === dateRangeStartDay,
                                                },
                                            )}
                                            key={`MonthDayItem-${dayNumber}`}
                                            onClick={handleClickDay}
                                        >
                                            {isEmpty ? null : (
                                                <span className="month-day-item-text">
                                                    {dayNumber}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                </div>
            </div>
        </Fragment>
    );
}
