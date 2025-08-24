# @acusti/css-values

[![latest version](https://img.shields.io/npm/v/@acusti/css-values?style=for-the-badge)](https://www.npmjs.com/package/@acusti/css-values)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/css-values?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fcss-values)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/css-values?style=for-the-badge)](https://www.npmjs.com/package/@acusti/css-values)
[![bundle size](https://deno.bundlejs.com/badge?q=@acusti/css-values)](https://bundlejs.com/?q=%40acusti%2Fcss-values)

Utilities for parsing, manipulating, and working with different types of
CSS values including lengths, angles, times, percentages, and integers.
This package provides type-safe functions for extracting units, converting
values, and working with CSS dimensions in JavaScript/TypeScript
applications.

## Key Features

- **Type-safe CSS value parsing** - Support for length, angle, time,
  percent, and integer CSS values
- **Unit extraction and conversion** - Extract units from CSS strings and
  convert between formats
- **Default unit handling** - Automatically apply appropriate default units
  for different value types
- **Time conversion utilities** - Convert CSS time values to milliseconds
  for JavaScript usage
- **Precision control** - Round values to specific decimal places
- **Comprehensive validation** - Built-in regex patterns for CSS value type
  validation

## Installation

```bash
npm install @acusti/css-values
# or
yarn add @acusti/css-values
```

## Quick Start

```js
import {
    getCSSValueWithUnit,
    getUnitFromCSSValue,
    getCSSValueAsNumber,
} from '@acusti/css-values';

// Add units to numeric values
const withUnit = getCSSValueWithUnit({
    cssValueType: 'length',
    value: 100,
}); // '100px'

// Extract units from CSS strings
const unit = getUnitFromCSSValue({
    cssValueType: 'length',
    value: '2rem',
}); // 'rem'

// Extract numeric values
const number = getCSSValueAsNumber('24px'); // 24
```

## API Reference

### Types

```ts
type CSSValueType = 'angle' | 'integer' | 'length' | 'percent' | 'time';

type Payload = {
    cssValueType: CSSValueType;
    defaultUnit?: string;
    value: number | string;
};
```

### Constants

```ts
// Default CSS value type (used when not specified)
const DEFAULT_CSS_VALUE_TYPE: CSSValueType = 'length';

// Default units for each CSS value type
const DEFAULT_UNIT_BY_CSS_VALUE_TYPE = {
    angle: 'deg', // degrees
    integer: '', // no unit
    length: 'px', // pixels
    percent: '%', // percentage
    time: 's', // seconds
};
```

### Functions

#### `getCSSValueWithUnit(payload: Payload): string`

Converts a numeric value to a CSS string with the appropriate unit.

```js
import { getCSSValueWithUnit } from '@acusti/css-values';

// Length values
getCSSValueWithUnit({ cssValueType: 'length', value: 16 });
// → '16px'

getCSSValueWithUnit({
    cssValueType: 'length',
    value: 2,
    defaultUnit: 'rem',
});
// → '2rem'

// Angle values
getCSSValueWithUnit({ cssValueType: 'angle', value: 90 });
// → '90deg'

getCSSValueWithUnit({
    cssValueType: 'angle',
    value: 1.5,
    defaultUnit: 'turn',
});
// → '1.5turn'

// Time values
getCSSValueWithUnit({ cssValueType: 'time', value: 0.3 });
// → '0.3s'

// Percentage values
getCSSValueWithUnit({ cssValueType: 'percent', value: 50 });
// → '50%'

// Integer values (no unit)
getCSSValueWithUnit({ cssValueType: 'integer', value: 3 });
// → '3'

// Invalid numbers return original value
getCSSValueWithUnit({
    cssValueType: 'length',
    value: 'invalid',
});
// → 'invalid'
```

#### `getUnitFromCSSValue(payload: Payload): string`

Extracts the unit from a CSS value string, returning the default unit if
none is found.

```js
import { getUnitFromCSSValue } from '@acusti/css-values';

// Extract units from CSS strings
getUnitFromCSSValue({ cssValueType: 'length', value: '100px' });
// → 'px'

getUnitFromCSSValue({ cssValueType: 'length', value: '2.5rem' });
// → 'rem'

getUnitFromCSSValue({ cssValueType: 'angle', value: '45deg' });
// → 'deg'

getUnitFromCSSValue({ cssValueType: 'time', value: '250ms' });
// → 'ms'

// Returns default unit when no unit specified
getUnitFromCSSValue({ cssValueType: 'length', value: '100' });
// → 'px'

getUnitFromCSSValue({ cssValueType: 'length', value: 100 });
// → 'px'

// Custom default units
getUnitFromCSSValue({
    cssValueType: 'length',
    value: '2',
    defaultUnit: 'em',
});
// → 'em'
```

#### `getCSSValueAsNumber(value: number | string): number`

Extracts the numeric portion from a CSS value.

```js
import { getCSSValueAsNumber } from '@acusti/css-values';

getCSSValueAsNumber('24px'); // → 24
getCSSValueAsNumber('1.5rem'); // → 1.5
getCSSValueAsNumber('90deg'); // → 90
getCSSValueAsNumber('100%'); // → 100
getCSSValueAsNumber(42); // → 42
getCSSValueAsNumber('invalid'); // → NaN
```

#### `getMillisecondsFromCSSValue(value: number | string): number`

Converts CSS time values to milliseconds for use in JavaScript.

```js
import { getMillisecondsFromCSSValue } from '@acusti/css-values';

getMillisecondsFromCSSValue('1s'); // → 1000
getMillisecondsFromCSSValue('500ms'); // → 500
getMillisecondsFromCSSValue('0.25s'); // → 250
getMillisecondsFromCSSValue('2.5s'); // → 2500
getMillisecondsFromCSSValue(1.5); // → 1.5 (assumes already in ms)
getMillisecondsFromCSSValue(''); // → 0
getMillisecondsFromCSSValue('invalid'); // → 0
```

#### `roundToPrecision(value: number, precision: number): number`

Rounds a number to a specific number of decimal places.

```js
import { roundToPrecision } from '@acusti/css-values';

roundToPrecision(3.14159, 2); // → 3.14
roundToPrecision(1.666, 1); // → 1.7
roundToPrecision(10.999, 0); // → 11
roundToPrecision(5, 2); // → 5
```

## Usage Examples

### CSS Value Input Component

```tsx
import {
    getCSSValueWithUnit,
    getUnitFromCSSValue,
    getCSSValueAsNumber,
} from '@acusti/css-values';
import { useState } from 'react';

function CSSValueInput({
    valueType = 'length',
    onValueChange,
    initialValue = '',
}) {
    const [inputValue, setInputValue] = useState(initialValue);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        // Convert to CSS string with proper unit
        const cssValue = getCSSValueWithUnit({
            cssValueType: valueType,
            value: newValue,
        });

        onValueChange(cssValue);
    };

    const currentUnit = getUnitFromCSSValue({
        cssValueType: valueType,
        value: inputValue,
    });

    return (
        <div className="css-value-input">
            <input
                type="number"
                value={getCSSValueAsNumber(inputValue) || ''}
                onChange={handleChange}
                placeholder="Enter value"
            />
            <span className="unit-display">{currentUnit}</span>
        </div>
    );
}
```

### CSS Animation Duration Manager

```tsx
import {
    getMillisecondsFromCSSValue,
    getCSSValueWithUnit,
} from '@acusti/css-values';

function AnimationController({ duration = '0.3s' }) {
    // Convert CSS duration to milliseconds for JavaScript timers
    const durationMS = getMillisecondsFromCSSValue(duration);

    const startAnimation = () => {
        // Apply CSS animation
        element.style.animationDuration = duration;

        // Set up JavaScript timer to match
        setTimeout(() => {
            console.log('Animation complete');
        }, durationMS);
    };

    return (
        <div>
            <p>
                Animation duration: {duration} ({durationMS}ms)
            </p>
            <button onClick={startAnimation}>Start Animation</button>
        </div>
    );
}
```

### Responsive Design Utilities

```js
import {
    getCSSValueWithUnit,
    getCSSValueAsNumber,
} from '@acusti/css-values';

function generateResponsiveValues(baseSize) {
    const basePx = getCSSValueAsNumber(baseSize);

    return {
        mobile: getCSSValueWithUnit({
            cssValueType: 'length',
            value: basePx * 0.8,
        }),
        tablet: getCSSValueWithUnit({
            cssValueType: 'length',
            value: basePx,
        }),
        desktop: getCSSValueWithUnit({
            cssValueType: 'length',
            value: basePx * 1.2,
        }),
    };
}

const fontSizes = generateResponsiveValues('16px');
// {
//   mobile: '12.8px',
//   tablet: '16px',
//   desktop: '19.2px'
// }
```

### Design System Value Converter

```js
import {
    getCSSValueWithUnit,
    getUnitFromCSSValue,
    getCSSValueAsNumber,
} from '@acusti/css-values';

class DesignSystem {
    constructor(baseUnit = 'rem') {
        this.baseUnit = baseUnit;
    }

    // Convert spacing tokens to CSS values
    spacing(multiplier) {
        return getCSSValueWithUnit({
            cssValueType: 'length',
            value: multiplier * 0.25, // 0.25rem base
            defaultUnit: this.baseUnit,
        });
    }

    // Convert any CSS value to design system units
    toDSUnits(cssValue) {
        const numericValue = getCSSValueAsNumber(cssValue);
        const currentUnit = getUnitFromCSSValue({
            cssValueType: 'length',
            value: cssValue,
        });

        // Convert px to rem (assuming 16px = 1rem)
        if (currentUnit === 'px' && this.baseUnit === 'rem') {
            return getCSSValueWithUnit({
                cssValueType: 'length',
                value: numericValue / 16,
                defaultUnit: 'rem',
            });
        }

        return cssValue;
    }
}

const ds = new DesignSystem('rem');
ds.spacing(4); // → '1rem'
ds.toDSUnits('24px'); // → '1.5rem'
```

### CSS Variable Generator

```js
import { getCSSValueWithUnit } from '@acusti/css-values';

function generateCSSVariables(theme) {
    const cssVars = {};

    // Convert theme values to proper CSS values
    Object.entries(theme.spacing).forEach(([key, value]) => {
        cssVars[`--spacing-${key}`] = getCSSValueWithUnit({
            cssValueType: 'length',
            value,
        });
    });

    Object.entries(theme.durations).forEach(([key, value]) => {
        cssVars[`--duration-${key}`] = getCSSValueWithUnit({
            cssValueType: 'time',
            value,
        });
    });

    return cssVars;
}

const theme = {
    spacing: { sm: 8, md: 16, lg: 24 },
    durations: { fast: 0.15, normal: 0.3, slow: 0.5 },
};

const cssVariables = generateCSSVariables(theme);
// {
//   '--spacing-sm': '8px',
//   '--spacing-md': '16px',
//   '--spacing-lg': '24px',
//   '--duration-fast': '0.15s',
//   '--duration-normal': '0.3s',
//   '--duration-slow': '0.5s'
// }
```

### Form Validation

```js
import {
    getCSSValueAsNumber,
    getUnitFromCSSValue,
} from '@acusti/css-values';

function validateCSSValue(value, type, constraints = {}) {
    const numericValue = getCSSValueAsNumber(value);
    const unit = getUnitFromCSSValue({ cssValueType: type, value });

    const errors = [];

    // Check if value is a valid number
    if (Number.isNaN(numericValue)) {
        errors.push('Value must be a valid number');
        return errors;
    }

    // Validate constraints
    if (constraints.min !== undefined && numericValue < constraints.min) {
        errors.push(`Value must be at least ${constraints.min}`);
    }

    if (constraints.max !== undefined && numericValue > constraints.max) {
        errors.push(`Value must be no more than ${constraints.max}`);
    }

    // Validate allowed units
    if (
        constraints.allowedUnits &&
        !constraints.allowedUnits.includes(unit)
    ) {
        errors.push(
            `Unit must be one of: ${constraints.allowedUnits.join(', ')}`,
        );
    }

    return errors;
}

// Usage
const errors = validateCSSValue('150%', 'percent', {
    min: 0,
    max: 100,
    allowedUnits: ['%'],
});
// ['Value must be no more than 100']
```

## Supported CSS Value Types

### Length

**Units:** `px`, `em`, `rem`, `ch`, `ex`, `vh`, `vw`, `vmin`, `vmax`, `cm`,
`mm`, `in`, `pc`, `pt`, `%` **Default:** `px` **Examples:** `16px`,
`1.5rem`, `100%`, `50vh`

### Angle

**Units:** `deg`, `grad`, `rad`, `turn` **Default:** `deg` **Examples:**
`90deg`, `0.25turn`, `1.57rad`

### Time

**Units:** `s`, `ms` **Default:** `s` **Examples:** `0.3s`, `250ms`, `1.5s`

### Percent

**Units:** `%` **Default:** `%` **Examples:** `50%`, `100%`, `33.333%`

### Integer

**Units:** None **Default:** `''` (empty string) **Examples:** `3`, `10`,
`0`

## Common Use Cases

- **Design system utilities** - Convert design tokens to CSS values
- **CSS-in-JS libraries** - Parse and manipulate CSS values in JavaScript
- **Animation timing** - Convert CSS durations to JavaScript milliseconds
- **Form validation** - Validate CSS input values
- **Responsive design** - Calculate proportional values for different
  breakpoints
- **CSS variable generation** - Convert configuration objects to CSS custom
  properties
- **Style parsing** - Extract and manipulate values from CSS strings
- **Unit conversion** - Transform between different CSS units

## Browser Compatibility

This package uses standard JavaScript features and works in all modern
browsers and Node.js environments. The regex patterns are based on official
CSS specifications from MDN.
