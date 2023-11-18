import * as React from 'react';

import Dropdown from '../../dropdown/src/Dropdown.js';

import './Dropdown.css';
import './useIsOutOfBounds.css';

import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof Dropdown> = {
    argTypes: {
        element: {
            description:
                'The HTMLElement that will be checked to see if it is out of bounds and in what direction. Can be null or undefined.',
            table: {
                type: { summary: 'object' },
            },
        },
    },
    component: Dropdown,
    parameters: {
        controls: { exclude: /.*/g },
        docs: {
            description: {
                component: `\`useIsOutOfBounds\` is a React hook that returns an object indicating if the
current component is out of the bounds of its nearest ancestor that doesn’t have overflow: visible. In other words,
it provides collision detection between an element and its bounds. The return value is
\`
type OutOfBounds = {
    bottom: boolean;
    hasLayout: boolean;
    left: boolean;
    maxHeight: null | number;
    maxWidth: null | number;
    right: boolean;
    top: boolean;
};
\`
It is used by in @acusti/dropdown to automatically position the dropdown in the direction
where there is room for it to render, so this story uses \`<Dropdown>\` to illustrate that behavior.`,
            },
        },
    },
    //https://storybook.js.org/docs/react/writing-docs/autodocs#setup-automated-documentation
    tags: ['autodocs'],
    title: 'UIKit/Hooks/useIsOutOfBounds',
};

export default meta;

type Story = StoryObj<typeof Dropdown>;

const list = (
    <ul>
        <li>Brunei Darussalam</li>
        <li>Cambodia</li>
        <li>Indonesia</li>
        <li>Laos</li>
        <li>Malaysia</li>
        <li>Myanmar (Burma)</li>
        <li>Philippines</li>
        <li>Singapore</li>
        <li>Thailand</li>
        <li>Timor-Leste (East Timor)</li>
        <li>Vietnam</li>
    </ul>
);

export const NotOutOfBounds: Story = {
    args: {
        children: list,
        className: 'not-out-of-bounds-example',
        isSearchable: true,
        name: 'notoutofbounds',
        placeholder: 'Default behavior',
    },
};

export const OutOfBoundsAtBottom: Story = {
    args: {
        children: list,
        className: 'out-of-bounds-example',
        isSearchable: true,
        name: 'outofboundsatbottom',
        placeholder: 'Show above',
    },
};

export const OutOfBoundsAtRight: Story = {
    args: {
        children: list,
        className: 'out-of-bounds-example position-right',
        isSearchable: true,
        name: 'outofboundsatright',
        placeholder: 'Show above & to the left',
    },
};

export const OutOfBoundsTopAndBottom: Story = {
    args: {
        children: (
            <ul>
                <li>Algeria</li>
                <li>Angola</li>
                <li>Benin</li>
                <li>Botswana</li>
                <li>Burkina Faso</li>
                <li>Burundi</li>
                <li>Cabo Verde</li>
                <li>Cameroon</li>
                <li>Central African Republic</li>
                <li>Chad</li>
                <li>Comoros</li>
                <li>Congo, Democratic Republic of the</li>
                <li>Congo, Republic of the</li>
                <li>Cote d’Ivoire</li>
                <li>Djibouti</li>
                <li>Egypt</li>
                <li>Equatorial Guinea</li>
                <li>Eritrea</li>
                <li>Eswatini</li>
                <li>Ethiopia</li>
                <li>Gabon</li>
                <li>Gambia</li>
                <li>Ghana</li>
                <li>Guinea</li>
                <li>Guinea-Bissau</li>
                <li>Kenya</li>
                <li>Lesotho</li>
                <li>Liberia</li>
                <li>Libya</li>
                <li>Madagascar</li>
                <li>Malawi</li>
                <li>Mali</li>
                <li>Mauritania</li>
                <li>Mauritius</li>
                <li>Morocco</li>
                <li>Mozambique</li>
                <li>Namibia</li>
                <li>Niger</li>
                <li>Nigeria</li>
                <li>Rwanda</li>
                <li>Sao Tome and Principe</li>
                <li>Senegal</li>
                <li>Seychelles</li>
                <li>Sierra Leone</li>
                <li>Somalia</li>
                <li>South Africa</li>
                <li>South Sudan</li>
                <li>Sudan</li>
                <li>Tanzania</li>
                <li>Togo</li>
                <li>Tunisia</li>
                <li>Uganda</li>
                <li>Zambia</li>
                <li>Zimbabwe</li>
            </ul>
        ),
        className: 'out-of-bounds-top-and-bottom-example',
        isSearchable: true,
        name: 'outofboundstopandbottom',
        placeholder: 'long list',
    },
};
