import { createContext, type ReactNode, use } from 'react';

export type StyleErrorHandler = (
    error: unknown,
    sheet: { readonly href: string; readonly url: string },
) => void;

export type StyleProviderProps = {
    children?: ReactNode;
    /**
     * The document the subtree renders into, when a portal puts it in another
     * one (an iframe’s, say). Defaults to the parent provider’s, or the
     * page’s own.
     */
    document?: Document;
    /**
     * Called once for each stripped sheet whose text fails to load. Defaults
     * to the parent provider’s, or `reportError`, which reports it as an
     * uncaught error to the console and to any `error` event listener.
     */
    onError?: StyleErrorHandler;
};

export type StyleSheet =
    | { readonly css: string; readonly href: string; readonly url?: undefined }
    | { readonly css?: undefined; readonly href: string; readonly url: string };

export const StyleContext = createContext<{
    document: Document | null;
    onError: StyleErrorHandler;
}>({
    document: null,
    onError: (error) => reportError(error),
});

/**
 * Tells each `<Style>` below it which document it renders into and what to do
 * when a stripped sheet fails to load. Each prop it leaves out comes from its
 * parent provider. A provider covers its whole React subtree, portals
 * included, so content in a frame that portals back out to the page (e.g. a
 * popover in the page’s `<body>`) needs a provider of its own with the page’s
 * `document`.
 */
export function StyleProvider({ children, document, onError }: StyleProviderProps) {
    const parent = use(StyleContext);
    const value = {
        document: document ?? parent.document,
        onError: onError ?? parent.onError,
    };
    return <StyleContext value={value}>{children}</StyleContext>;
}
