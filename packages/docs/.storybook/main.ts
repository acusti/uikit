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
    addons: [getAbsolutePath('@storybook/addon-essentials')],
    docs: { autodocs: 'tag' },
    framework: {
        name: getAbsolutePath('@storybook/react-vite'),
        options: {},
    },
    stories: ['../stories/Introduction.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],
    typescript: {
        check: false,
        reactDocgen: 'react-docgen',
        skipBabel: true,
    },
};

export default config;
