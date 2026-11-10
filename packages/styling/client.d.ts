declare module '*.css?style' {
    import type { StyleSheet } from '@acusti/styling';

    const sheet: StyleSheet;
    export default sheet;
}
