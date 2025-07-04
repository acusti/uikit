import { Style } from '@acusti/styling';
import clsx from 'clsx';
import { Fragment } from 'react';

import { ROOT_CLASS_NAME, STYLES } from './styles/month-calendar.js';
import {
    getDateFromMonthAndDay,
    getLastDateFromMonth,
    getMonthFromDate,
    getMonthNameFromMonth,
    getYearFromMonth,
} from './utils.js';

export type Props = {
    className?: string;
    dateEnd?: Date | null | number | string;
    dateEndPreview?: null | string;
    dateStart?: Date | null | number | string;
    isRange?: boolean;
    month: number; // a unique numerical value representing the number of months since jan 1970
    onChange?: (date: string) => void;
    onChangeEndPreview?: (date: string) => void;
    title?: string;
};

type DateRangeDays = [null | number, null | number, null | number];

const DAYS = Array(7).fill(null);

export default function MonthCalendar({
    className,
    dateEnd,
    dateEndPreview,
    dateStart,
    isRange,
    month,
    onChange,
    onChangeEndPreview,
    title,
}: Props) {
    const year = getYearFromMonth(month);
    title = title ?? `${getMonthNameFromMonth(month)} ${year}`;
    const firstDate = getDateFromMonthAndDay(month, 1);
    const lastDate = getLastDateFromMonth(month);
    const totalDays = lastDate.getDate();
    const firstDay = firstDate.getDay();
    const spacesAfterLastDay = 7 - (lastDate.getDay() % 7); // prettier-ignore
    const daySpaces = totalDays + firstDay + spacesAfterLastDay;

    const [dateRangeStartDay, dateRangeEndDay, dateRangeEndPreviewDay]: DateRangeDays = [
        dateStart,
        dateEnd,
        dateEndPreview,
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
        [null, null, null],
    );

    const handleClickDay = (event: React.SyntheticEvent<HTMLElement>) => {
        const { date } = event.currentTarget.dataset;
        if (date && onChange) onChange(date);
    };

    const handleMouseEnterDay = (event: React.SyntheticEvent<HTMLElement>) => {
        if (isRange && onChangeEndPreview) {
            const { date } = event.currentTarget.dataset;
            if (date) onChangeEndPreview(date);
        }
    };

    return (
        <Fragment>
            <Style href="@acusti/date-picker/MonthCalendar">{STYLES}</Style>
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
                                {DAYS.map((__, dayIndex) => {
                                    dayIndex += weekIndex * 7;
                                    const dayNumber = (dayIndex - firstDay) + 1; // prettier-ignore
                                    const isEmpty =
                                        dayNumber < 1 || dayNumber > totalDays;
                                    const date = isEmpty
                                        ? null
                                        : getDateFromMonthAndDay(month, dayNumber);
                                    const isAfterDateRangeStart =
                                        dateRangeStartDay != null &&
                                        dayNumber > dateRangeStartDay;
                                    const isBeforeDateRangeEnd =
                                        (dateRangeEndDay == null &&
                                            dateRangeEndPreviewDay != null &&
                                            dayNumber < dateRangeEndPreviewDay) ||
                                        (dateRangeEndDay != null &&
                                            dayNumber < dateRangeEndDay);

                                    return (
                                        <button
                                            className={clsx(
                                                `${ROOT_CLASS_NAME}-month-day-item`,
                                                {
                                                    'end-date':
                                                        !isEmpty &&
                                                        dayNumber === dateRangeEndDay,
                                                    'is-empty': isEmpty,
                                                    'is-selected':
                                                        !isEmpty &&
                                                        isAfterDateRangeStart &&
                                                        isBeforeDateRangeEnd,
                                                    'start-date':
                                                        !isEmpty &&
                                                        dayNumber === dateRangeStartDay,
                                                },
                                            )}
                                            data-date={date?.toISOString()}
                                            disabled={isEmpty}
                                            key={`MonthDayItem-${dayNumber}`}
                                            onClick={handleClickDay}
                                            onMouseEnter={handleMouseEnterDay}
                                            type="button"
                                        >
                                            {isEmpty ? null : (
                                                <span className="month-day-item-text">
                                                    {dayNumber}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                </div>
            </div>
        </Fragment>
    );
}
