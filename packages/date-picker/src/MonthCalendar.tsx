import { Style } from '@acusti/styling';
import clsx from 'clsx';
import * as React from 'react';

import { getMonthNameFromMonth, getYearFromMonth } from './utils.js';
import { ROOT_CLASS_NAME, STYLES } from './styles/month-calendar.js';

export type Props = {
    className?: string;
    month: number; // a unique numerical value representing the number of months since jan 1970
    onChange?: (event: React.SyntheticEvent<HTMLElement>) => void;
    title?: string;
};

const { Fragment, useCallback } = React;

const DAYS = Array(7).fill(null);

export default function MonthCalendar({ className, month, onChange, title }: Props) {
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
                                    return (
                                        <div
                                            className={`${ROOT_CLASS_NAME}-month-day-item`}
                                            key={`MonthDayItem-${dayNumber}`}
                                            onClick={handleClickDay}
                                        >
                                            <span className="month-day-item-text">
                                                {dayNumber < 1 || dayNumber > totalDays
                                                    ? ''
                                                    : dayNumber}
                                            </span>
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
