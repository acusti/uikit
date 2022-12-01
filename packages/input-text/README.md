# @acusti/input-text

[![latest version](https://img.shields.io/npm/v/@acusti/input-text?style=for-the-badge)](https://www.npmjs.com/package/@acusti/input-text)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/input-text?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Finput-text)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@acusti/input-text?style=for-the-badge)](https://bundlephobia.com/package/@acusti/input-text)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/input-text?style=for-the-badge)](https://www.npmjs.com/package/@acusti/input-text)

`InputText` is a React component that renders a semi-controlled input, meaning that while it is [uncontrolled][] in the React sense, it’s value is overwritten whenever `props.initialValue` changes. Also, if
`props.selectTextOnFocus` is true, it selects the entire contents of the
input whenever the input is focused. Lastly, if `props.multiLine` is true, it renders a textarea element that autogrows and shrinks to adjust to the length of its contents.

[uncontrolled]: https://reactjs.org/docs/uncontrolled-components.html