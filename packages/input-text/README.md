# @acusti/input-text

[![latest version](https://img.shields.io/npm/v/@acusti/input-text?style=for-the-badge)](https://www.npmjs.com/package/@acusti/input-text)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/input-text?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Finput-text)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/input-text?style=for-the-badge)](https://www.npmjs.com/package/@acusti/input-text)
[![bundle size](https://deno.bundlejs.com/badge?q=@acusti/input-text)](https://bundlejs.com/?q=%40acusti%2Finput-text)

A React text input component that combines the simplicity of uncontrolled
inputs with the power of automatic resizing, smart text selection, and
advanced interaction patterns. Built for modern web applications that need
reliable text input handling without the complexity of fully controlled
components.

## Key Features

- **Semi-Controlled Architecture** - Uncontrolled for performance,
  automatically syncs when `initialValue` changes
- **Automatic Multi-line Resizing** - Textarea elements grow and shrink
  vertically to fit content
- **Smart Text Selection** - Optional select-all-on-focus behavior that
  works across all browsers
- **Double-Click to Edit** - Read-only display mode with inline editing
  activation
- **Submit on Enter** - Intelligent form submission with multi-line support
- **Modern CSS Integration** - Uses `field-sizing: content` when available
  with ResizeObserver fallback
- **Universal Input Types** - Supports text, email, password, search, tel,
  url, and number inputs
- **Accessibility First** - Proper focus management, keyboard navigation,
  and screen reader support
- **Zero Dependencies** - Lightweight implementation with no external
  dependencies

## Installation

```bash
npm install @acusti/input-text
# or
yarn add @acusti/input-text
```

## Quick Start

```tsx
import InputText from '@acusti/input-text';
import { useState } from 'react';

// Simple text input
function SimpleInput() {
    return <InputText placeholder="Enter your name" name="userName" />;
}

// Multi-line textarea with auto-resize
function AutoResizingTextarea() {
    return (
        <InputText
            multiLine
            placeholder="Write your message here…"
            maxHeight={300}
            name="message"
        />
    );
}

// Input with select-all-on-focus
function SelectOnFocusInput() {
    return (
        <InputText
            initialValue="Edit this text"
            selectTextOnFocus
            name="editableText"
        />
    );
}
```

## API Reference

### InputText Component

```tsx
type Props = {
    /** Controls text capitalization behavior */
    autoCapitalize?: 'none' | 'off' | 'sentences' | 'words' | 'characters';

    /** Browser autocomplete hint */
    autoComplete?: HTMLInputElement['autocomplete'];

    /** Whether input should be focused on mount */
    autoFocus?: boolean;

    /** Additional CSS class name for styling */
    className?: string;

    /** Whether the input is disabled */
    disabled?: boolean;

    /**
     * If true, input renders as readonly initially and only becomes interactive
     * when double-clicked or when user focuses the readonly input and then
     * presses the enter key. Input becomes readonly again when blurred.
     */
    doubleClickToEdit?: boolean;

    /** Hint for virtual keyboard enter key */
    enterKeyHint?:
        | 'enter'
        | 'done'
        | 'go'
        | 'next'
        | 'previous'
        | 'search'
        | 'send';

    /** Associates input with a form element */
    form?: string;

    /** Unique identifier for the input */
    id?: string;

    /**
     * The initial value of the text input. If this prop changes,
     * the input value will be updated to match the new value.
     */
    initialValue?: string;

    /** ID of a datalist element for autocomplete suggestions */
    list?: string;

    /** Maximum numeric value (for number inputs) */
    max?: number;

    /** Maximum height for multi-line inputs (px or CSS value) */
    maxHeight?: number | string;

    /** Maximum number of characters allowed */
    maxLength?: number;

    /** Minimum numeric value (for number inputs) */
    min?: number;

    /** Minimum number of characters required */
    minLength?: number;

    /**
     * If true, input renders as a <textarea> that automatically grows and
     * shrinks vertically to adjust to the length of its contents.
     */
    multiLine?: boolean;

    /** Whether multiple values are allowed (for email inputs) */
    multiple?: boolean;

    /** Input name for form submission */
    name?: string;

    /** Standard blur event handler */
    onBlur?: (event: FocusEvent<InputElement>) => unknown;

    /** Standard change event handler */
    onChange?: (event: ChangeEvent<InputElement>) => unknown;

    /**
     * Simplified change handler that receives just the new value.
     * Perfect for passing setState functions directly.
     */
    onChangeValue?: (value: string) => unknown;

    /** Standard focus event handler */
    onFocus?: (event: FocusEvent<InputElement>) => unknown;

    /** Standard key down event handler */
    onKeyDown?: (event: KeyboardEvent<InputElement>) => unknown;

    /** Standard key up event handler */
    onKeyUp?: (event: KeyboardEvent<InputElement>) => unknown;

    /** Regular expression pattern for validation */
    pattern?: string;

    /** Placeholder text when input is empty */
    placeholder?: string;

    /** Whether the input is read-only */
    readOnly?: boolean;

    /** Whether the input is required for form submission */
    required?: boolean;

    /** Initial number of rows for multi-line inputs */
    rows?: number;

    /** If true, all text is selected when input receives focus */
    selectTextOnFocus?: boolean;

    /** Visual size of the input (character width) */
    size?: number;

    /** Step value for numeric inputs */
    step?: number;

    /** Inline styles */
    style?: CSSProperties;

    /**
     * If true, pressing Enter submits the parent form and blurs by default.
     * Set keepFocusOnSubmit to submit without blurring.
     * For multi-line inputs, Cmd/Ctrl+Enter always submits.
     */
    submitOnEnter?: boolean;
    /**
     * If true, pressing Enter while submitOnEnter is enabled keeps focus
     * on the input instead of blurring.
     */
    keepFocusOnSubmit?: boolean;

    /** Tab order index */
    tabIndex?: number;

    /** Tooltip text */
    title?: string;

    /** Input type - determines validation and virtual keyboard */
    type?:
        | 'text'
        | 'email'
        | 'number'
        | 'password'
        | 'search'
        | 'tel'
        | 'url';
};
```

### Types

```tsx
import type { InputElement } from '@acusti/input-text';

// InputElement is a union type for event handlers
type InputElement = HTMLInputElement | HTMLTextAreaElement;
```

## Usage Examples

### Basic Text Inputs (equivalent API to native <input>)

```tsx
import InputText from '@acusti/input-text';
import { useState } from 'react';

function ContactForm() {
    return (
        <form>
            {/* Simple text input */}
            <InputText
                name="firstName"
                placeholder="First name"
                required
                autoCapitalize="words"
            />

            {/* Email input with autocomplete */}
            <InputText
                type="email"
                name="email"
                placeholder="Email address"
                autoComplete="email"
                required
            />

            {/* Phone input */}
            <InputText
                type="tel"
                name="phone"
                placeholder="Phone number"
                autoComplete="tel"
            />

            {/* URL input */}
            <InputText
                type="url"
                name="website"
                placeholder="Website URL"
                autoComplete="url"
            />
        </form>
    );
}
```

### Auto-Resizing Multi-line Inputs

```tsx
import InputText from '@acusti/input-text';
import { useState } from 'react';

function CommentSystem() {
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            await submitComment(comment);
            setComment('');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label htmlFor="comment">Add a comment</label>
            <InputText
                id="comment"
                name="comment"
                multiLine
                placeholder="Share your thoughts…"
                initialValue={comment}
                onChangeValue={setComment}
                maxHeight={200}
                rows={3}
                disabled={isSubmitting}
                submitOnEnter
            />

            <div className="comment-actions">
                <small>
                    Press Enter to submit, Shift+Enter for new line
                </small>
                <button
                    type="submit"
                    disabled={!comment.trim() || isSubmitting}
                >
                    {isSubmitting ? 'Submitting…' : 'Submit Comment'}
                </button>
            </div>
        </form>
    );
}
```

### Inline Editing with Double-Click

```tsx
import InputText from '@acusti/input-text';
import { useState, useCallback } from 'react';

function EditableTitle() {
    const [title, setTitle] = useState('Click to edit this title');
    const [savedTitle, setSavedTitle] = useState(title);

    const handleTitleChange = useCallback((value: string) => {
        setTitle(value);
    }, []);

    const handleBlur = useCallback(() => {
        // Auto-save when editing finishes
        if (title !== savedTitle) {
            setSavedTitle(title);
            // Save to backend here
            console.log('Saving title:', title);
        }
    }, [title, savedTitle]);

    return (
        <div className="editable-content">
            <h1>
                <InputText
                    doubleClickToEdit
                    initialValue={title}
                    onChangeValue={handleTitleChange}
                    onBlur={handleBlur}
                    selectTextOnFocus
                    placeholder="Enter title…"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: 'inherit',
                        fontWeight: 'inherit',
                        color: 'inherit',
                        padding: 0,
                        width: '100%',
                    }}
                />
            </h1>
            <p className="hint">Double-click the title above to edit it</p>
        </div>
    );
}
```

### Search Input with Instant Results

```tsx
import InputText from '@acusti/input-text';
import { useState, useDeferredValue, useMemo } from 'react';

function SearchableList({ items }) {
    const [searchTerm, setSearchTerm] = useState('');
    const deferredSearchTerm = useDeferredValue(searchTerm);

    const filteredItems = useMemo(() => {
        if (!deferredSearchTerm) return items;
        return items.filter((item) =>
            item.name
                .toLowerCase()
                .includes(deferredSearchTerm.toLowerCase()),
        );
    }, [deferredSearchTerm, items]);

    return (
        <div className="search-container">
            <InputText
                type="search"
                placeholder="Search items…"
                initialValue={searchTerm}
                onChangeValue={setSearchTerm}
                autoFocus
                enterKeyHint="search"
                style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    borderRadius: '8px',
                    border: '2px solid #e1e5e9',
                    outline: 'none',
                }}
            />

            <div className="search-results">
                {filteredItems.length === 0 ? (
                    <div className="no-results">
                        No items found for “{deferredSearchTerm}”
                    </div>
                ) : (
                    filteredItems.map((item) => (
                        <div key={item.id} className="search-result-item">
                            {item.name}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
```

### Form with Smart Validation

```tsx
import InputText from '@acusti/input-text';
import { useState } from 'react';

function UserProfileForm() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        bio: '',
        website: '',
    });
    const [errors, setErrors] = useState({});

    const updateField = (field: string) => (value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: null }));
        }
    };

    const validateField = (field: string, value: string) => {
        switch (field) {
            case 'username':
                if (value.length < 3)
                    return 'Username must be at least 3 characters';
                if (!/^[a-zA-Z0-9_]+$/.test(value))
                    return 'Username can only contain letters, numbers, and underscores';
                break;
            case 'email':
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
                    return 'Please enter a valid email address';
                break;
            case 'website':
                if (value && !/^https?:\/\//.test(value))
                    return 'Website must start with http:// or https://';
                break;
        }
        return null;
    };

    const handleBlur = (field: string) => (event: any) => {
        const error = validateField(field, event.target.value);
        if (error) {
            setErrors((prev) => ({ ...prev, [field]: error }));
        }
    };

    return (
        <form className="user-profile-form">
            <div className="field-group">
                <label htmlFor="username">Username*</label>
                <InputText
                    id="username"
                    name="username"
                    initialValue={formData.username}
                    onChangeValue={updateField('username')}
                    onBlur={handleBlur('username')}
                    selectTextOnFocus
                    pattern="[a-zA-Z0-9_]+"
                    minLength={3}
                    maxLength={20}
                    required
                    style={{
                        borderColor: errors.username
                            ? '#dc3545'
                            : '#ced4da',
                    }}
                />
                {errors.username && (
                    <div className="error-message">{errors.username}</div>
                )}
            </div>

            <div className="field-group">
                <label htmlFor="email">Email*</label>
                <InputText
                    id="email"
                    name="email"
                    type="email"
                    initialValue={formData.email}
                    onChangeValue={updateField('email')}
                    onBlur={handleBlur('email')}
                    autoComplete="email"
                    required
                    style={{
                        borderColor: errors.email ? '#dc3545' : '#ced4da',
                    }}
                />
                {errors.email && (
                    <div className="error-message">{errors.email}</div>
                )}
            </div>

            <div className="field-group">
                <label htmlFor="bio">Bio</label>
                <InputText
                    id="bio"
                    name="bio"
                    multiLine
                    initialValue={formData.bio}
                    onChangeValue={updateField('bio')}
                    placeholder="Tell us about yourself…"
                    maxLength={500}
                    maxHeight={150}
                    rows={4}
                />
                <div className="char-count">
                    {formData.bio.length}/500 characters
                </div>
            </div>

            <div className="field-group">
                <label htmlFor="website">Website</label>
                <InputText
                    id="website"
                    name="website"
                    type="url"
                    initialValue={formData.website}
                    onChangeValue={updateField('website')}
                    onBlur={handleBlur('website')}
                    placeholder="https://yourwebsite.com"
                    autoComplete="url"
                    style={{
                        borderColor: errors.website
                            ? '#dc3545'
                            : '#ced4da',
                    }}
                />
                {errors.website && (
                    <div className="error-message">{errors.website}</div>
                )}
            </div>

            <button type="submit" className="submit-button">
                Save Profile
            </button>
        </form>
    );
}
```

### Chat Input with Enhanced UX

```tsx
import InputText from '@acusti/input-text';
import { useState, useRef, useCallback } from 'react';

function ChatInput({ onSendMessage, disabled }) {
    const [message, setMessage] = useState('');
    const inputRef = useRef(null);

    const handleSend = useCallback(() => {
        const trimmedMessage = message.trim();
        if (trimmedMessage && !disabled) {
            onSendMessage(trimmedMessage);
            setMessage('');
            inputRef.current?.focus();
        }
    }, [message, disabled, onSendMessage]);

    const handleKeyDown = useCallback(
        (event) => {
            // Send on Enter, new line on Shift+Enter
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
            }
        },
        [handleSend],
    );

    return (
        <div className="chat-input-container">
            <div className="input-wrapper">
                <InputText
                    ref={inputRef}
                    multiLine
                    placeholder={
                        disabled ? 'Connecting…' : 'Type a message…'
                    }
                    initialValue={message}
                    onChangeValue={setMessage}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    maxHeight={120}
                    rows={1}
                    enterKeyHint="send"
                    style={{
                        width: '100%',
                        padding: '12px 50px 12px 16px',
                        borderRadius: '24px',
                        border: '2px solid #e1e5e9',
                        resize: 'none',
                        fontSize: '14px',
                        lineHeight: '1.4',
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                    }}
                />

                <button
                    type="button"
                    onClick={handleSend}
                    disabled={!message.trim() || disabled}
                    className="send-button"
                    aria-label="Send message"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path
                            fill="currentColor"
                            d="M2,21L23,12L2,3V10L17,12L2,14V21Z"
                        />
                    </svg>
                </button>
            </div>

            <div className="input-hint">
                Press Enter to send, Shift+Enter for new line
            </div>
        </div>
    );
}
```

### Dynamic Input List

```tsx
import InputText from '@acusti/input-text';
import { useState, useCallback } from 'react';

function TagsInput() {
    const [tags, setTags] = useState(['React', 'TypeScript']);

    const updateTag = useCallback(
        (index: number) => (value: string) => {
            setTags((prev) => {
                const newTags = [...prev];
                newTags[index] = value;
                return newTags;
            });
        },
        [],
    );

    const removeTag = useCallback((index: number) => {
        setTags((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const addTag = useCallback(() => {
        setTags((prev) => [...prev, '']);
    }, []);

    const handleKeyDown = useCallback(
        (index: number) => (event) => {
            if (
                event.key === 'Backspace' &&
                !event.target.value &&
                tags.length > 1
            ) {
                event.preventDefault();
                removeTag(index);
            } else if (
                event.key === 'Enter' &&
                event.target.value.trim()
            ) {
                event.preventDefault();
                addTag();
            }
        },
        [tags.length, removeTag, addTag],
    );

    return (
        <div className="tags-input">
            <label>Tags</label>
            <div className="tags-list">
                {tags.map((tag, index) => (
                    <div key={index} className="tag-input-wrapper">
                        <InputText
                            initialValue={tag}
                            onChangeValue={updateTag(index)}
                            onKeyDown={handleKeyDown(index)}
                            placeholder="Enter tag…"
                            selectTextOnFocus
                            style={{
                                padding: '8px 12px',
                                border: '2px solid #e1e5e9',
                                borderRadius: '20px',
                                fontSize: '14px',
                                minWidth: '100px',
                            }}
                        />

                        {tags.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeTag(index)}
                                className="remove-tag"
                                aria-label="Remove tag"
                            >
                                ×
                            </button>
                        )}
                    </div>
                ))}

                <button type="button" onClick={addTag} className="add-tag">
                    + Add Tag
                </button>
            </div>

            <div className="tags-preview">
                <strong>Tags:</strong> {tags.filter(Boolean).join(', ')}
            </div>
        </div>
    );
}
```

## Advanced Features

### Automatic Resizing

The multi-line input automatically resizes using modern CSS
`field-sizing: content` when supported, with a ResizeObserver-based
fallback for older browsers:

```tsx
// Automatic resizing with height limits
<InputText
    multiLine
    maxHeight={300} // Prevents growing beyond 300px
    rows={3} // Initial height (3 rows)
    placeholder="This textarea will grow as you type…"
/>
```

### Smart Enter Key Handling

The component intelligently handles Enter key behavior based on context:

```tsx
// Single-line: Enter always submits or blurs
<InputText
    submitOnEnter  // Enter submits form or blurs input
    type="search"
/>

// Chat-style single-line: submit and keep typing
<InputText
    keepFocusOnSubmit
    submitOnEnter  // Enter submits without blurring
/>

// Multi-line: Enter adds newline, Cmd/Ctrl+Enter submits
<InputText
    multiLine
    submitOnEnter  // Cmd/Ctrl+Enter submits, Enter adds newline
/>
```

### Browser Compatibility

- **Modern Browsers** - Chrome, Firefox, Safari, Edge (latest versions)
- **CSS Features** - Uses `field-sizing: content` when available
- **Fallback** - ResizeObserver-based resizing for older browsers
- **Mobile** - Touch-friendly with proper virtual keyboard hints
- **Accessibility** - Full screen reader and keyboard navigation support

## Styling

The component accepts standard CSS styling and works with any CSS
framework:

```css
/* Custom styling example */
.custom-input {
    --input-border-radius: 8px;
    --input-padding: 12px 16px;
    --input-font-size: 16px;
    --input-line-height: 1.5;

    padding: var(--input-padding);
    border-radius: var(--input-border-radius);
    font-size: var(--input-font-size);
    line-height: var(--input-line-height);

    border: 2px solid #e1e5e9;
    background: #ffffff;
    transition: all 0.2s ease;
}

.custom-input:focus {
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    outline: none;
}

.custom-input:disabled {
    background-color: #f8f9fa;
    border-color: #e9ecef;
    color: #6c757d;
    cursor: not-allowed;
}

/* Multi-line specific styles */
.custom-input[data-multiline='true'] {
    resize: vertical;
    min-height: 100px;
}

/* Double-click to edit styles */
.custom-input[readonly] {
    border-color: transparent;
    background: transparent;
    cursor: pointer;
}

.custom-input[readonly]:hover {
    background: #f8f9fa;
    border-color: #e9ecef;
}
```

## Accessibility

The InputText component includes comprehensive accessibility features:

### Keyboard Navigation

- **Tab Navigation** - Proper tab order integration
- **Enter Key** - Smart submission behavior
- **Escape Key** - Cancels double-click editing
- **Standard Text Editing** - All standard keyboard shortcuts work

### Screen Reader Support

- **Semantic HTML** - Uses proper input/textarea elements
- **Label Association** - Works with label elements and aria-labelledby
- **Status Announcements** - Changes are announced appropriately
- **Error States** - Validation errors are properly communicated

### Focus Management

- **Focus Indicators** - Clear visual focus states
- **Focus Trapping** - Proper focus behavior in modals/popovers
- **Auto Focus** - Optional automatic focusing on mount

### Implementation Example

```tsx
// Accessible form implementation
<div className="form-field">
    <label htmlFor="user-bio" id="bio-label">
        Biography
        <span className="required" aria-label="required">
            *
        </span>
    </label>

    <InputText
        id="user-bio"
        name="biography"
        multiLine
        required
        aria-labelledby="bio-label"
        aria-describedby="bio-hint bio-error"
        aria-invalid={hasError}
        maxLength={500}
    />

    <div id="bio-hint" className="field-hint">
        Tell us about yourself in 500 characters or less
    </div>

    {hasError && (
        <div id="bio-error" className="error-message" role="alert">
            Biography is required and must be at least 10 characters
        </div>
    )}
</div>
```

## Common Use Cases

- **Form Fields** - Contact forms, user profiles, settings
- **Content Creation** - Blog posts, comments, social media
- **Search Interfaces** - Live search, filters, autocomplete
- **Inline Editing** - Editable titles, descriptions, labels
- **Chat Applications** - Message input with auto-resize
- **Configuration Panels** - Settings, preferences, admin interfaces
- **Data Entry** - Spreadsheet-like interfaces, bulk data input
- **Creative Tools** - Code editors, markdown editors, note-taking

## Demo

See the
[Storybook documentation and examples](https://uikit.acusti.ca/?path=/docs/uikit-controls-inputtext--docs)
for interactive demonstrations of all InputText features and
configurations.
