import type { Preview } from '@storybook/react';

const preview: Preview = {
    parameters: {
        actions: { argTypesRegex: '^on[A-Z].*' },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
        previewTabs: {
            'storybook/docs/panel': { index: -1 }, // move “Docs” tab before “Canvas”
        },
        viewMode: 'docs',
    },
};

export default preview;
