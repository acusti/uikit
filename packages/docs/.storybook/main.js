const path = require('path');

module.exports = {
    stories: ['../stories/**/*.stories.mdx', '../stories/**/*.stories.@(js|jsx|ts|tsx)'],
    addons: [
        '@storybook/addon-docs',
        '@storybook/addon-essentials',
        '@storybook/addon-links',
    ],
    webpackFinal: (config, { configType }) => {
        config.resolve.alias['core-js'] = path.dirname(require.resolve('core-js'));
        return config;
    },
};
