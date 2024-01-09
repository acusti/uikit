# @acusti/css-value-input

[![latest version](https://img.shields.io/npm/v/@acusti/css-value-input?style=for-the-badge)](https://www.npmjs.com/package/@acusti/css-value-input)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/css-value-input?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fcss-value-input)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@acusti/css-value-input?style=for-the-badge)](https://bundlephobia.com/package/@acusti/css-value-input)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/css-value-input?style=for-the-badge)](https://www.npmjs.com/package/@acusti/css-value-input)

`CSSValueInput` is a React component that renders a text input that can
take and update a CSS value of a particular type with a default unit. The
input’s behavior is similar to those of design applications such as Adobe
Illustrator.

See the [storybook docs and demo][] to get a feel for what it can do.

[storybook docs and demo]:
    https://acusti-uikit.netlify.app/?path=/docs/uikit-controls-CSSValueInput--docs

## Usage

```
npm install @acusti/css-value-input
# or
yarn add @acusti/css-value-input
```

### Props

This is the type signature for the props you can pass to `CSSValueInput`.
The unique features provided by the component are called out and explained
above the corresponding prop via JSDoc comments:

```ts
type Props = {
    /**
     * Boolean indicating if the user can submit an empty value (i.e. clear
     * the value). Defaults to true.
     */
    allowEmpty?: boolean;
    className?: string;
    cssValueType?: CSSValueType;
    disabled?: boolean;
    /**
     * Function that receives a value and converts it to its numerical equivalent
     * (i.e. '12px' → 12). Defaults to parseFloat().
     */
    getValueAsNumber?: (value: string | number) => number;
    icon?: React.ReactNode;
    label?: string;
    max?: number;
    min?: number;
    name?: string;
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => unknown;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => unknown;
    onFocus?: (event: React.FocusEvent<HTMLInputElement>) => unknown;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => unknown;
    onKeyUp?: (event: React.KeyboardEvent<HTMLInputElement>) => unknown;
    /**
     * Custom event handler triggered when the user presses enter/return
     * or blurs the input after making a change. Hitting esc will restore
     * the previous submitted value or original value.
     */
    onSubmitValue: (value: string) => unknown;
    placeholder?: string;
    step?: number;
    tabIndex?: number;
    title?: string;
    unit?: string;
    /** Regex or validator function to validate non-numeric values */
    validator?: RegExp | ((value: string) => boolean);
    value?: string;
};
```
