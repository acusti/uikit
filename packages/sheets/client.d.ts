declare module '*.css?sheet' {
    import type { StyleSheet } from '@acusti/sheets';

    const sheet: StyleSheet;
    export default sheet;
}
