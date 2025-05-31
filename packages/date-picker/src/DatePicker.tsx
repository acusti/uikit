/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { Style } from '@acusti/styling';
import clsx from 'clsx';
import * as React from 'react';

import MonthCalendar from './MonthCalendar.js';
import { ROOT_CLASS_NAME, STYLES } from './styles/date-picker.js';
import {
    getMonthAbbreviationFromMonth,
    getMonthFromDate,
    getYearFromMonth,
} from './utils.js';

export type Props = {
    className?: string;
    dateEnd?: Date | number | string;
    dateStart?: Date | number | string;
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

const { Fragment, useCallback, useEffect, useRef, useState } = React;

const getAbbreviatedMonthTitle = (month: number) =>
    `${getMonthAbbreviationFromMonth(month)} ${getYearFromMonth(month)}`;

export default function DatePicker({
    className,
    dateEnd: _dateEnd,
    dateStart: _dateStart,
    initialMonth,
    isRange = _dateEnd != null,
    isTwoUp,
    monthLimitFirst,
    monthLimitLast,
    onChange,
    showEndInitially,
    useMonthAbbreviations,
}: Props) {
    const dateEndFromProps =
        _dateEnd != null && typeof _dateEnd !== 'string'
            ? new Date(_dateEnd).toISOString()
            : _dateEnd;
    const dateStartFromProps =
        _dateStart != null && typeof _dateStart !== 'string'
            ? new Date(_dateStart).toISOString()
            : _dateStart;
    const [dateEnd, setDateEnd] = useState<null | string>(dateEndFromProps ?? null);
    const [dateStart, setDateStart] = useState<null | string>(dateStartFromProps ?? null);
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

    const [dateEndPreview, setDateEndPreview] = useState<null | string>(null);
    const [month, setMonth] = useState<number>(initialMonth);

    // In two-up view we see 1 more month, so monthLimitLast needs to be 1 less
    if (isTwoUp && monthLimitLast != null) {
        monthLimitLast -= 1;
    }

    const delta = isTwoUp ? 2 : 1;

    const handleClickLeftArrow = useCallback(() => {
        setMonth((existingMonth: number) =>
            Math.max(existingMonth - delta, monthLimitFirst ?? -Infinity),
        );
    }, [delta, monthLimitFirst]);

    const handleClickRightArrow = useCallback(() => {
        setMonth((existingMonth: number) =>
            Math.min(existingMonth + delta, monthLimitLast ?? Infinity),
        );
    }, [delta, monthLimitLast]);

    const handleChange = useCallback(
        (date: string) => {
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
        },
        [dateEnd, dateStart, isRange, onChange],
    );

    const handleChangeEndPreview = useCallback((date: string) => {
        setDateEndPreview(date);
    }, []);

    return (
        <Fragment>
            <Style href="@acusti/date-picker/DatePicker">{STYLES}</Style>
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
