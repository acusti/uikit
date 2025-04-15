import { dirname, join } from 'path';

import type { StorybookConfig } from '@storybook/react-vite';

// https://storybook.js.org/docs/faq#how-do-i-fix-module-resolution-in-special-environments
const _require = typeof require === 'undefined' ? import.meta : require;
const getAbsolutePath = (value: string): any =>
    dirname(_require.resolve(join(value, 'package.json'))).replace(/^file:\/\//, '');

const config: StorybookConfig = {
    addons: [getAbsolutePath('@storybook/addon-essentials')],
    docs: { autodocs: 'tag' },
    framework: {
        name: getAbsolutePath('@storybook/react-vite'),
        options: {},
    },
    stories: ['../stories/Introduction.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],
    typescript: { check: false, reactDocgen: 'react-docgen' },
};

export default config;
