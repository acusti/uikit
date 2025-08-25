// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import MonthCalendar from './MonthCalendar.js';
import { getMonthFromDate } from './utils.js';

const noop = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function

afterEach(cleanup);

describe('MonthCalendar.tsx', () => {
    it('renders a calendar for the current month', () => {
        const currentMonth = getMonthFromDate(new Date());
        render(<MonthCalendar month={currentMonth} onChange={noop} />);

        // Check that the calendar renders with day buttons
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
    });

    it('applies is-today class to current day when showing current month', () => {
        const today = new Date();
        const currentMonth = getMonthFromDate(today);
        const todayDay = today.getDate();

        render(<MonthCalendar month={currentMonth} onChange={noop} />);

        // Find the button with today's date and verify it has the is-today class
        const todayButton = screen.getByRole('button', { name: todayDay.toString() });
        expect(todayButton).toBeDefined();
        expect(todayButton.classList.contains('is-today')).toBe(true);
    });

    it('does not apply is-today class when showing a different month', () => {
        // Use February 1985 (month 181 from the story)
        render(<MonthCalendar month={181} onChange={noop} />);

        // Get all day buttons (not empty ones)
        const dayButtons = screen
            .getAllByRole('button')
            .filter(
                (button: HTMLButtonElement) =>
                    Boolean(button.textContent) && !button.disabled,
            );

        // None of the buttons should have is-today class since we're showing a past month
        dayButtons.forEach((button) => {
            expect(button.classList.contains('is-today')).toBe(false);
        });
    });

    it('maintains is-today class with other classes when date is selected', () => {
        const today = new Date();
        const currentMonth = getMonthFromDate(today);
        const todayISO = today.toISOString();

        render(
            <MonthCalendar dateStart={todayISO} month={currentMonth} onChange={noop} />,
        );

        const todayButton = screen.getByRole('button', {
            name: today.getDate().toString(),
        });
        expect(todayButton.classList.contains('is-today')).toBe(true);
        expect(todayButton.classList.contains('start-date')).toBe(true);
    });
});
