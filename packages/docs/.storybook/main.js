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
};
