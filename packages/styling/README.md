# @acusti/styling

[![latest version](https://img.shields.io/npm/v/@acusti/styling?style=for-the-badge)](https://www.npmjs.com/package/@acusti/styling)
[![maintenance status](https://img.shields.io/npms-io/maintenance-score/@acusti/styling?style=for-the-badge)](https://npms.io/search?q=%40acusti%2Fstyling)
[![downloads per month](https://img.shields.io/npm/dm/@acusti/styling?style=for-the-badge)](https://www.npmjs.com/package/@acusti/styling)
[![bundle size](https://deno.bundlejs.com/badge?q=@acusti/styling)](https://bundlejs.com/?q=%40acusti%2Fstyling)

`@acusti/styling` provides React 19+ optimized styling utilities, including
the `Style` component that leverages React’s new `<style>` element special
rendering behavior and a collection of CSS utilities. It’s designed for
modern React applications that need efficient, SSR-friendly styling with
automatic optimization.

> [!WARNING]
> Maintenance mode only: this package is no longer under active feature
> development. It receives critical fixes only.

## Key Features

- **React 19+ optimized** - Uses React’s new `<style>` element special
  rendering behavior
- **Automatic minification** - CSS is minified and cached for optimal
  performance
- **SSR-friendly** - No hydration errors with server-side rendering
- **Style deduplication** - Identical styles are automatically deduplicated
- **Suspense integration** - Assets in CSS suspend properly during loading
- **Global cache** - Minified styles are cached to avoid re-computation
- **CSS utilities** - Includes useful CSS constants like system fonts

## Installation

```bash
npm install @acusti/styling
# or
yarn add @acusti/styling
```

## Quick Start

```tsx
import { Style } from '@acusti/styling';

function MyComponent() {
    return (
        <>
            <Style>
                {`
                    .my-button {
                        background: #007bff;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                    .my-button:hover {
                        background: #0056b3;
                    }
                `}
            </Style>

            <button className="my-button">Click me</button>
        </>
    );
}
```

## React 19+ `<style>` Special Behavior

This package leverages React 19’s new `<style>` element
[special rendering behavior](https://react.dev/reference/react-dom/components/style#special-rendering-behavior):

> React will move `<style>` components to the document’s `<head>`,
> de-duplicate identical stylesheets, and suspend while the stylesheet is
> loading.

**Benefits:**

- **SSR-friendly** - No hydration errors between server and client
- **Automatic deduplication** - Identical styles are merged automatically
- **Suspense integration** - CSS assets (fonts, images) suspend properly
  during loading
- **Performance optimized** - Styles are hoisted to `<head>` for optimal
  loading

## API Reference

### `Style` Component

```tsx
type Props = {
    children: string;
    href?: string;
    precedence?: string;
};
```

**Props:**

- **`children`** (string, required): The CSS string to render
- **`href`** (string, optional): Custom identifier for the stylesheet.
  Defaults to minified CSS content
- **`precedence`** (string, optional): Controls loading priority. Defaults
  to `'medium'`

```tsx
import { Style } from '@acusti/styling';

function MyComponent() {
    return (
        <Style precedence="high" href="critical-styles">
            {`.critical { display: block !important; }`}
        </Style>
    );
}
```

### CSS Minification Function

```tsx
import { minifyStyles } from '@acusti/styling';

const minified = minifyStyles(`
    .button {
        background-color: #ffffff;
        padding: 10px 20px;
        border: 1px solid #cccccc;
    }
`);
// Result: ".button{background-color:#fff;padding:10px 20px;border:1px solid #ccc}"
```

### CSS Constants

- **`SYSTEM_UI_FONT`**: Cross-platform system UI font stack

```tsx
import { Style, SYSTEM_UI_FONT } from '@acusti/styling';

function SystemStyles() {
    return <Style>{':root { font-family: ${SYSTEM_UI_FONT}; }'}</Style>;
}
```

## Usage Examples

### Component-Scoped Styles

```tsx
import { Style } from '@acusti/styling';

function Card({ title, children }) {
    return (
        <>
            <Style>
                {`
                    .card {
                        border: 1px solid #e0e0e0;
                        border-radius: 8px;
                        padding: 16px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        background: white;
                    }
                    .card-title {
                        margin: 0 0 12px 0;
                        font-size: 18px;
                        font-weight: 600;
                        color: #333;
                    }
                    .card-content {
                        color: #666;
                        line-height: 1.5;
                    }
                `}
            </Style>

            <div className="card">
                <h3 className="card-title">{title}</h3>
                <div className="card-content">{children}</div>
            </div>
        </>
    );
}
```

### Global Styles with System Fonts

```tsx
import { Style, SYSTEM_UI_FONT } from '@acusti/styling';

function GlobalStyles() {
    return (
        <Style precedence="low" href="global-styles">
            {`
                * {
                    box-sizing: border-box;
                }
                
                body {
                    margin: 0;
                    font-family: ${SYSTEM_UI_FONT};
                    line-height: 1.5;
                    color: #333;
                    background: #fff;
                }
                
                button {
                    font-family: inherit;
                    cursor: pointer;
                }
                
                input, textarea {
                    font-family: inherit;
                }
            `}
        </Style>
    );
}
```

### Theme-Based Styling

```tsx
import { Style } from '@acusti/styling';

function ThemedButton({ theme = 'primary', children }) {
    const themes = {
        primary: {
            bg: '#007bff',
            hoverBg: '#0056b3',
            color: 'white',
        },
        secondary: {
            bg: '#6c757d',
            hoverBg: '#545b62',
            color: 'white',
        },
        success: {
            bg: '#28a745',
            hoverBg: '#1e7e34',
            color: 'white',
        },
    };

    const currentTheme = themes[theme] || themes.primary;

    return (
        <>
            <Style href={`button-${theme}`}>
                {`
                    .btn-${theme} {
                        background: ${currentTheme.bg};
                        color: ${currentTheme.color};
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    }
                    .btn-${theme}:hover {
                        background: ${currentTheme.hoverBg};
                    }
                    .btn-${theme}:focus {
                        outline: 2px solid ${currentTheme.bg};
                        outline-offset: 2px;
                    }
                `}
            </Style>

            <button className={`btn-${theme}`}>{children}</button>
        </>
    );
}
```

### Dynamic Styles

```tsx
import { Style } from '@acusti/styling';
import { useState } from 'react';

function DynamicCard() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [accentColor, setAccentColor] = useState('#007bff');

    return (
        <>
            <Style href={`dynamic-card-${accentColor}`}>
                {`
                    .dynamic-card {
                        border: 2px solid ${accentColor};
                        border-radius: 8px;
                        padding: 16px;
                        transition: all 0.3s ease;
                        cursor: pointer;
                        background: white;
                    }
                    
                    .dynamic-card:hover {
                        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                        transform: translateY(-2px);
                    }
                    
                    .dynamic-card.expanded {
                        background: ${accentColor}10;
                    }
                    
                    .card-header {
                        color: ${accentColor};
                        font-weight: 600;
                        margin-bottom: 8px;
                    }
                    
                    .card-controls {
                        margin-top: 16px;
                        display: flex;
                        gap: 8px;
                        align-items: center;
                    }
                `}
            </Style>

            <div
                className={`dynamic-card ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="card-header">
                    Dynamic Card{' '}
                    {isExpanded ? '(Expanded)' : '(Collapsed)'}
                </div>

                <p>Click to toggle expansion state</p>

                {isExpanded && (
                    <div className="card-controls">
                        <label>Accent Color:</label>
                        <input
                            type="color"
                            value={accentColor}
                            onChange={(e) =>
                                setAccentColor(e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
```

### Critical CSS with High Precedence

```tsx
import { Style } from '@acusti/styling';

function CriticalStyles() {
    return (
        <Style precedence="high" href="critical">
            {`
                /* Critical above-the-fold styles */
                .hero {
                    height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    text-align: center;
                }
                
                .hero h1 {
                    font-size: clamp(2rem, 5vw, 4rem);
                    margin: 0;
                    font-weight: 700;
                }
                
                .hero p {
                    font-size: clamp(1rem, 3vw, 1.5rem);
                    margin: 1rem 0 2rem 0;
                    opacity: 0.9;
                }
                
                .cta-button {
                    background: rgba(255,255,255,0.2);
                    border: 2px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    backdrop-filter: blur(10px);
                }
                
                .cta-button:hover {
                    background: rgba(255,255,255,0.3);
                    border-color: rgba(255,255,255,0.5);
                    transform: translateY(-2px);
                }
            `}
        </Style>
    );
}
```

### Animation Styles

```tsx
import { Style } from '@acusti/styling';

function AnimatedModal({ isOpen, onClose, children }) {
    return (
        <>
            <Style href="modal-animations">
                {`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    
                    @keyframes slideUp {
                        from { 
                            opacity: 0;
                            transform: translateY(20px);
                        }
                        to { 
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }
                    
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0,0,0,0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        animation: fadeIn 0.2s ease-out;
                        z-index: 1000;
                    }
                    
                    .modal-content {
                        background: white;
                        border-radius: 8px;
                        padding: 24px;
                        max-width: 500px;
                        width: 90%;
                        max-height: 80vh;
                        overflow: auto;
                        animation: slideUp 0.3s ease-out;
                    }
                    
                    .modal-close {
                        position: absolute;
                        top: 16px;
                        right: 16px;
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #666;
                    }
                `}
            </Style>

            {isOpen && (
                <div className="modal-overlay" onClick={onClose}>
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="modal-close" onClick={onClose}>
                            ×
                        </button>
                        {children}
                    </div>
                </div>
            )}
        </>
    );
}
```

## Performance Considerations

### Style Caching

The component automatically caches minified styles to avoid recomputation:

```tsx
// These will use the same cached minified styles
function Button1() {
    return <Style>{buttonStyles}</Style>;
}

function Button2() {
    return <Style>{buttonStyles}</Style>; // Reuses cache
}
```

### Custom href for Better Caching

Use custom `href` values for better caching control:

```tsx
// Good: Uses custom href for consistent caching
<Style href="button-primary">
    {generateButtonStyles('primary')}
</Style>

// Less optimal: href changes with dynamic content
<Style>
    {generateButtonStyles(dynamicTheme)}
</Style>
```

### Precedence for DOM Order

Control CSS parsing priority with precedence:

```tsx
// Critical styles load first
<Style precedence="high" href="critical">
    {criticalStyles}
</Style>

// Component styles load normally
<Style precedence="medium" href="components">
    {componentStyles}
</Style>

// Non-critical styles load last
<Style precedence="low" href="animations">
    {animationStyles}
</Style>
```

## CSS Minification

The package includes a powerful CSS minifier that:

- Removes comments (except `/*!` important comments)
- Normalizes whitespace
- Removes unnecessary semicolons
- Optimizes values (e.g., `0px` → `0`, `#ffffff` → `#fff`)
- Preserves `calc()` expressions
- Handles string literals safely

```tsx
import { minifyStyles } from '@acusti/styling';

const original = `
    /* Comment */
    .button {
        background-color: #ffffff;
        padding: 10px 20px;
        border: 1px solid #cccccc;
        margin: 0px 0px 0px 0px;
    }
`;

const minified = minifyStyles(original);
// ".button{background-color:#fff;padding:10px 20px;border:1px solid #ccc;margin:0}"
```

## Best Practices

### Component-Level Styles

Keep styles close to their components:

```tsx
// ✅ Good: Styles are colocated with component
function Newsletter() {
    return (
        <>
            <Style href="newsletter">{newsletterStyles}</Style>
            <div className="newsletter">...</div>
        </>
    );
}
```

### Global vs Component Styles

Use precedence to control loading order:

```tsx
// ✅ Global styles with low precedence
function GlobalStyles() {
    return (
        <Style precedence="low" href="global">
            {globalStyles}
        </Style>
    );
}

// ✅ Critical component styles with high precedence
function Hero() {
    return (
        <Style precedence="high" href="hero">
            {heroStyles}
        </Style>
    );
}
```

### Custom Properties for Theming

Use CSS custom properties for dynamic theming:

```tsx
<Style href="theme">
    {`
        :root {
            --primary-color: ${theme.primary};
            --secondary-color: ${theme.secondary};
        }
        
        .button {
            background: var(--primary-color);
        }
    `}
</Style>
```

## Common Use Cases

- **Component libraries** - Style components without external CSS files
- **Dynamic themes** - Generate styles based on user preferences
- **SSR applications** - Avoid hydration issues with server-rendered styles
- **Critical CSS** - Inline above-the-fold styles for faster rendering
- **CSS-in-JS alternative** - Use regular CSS with React 19+ benefits
- **Animation libraries** - Define keyframes and animations inline
- **Responsive components** - Include media queries with components

This package provides a modern, efficient way to handle CSS in React 19+
applications while maintaining the familiarity and power of traditional
CSS.
