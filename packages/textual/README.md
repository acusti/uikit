# @acusti/textual

[![latest version](https://img.shields.io/npm/v/@acusti/textual?style=for-the-badge)](https://www.npmjs.com/package/@acusti/textual)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/textual?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Ftextual)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/textual?style=for-the-badge)](https://www.npmjs.com/package/@acusti/textual)
[![bundle size](https://deno.bundlejs.com/badge?q=@acusti/textual)](https://bundlejs.com/?q=%40acusti%2Ftextual)

Utilities for transforming and formatting text (i.e. strings). These
functions provide common text manipulation operations that are useful in UI
development, from capitalizing text to extracting initials and parsing
names from email addresses.

## Installation

```bash
npm install @acusti/textual
# or
yarn add @acusti/textual
```

## Key Features

- **Tree-shakeable** - All functions are named exports for optimal bundling
- **Zero dependencies** - Lightweight with no external dependencies
- **TypeScript support** - Fully typed with comprehensive type definitions
- **Pure functions** - No side effects, always return new values
- **Unicode aware** - Handles international characters correctly

## Quick Start

```js
import {
    capitalize,
    getInitials,
    getNameFromEmail,
} from '@acusti/textual';

// Capitalize text like CSS text-transform: capitalize
const title = capitalize('hello world'); // => 'Hello World'

// Extract initials from names
const initials = getInitials('John Doe Smith'); // => 'JDS'

// Parse display name from email
const name = getNameFromEmail('john.doe@example.com'); // => 'John Doe'
```

## API Reference

### `capitalize(text: string): string`

Returns input text with equivalent formatting to the
`text-transform: capitalize` CSS property. Capitalizes the first letter of
each word.

```js
import { capitalize } from '@acusti/textual';

capitalize('hello world'); // => 'Hello World'
capitalize('iOS app development'); // => 'IOS App Development'
capitalize('mary-jane watson'); // => 'Mary-Jane Watson'
capitalize('hello.world'); // => 'Hello.World'
capitalize(''); // => ''
```

**Parameters:**

- `text` (string): The text to capitalize

**Returns:**

- (string): The capitalized text

### `getInitials(name: string, maxLength?: number): string`

Extracts uppercase initials from the input string. For single words, uses
uppercase letters and numbers. For multiple words, uses the first character
of each word.

```js
import { getInitials } from '@acusti/textual';

// Multiple words - first letter of each word
getInitials('John Doe Smith'); // => 'JDS'
getInitials('Mary-Jane Watson'); // => 'MJW'
getInitials('Dr. Martin Luther King Jr.'); // => 'DMLKJ'

// Single words - uppercase letters and numbers
getInitials('iPhone'); // => 'PI'
getInitials('iOS15'); // => 'IOS'
getInitials('user123'); // => 'U'

// Limit length
getInitials('Very Long Name Here', 2); // => 'VL'
getInitials('Single', 1); // => 'S'

// Edge cases
getInitials(''); // => ''
getInitials('123'); // => ''
```

**Parameters:**

- `name` (string): The name to extract initials from
- `maxLength` (number, optional): Maximum number of initials to return.
  Defaults to 3

**Returns:**

- (string): The uppercase initials

### `getNameFromEmail(email: string): string`

Converts an email address into a formatted display name by extracting the
username part and treating `.` and `+` as space separators.

```js
import { getNameFromEmail } from '@acusti/textual';

getNameFromEmail('john.doe@example.com'); // => 'John Doe'
getNameFromEmail('mary.jane.watson@company.co.uk'); // => 'Mary Jane Watson'
getNameFromEmail('user+tag@domain.com'); // => 'User Tag'
getNameFromEmail('firstname.lastname+work@corp.com'); // => 'Firstname Lastname Work'

// Handles edge cases
getNameFromEmail('singlename@example.com'); // => 'Singlename'
getNameFromEmail('user123@test.com'); // => 'User123'
getNameFromEmail(''); // => ''
getNameFromEmail('invalid-email'); // => 'Invalid Email'
```

**Parameters:**

- `email` (string): The email address to extract a name from

**Returns:**

- (string): The formatted display name

## Usage Examples

### User Profile Display

```tsx
import { getInitials, getNameFromEmail } from '@acusti/textual';

function UserAvatar({ user }) {
    const displayName = user.name || getNameFromEmail(user.email);
    const initials = getInitials(displayName);

    return (
        <div className="user-avatar">
            <div className="avatar-circle">
                {user.avatar ? (
                    <img src={user.avatar} alt={displayName} />
                ) : (
                    <span className="initials">{initials}</span>
                )}
            </div>
            <span className="display-name">{displayName}</span>
        </div>
    );
}
```

### Form Field Formatting

```tsx
import { capitalize } from '@acusti/textual';

function NameInput({ value, onChange }) {
    const handleBlur = (e) => {
        // Auto-capitalize names when user finishes editing
        const capitalized = capitalize(e.target.value.toLowerCase());
        onChange(capitalized);
    };

    return (
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            placeholder="Enter full name"
        />
    );
}
```

### Contact List

```tsx
import { getInitials, capitalize } from '@acusti/textual';

function ContactCard({ contact }) {
    const initials = getInitials(contact.name);
    const formattedName = capitalize(contact.name);

    return (
        <div className="contact-card">
            <div
                className="contact-avatar"
                style={{ backgroundColor: getAvatarColor(initials) }}
            >
                {initials}
            </div>
            <div className="contact-info">
                <h3>{formattedName}</h3>
                <p>{contact.email}</p>
                <p>{contact.phone}</p>
            </div>
        </div>
    );
}

// Helper function to generate consistent colors based on initials
function getAvatarColor(initials) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
    const index = initials.charCodeAt(0) % colors.length;
    return colors[index];
}
```

### Email Suggestion

```tsx
import { getNameFromEmail, capitalize } from '@acusti/textual';

function EmailSignup({ email, onNameSuggest }) {
    const suggestedName = email ? getNameFromEmail(email) : '';

    return (
        <form>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
            />

            {suggestedName && (
                <div className="name-suggestion">
                    <p>Is your name {capitalize(suggestedName)}?</p>
                    <button
                        type="button"
                        onClick={() =>
                            onNameSuggest(capitalize(suggestedName))
                        }
                    >
                        Yes, use this name
                    </button>
                </div>
            )}
        </form>
    );
}
```

### Team Member Directory

```tsx
import {
    getInitials,
    getNameFromEmail,
    capitalize,
} from '@acusti/textual';

function TeamDirectory({ members }) {
    return (
        <div className="team-directory">
            {members.map((member) => {
                const displayName =
                    member.name || getNameFromEmail(member.email);
                const formattedName = capitalize(displayName);
                const initials = getInitials(displayName);

                return (
                    <div key={member.id} className="team-member">
                        <div className="member-avatar">
                            {member.photo ? (
                                <img
                                    src={member.photo}
                                    alt={formattedName}
                                />
                            ) : (
                                <div
                                    className="initials-avatar"
                                    title={formattedName}
                                >
                                    {initials}
                                </div>
                            )}
                        </div>

                        <div className="member-info">
                            <h3>{formattedName}</h3>
                            <p className="role">
                                {capitalize(member.role || 'team member')}
                            </p>
                            <p className="department">
                                {capitalize(member.department || '')}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
```

### Comment System

```tsx
import { getInitials, getNameFromEmail } from '@acusti/textual';

function CommentCard({ comment }) {
    const authorName =
        comment.author?.name ||
        getNameFromEmail(comment.author?.email || '');
    const authorInitials = getInitials(authorName);

    return (
        <div className="comment">
            <div className="comment-avatar">
                <span className="avatar-text">{authorInitials}</span>
            </div>

            <div className="comment-content">
                <div className="comment-header">
                    <span className="author-name">{authorName}</span>
                    <time className="comment-date">
                        {new Date(comment.createdAt).toLocaleDateString()}
                    </time>
                </div>

                <p className="comment-text">{comment.text}</p>
            </div>
        </div>
    );
}
```

## Common Use Cases

- **User avatars** - Generate initials for profile pictures
- **Display names** - Create readable names from email addresses
- **Form validation** - Auto-capitalize user input for consistency
- **Contact lists** - Format names consistently across the application
- **User onboarding** - Suggest display names during account creation
- **Team directories** - Display member information uniformly
- **Comment systems** - Show author names and initials
- **Email templates** - Format recipient names properly

## Best Practices

### Input Sanitization

Always validate input before processing:

```js
import { capitalize, getInitials } from '@acusti/textual';

function safeCapitalize(input) {
    if (typeof input !== 'string') return '';
    return capitalize(input.trim());
}

function safeGetInitials(input, maxLength = 3) {
    if (typeof input !== 'string') return '';
    return getInitials(input.trim(), maxLength);
}
```

### Internationalization

The functions works fully with unicode characters where the concept of
capitalization makes sense.

```js
import { capitalize } from '@acusti/textual';

// Works with international characters
capitalize('josé maría'); // => 'José María'
capitalize('björk guðmundsdóttir'); // => 'Björk Guðmundsdóttir'
capitalize('ælfgyva'); // => 'Ælfgyva'
getInitials('ólafur arnalds'); // => 'ÓA'
```

### Performance

All functions are optimized for performance and can handle large datasets:

```js
import { getInitials } from '@acusti/textual';

// Efficient for processing large lists
const userInitials = users.map((user) => ({
    ...user,
    initials: getInitials(user.name),
}));
```
