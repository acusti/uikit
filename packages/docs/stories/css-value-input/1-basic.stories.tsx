import { storiesOf } from '@storybook/react';
import * as React from 'react';
import CSSValueInput from '@acusti/css-value-input';

storiesOf('@acusti/css-value-input/1. Basic', module).add('first', () => (
    <CSSValueInput
        cssValueType="time"
        label="Duration"
        onSubmit={() => {}}
        placeholder="0.25s"
        unit="s"
    />
));
