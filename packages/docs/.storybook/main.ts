import { type StorybookConfig } from '@storybook/react-vite';
import react from '@vitejs/plugin-react';
import { dirname, join } from 'path';

import { compilerOptions } from '../../../vite.config.base.js';

// https://storybook.js.org/docs/faq#how-do-i-fix-module-resolution-in-special-environments
const _require = typeof require === 'undefined' ? import.meta : require;
const getAbsolutePath = (value: string): string =>
    dirname(_require.resolve(join(value, 'package.json'))).replace(/^file:\/\//, '');

const main: StorybookConfig = {
    addons: [getAbsolutePath('@storybook/addon-docs')],
    framework: {
        name: getAbsolutePath('@storybook/react-vite'),
        options: {},
    },
    stories: ['../stories/Introduction.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],
    typescript: { check: false, reactDocgen: 'react-docgen' },
    async viteFinal(viteConfig) {
        const { mergeConfig } = await import('vite');

        return mergeConfig(viteConfig, {
            plugins: [
                react({
                    babel: {
                        plugins: [['babel-plugin-react-compiler', compilerOptions]],
                    },
                }),
            ],
        });
    },
};

export default main;
