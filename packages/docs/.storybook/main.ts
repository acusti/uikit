import { dirname, join } from 'path';

import type { StorybookConfig } from '@storybook/react-vite';

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): any {
    return dirname(require.resolve(join(value, 'package.json')));
}

const config: StorybookConfig = {
    addons: [
        getAbsolutePath('@storybook/addon-links'),
        getAbsolutePath('@storybook/addon-essentials'),
        getAbsolutePath('@storybook/addon-interactions'),
    ],
    docs: {
        autodocs: 'tag',
    },
    framework: {
        name: getAbsolutePath('@storybook/react-vite'),
        options: {},
    },
    stories: [
        '../stories/Introduction.stories.mdx',
        '../stories/**/*.stories.mdx',
        '../stories/**/*.stories.@(js|jsx|ts|tsx)',
    ],
    typescript: {
        check: false,
        reactDocgen: 'react-docgen',
        skipBabel: true,
    },
};

export default config;
