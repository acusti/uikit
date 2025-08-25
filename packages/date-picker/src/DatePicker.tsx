import { Style } from '@acusti/styling';
import clsx from 'clsx';
import { Fragment, useEffect, useRef, useState } from 'react';

import MonthCalendar from './MonthCalendar.js';
import { ROOT_CLASS_NAME, STYLES } from './styles/date-picker.js';
import {
    getMonthAbbreviationFromMonth,
    getMonthFromDate,
    getYearFromMonth,
} from './utils.js';

export type Props = {
    className?: string;
    dateEnd?: Date | null | number | string;
    dateStart?: Date | null | number | string;
    initialMonth?: number;
    isRange?: boolean;
    isTwoUp?: boolean;
    monthLimitFirst?: number;
    monthLimitLast?: number;
    onChange: (payload: { dateEnd?: null | string; dateStart: string }) => void;
    /**
     * Boolean to specify that date picker should initially render with the
     * end date’s month visible. The default behavior is to initially render
     * with the start date’s month visible.
     */
    showEndInitially?: boolean;
    useMonthAbbreviations?: boolean;
};

const getAbbreviatedMonthTitle = (month: number) =>
    `${getMonthAbbreviationFromMonth(month)} ${getYearFromMonth(month)}`;

const normalizeDate = (date: Date | null | number | string | undefined) => {
    if (date == null || date === '') return null;
    return typeof date === 'string' ? date : new Date(date).toISOString();
};

export default function DatePicker({
    className,
    dateEnd: _dateEnd,
    dateStart: _dateStart,
    initialMonth,
    isRange: _isRange,
    isTwoUp,
    monthLimitFirst,
    monthLimitLast: _monthLimitLast,
    onChange,
    showEndInitially,
    useMonthAbbreviations,
}: Props) {
    const isRange = _isRange ?? _dateEnd != null;
    // In two-up view we see 1 more month, so monthLimitLast needs to be 1 less
    const monthLimitLast =
        isTwoUp && _monthLimitLast != null ? _monthLimitLast - 1 : _monthLimitLast;
    const dateEndFromProps = normalizeDate(_dateEnd);
    const dateStartFromProps = normalizeDate(_dateStart);
    const [dateEnd, setDateEnd] = useState(dateEndFromProps);
    const [dateStart, setDateStart] = useState(dateStartFromProps);
    const updatingDateEndRef = useRef(false);

    useEffect(() => {
        if (dateEndFromProps == null) return;
        setDateEnd(dateEndFromProps);
    }, [dateEndFromProps]);

    useEffect(() => {
        if (dateStartFromProps == null) return;
        setDateStart(dateStartFromProps);
    }, [dateStartFromProps]);

    if (initialMonth == null) {
        // if no valid initial date, initially show present month as date end
        const useDateEnd = dateStart == null || Boolean(showEndInitially && dateEnd);
        // use date from props if set
        const initialDate = useDateEnd ? dateEnd : dateStart;
        initialMonth = getMonthFromDate(
            initialDate == null ? new Date() : new Date(initialDate),
        );
        if (useDateEnd && isTwoUp) {
            initialMonth -= 1;
        }
    }

    // clamp initial month to monthLimit bounds
    const maxInitialMonth =
        (monthLimitLast == null ? Number.MAX_SAFE_INTEGER : monthLimitLast) +
        (isTwoUp ? -1 : 0);
    initialMonth = Math.max(
        Math.min(initialMonth, maxInitialMonth),
        monthLimitFirst ?? Number.MIN_SAFE_INTEGER,
    );
    const [month, setMonth] = useState<number>(initialMonth);
    const [dateEndPreview, setDateEndPreview] = useState<null | string>(null);

    const delta = isTwoUp ? 2 : 1;

    const handleClickLeftArrow = () => {
        setMonth((existingMonth: number) =>
            Math.max(existingMonth - delta, monthLimitFirst ?? -Infinity),
        );
    };

    const handleClickRightArrow = () => {
        setMonth((existingMonth: number) =>
            Math.min(existingMonth + delta, monthLimitLast ?? Infinity),
        );
    };

    const handleChange = (date: string) => {
        // If we last set the dateStart or we have a dateStart but no dateEnd, set dateEnd
        if (
            isRange &&
            dateStart != null &&
            (updatingDateEndRef.current || dateEnd == null)
        ) {
            // Ensure that dateEnd is after dateStart; if not, swap them
            if (date < dateStart) {
                setDateStart(date);
                setDateEnd(dateStart);
                onChange({ dateEnd: dateStart, dateStart: date });
            } else {
                setDateEnd(date);
                onChange({ dateEnd: date, dateStart });
            }
            updatingDateEndRef.current = false;
        } else {
            setDateStart(date);
            setDateEnd(null);
            if (isRange) {
                onChange({ dateEnd: null, dateStart: date });
                updatingDateEndRef.current = true;
            } else {
                onChange({ dateStart: date });
            }
        }
    };

    const handleChangeEndPreview = (date: string) => {
        setDateEndPreview(date);
    };

    return (
        <Fragment>
            <Style href="@acusti/date-picker/DatePicker">{STYLES}</Style>
            <div
                className={clsx(ROOT_CLASS_NAME, className, {
                    'two-up': isTwoUp,
                })}
            >
                <div className={`${ROOT_CLASS_NAME}-range-arrow-wrap`}>
                    <button
                        aria-label="Previous Month"
                        className={clsx(`${ROOT_CLASS_NAME}-range-arrow left-arrow`, {
                            disabled: monthLimitFirst != null && month <= monthLimitFirst,
                        })}
                        onClick={handleClickLeftArrow}
                        type="button"
                    />
                    <button
                        aria-label="Next Month"
                        className={clsx(`${ROOT_CLASS_NAME}-range-arrow right-arrow`, {
                            disabled: monthLimitLast != null && month >= monthLimitLast,
                        })}
                        onClick={handleClickRightArrow}
                        type="button"
                    />
                </div>
                <div className={`${ROOT_CLASS_NAME}-month-container`}>
                    <MonthCalendar
                        dateEnd={dateEnd}
                        dateEndPreview={dateEndPreview}
                        dateStart={dateStart}
                        isRange={isRange}
                        month={month}
                        onChange={handleChange}
                        onChangeEndPreview={handleChangeEndPreview}
                        title={
                            useMonthAbbreviations
                                ? getAbbreviatedMonthTitle(month)
                                : undefined
                        }
                    />
                    {isTwoUp ? (
                        <MonthCalendar
                            dateEnd={dateEnd}
                            dateEndPreview={dateEndPreview}
                            dateStart={dateStart}
                            isRange={isRange}
                            month={month + 1}
                            onChange={handleChange}
                            onChangeEndPreview={handleChangeEndPreview}
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
