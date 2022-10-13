const path = require('path');

module.exports = {
    stories: [
        '../stories/Introduction.stories.mdx',
        '../stories/**/*.stories.mdx',
        '../stories/**/*.stories.@(js|jsx|ts|tsx)',
    ],
    addons: ['@storybook/addon-essentials', '@storybook/addon-links'],
    typescript: {
        reactDocgen: 'react-docgen',
    },
    webpackFinal: (config, { configType }) => {
        config.resolve.alias['core-js'] = path.dirname(require.resolve('core-js'));
        return config;
    },
};
