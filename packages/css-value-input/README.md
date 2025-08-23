# @acusti/css-value-input

[![latest version](https://img.shields.io/npm/v/@acusti/css-value-input?style=for-the-badge)](https://www.npmjs.com/package/@acusti/css-value-input)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/css-value-input?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fcss-value-input)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/css-value-input?style=for-the-badge)](https://www.npmjs.com/package/@acusti/css-value-input)
[![bundle size](https://deno.bundlejs.com/badge?q=@acusti/css-value-input)](https://bundlejs.com/?q=%40acusti%2Fcss-value-input)

`CSSValueInput` is a React component that renders a specialized text input
for CSS values with intelligent unit handling, increment/decrement
controls, validation, and normalization. Designed with the user experience
of professional design tools like Adobe Illustrator, it automatically
manages units, enforces constraints, and provides intuitive keyboard
interactions.

## Key Features

- **Smart Unit Management** - Automatically applies appropriate units based
  on CSS value type
- **Arrow Key Increment/Decrement** - Use ↑/↓ keys to adjust values (Shift
  for 10x multiplier)
- **Automatic Validation** - Enforces min/max bounds and CSS value type
  constraints
- **Value Normalization** - Converts inputs to valid CSS values with proper
  units
- **Escape to Revert** - Press Escape to restore the last valid value
- **Custom Validators** - Support for regex or function-based validation of
  non-numeric values
- **Flexible Input Types** - Supports length, angle, time, percentage, and
  integer CSS values
- **Design Tool UX** - Text selection on focus, enter to confirm, intuitive
  interactions

## Installation

```bash
npm install @acusti/css-value-input
# or
yarn add @acusti/css-value-input
```

## Quick Start

```tsx
import CSSValueInput from '@acusti/css-value-input';
import { useState } from 'react';

function StyleEditor() {
    const [width, setWidth] = useState('100px');
    const [rotation, setRotation] = useState('0deg');

    return (
        <div>
            <CSSValueInput
                label="Width"
                cssValueType="length"
                value={width}
                onSubmitValue={setWidth}
                min={0}
                max={1000}
            />

            <CSSValueInput
                label="Rotation"
                cssValueType="angle"
                value={rotation}
                onSubmitValue={setRotation}
                step={15}
            />
        </div>
    );
}
```

## API Reference

### Props

```ts
type Props = {
    /**
     * Boolean indicating if the user can submit an empty value (i.e. clear
     * the value). Defaults to true.
     */
    allowEmpty?: boolean;

    /** Additional CSS class name for styling */
    className?: string;

    /** Type of CSS value: 'length', 'angle', 'time', 'percent', or 'integer' */
    cssValueType?: CSSValueType;

    /** Disable the input */
    disabled?: boolean;

    /**
     * Function that receives a value and converts it to its numerical equivalent
     * (i.e. '12px' → 12). Defaults to parseFloat().
     */
    getValueAsNumber?: (value: string | number) => number;

    /** Icon element to display before the input */
    icon?: React.ReactNode;

    /** Label text displayed above the input */
    label?: string;

    /** Maximum allowed numeric value */
    max?: number;

    /** Minimum allowed numeric value */
    min?: number;

    /** HTML name attribute for forms */
    name?: string;

    /** Called when input loses focus */
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => unknown;

    /** Called on each keystroke (before validation) */
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => unknown;

    /** Called when input gains focus */
    onFocus?: (event: React.FocusEvent<HTMLInputElement>) => unknown;

    /** Called on key press (before built-in key handling) */
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => unknown;

    /** Called on key release */
    onKeyUp?: (event: React.KeyboardEvent<HTMLInputElement>) => unknown;

    /**
     * Called when the user submits a value (Enter key or blur after change).
     * This is your main callback for getting the validated, normalized CSS value.
     */
    onSubmitValue: (value: string) => unknown;

    /** Placeholder text when input is empty */
    placeholder?: string;

    /** Step size for arrow key increments (default: 1) */
    step?: number;

    /** HTML tabindex for focus order */
    tabIndex?: number;

    /** Tooltip text */
    title?: string;

    /** Default unit to apply (auto-detected from cssValueType if not provided) */
    unit?: string;

    /** Custom validator for non-numeric values (RegExp or function) */
    validator?: RegExp | ((value: string) => boolean);

    /** Current value of the input */
    value?: string;
};
```

### CSS Value Types

The component supports all CSS value types from `@acusti/css-values`:

- **`length`** - px, em, rem, %, vh, vw, etc. (default: px)
- **`angle`** - deg, rad, grad, turn (default: deg)
- **`time`** - s, ms (default: s)
- **`percent`** - % (default: %)
- **`integer`** - whole numbers only (no unit)

## Usage Examples

### Design Tool Property Panel

```tsx
import CSSValueInput from '@acusti/css-value-input';
import { useState } from 'react';

function PropertyPanel({ selectedElement }) {
    const [styles, setStyles] = useState({
        width: '100px',
        height: '100px',
        borderRadius: '0px',
        rotation: '0deg',
        opacity: '100%',
        animationDuration: '0.3s',
    });

    const updateStyle = (property: string) => (value: string) => {
        setStyles((prev) => ({ ...prev, [property]: value }));
        // Apply to selected element
        if (selectedElement) {
            selectedElement.style[property] = value;
        }
    };

    return (
        <div className="property-panel">
            <h3>Transform</h3>
            <div className="input-group">
                <CSSValueInput
                    label="Width"
                    cssValueType="length"
                    value={styles.width}
                    onSubmitValue={updateStyle('width')}
                    min={0}
                    icon="📏"
                />

                <CSSValueInput
                    label="Height"
                    cssValueType="length"
                    value={styles.height}
                    onSubmitValue={updateStyle('height')}
                    min={0}
                    icon="📐"
                />
            </div>

            <CSSValueInput
                label="Border Radius"
                cssValueType="length"
                value={styles.borderRadius}
                onSubmitValue={updateStyle('borderRadius')}
                min={0}
                step={5}
                icon="⭕"
            />

            <CSSValueInput
                label="Rotation"
                cssValueType="angle"
                value={styles.rotation}
                onSubmitValue={updateStyle('rotation')}
                step={15}
                icon="🔄"
            />

            <h3>Appearance</h3>
            <CSSValueInput
                label="Opacity"
                cssValueType="percent"
                value={styles.opacity}
                onSubmitValue={updateStyle('opacity')}
                min={0}
                max={100}
                step={5}
                icon="👁️"
            />

            <CSSValueInput
                label="Animation Duration"
                cssValueType="time"
                value={styles.animationDuration}
                onSubmitValue={updateStyle('animationDuration')}
                min={0}
                step={0.1}
                icon="⏱️"
            />
        </div>
    );
}
```

### Responsive Design Controls

```tsx
import CSSValueInput from '@acusti/css-value-input';
import { useState } from 'react';

function ResponsiveControls() {
    const [breakpoints, setBreakpoints] = useState({
        mobile: '480px',
        tablet: '768px',
        desktop: '1024px',
        wide: '1440px',
    });

    const [spacing, setSpacing] = useState({
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
    });

    const updateBreakpoint = (key: string) => (value: string) => {
        setBreakpoints((prev) => ({ ...prev, [key]: value }));
    };

    const updateSpacing = (key: string) => (value: string) => {
        setSpacing((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="responsive-controls">
            <section>
                <h3>Breakpoints</h3>
                {Object.entries(breakpoints).map(([key, value]) => (
                    <CSSValueInput
                        key={key}
                        label={key.charAt(0).toUpperCase() + key.slice(1)}
                        cssValueType="length"
                        value={value}
                        onSubmitValue={updateBreakpoint(key)}
                        min={200}
                        max={2560}
                        step={10}
                        unit="px"
                    />
                ))}
            </section>

            <section>
                <h3>Spacing Scale</h3>
                {Object.entries(spacing).map(([key, value]) => (
                    <CSSValueInput
                        key={key}
                        label={key.toUpperCase()}
                        cssValueType="length"
                        value={value}
                        onSubmitValue={updateSpacing(key)}
                        min={0}
                        max={100}
                        step={2}
                    />
                ))}
            </section>
        </div>
    );
}
```

### Animation Keyframe Editor

```tsx
import CSSValueInput from '@acusti/css-value-input';
import { useState } from 'react';

function KeyframeEditor() {
    const [keyframes, setKeyframes] = useState([
        {
            offset: '0%',
            transform: 'translateX(0px) rotate(0deg)',
            opacity: '100%',
        },
        {
            offset: '50%',
            transform: 'translateX(100px) rotate(180deg)',
            opacity: '50%',
        },
        {
            offset: '100%',
            transform: 'translateX(0px) rotate(360deg)',
            opacity: '100%',
        },
    ]);

    const [animationSettings, setAnimationSettings] = useState({
        duration: '2s',
        delay: '0s',
        timingFunction: 'ease-in-out',
        iterations: '1',
    });

    const updateKeyframe = (
        index: number,
        property: string,
        value: string,
    ) => {
        setKeyframes((prev) =>
            prev.map((kf, i) =>
                i === index ? { ...kf, [property]: value } : kf,
            ),
        );
    };

    return (
        <div className="keyframe-editor">
            <h3>Animation Settings</h3>
            <div className="animation-controls">
                <CSSValueInput
                    label="Duration"
                    cssValueType="time"
                    value={animationSettings.duration}
                    onSubmitValue={(value) =>
                        setAnimationSettings((prev) => ({
                            ...prev,
                            duration: value,
                        }))
                    }
                    min={0}
                    step={0.1}
                />

                <CSSValueInput
                    label="Delay"
                    cssValueType="time"
                    value={animationSettings.delay}
                    onSubmitValue={(value) =>
                        setAnimationSettings((prev) => ({
                            ...prev,
                            delay: value,
                        }))
                    }
                    min={0}
                    step={0.1}
                />

                <CSSValueInput
                    label="Iterations"
                    cssValueType="integer"
                    value={animationSettings.iterations}
                    onSubmitValue={(value) =>
                        setAnimationSettings((prev) => ({
                            ...prev,
                            iterations: value,
                        }))
                    }
                    min={1}
                    validator={(value) =>
                        value === 'infinite' || !isNaN(Number(value))
                    }
                />
            </div>

            <h3>Keyframes</h3>
            {keyframes.map((keyframe, index) => (
                <div key={index} className="keyframe">
                    <h4>Keyframe {index + 1}</h4>
                    <div className="keyframe-controls">
                        <CSSValueInput
                            label="Offset"
                            cssValueType="percent"
                            value={keyframe.offset}
                            onSubmitValue={(value) =>
                                updateKeyframe(index, 'offset', value)
                            }
                            min={0}
                            max={100}
                            step={5}
                        />

                        <CSSValueInput
                            label="Opacity"
                            cssValueType="percent"
                            value={keyframe.opacity}
                            onSubmitValue={(value) =>
                                updateKeyframe(index, 'opacity', value)
                            }
                            min={0}
                            max={100}
                            step={10}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}
```

### CSS Grid Layout Builder

```tsx
import CSSValueInput from '@acusti/css-value-input';
import { useState } from 'react';

function GridLayoutBuilder() {
    const [gridSettings, setGridSettings] = useState({
        columns: '1fr 1fr 1fr',
        rows: 'auto auto',
        columnGap: '16px',
        rowGap: '16px',
        padding: '20px',
    });

    const [itemSettings, setItemSettings] = useState({
        columnStart: '1',
        columnEnd: '2',
        rowStart: '1',
        rowEnd: '2',
    });

    return (
        <div className="grid-builder">
            <h3>Grid Container</h3>
            <div className="grid-controls">
                <CSSValueInput
                    label="Column Gap"
                    cssValueType="length"
                    value={gridSettings.columnGap}
                    onSubmitValue={(value) =>
                        setGridSettings((prev) => ({
                            ...prev,
                            columnGap: value,
                        }))
                    }
                    min={0}
                    step={4}
                />

                <CSSValueInput
                    label="Row Gap"
                    cssValueType="length"
                    value={gridSettings.rowGap}
                    onSubmitValue={(value) =>
                        setGridSettings((prev) => ({
                            ...prev,
                            rowGap: value,
                        }))
                    }
                    min={0}
                    step={4}
                />

                <CSSValueInput
                    label="Padding"
                    cssValueType="length"
                    value={gridSettings.padding}
                    onSubmitValue={(value) =>
                        setGridSettings((prev) => ({
                            ...prev,
                            padding: value,
                        }))
                    }
                    min={0}
                    step={4}
                />
            </div>

            <h3>Grid Item Position</h3>
            <div className="item-controls">
                <CSSValueInput
                    label="Column Start"
                    cssValueType="integer"
                    value={itemSettings.columnStart}
                    onSubmitValue={(value) =>
                        setItemSettings((prev) => ({
                            ...prev,
                            columnStart: value,
                        }))
                    }
                    min={1}
                />

                <CSSValueInput
                    label="Column End"
                    cssValueType="integer"
                    value={itemSettings.columnEnd}
                    onSubmitValue={(value) =>
                        setItemSettings((prev) => ({
                            ...prev,
                            columnEnd: value,
                        }))
                    }
                    min={1}
                />

                <CSSValueInput
                    label="Row Start"
                    cssValueType="integer"
                    value={itemSettings.rowStart}
                    onSubmitValue={(value) =>
                        setItemSettings((prev) => ({
                            ...prev,
                            rowStart: value,
                        }))
                    }
                    min={1}
                />

                <CSSValueInput
                    label="Row End"
                    cssValueType="integer"
                    value={itemSettings.rowEnd}
                    onSubmitValue={(value) =>
                        setItemSettings((prev) => ({
                            ...prev,
                            rowEnd: value,
                        }))
                    }
                    min={1}
                />
            </div>

            <div className="preview">
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: gridSettings.columns,
                        gridTemplateRows: gridSettings.rows,
                        columnGap: gridSettings.columnGap,
                        rowGap: gridSettings.rowGap,
                        padding: gridSettings.padding,
                        border: '1px dashed #ccc',
                        minHeight: '200px',
                    }}
                >
                    <div
                        style={{
                            gridColumnStart: itemSettings.columnStart,
                            gridColumnEnd: itemSettings.columnEnd,
                            gridRowStart: itemSettings.rowStart,
                            gridRowEnd: itemSettings.rowEnd,
                            backgroundColor: '#e3f2fd',
                            padding: '8px',
                            border: '1px solid #2196f3',
                        }}
                    >
                        Grid Item
                    </div>
                </div>
            </div>
        </div>
    );
}
```

### Typography Controls

```tsx
import CSSValueInput from '@acusti/css-value-input';
import { useState } from 'react';

function TypographyControls() {
    const [typography, setTypography] = useState({
        fontSize: '16px',
        lineHeight: '1.5',
        letterSpacing: '0px',
        wordSpacing: '0px',
        textIndent: '0px',
    });

    const updateTypography = (property: string) => (value: string) => {
        setTypography((prev) => ({ ...prev, [property]: value }));
    };

    return (
        <div className="typography-controls">
            <h3>Typography</h3>

            <CSSValueInput
                label="Font Size"
                cssValueType="length"
                value={typography.fontSize}
                onSubmitValue={updateTypography('fontSize')}
                min={8}
                max={72}
                step={1}
                icon="🔤"
            />

            <CSSValueInput
                label="Line Height"
                cssValueType="length"
                value={typography.lineHeight}
                onSubmitValue={updateTypography('lineHeight')}
                min={0.5}
                max={3}
                step={0.1}
                unit="" // Line height can be unitless
                validator={(value) => {
                    // Allow unitless numbers or length values
                    return /^(\d*\.?\d+)(px|em|rem|%)?$/.test(value);
                }}
                icon="📏"
            />

            <CSSValueInput
                label="Letter Spacing"
                cssValueType="length"
                value={typography.letterSpacing}
                onSubmitValue={updateTypography('letterSpacing')}
                min={-5}
                max={10}
                step={0.5}
                icon="🔤"
            />

            <CSSValueInput
                label="Word Spacing"
                cssValueType="length"
                value={typography.wordSpacing}
                onSubmitValue={updateTypography('wordSpacing')}
                min={-10}
                max={20}
                step={1}
                icon="📝"
            />

            <CSSValueInput
                label="Text Indent"
                cssValueType="length"
                value={typography.textIndent}
                onSubmitValue={updateTypography('textIndent')}
                min={0}
                max={100}
                step={5}
                icon="⬅️"
            />

            <div className="preview-text" style={typography}>
                <p>
                    Lorem ipsum dolor sit amet, consectetur adipiscing
                    elit. Sed do eiusmod tempor incididunt ut labore et
                    dolore magna aliqua. Ut enim ad minim veniam, quis
                    nostrud exercitation.
                </p>
            </div>
        </div>
    );
}
```

### Custom Validator Examples

```tsx
import CSSValueInput from '@acusti/css-value-input';

function CustomValidators() {
    // CSS function validator (e.g., calc(), var(), etc.)
    const cssFunctionValidator = (value: string) => {
        return (
            /^(calc|var|min|max|clamp)\(.*\)$/.test(value) ||
            !isNaN(parseFloat(value))
        );
    };

    // Color hex validator
    const hexColorValidator = /^#([0-9A-Fa-f]{3}){1,2}$/;

    // CSS keyword validator for display property
    const displayKeywordValidator = (value: string) => {
        const validKeywords = [
            'block',
            'inline',
            'flex',
            'grid',
            'none',
            'inline-block',
        ];
        return validKeywords.includes(value) || !isNaN(parseFloat(value));
    };

    return (
        <div>
            <CSSValueInput
                label="Width (supports calc)"
                cssValueType="length"
                onSubmitValue={(value) => console.log('Width:', value)}
                validator={cssFunctionValidator}
                placeholder="100px or calc(50% - 10px)"
            />

            <CSSValueInput
                label="Border Color"
                cssValueType="length" // We'll override the unit behavior
                onSubmitValue={(value) => console.log('Color:', value)}
                validator={hexColorValidator}
                unit="" // No default unit
                placeholder="#ff0000"
            />

            <CSSValueInput
                label="Z-Index"
                cssValueType="integer"
                onSubmitValue={(value) => console.log('Z-Index:', value)}
                min={-999}
                max={999}
                step={1}
                validator={(value) =>
                    value === 'auto' || !isNaN(parseInt(value))
                }
            />
        </div>
    );
}
```

## Keyboard Interactions

### Arrow Keys

- **↑/↓** - Increment/decrement by step amount
- **Shift + ↑/↓** - Increment/decrement by step × 10
- Works with all numeric CSS value types

### Special Keys

- **Enter** - Submit value and blur input
- **Escape** - Revert to last submitted value and blur
- **Tab** - Submit value and move to next input

### Value Handling

- **Auto-complete units** - Typing "100" becomes "100px" for length inputs
- **Unit preservation** - Keeps the unit from the previous value when
  possible
- **Range enforcement** - Automatically clamps values to min/max bounds
- **Type coercion** - Converts integers when cssValueType="integer"

## Styling

The component uses CSS classes with the prefix `cssvalueinput`:

```css
.cssvalueinput {
    /* Main container styles */
}

.cssvalueinput-icon {
    /* Icon container styles */
}

.cssvalueinput-label {
    /* Label container styles */
}

.cssvalueinput-label-text {
    /* Label text styles */
}

.cssvalueinput-value {
    /* Input wrapper styles */
}

.cssvalueinput.disabled {
    /* Disabled state styles */
}
```

### Example Styling

```css
.cssvalueinput {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 12px;
}

.cssvalueinput-label-text {
    font-size: 12px;
    font-weight: 600;
    color: #333;
    margin: 0;
}

.cssvalueinput-icon {
    font-size: 16px;
    margin-right: 8px;
}

.cssvalueinput input {
    padding: 6px 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-family: monospace;
    text-align: center;
}

.cssvalueinput input:focus {
    outline: 2px solid #007bff;
    border-color: transparent;
}

.cssvalueinput.disabled {
    opacity: 0.6;
    pointer-events: none;
}
```

## Integration with CSS-in-JS

```tsx
import CSSValueInput from '@acusti/css-value-input';
import styled from 'styled-components';

const StyledBox = styled.div<{
    width: string;
    height: string;
    rotation: string;
}>`
    width: ${(props) => props.width};
    height: ${(props) => props.height};
    transform: rotate(${(props) => props.rotation});
    background: linear-gradient(45deg, #007bff, #28a745);
    transition: all 0.3s ease;
`;

function StyledComponentEditor() {
    const [boxStyles, setBoxStyles] = useState({
        width: '200px',
        height: '200px',
        rotation: '0deg',
    });

    return (
        <div>
            <div className="controls">
                <CSSValueInput
                    label="Width"
                    cssValueType="length"
                    value={boxStyles.width}
                    onSubmitValue={(value) =>
                        setBoxStyles((prev) => ({ ...prev, width: value }))
                    }
                />

                <CSSValueInput
                    label="Height"
                    cssValueType="length"
                    value={boxStyles.height}
                    onSubmitValue={(value) =>
                        setBoxStyles((prev) => ({
                            ...prev,
                            height: value,
                        }))
                    }
                />

                <CSSValueInput
                    label="Rotation"
                    cssValueType="angle"
                    value={boxStyles.rotation}
                    onSubmitValue={(value) =>
                        setBoxStyles((prev) => ({
                            ...prev,
                            rotation: value,
                        }))
                    }
                    step={15}
                />
            </div>

            <StyledBox {...boxStyles}>Styled Component</StyledBox>
        </div>
    );
}
```

## Accessibility

- **Label Association** - Proper label/input relationships for screen
  readers
- **Keyboard Navigation** - Full keyboard control without mouse dependency
- **Focus Management** - Clear focus indicators and logical tab order
- **Value Announcements** - Screen readers announce value changes
- **Error Handling** - Invalid values are reverted with visual feedback

## Browser Compatibility

- **Modern Browsers** - Chrome, Firefox, Safari, Edge (latest)
- **Mobile Support** - Touch-friendly with virtual keyboard support
- **SSR Compatible** - Works with Next.js, React Router, etc.

## Common Use Cases

- **Design Tools** - Property panels, style editors, layout builders
- **CSS Generators** - Live CSS property editors
- **Animation Tools** - Keyframe editors, timing controls
- **Theme Builders** - Design system value editors
- **Form Builders** - CSS-aware form inputs
- **Component Libraries** - Styleable component property editors

## Demo

See the
[Storybook documentation and examples](https://uikit.acusti.ca/?path=/docs/uikit-controls-CSSValueInput--docs)
for interactive demonstrations of all CSS value input features and
configurations.
