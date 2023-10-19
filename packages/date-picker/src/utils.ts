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

export const getMonthNameFromMonth = (month: number) => MONTH_NAMES[month % 12];

export const getMonthAbbreviationFromMonth = (month: number) => {
    const monthName = getMonthNameFromMonth(month);
    if (monthName === 'September') return 'Sept';
    return monthName.substring(0, 3);
};
