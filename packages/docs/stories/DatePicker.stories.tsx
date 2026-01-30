import type { Meta, StoryObj } from '@storybook/react-vite';

import { DatePicker, getMonthFromDate } from '@acusti/date-picker';
import { useState } from 'react';

import './DatePicker.css';

const meta: Meta<typeof DatePicker> = {
    argTypes: {
        defaultDateEnd: {
            control: 'date',
            description: '(optional) default end date of current date range',
        },
        defaultDateStart: {
            control: 'date',
            description: '(optional) default start date of current date range',
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
    defaultDateEnd: new Date(2024, 0, 6).toISOString(),
    defaultDateStart: new Date(2023, 11, 25).toISOString(),
    isTwoUp: true,
};

export const DateRangeNavidadDiaDeLosReyesDatePicker: Story = {
    args: DATE_RANGE_NAVIDAD_DIA_DE_LOS_REYES_PROPS,
    render() {
        const [resetKey, setResetKey] = useState(0);
        const [selectedDates, setSelectedDates] = useState({
            start: DATE_RANGE_NAVIDAD_DIA_DE_LOS_REYES_PROPS.defaultDateStart,
            end: DATE_RANGE_NAVIDAD_DIA_DE_LOS_REYES_PROPS.defaultDateEnd,
        });

        const handleReset = () => {
            setResetKey((prev) => prev + 1);
            setSelectedDates({
                start: DATE_RANGE_NAVIDAD_DIA_DE_LOS_REYES_PROPS.defaultDateStart,
                end: DATE_RANGE_NAVIDAD_DIA_DE_LOS_REYES_PROPS.defaultDateEnd,
            });
        };

        return (
            <div>
                <DatePicker
                    key={resetKey}
                    className={DATE_RANGE_NAVIDAD_DIA_DE_LOS_REYES_PROPS.className}
                    isTwoUp={DATE_RANGE_NAVIDAD_DIA_DE_LOS_REYES_PROPS.isTwoUp}
                    defaultDateEnd={selectedDates.end}
                    defaultDateStart={selectedDates.start}
                    onChange={(update) => {
                        setSelectedDates({
                            start: update.dateStart,
                            end: update.dateEnd ?? '',
                        });
                    }}
                />
                <div style={{ marginTop: '16px' }}>
                    <button
                        onClick={handleReset}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            backgroundColor: '#f5f5f5',
                        }}
                    >
                        Reset to Christmas-Epiphany Range
                    </button>
                    {selectedDates.start && (
                        <p style={{ marginTop: '8px' }}>
                            Selected: {new Date(selectedDates.start).toLocaleDateString()}
                            {selectedDates.end &&
                                ` - ${new Date(selectedDates.end).toLocaleDateString()}`}
                        </p>
                    )}
                </div>
            </div>
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
        defaultDateEnd: new Date(1234, 0, 1).toISOString(),
        defaultDateStart: new Date(1233, 0, 1).toISOString(),
        isTwoUp: true,
        showEndInitially: true,
    },
};

// README Examples as Interactive Stories

const BOOKING_PROPS = {
    className: 'booking-date-picker-story',
    isRange: true,
    isTwoUp: true,
    useMonthAbbreviations: true,
};

export const BookingSystemDateRange: Story = {
    args: BOOKING_PROPS,
    render() {
        const [resetKey, setResetKey] = useState(0);
        const [checkIn, setCheckIn] = useState('');
        const [checkOut, setCheckOut] = useState('');
        const isValid = checkIn && checkOut;

        // Limit to next 12 months only
        const today = new Date();
        const monthLimitFirst = getMonthFromDate(today);
        const monthLimitLast = monthLimitFirst + 12;

        const handleClearDates = () => {
            setResetKey((prev) => prev + 1);
            setCheckIn('');
            setCheckOut('');
        };

        return (
            <div className="booking-date-picker">
                <h3>Select Your Stay</h3>
                <DatePicker
                    key={resetKey}
                    {...BOOKING_PROPS}
                    monthLimitFirst={monthLimitFirst}
                    monthLimitLast={monthLimitLast}
                    onChange={({ dateStart, dateEnd }) => {
                        setCheckIn(dateStart);
                        setCheckOut(dateEnd ?? '');
                    }}
                    defaultDateStart={checkIn}
                    defaultDateEnd={checkOut}
                />

                <div style={{ marginTop: '16px' }}>
                    <button
                        onClick={handleClearDates}
                        style={{
                            padding: '8px 16px',
                            border: '1px solid #dc3545',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            backgroundColor: '#fff',
                            color: '#dc3545',
                            marginRight: '8px',
                        }}
                    >
                        Clear Dates
                    </button>
                </div>

                {isValid ? (
                    <div
                        className="booking-summary"
                        style={{
                            marginTop: '16px',
                            padding: '16px',
                            border: '1px solid #e1e5e9',
                            borderRadius: '8px',
                            backgroundColor: '#f8f9fa',
                        }}
                    >
                        <p>
                            <strong>Check-in:</strong>{' '}
                            {new Date(checkIn).toLocaleDateString()}
                        </p>
                        <p>
                            <strong>Check-out:</strong>{' '}
                            {new Date(checkOut).toLocaleDateString()}
                        </p>
                        <p>
                            <strong>Duration:</strong>{' '}
                            {(() => {
                                const checkInTime = new Date(checkIn).getTime();
                                const checkOutTime = new Date(checkOut).getTime();
                                const diffTime = checkOutTime - checkInTime;
                                const diffDays = Math.ceil(
                                    diffTime / (1000 * 60 * 60 * 24),
                                );
                                return Math.max(0, diffDays);
                            })()}{' '}
                            nights
                        </p>
                    </div>
                ) : null}
            </div>
        );
    },
    parameters: {
        docs: {
            description: {
                story: 'A complete booking system example with date range selection, month limits, and booking summary display.',
            },
        },
    },
};

const EVENT_PROPS = {
    className: 'event-scheduler-story',
};

export const EventScheduler: Story = {
    args: EVENT_PROPS,
    render() {
        const [resetKey, setResetKey] = useState(0);
        const [eventDate, setEventDate] = useState('');
        const [showPicker, setShowPicker] = useState(false);

        // Only allow future dates
        const monthLimitFirst = getMonthFromDate(new Date());

        const handleClearDate = () => {
            setResetKey((prev) => prev + 1);
            setEventDate('');
            setShowPicker(false);
        };

        return (
            <div className="event-scheduler">
                <div style={{ marginBottom: '16px' }}>
                    <label
                        htmlFor="event-date"
                        style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: 500,
                        }}
                    >
                        Event Date:
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            id="event-date"
                            type="text"
                            value={
                                eventDate ? new Date(eventDate).toLocaleDateString() : ''
                            }
                            onClick={() => setShowPicker(true)}
                            placeholder="Click to select date"
                            readOnly
                            style={{
                                padding: '8px 12px',
                                border: '2px solid #e1e5e9',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                width: '200px',
                            }}
                        />
                        {eventDate && (
                            <button
                                onClick={handleClearDate}
                                style={{
                                    padding: '6px 12px',
                                    border: '1px solid #dc3545',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    backgroundColor: '#fff',
                                    color: '#dc3545',
                                    fontSize: '12px',
                                }}
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {showPicker ? (
                    <div
                        style={{
                            position: 'relative',
                            zIndex: 1000,
                            marginTop: '8px',
                        }}
                    >
                        <div
                            style={{
                                padding: '16px',
                                border: '1px solid #e1e5e9',
                                borderRadius: '8px',
                                backgroundColor: 'white',
                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                            }}
                        >
                            <DatePicker
                                key={resetKey}
                                {...EVENT_PROPS}
                                monthLimitFirst={monthLimitFirst}
                                onChange={({ dateStart }) => {
                                    setEventDate(dateStart);
                                    setShowPicker(false);
                                }}
                                defaultDateStart={eventDate}
                            />
                            <button
                                onClick={() => setShowPicker(false)}
                                style={{
                                    marginTop: '12px',
                                    padding: '8px 16px',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        );
    },
    parameters: {
        docs: {
            description: {
                story: 'An event scheduling interface with modal-style date picker that only allows future dates.',
            },
        },
    },
};

export const BirthdayPicker: Story = {
    render() {
        const [resetKey, setResetKey] = useState(0);
        const [birthday, setBirthday] = useState('');

        // Reasonable age limits: 13 to 120 years ago
        const today = new Date();
        const maxAge = new Date(
            today.getFullYear() - 120,
            today.getMonth(),
            today.getDate(),
        );
        const minAge = new Date(
            today.getFullYear() - 13,
            today.getMonth(),
            today.getDate(),
        );

        const monthLimitFirst = getMonthFromDate(maxAge);
        const monthLimitLast = getMonthFromDate(minAge);

        // Start showing calendar at a reasonable age (25 years ago)
        const defaultMonth = getMonthFromDate(
            new Date(today.getFullYear() - 25, today.getMonth(), today.getDate()),
        );

        const handleClear = () => {
            setResetKey((prev) => prev + 1);
            setBirthday('');
        };

        return (
            <div className="birthday-picker">
                <h3>Enter Your Birthday</h3>
                <DatePicker
                    key={resetKey}
                    initialMonth={defaultMonth}
                    monthLimitFirst={monthLimitFirst}
                    monthLimitLast={monthLimitLast}
                    onChange={({ dateStart }) => setBirthday(dateStart)}
                    defaultDateStart={birthday}
                />

                <div style={{ marginTop: '16px' }}>
                    {birthday && (
                        <button
                            onClick={handleClear}
                            style={{
                                padding: '6px 12px',
                                border: '1px solid #dc3545',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                backgroundColor: '#fff',
                                color: '#dc3545',
                                fontSize: '14px',
                                marginBottom: '12px',
                            }}
                        >
                            Clear Birthday
                        </button>
                    )}
                </div>

                {birthday ? (
                    <p
                        style={{
                            marginTop: '8px',
                            padding: '12px',
                            backgroundColor: '#e3f2fd',
                            borderRadius: '6px',
                        }}
                    >
                        <strong>
                            You are{' '}
                            {Math.floor(
                                (today.getTime() - new Date(birthday).getTime()) /
                                    (1000 * 60 * 60 * 24 * 365.25),
                            )}{' '}
                            years old
                        </strong>
                    </p>
                ) : null}
            </div>
        );
    },
    parameters: {
        docs: {
            description: {
                story: 'A birthday picker with reasonable age limits (13-120 years) and automatic age calculation.',
            },
        },
    },
};

export const FlexibleDatePicker: Story = {
    render() {
        const [resetKey, setResetKey] = useState(0);
        const [selectedDate, setSelectedDate] = useState('');
        const [viewMode, setViewMode] = useState<'single' | 'double'>('single');

        const handleClear = () => {
            setResetKey((prev) => prev + 1);
            setSelectedDate('');
        };

        return (
            <div className="flexible-date-picker">
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ marginRight: '16px' }}>
                        <input
                            type="radio"
                            checked={viewMode === 'single'}
                            onChange={() => setViewMode('single')}
                            style={{ marginRight: '4px' }}
                        />
                        Single Month
                    </label>
                    <label style={{ marginRight: '16px' }}>
                        <input
                            type="radio"
                            checked={viewMode === 'double'}
                            onChange={() => setViewMode('double')}
                            style={{ marginRight: '4px' }}
                        />
                        Two Months
                    </label>
                    {selectedDate && (
                        <button
                            onClick={handleClear}
                            style={{
                                padding: '4px 8px',
                                border: '1px solid #dc3545',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                backgroundColor: '#fff',
                                color: '#dc3545',
                                fontSize: '12px',
                            }}
                        >
                            Clear
                        </button>
                    )}
                </div>

                <DatePicker
                    key={resetKey}
                    isTwoUp={viewMode === 'double'}
                    useMonthAbbreviations={viewMode === 'double'}
                    onChange={({ dateStart }) => setSelectedDate(dateStart)}
                    defaultDateStart={selectedDate}
                />

                {selectedDate ? (
                    <div
                        style={{
                            marginTop: '16px',
                            padding: '12px',
                            border: '1px solid #e1e5e9',
                            borderRadius: '6px',
                        }}
                    >
                        <strong>Selected:</strong>{' '}
                        {new Date(selectedDate).toLocaleDateString()}
                        <br />
                        <strong>Day of week:</strong>{' '}
                        {new Date(selectedDate).toLocaleDateString('en', {
                            weekday: 'long',
                        })}
                    </div>
                ) : null}
            </div>
        );
    },
    parameters: {
        docs: {
            description: {
                story: 'A flexible date picker that can switch between single and two-month views dynamically.',
            },
        },
    },
};
