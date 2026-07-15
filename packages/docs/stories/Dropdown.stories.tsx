import { fn } from 'storybook/test';
import * as React from 'react';

import CSSValueInput from '../../css-value-input/src/CSSValueInput.js';
import Dropdown, { Menubar } from '../../dropdown/src/Dropdown.js';

import './CSSValueInput.css';
import './Dropdown.css';
import './InputText.css';

import type { Meta, StoryObj } from '@storybook/react-vite';

const { Fragment } = React;

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            aria-hidden="true"
            fill="none"
            focusable="false"
            height="12"
            viewBox="0 0 12 12"
            width="12"
            {...props}
        >
            <path
                d="M2.5 4.5 6 8l3.5-3.5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
            />
        </svg>
    );
}

const meta: Meta<typeof Dropdown> = {
    args: {
        onClose: fn(),
        onOpen: fn(),
        onSubmitItem: fn(),
    },
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
        label: (
            <span
                style={{
                    alignItems: 'center',
                    display: 'inline-flex',
                    gap: '0.25rem',
                }}
            >
                Font size
                <ChevronDownIcon />
            </span>
        ),
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

const COUNTRIES = [
    { label: 'Australia', value: 'AU' },
    { label: 'Brazil', value: 'BR' },
    { label: 'Canada', value: 'CA' },
    { label: 'Germany', value: 'DE' },
    { label: 'Japan', value: 'JP' },
    { label: 'United Kingdom', value: 'GB' },
    { label: 'United States', value: 'US' },
] as const;

export const LabelDifferentFromValue: Story = {
    parameters: {
        docs: {
            description: {
                story: 'When an item’s stored value differs from its display label — here an ISO country code stored under the country name — pass `value` as a `{ value, label }` pair. The `value` drives change detection and matching against each item’s `data-ukt-value`, while the `label` is shown in the searchable input (and is what you type to filter). `onSubmitItem` reports the same `{ value, label }` shape back, so a controlled consumer feeds it straight into state — no mapping a label back to an id. The selected code is stored and echoed below; a bare string `value` still works when an item’s value and label are the same.',
            },
        },
    },
    render() {
        const [country, setCountry] = React.useState('US');
        const selected = COUNTRIES.find(({ value }) => value === country);
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Dropdown
                    isSearchable
                    label="Country"
                    onSubmitItem={({ value }) => setCountry(value)}
                    placeholder="Search countries…"
                    value={
                        selected ? { label: selected.label, value: selected.value } : ''
                    }
                >
                    <ul>
                        {COUNTRIES.map(({ label, value }) => (
                            <li data-ukt-value={value} key={value}>
                                {label}
                            </li>
                        ))}
                    </ul>
                </Dropdown>
                <p style={{ margin: 0 }}>
                    Stored value: <code>{country}</code>
                </p>
            </div>
        );
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
            className="avatar-profile has-avatar"
            style={{ backgroundImage: `url("https://picsum.photos/id/40/100/100")` }}
        >
            AP
        </button>,
        <div className="menu-list avatar-dropdown">
            <div
                className="avatar-edit has-avatar"
                style={{
                    backgroundImage: `url("https://picsum.photos/id/40/100/100")`,
                }}
            >
                <div className="avatar-initials">AP</div>
            </div>
            <div className="profile-email-wrap">
                <p className="profile-email">andrew@example.com</p>
            </div>
            <form method="post" action="/logout" className="sign-out-wrap">
                <button className="btn-ghost" type="submit">
                    Sign Out
                </button>
            </form>
        </div>,
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

export const TransformedAncestor: Story = {
    parameters: {
        docs: {
            description: {
                story: 'The dropdown body renders in the top layer, so an ancestor with a `transform` (or `filter`, `contain`, etc.) can’t become its containing block and throw off placement. This card is `transform`ed — scaled and rotated — yet the menu still anchors to its trigger and renders upright at full scale instead of being captured by the card. Before top-layer rendering, an ancestor transform broke positioning and its `position-try` fallbacks, which consumers had to work around by de-transforming.',
            },
        },
    },
    render() {
        return (
            <div className="transformed-ancestor-panel">
                <p className="transformed-ancestor-note">
                    This card has <code>transform: rotate(-3deg) scale(0.94)</code>. The
                    menu below still anchors correctly.
                </p>
                <Dropdown className="transformed-ancestor" onSubmitItem={fn()}>
                    Edit
                    <ul>
                        <li data-ukt-value="cut">Cut</li>
                        <li data-ukt-value="copy">Copy</li>
                        <li data-ukt-value="paste">Paste</li>
                        <li data-ukt-value="select-all">Select All</li>
                        <li data-ukt-value="delete">Delete</li>
                    </ul>
                </Dropdown>
            </div>
        );
    },
};

export const CenteredMenu: Story = {
    parameters: {
        docs: {
            description: {
                story: 'Center a menu over its trigger with a `span-all` position-area tile. A `center` tile is only as wide as the trigger, so a wider body overflows it and `position-try` never selects a flipped fallback; `span-all` centers identically but spans the full width, so it flips cleanly (and clamps to the viewport) when there isn’t room below.',
            },
        },
    },
    render() {
        return (
            <Dropdown className="centered-menu" onSubmitItem={fn()}>
                Insert
                <ul>
                    <li data-ukt-value="image">Image…</li>
                    <li data-ukt-value="table">Table</li>
                    <li data-ukt-value="chart">Chart</li>
                    <li data-ukt-value="page-break">Page Break</li>
                    <li data-ukt-value="horizontal-rule">Horizontal Rule</li>
                </ul>
            </Dropdown>
        );
    },
};

const DIRECTION_RECIPE_ROWS = [
    [
        { className: 'direction-bottom-start', label: 'Bottom Start (default)' },
        { className: 'direction-bottom-end', label: 'Bottom End' },
    ],
    [
        { className: 'direction-top-start', label: 'Top Start' },
        { className: 'direction-top-end', label: 'Top End' },
    ],
] as const;

export const DirectionRecipes: Story = {
    parameters: {
        docs: {
            description: {
                story: 'The four `@position-try` recipes the component ships, each pairing `--uktdd-body-position-area` with its matching `--uktdd-body-position-try-fallbacks` (see the README’s “Changing the Default Direction” section for the full cheatsheet). Each is named for the edge that stays flush with the trigger, not the direction the body extends toward: “start” keeps the body’s inline-start edge flush with the trigger’s, extending toward inline-end; “end” is the mirror image. The bottom pair sits near the top of the canvas and the top pair near the bottom, so each opens toward the side with more room rather than `position-try-order: most-height` overriding it toward whichever side has more empty canvas.',
            },
        },
    },
    render() {
        return (
            <div className="direction-recipes">
                {DIRECTION_RECIPE_ROWS.map((row) => (
                    <div className="direction-recipes-row" key={row[0].className}>
                        {row.map(({ className, label }) => (
                            <Dropdown
                                className={className}
                                key={className}
                                onSubmitItem={fn()}
                            >
                                {label}
                                <ul>
                                    <li data-ukt-value="one">Item one</li>
                                    <li data-ukt-value="two">Item two</li>
                                    <li data-ukt-value="three">Item three</li>
                                </ul>
                            </Dropdown>
                        ))}
                    </div>
                ))}
            </div>
        );
    },
};

export const SubmenuDropdown: Story = {
    args: {
        children: [
            'Format',
            <ul>
                <li data-ukt-item>Bold</li>
                <li data-ukt-item>Italic</li>
                <li data-ukt-item>Underline</li>
                <Dropdown label="Align">
                    <ul>
                        <li data-ukt-value="left">Left</li>
                        <li data-ukt-value="center">Center</li>
                        <li data-ukt-value="right">Right</li>
                        <li data-ukt-value="justify">Justify</li>
                    </ul>
                </Dropdown>
                <Dropdown label="Spacing">
                    <ul>
                        <li data-ukt-value="1">Single</li>
                        <li data-ukt-value="1.5">1.5 Lines</li>
                        <li data-ukt-value="2">Double</li>
                        <Dropdown label="Custom">
                            <ul>
                                <li data-ukt-value="0.5">0.5 Lines</li>
                                <li data-ukt-value="3">Triple</li>
                            </ul>
                        </Dropdown>
                    </ul>
                </Dropdown>
            </ul>,
        ] as const,
        className: 'submenu-example',
    },
    parameters: {
        docs: {
            description: {
                story: 'A `Dropdown` nested inside another dropdown’s body renders as a parent item that discloses a submenu. Pause on a parent item to disclose its submenu (pointer or arrow keys), press → to dive in, ← to surface back out. Parent items never submit; `onSubmitItem` fires only for leaf items, with the leaf’s ancestor `path` in the payload.',
            },
        },
    },
};

export const WithGaps: Story = {
    parameters: {
        docs: {
            description: {
                story: '`--uktdd-body-gap` adds space between the trigger and the body (as a symmetric `margin-block`), and `--uktdd-submenu-gap` does the same between a parent item and its submenu (as `margin-inline`). Because they’re margins, the gap auto-reverses to whichever side the box attaches to when `position-try` flips it, and — unlike a `translate` — establishes no containing block, so it’s safe with submenus. This dropdown sets a 10px body gap and an 8px submenu gap.',
            },
        },
    },
    render() {
        return (
            <Dropdown className="gap-example" onSubmitItem={fn()}>
                Format
                <ul>
                    <li data-ukt-item>Bold</li>
                    <li data-ukt-item>Italic</li>
                    <li data-ukt-item>Underline</li>
                    <Dropdown label="Align">
                        <ul>
                            <li data-ukt-value="left">Left</li>
                            <li data-ukt-value="center">Center</li>
                            <li data-ukt-value="right">Right</li>
                            <li data-ukt-value="justify">Justify</li>
                        </ul>
                    </Dropdown>
                </ul>
            </Dropdown>
        );
    },
};

export const OpenOnHover: Story = {
    parameters: {
        docs: {
            description: {
                story: 'With `openOnHover`, the dropdown opens as soon as the pointer hovers the trigger and closes a short moment after the pointer leaves the trigger and body entirely (the close is delayed so crossing the gap between them, or pausing over either, doesn’t flicker-close it). Click and keyboard opening keep working alongside it. Best for a menu you can take in at a glance — an account menu, a preview — so a stray hover doesn’t reveal something the user has to click into.',
            },
        },
    },
    render() {
        return (
            <Dropdown className="open-on-hover-example" onSubmitItem={fn()} openOnHover>
                <button
                    className="uktdropdown-trigger"
                    style={{
                        alignItems: 'center',
                        display: 'inline-flex',
                        gap: '0.25rem',
                    }}
                    type="button"
                >
                    Account
                    <ChevronDownIcon />
                </button>
                <ul>
                    <li data-ukt-value="profile">Profile</li>
                    <li data-ukt-value="settings">Settings</li>
                    <li data-ukt-value="billing">Billing</li>
                    <li className="separator" />
                    <li data-ukt-value="sign-out">Sign out</li>
                </ul>
            </Dropdown>
        );
    },
};

export const MenubarAppMenu: Story = {
    parameters: {
        docs: {
            description: {
                story: '`Menubar` combines sibling dropdowns into a single menu like the system menu in the top toolbar of macOS: one menu open at a time, ←/→ move between menus, and once any menu is open, hovering another trigger switches to it.',
            },
        },
    },
    render() {
        return (
            <Menubar>
                <Dropdown onSubmitItem={fn()}>
                    File
                    <ul>
                        <li data-ukt-item>New Window</li>
                        <li data-ukt-item>New Tab</li>
                        <Dropdown label="Open Recent">
                            <ul>
                                <li data-ukt-item>project-a</li>
                                <li data-ukt-item>project-b</li>
                                <li data-ukt-item>project-c</li>
                            </ul>
                        </Dropdown>
                        <li data-ukt-item>Close Window</li>
                    </ul>
                </Dropdown>
                <Dropdown onSubmitItem={fn()}>
                    Edit
                    <ul>
                        <li data-ukt-item>Undo</li>
                        <li data-ukt-item>Redo</li>
                        <Dropdown label="Find">
                            <ul>
                                <li data-ukt-item>Find…</li>
                                <li data-ukt-item>Find Next</li>
                                <li data-ukt-item>Find Previous</li>
                            </ul>
                        </Dropdown>
                    </ul>
                </Dropdown>
                <Dropdown onSubmitItem={fn()}>
                    View
                    <ul>
                        <li data-ukt-item>Zoom In</li>
                        <li data-ukt-item>Zoom Out</li>
                        <li data-ukt-item>Actual Size</li>
                    </ul>
                </Dropdown>
            </Menubar>
        );
    },
};

export const NestedInfoPopover: Story = {
    args: {
        children: [
            'Layout',
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ alignItems: 'center', display: 'flex', gap: '0.25rem' }}>
                    <CSSValueInput
                        cssValueType="length"
                        label="Width"
                        onSubmitValue={() => {}}
                        placeholder="100vw"
                        unit="vw"
                    />
                    <Dropdown hasItems={false}>
                        <button aria-label="About width" type="button">
                            ℹ️
                        </button>
                        <p style={{ margin: 0, maxWidth: '16rem' }}>
                            Width accepts any CSS length. Use the ↑/↓ arrow keys in the
                            input to step the current value.
                        </p>
                    </Dropdown>
                </div>
                <div style={{ alignItems: 'center', display: 'flex', gap: '0.25rem' }}>
                    <CSSValueInput
                        cssValueType="length"
                        label="Rotation"
                        onSubmitValue={() => {}}
                        placeholder="0deg"
                        step={5}
                        unit="deg"
                    />
                    <Dropdown hasItems={false}>
                        <button aria-label="About rotation" type="button">
                            ℹ️
                        </button>
                        <p style={{ margin: 0, maxWidth: '16rem' }}>
                            Rotation accepts any CSS angle (deg, rad, turn) and steps by
                            5deg with the ↑/↓ arrow keys.
                        </p>
                    </Dropdown>
                </div>
            </div>,
        ] as const,
        className: 'nested-info-popover',
        hasItems: false,
    },
    parameters: {
        docs: {
            description: {
                story: 'A `Dropdown` nested with `hasItems={false}` isn’t a submenu — it renders as an independent anchored dropdown inside the outer body, like these ℹ️ info popovers describing each input. Interacting with the popover doesn’t close or submit the outer dropdown, and Escape closes the innermost open dropdown first.',
            },
        },
    },
};
