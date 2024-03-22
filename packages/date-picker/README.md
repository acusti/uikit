# @acusti/date-picker

[![latest version](https://img.shields.io/npm/v/@acusti/date-picker?style=for-the-badge)](https://www.npmjs.com/package/@acusti/date-picker)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/date-picker?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fdate-picker)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@acusti/date-picker?style=for-the-badge)](https://bundlephobia.com/package/@acusti/date-picker)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/date-picker?style=for-the-badge)](https://www.npmjs.com/package/@acusti/date-picker)

A group of React components and utils for rendering a date picker with
support for ranges via a two-up month calendar view.

See the [storybook docs and demo][] to get a feel for what it can do.

[storybook docs and demo]:
    https://acusti-uikit.netlify.app/?path=/docs/uikit-controls-datepicker-datepicker--docs

## Usage

```
npm install @acusti/date-picker
# or
yarn add @acusti/date-picker
```

### Example

To render a two-up date picker for selecting date ranges, handling date
selections via the `onChange` prop and showing months using abbreviations:

```tsx
import { DatePicker } from '@acusti/date-picker';
import { useCallback, useState } from 'react';

function Popover() {
    const [dateRangeStart, setDateRangeStart] = useState<null | string>(
        null,
    );
    const [dateRangeEnd, setDateRangeEnd] = useState<null | string>(null);

    const handleDateRangeChange = useCallback(({ dateEnd, dateStart }) => {
        setDateRangeStart(dateStart);
        if (dateEnd) {
            setDateRangeEnd(dateEnd);
        }
    }, []);

    return (
        <DatePicker
            isRange
            isTwoUp
            onChange={handleDateRangeChange}
            useMonthAbbreviations
        />
    );
}
```

### Props

This is the type signature for the props you can pass to `DatePicker`:

```ts
type Props = {
    className?: string;
    dateEnd?: Date | string | number;
    dateStart?: Date | string | number;
    initialMonth?: number;
    isRange?: boolean;
    isTwoUp?: boolean;
    monthLimitFirst?: number;
    monthLimitLast?: number;
    onChange: (payload: { dateEnd?: string; dateStart: string }) => void;
    useMonthAbbreviations?: boolean;
};
```
