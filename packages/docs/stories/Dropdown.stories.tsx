import { fn } from 'storybook/test';
import * as React from 'react';

import CSSValueInput from '../../css-value-input/src/CSSValueInput.js';
import Dropdown from '../../dropdown/src/Dropdown.js';

import './CSSValueInput.css';
import './Dropdown.css';
import './InputText.css';

import type { Meta, StoryObj } from '@storybook/react-vite';

const { Fragment } = React;

const meta: Meta<typeof Dropdown> = {
    component: Dropdown,
    parameters: {
        docs: {
            description: {
                component:
                    '`Dropdown` is a React component that renders a menu-like UI with a trigger that the user clicks to disclose a dropdown positioned below the trigger. The body of the dropdown can include any DOM, and many dropdowns can be combined to form a multi-item menu, like the system menu in the top toolbar of macOS.',
            },
        },
    },
    //https://storybook.js.org/docs/react/writing-docs/autodocs#setup-automated-documentation
    tags: ['autodocs'],
    title: 'UIKit/Controls/Dropdown',
};

export default meta;

type Story = StoryObj<typeof Dropdown>;

export const CSSLengthsDropdown: Story = {
    args: {
        children: (
            <ul>
                <li>0px</li>
                <li>4px</li>
                <li>9px</li>
                <li>18px</li>
                <li>36px</li>
                <li>54px</li>
                <li>72px</li>
                <li>144px</li>
                <li>167px</li>
                <li>198px</li>
            </ul>
        ),
        className: 'css-lengths no-trigger-text',
    },
};

export const StatesDropdown: Story = {
    args: {
        children: (
            <ul>
                <li>Alabama</li>
                <li>Alaska</li>
                <li>Arizona</li>
                <li>Arkansas</li>
                <li>California</li>
                <li>Colorado</li>
                <li>Connecticut</li>
                <li>Delaware</li>
                <li>Florida</li>
                <li>Georgia</li>
                <li>Hawaii</li>
                <li>Idaho</li>
                <li>Illinois</li>
                <li>Indiana</li>
                <li>Iowa</li>
                <li>Kansas</li>
                <li>Kentucky</li>
                <li>Louisiana</li>
                <li>Maine</li>
                <li>Maryland</li>
                <li>Massachusetts</li>
                <li>Michigan</li>
                <li>Minnesota</li>
                <li>Mississippi</li>
                <li>Missouri</li>
                <li>Montana</li>
                <li>Nebraska</li>
                <li>Nevada</li>
                <li>New Hampshire</li>
                <li>New Jersey</li>
                <li>New Mexico</li>
                <li>New York</li>
                <li>North Carolina</li>
                <li>North Dakota</li>
                <li>Ohio</li>
                <li>Oklahoma</li>
                <li>Oregon</li>
                <li>Pennsylvania</li>
                <li>Rhode Island</li>
                <li>South Carolina</li>
                <li>South Dakota</li>
                <li>Tennessee</li>
                <li>Texas</li>
                <li>Utah</li>
                <li>Vermont</li>
                <li>Virginia</li>
                <li>Washington</li>
                <li>West Virginia</li>
                <li>Wisconsin</li>
                <li>Wyoming</li>
            </ul>
        ),
        className: 'states-dropdown',
        isSearchable: true,
        placeholder: 'Choose a state…',
    },
};

export const FontWeightDropdown: Story = {
    args: {
        children: (
            <ul>
                <li data-ukt-value="100">
                    <span className="item-title">Font Weight - </span>
                    100
                </li>
                <li data-ukt-value="200">
                    <span className="item-title">Font Weight - </span>
                    200
                </li>
                <li data-ukt-value="300">
                    <span className="item-title">Font Weight - </span>
                    300
                </li>
                <li data-ukt-value="400">
                    <span className="item-title">Font Weight - </span>
                    400
                </li>
                <li data-ukt-value="500">
                    <span className="item-title">Font Weight - </span>
                    500
                </li>
                <li data-ukt-value="600">
                    <span className="item-title">Font Weight - </span>
                    600
                </li>
                <li data-ukt-value="700">
                    <span className="item-title">Font Weight - </span>
                    700
                </li>
            </ul>
        ),
        className: 'font-weight',
        isSearchable: true,
    },
};

export const ShowContextMenuOnMount: Story = {
    args: {
        children: [
            'View menu',
            <Fragment>
                <h4 className="heading">View</h4>
                <ul>
                    <li data-ukt-item>Open</li>
                    <li data-ukt-item>Preview</li>
                </ul>
                <h4 className="heading">Edit</h4>
                <ul>
                    <li data-ukt-value="save-item">Save</li>
                    <li data-ukt-value="edit-item">Edit</li>
                    <li data-ukt-value="delete-item">Delete</li>
                </ul>
            </Fragment>,
        ],
        className: 'open-on-mount-context-menu',
        isOpenOnMount: true,
        // NOTE spies are a workaround for a bug related to implicit arg detection
        // https://github.com/storybookjs/storybook/issues/23873
        onClick: fn(),
        onClose: fn(),
        onMouseDown: fn(),
        onMouseUp: fn(),
        onOpen: fn(),
        onSubmitItem: fn(),
    },
};

export const DropdownWithInteractiveContents: Story = {
    args: {
        children: [
            'Open',
            <div>
                <p>
                    Try interacting with the controls here. The dropdown should only close
                    when you click outside of the entire dropdown or if you hit the escape
                    key when focus isn’t in the input controls.
                </p>
                <CSSValueInput
                    cssValueType="length"
                    label="Width"
                    onSubmitValue={() => {}}
                    placeholder="100vw"
                    unit="vw"
                />
                <CSSValueInput
                    cssValueType="length"
                    label="Rotation"
                    onSubmitValue={() => {}}
                    placeholder="0deg"
                    step={5}
                    unit="deg"
                />
            </div>,
        ],
        className: 'dropdown-without-items',
        hasItems: false,
    },
};

export const SearchableWithLabel: Story = {
    args: {
        children: (
            <ul>
                <li>0px</li>
                <li>4px</li>
                <li>9px</li>
                <li>18px</li>
                <li>36px</li>
                <li>54px</li>
                <li>72px</li>
                <li>144px</li>
                <li>167px</li>
                <li>198px</li>
            </ul>
        ),
        className: 'searchable-with-label',
        isSearchable: true,
        label: 'Font size',
    },
};

export const SearchableAndAllowCreate: Story = {
    args: {
        allowCreate: true,
        children: (
            <ul>
                <li>0px</li>
                <li>4px</li>
                <li>9px</li>
                <li>18px</li>
                <li>36px</li>
                <li>54px</li>
                <li>72px</li>
                <li>144px</li>
                <li>167px</li>
                <li>198px</li>
            </ul>
        ),
        className: 'searchable-and-allow-create',
        isSearchable: true,
        label: 'Font size',
    },
};

export const CSSValueInputTrigger: Story = {
    args: {
        allowCreate: true,
        children: [
            <CSSValueInput
                name="cssinputbackgroundsize"
                onSubmitValue={() => {}}
                placeholder="cover"
                validator={/^(auto|contain|cover)$/}
            />,
            <ul>
                <li>cover</li>
                <li>contain</li>
                <li>auto</li>
                <li>50px</li>
                <li>100px</li>
                <li>200px</li>
                <li>50%</li>
            </ul>,
        ],
        className: 'css-value-input-trigger',
        hasItems: true,
        label: 'Background size',
    },
};

export const TextareaTrigger: Story = {
    args: {
        children: [
            <textarea></textarea>,
            <ul>
                <li>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque
                    ullamcorper fringilla quam, vel tincidunt nisl mattis vel.
                </li>
                <li>
                    Aenean posuere erat sed enim luctus, et accumsan nisl elementum. Nulla
                    vel blandit urna, vel accumsan nulla. Nulla varius luctus ex, gravida
                    ultrices orci sagittis eu.
                </li>
                <li>
                    Quisque vitae magna euismod ligula molestie maximus id et nunc. Nam et
                    lacus euismod, porttitor massa vel, sollicitudin ex. Sed ut tellus
                    suscipit, faucibus tortor nec, fermentum mi.
                </li>
                <li>
                    Nulla sagittis justo non accumsan sagittis. Cras a eros et dolor
                    dapibus bibendum lobortis quis ante. Ut eget scelerisque massa.
                </li>
                <li>
                    Vestibulum quis dignissim nunc. Mauris fringilla at nulla non lacinia.
                    Etiam tristique elit non nisl finibus, fringilla hendrerit ligula
                    hendrerit. Fusce eget leo lacinia, eleifend diam non, suscipit purus.
                </li>
            </ul>,
        ],
        className: 'textarea-trigger',
        hasItems: true,
    },
};

export const CheckboxesDropdown: Story = {
    args: {
        children: [
            'Colors',
            <ul>
                <li>
                    <label>
                        <input type="checkbox" /> Red
                    </label>
                </li>
                <li>
                    <label>
                        <input type="checkbox" /> Blue
                    </label>
                </li>
                <li>
                    <label>
                        <input type="checkbox" /> Yellow
                    </label>
                </li>
                <li>
                    <label>
                        <input type="checkbox" /> Cyan
                    </label>
                </li>
                <li>
                    <label>
                        <input type="checkbox" /> Orchid
                    </label>
                </li>
                <li>
                    <label>
                        <input type="checkbox" /> Slate
                    </label>
                </li>
            </ul>,
        ],
        className: 'checkboxes',
        keepOpenOnSubmit: true,
    },
};

const FIXED_HEADER_PROPS = {
    children: [
        <button
            aria-label="Open user menu"
            className="avatar-profile"
            popoverTarget="avatar-menu-popover"
        >
            AP
        </button>,
        <ul className="menu-list avatar-dropdown">
            <div className="avatar-edit-wrap">
                <span className="avatar-edit has-avatar">
                    <div className="avatar-initials">AP</div>
                </span>
            </div>
            <div className="profile-email-wrap">
                <p className="profile-email">andrew@example.com</p>
            </div>
            <form method="post" action="/logout" className="sign-out-wrap">
                <button className="btn-ghost" type="submit">
                    Sign Out
                </button>
            </form>
        </ul>,
    ] as const,
    className: 'avatar-menu',
};

export const FixedHeader: Story = {
    args: FIXED_HEADER_PROPS,
    render() {
        // const [dateStart, setDateStart] = useState(
        //     FIXED_HEADER_PROPS.dateStart,
        // );
        // const [dateEnd, setDateEnd] = useState(
        //     FIXED_HEADER_PROPS.dateEnd,
        // );

        return (
            <>
                <header className="mk-header">
                    <nav className="mk-nav a1">
                        <a className="logo" href="/"></a>
                        <a className="btn-text logo-text" href="/">
                            UIKit
                        </a>
                    </nav>
                    <div className="mk-nav center">
                        <h5 className="mk subtitle">
                            Welcome! Join our{' '}
                            <a
                                className="home-link"
                                rel="noreferrer"
                                href="https://discord.gg/dTpXZpQ9Rz"
                                target="_blank"
                            >
                                Discord.
                            </a>
                        </h5>
                    </div>
                    <nav className="mk-nav a2">
                        <a className="btn-text" href="/projects">
                            Projects
                        </a>
                        <Dropdown {...FIXED_HEADER_PROPS} />
                    </nav>
                </header>
                <h1>Lorem ipsum</h1>
            </>
        );
    },
};

export const DisabledDropdown: Story = {
    args: {
        children: (
            <ul>
                <li>0px</li>
                <li>4px</li>
                <li>9px</li>
                <li>18px</li>
                <li>36px</li>
                <li>54px</li>
                <li>72px</li>
                <li>144px</li>
                <li>167px</li>
                <li>198px</li>
            </ul>
        ),
        className: 'disabled-dropdown',
        disabled: true,
        isSearchable: true,
        label: 'Disabled',
        name: 'disabledexample',
        value: '167px',
    },
};

export const OverlappingDropdown: Story = {
    args: {
        children: (
            <ul>
                <li>the carbon in our apple pies</li>
                <li>sea of tranquility tesseract</li>
                <li>encyclopaedia galactica</li>
                <li>billions upon billions</li>
                <li>network of wormholes</li>
                <li>tingling of the spine</li>
                <li>corpus callosum</li>
                <li>finite but unbounded</li>
            </ul>
        ),
        className: 'overlapping-dropdown no-trigger-text',
    },
};

export const OutOfBoundsAtRight: Story = {
    args: {
        children: (
            <ul>
                <li>0px</li>
                <li>4px</li>
                <li>9px</li>
                <li>18px</li>
                <li>36px</li>
                <li>54px</li>
                <li>72px</li>
                <li>144px</li>
                <li>167px</li>
                <li>198px</li>
            </ul>
        ),
        className: 'out-of-bounds-example position-right',
        isSearchable: true,
        name: 'outofboundsatright',
        placeholder: 'Fill available space',
    },
};

export const OutOfBoundsWithNoDirectionChange: Story = {
    args: {
        children: (
            <ul>
                <li>Antarctica</li>
                <li>Arctic Circle</li>
                <li>North Pole</li>
            </ul>
        ),
        className: 'out-of-bounds-example no-direction-change',
        isSearchable: true,
        name: 'outofboundsatbottomnodirectionchange',
        placeholder: 'Show below even though it goes out of bounds',
    },
};
