// The following utils work on a “month” as a unique numerical value
// representing the number of months since the unix epoch (jan 1970)
const START_YEAR = 1970;
const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const getYearFromDate = (date: Date) => date.getFullYear() - START_YEAR;

export const getMonthFromDate = (date: Date) =>
    date.getMonth() + (getYearFromDate(date) * 12); // prettier-ignore

export const getYearFromMonth = (month: number) => Math.floor(month / 12) + START_YEAR;

export const getMonthNameFromMonth = (month: number): string => {
    let index = month % 12;
    if (Number.isNaN(index)) return '';
    if (index < 0) index = 12 + index;
    return MONTH_NAMES[index];
};

export const getMonthAbbreviationFromMonth = (month: number) => {
    const monthName = getMonthNameFromMonth(month);
    if (monthName === 'September') return 'Sept';
    return monthName.substring(0, 3);
};

export const getDateFromMonthAndDay = (month: number, day: number, asUTC?: boolean) => {
    const monthIn12 = month < 0 ? (12 - Math.abs(month % 12)) % 12 : month % 12;
    const year = getYearFromMonth(month);
    return asUTC
        ? new Date(Date.UTC(year, monthIn12, day))
        : new Date(year, monthIn12, day);
};

export const getLastDateFromMonth = (month: number, asUTC?: boolean) => {
    // day 0 of the next month is the last day of the current month
    return getDateFromMonthAndDay(month + 1, 0, asUTC);
};
