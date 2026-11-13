import { createContext, type ReactNode, use } from 'react';

export type StyleErrorHandler = (
    error: unknown,
    sheet: { readonly href: string; readonly url: string },
) => void;

export type StyleProviderProps = {
    children?: ReactNode;
    /**
     * The document the subtree renders into, when a portal puts it in another
     * one (an iframe’s, say). Defaults to the provider above’s, or the
     * page’s own.
     */
    document?: Document;
    /**
     * Called once for each stripped sheet whose text fails to load. Defaults
     * to the provider above’s, or `reportError`, which reports it as an
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
 * when a stripped sheet fails to load. Each prop it leaves out comes from the
 * provider above it. Context passes through portals, so a portal out of an
 * iframe and back into the page needs a provider of its own.
 */
export function StyleProvider({ children, document, onError }: StyleProviderProps) {
    const parent = use(StyleContext);
    const value = {
        document: document ?? parent.document,
        onError: onError ?? parent.onError,
    };
    return <StyleContext value={value}>{children}</StyleContext>;
}
