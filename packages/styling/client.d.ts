declare module '*.css?sheet' {
    import type { StyleSheet } from '@acusti/styling';

    const sheet: StyleSheet;
    export default sheet;
}
