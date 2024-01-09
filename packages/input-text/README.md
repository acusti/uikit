# @acusti/input-text

[![latest version](https://img.shields.io/npm/v/@acusti/input-text?style=for-the-badge)](https://www.npmjs.com/package/@acusti/input-text)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/input-text?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Finput-text)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@acusti/input-text?style=for-the-badge)](https://bundlephobia.com/package/@acusti/input-text)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/input-text?style=for-the-badge)](https://www.npmjs.com/package/@acusti/input-text)

`InputText` is a React component that renders a semi-controlled input,
meaning that while it is [uncontrolled][] in the React sense, it’s value is
overwritten whenever `props.initialValue` changes. It also support
multiline inputs (rendered as a `<textarea>`) that automatically resize
vertically to fit their content.

See the [storybook docs and demo][] to get a feel for what it can do.

[storybook docs and demo]:
    https://acusti-uikit.netlify.app/?path=/docs/uikit-controls-inputtext--docs
[uncontrolled]: https://reactjs.org/docs/uncontrolled-components.html

## Usage

```
npm install @acusti/input-text
# or
yarn add @acusti/input-text
```

### Props

This is the type signature for the props you can pass to `InputText`. The
unique features provided by the component are called out and explained
above the corresponding prop via JSDoc comments:

```ts
type Props = {
    autoCapitalize?: 'none' | 'off' | 'sentences' | 'words' | 'characters';
    autoComplete?: HTMLInputElement['autocomplete'];
    className?: string;
    disabled?: boolean;
    /**
     * If true, input renders as readonly initially and only becomes interactive
     * when double-clicked or when user focuses the readonly input and then
     * presses the enter key. Likewise, the input becomes readonly again when
     * it is blurred or when the user presses enter or escape.
     */
    doubleClickToEdit?: boolean;
    enterKeyHint?: InputHTMLAttributes<HTMLInputElement>['enterKeyHint'];
    form?: string;
    /**
     * The initial value of the text input. If props.initialValue changes at
     * any point, the new value will override the local state of the input.
     */
    initialValue?: string;
    list?: string;
    max?: number;
    maxHeight?: number | string;
    maxLength?: number;
    min?: number;
    minLength?: number;
    /**
     * If true, input renders as a <textarea> that automatically grows and
     * shrinks vertically to adjust to the length of its contents.
     */
    multiLine?: boolean;
    multiple?: boolean;
    name?: string;
    onBlur?: (event: React.FocusEvent<InputElement>) => unknown;
    onChange?: (event: React.ChangeEvent<InputElement>) => unknown;
    onFocus?: (event: React.FocusEvent<InputElement>) => unknown;
    onKeyDown?: (event: React.KeyboardEvent<InputElement>) => unknown;
    onKeyUp?: (event: React.KeyboardEvent<InputElement>) => unknown;
    pattern?: string;
    placeholder?: string;
    readOnly?: boolean;
    required?: boolean;
    /** If true, the contents of the input are selected when it’s focused. */
    selectTextOnFocus?: boolean;
    size?: number;
    step?: number;
    style?: React.CSSProperties;
    /**
     * If true, pressing enter/return submits the <form> that the input is a
     * part of, or else blurs the input if no form is found.
     */
    submitOnEnter?: boolean;
    tabIndex?: number;
    title?: string;
    type?:
        | 'text'
        | 'email'
        | 'number'
        | 'password'
        | 'search'
        | 'tel'
        | 'url';
};
```
