# @acusti/date-picker

[![latest version](https://img.shields.io/npm/v/@acusti/date-picker?style=for-the-badge)](https://www.npmjs.com/package/@acusti/date-picker)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/date-picker?style=for-the-badge)](https://www.npmjs.com/package/@acusti/date-picker)
[![bundle size](https://deno.bundlejs.com/badge?q=@acusti/date-picker)](https://bundlejs.com/?q=%40acusti%2Fdate-picker)
[![supply chain security](https://socket.dev/api/badge/npm/package/@acusti/date-picker/0.8.0)](https://socket.dev/npm/package/@acusti/date-picker/overview/0.8.0)

A comprehensive React date picker library with support for single date
selection, date ranges, and two-up month calendar views. Built with
accessibility and user experience in mind, featuring smooth navigation,
intelligent date range handling, and customizable styling.

## Key Features

- **Single & Range Selection** - Pick individual dates or date ranges with
  intelligent range logic
- **Two-Up Calendar View** - Display two months side-by-side for easier
  range selection
- **Month Navigation** - Smooth navigation with optional month limits for
  business logic
- **Smart Range Handling** - Automatic date swapping and preview
  highlighting
- **Flexible Date Input** - Accepts Date objects, ISO strings, or
  timestamps
- **Customizable Display** - Month abbreviations, custom styling, and
  layout options
- **Built-in Styling** - Attractive default styles with CSS custom property
  theming
- **Accessibility Ready** - Keyboard navigation and screen reader support

## Installation

```bash
npm install @acusti/date-picker
# or
yarn add @acusti/date-picker
```

## Quick Start

```tsx
import { DatePicker } from '@acusti/date-picker';
import { useState } from 'react';

// Simple single date picker
function SimpleDatePicker() {
    const [selectedDate, setSelectedDate] = useState('');

    return (
        <DatePicker
            onChange={({ dateStart }) => setSelectedDate(dateStart)}
            dateStart={selectedDate}
        />
    );
}

// Date range picker
function DateRangePicker() {
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const handleChange = ({ dateStart, dateEnd }) => {
        setDateRange({ start: dateStart, end: dateEnd || '' });
    };

    return (
        <DatePicker
            isRange
            isTwoUp
            onChange={handleChange}
            dateStart={dateRange.start}
            dateEnd={dateRange.end}
            useMonthAbbreviations
        />
    );
}
```

## API Reference

### DatePicker Component

```tsx
type Props = {
    /** Additional CSS class name for styling */
    className?: string;

    /** End date for range selection (Date object, ISO string, timestamp, or null) */
    dateEnd?: Date | string | number | null;

    /** Start date for single or range selection (Date object, ISO string, timestamp, or null) */
    dateStart?: Date | string | number | null;

    /** Initial month to display (number of months since January 1970) */
    initialMonth?: number;

    /** Enable date range selection mode */
    isRange?: boolean;

    /** Display two months side-by-side */
    isTwoUp?: boolean;

    /** Earliest month that can be navigated to */
    monthLimitFirst?: number;

    /** Latest month that can be navigated to */
    monthLimitLast?: number;

    /** Callback when dates are selected */
    onChange: (payload: {
        dateEnd?: string | null;
        dateStart: string;
    }) => void;

    /** Show end date’s month initially (when both start and end dates exist) */
    showEndInitially?: boolean;

    /** Use abbreviated month names (Jan, Feb, etc.) */
    useMonthAbbreviations?: boolean;
};
```

### MonthCalendar Component

For advanced use cases, you can use the individual month calendar:

```tsx
import { MonthCalendar } from '@acusti/date-picker';

type MonthCalendarProps = {
    className?: string;
    dateEnd?: Date | string | number | null;
    dateEndPreview?: string | null;
    dateStart?: Date | string | number | null;
    isRange?: boolean;
    month: number; // Months since January 1970
    onChange?: (date: string) => void;
    onChangeEndPreview?: (date: string) => void;
    title?: string;
};
```

### Utility Functions

```tsx
import {
    getMonthFromDate,
    getYearFromMonth,
    getMonthNameFromMonth,
    getMonthAbbreviationFromMonth,
} from '@acusti/date-picker';

// Convert Date to month number (months since Jan 1970)
const monthNumber = getMonthFromDate(new Date());

// Convert month number to calendar year
const year = getYearFromMonth(monthNumber);

// Get full month name
const monthName = getMonthNameFromMonth(monthNumber); // "January"

// Get abbreviated month name
const monthAbbr = getMonthAbbreviationFromMonth(monthNumber); // "Jan"
```

## Usage Examples

### Booking System Date Range

**[🎮 Live Demo](https://uikit.acusti.ca/?path=/story/uikit-controls-datepicker-datepicker--booking-system-date-range)**

```tsx
import { DatePicker } from '@acusti/date-picker';
import { useState } from 'react';

function BookingDatePicker() {
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const isValid = checkIn && checkOut;

    // Limit to next 12 months only
    const today = new Date();
    const monthLimitFirst = getMonthFromDate(today);
    const monthLimitLast = monthLimitFirst + 12;

    return (
        <div className="booking-date-picker">
            <h3>Select Your Stay</h3>
            <DatePicker
                className="booking-date-picker-story"
                isRange
                isTwoUp
                monthLimitFirst={monthLimitFirst}
                monthLimitLast={monthLimitLast}
                onChange={({ dateStart, dateEnd }) => {
                    setCheckIn(dateStart);
                    setCheckOut(dateEnd ?? '');
                }}
                dateStart={checkIn}
                dateEnd={checkOut}
                useMonthAbbreviations
            />

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
                            const checkInTime = new Date(
                                checkIn,
                            ).getTime();
                            const checkOutTime = new Date(
                                checkOut,
                            ).getTime();
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
}
```

### Event Scheduler

**[🎮 Live Demo](https://uikit.acusti.ca/?path=/story/uikit-controls-datepicker-datepicker--event-scheduler)**

```tsx
import { DatePicker } from '@acusti/date-picker';
import { useState } from 'react';

function EventScheduler() {
    const [eventDate, setEventDate] = useState('');
    const [showPicker, setShowPicker] = useState(false);

    // Only allow future dates
    const monthLimitFirst = getMonthFromDate(new Date());

    return (
        <div className="event-scheduler">
            <div style={{ marginBottom: '16px' }}>
                <label
                    htmlFor="event-date"
                    style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '500',
                    }}
                >
                    Event Date:
                </label>
                <input
                    id="event-date"
                    type="text"
                    value={
                        eventDate
                            ? new Date(eventDate).toLocaleDateString()
                            : ''
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
                            className="event-scheduler-story"
                            monthLimitFirst={monthLimitFirst}
                            onChange={({ dateStart }) => {
                                setEventDate(dateStart);
                                setShowPicker(false);
                            }}
                            dateStart={eventDate}
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
}
```

### Report Date Range Filter

```tsx
import { DatePicker } from '@acusti/date-picker';
import { useState, useEffect } from 'react';

function ReportFilter() {
    const [dateRange, setDateRange] = useState({
        start: '',
        end: '',
    });
    const [isOpen, setIsOpen] = useState(false);

    // Limit to past 2 years for historical reports
    const today = new Date();
    const monthLimitLast = getMonthFromDate(today);
    const monthLimitFirst = monthLimitLast - 24;

    const handleApplyRange = ({ dateStart, dateEnd }) => {
        setDateRange({
            start: dateStart,
            end: dateEnd || dateStart,
        });

        if (dateEnd) {
            setIsOpen(false);
        }
    };

    const formatDateRange = () => {
        if (!dateRange.start) return 'Select date range';

        const startDate = new Date(dateRange.start).toLocaleDateString();
        const endDate = dateRange.end
            ? new Date(dateRange.end).toLocaleDateString()
            : startDate;

        return `${startDate} - ${endDate}`;
    };

    return (
        <div className="report-filter">
            <button
                className="date-range-button"
                onClick={() => setIsOpen(!isOpen)}
            >
                📅 {formatDateRange()}
            </button>

            {isOpen ? (
                <div className="date-picker-dropdown">
                    <DatePicker
                        isRange
                        isTwoUp
                        monthLimitFirst={monthLimitFirst}
                        monthLimitLast={monthLimitLast}
                        onChange={handleApplyRange}
                        dateStart={dateRange.start}
                        dateEnd={dateRange.end}
                        showEndInitially={!!dateRange.end}
                    />
                </div>
            ) : null}
        </div>
    );
}
```

### Birthday Picker with Year Limits

**[🎮 Live Demo](https://uikit.acusti.ca/?path=/story/uikit-controls-datepicker-datepicker--birthday-picker)**

```tsx
import { DatePicker, getMonthFromDate } from '@acusti/date-picker';
import { useState } from 'react';

function BirthdayPicker() {
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
        new Date(
            today.getFullYear() - 25,
            today.getMonth(),
            today.getDate(),
        ),
    );

    return (
        <div className="birthday-picker">
            <h3>Enter Your Birthday</h3>
            <DatePicker
                initialMonth={defaultMonth}
                monthLimitFirst={monthLimitFirst}
                monthLimitLast={monthLimitLast}
                onChange={({ dateStart }) => setBirthday(dateStart)}
                dateStart={birthday}
            />

            {birthday ? (
                <p
                    style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '6px',
                    }}
                >
                    <strong>
                        You are{' '}
                        {Math.floor(
                            (today.getTime() -
                                new Date(birthday).getTime()) /
                                (1000 * 60 * 60 * 24 * 365.25),
                        )}{' '}
                        years old
                    </strong>
                </p>
            ) : null}
        </div>
    );
}
```

### Multi-Month Navigation

**[🎮 Live Demo](https://uikit.acusti.ca/?path=/story/uikit-controls-datepicker-datepicker--flexible-date-picker)**

```tsx
import { DatePicker, getMonthFromDate } from '@acusti/date-picker';
import { useState } from 'react';

function FlexibleDatePicker() {
    const [selectedDate, setSelectedDate] = useState('');
    const [viewMode, setViewMode] = useState<'single' | 'double'>(
        'single',
    );

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
                <label>
                    <input
                        type="radio"
                        checked={viewMode === 'double'}
                        onChange={() => setViewMode('double')}
                        style={{ marginRight: '4px' }}
                    />
                    Two Months
                </label>
            </div>

            <DatePicker
                isTwoUp={viewMode === 'double'}
                useMonthAbbreviations={viewMode === 'double'}
                onChange={({ dateStart }) => setSelectedDate(dateStart)}
                dateStart={selectedDate}
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
}
```

### Custom Month Calendar Usage

```tsx
import { MonthCalendar, getMonthFromDate } from '@acusti/date-picker';
import { useState } from 'react';

function CustomCalendarGrid() {
    const [selectedDates, setSelectedDates] = useState<string[]>([]);
    const currentMonth = getMonthFromDate(new Date());

    const handleDateSelect = (date: string) => {
        setSelectedDates((prev) =>
            prev.includes(date)
                ? prev.filter((d) => d !== date)
                : [...prev, date],
        );
    };

    return (
        <div>
            <h3>Multi-Select Calendar</h3>
            <p>Click dates to select/deselect multiple dates</p>

            <MonthCalendar
                month={currentMonth}
                onChange={handleDateSelect}
                title="Select Multiple Dates"
            />

            <div className="selected-dates">
                <h4>Selected Dates ({selectedDates.length}):</h4>
                <ul>
                    {selectedDates.map((date) => (
                        <li key={date}>
                            {new Date(date).toLocaleDateString()}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
```

## Styling

The date picker uses CSS custom properties for easy theming:

```css
.date-picker {
    /* Calendar colors */
    --date-picker-bg: #ffffff;
    --date-picker-border: #e0e0e0;
    --date-picker-text: #333333;

    /* Selected date colors */
    --date-picker-selected-bg: #007bff;
    --date-picker-selected-text: #ffffff;

    /* Range selection colors */
    --date-picker-range-bg: #e3f2fd;
    --date-picker-range-border: #2196f3;

    /* Hover states */
    --date-picker-hover-bg: #f5f5f5;

    /* Navigation arrows */
    --date-picker-arrow-color: #666666;
    --date-picker-arrow-hover: #333333;

    /* Month header */
    --date-picker-header-text: #333333;
    --date-picker-header-bg: #f8f9fa;
}

/* Custom styling example */
.booking-calendar {
    --date-picker-selected-bg: #28a745;
    --date-picker-range-bg: #d4edda;
    --date-picker-range-border: #28a745;
}

.event-calendar {
    --date-picker-selected-bg: #6f42c1;
    --date-picker-range-bg: #e2d9f3;
}
```

## Month Number System

The date picker uses an internal month numbering system where months are
represented as the number of months since January 1970:

- January 1970 = 0
- February 1970 = 1
- January 2024 = 648
- etc.

This system allows for efficient month calculations and navigation. The
utility functions handle the conversion between this system and standard
dates.

## Browser Compatibility

- **Modern Browsers** - Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Support** - iOS Safari, Android Chrome
- **SSR Compatible** - Works with Next.js, React Router, and other SSR
  frameworks

## Common Use Cases

- **Booking Systems** - Hotels, flights, rental properties
- **Event Management** - Conference registration, appointment scheduling
- **Reporting Tools** - Date range filters for analytics
- **Form Inputs** - Birthday selection, deadline setting
- **Content Management** - Publishing date selection
- **E-commerce** - Delivery date selection, sale periods
- **Project Management** - Milestone and deadline tracking

## Demo

See the
[Storybook documentation and examples](https://uikit.acusti.ca/?path=/docs/uikit-controls-datepicker-datepicker--docs)
for interactive demonstrations of all date picker features and
configurations.
