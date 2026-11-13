import { use } from 'react';

import {
    StyleContext,
    type StyleErrorHandler,
    type StyleSheet,
} from './StyleProvider.js';

export type StyleProps = {
    /** defaults to `medium` */
    precedence?: string;
    /** a `./x.css?style` import */
    sheet: StyleSheet;
};

const fetches = new Map<string, Promise<null | string>>();

/**
 * Renders a stylesheet as a hoisted `<style>`: React puts it in the `<head>`
 * of the document it renders into, once per href, in the order it first meets
 * it among the sheets of its precedence.
 *
 * A client build that strips the text gives a sheet without `css`. There the
 * text comes from one of two places:
 * 1. The document, when a server render already put the sheet there. React
 *    then never reads the `<style>`’s children, so it renders without any.
 * 2. The sheet’s emitted `.css` asset otherwise. The render suspends until it
 *    arrives, and the sheet still goes in as a `<style>`, in render order
 *    among the others. A `<link>` would not: React inserts a new `<link>`
 *    ahead of every `<style>` new in the same commit.
 */
export default function Style({ precedence = 'medium', sheet }: StyleProps) {
    const { document: target, onError } = use(StyleContext);
    let css = sheet.css ?? null;
    if (
        sheet.url != null &&
        !getIsInDocument({ doc: target ?? document, href: sheet.href })
    ) {
        css = use(fetchText({ onError, sheet }));
        // no element, rather than an empty one React would keep under this href
        if (css == null) return null;
    }
    return (
        <style href={sheet.href} precedence={precedence}>
            {css}
        </style>
    );
}

// A sheet that doesn’t arrive leaves what it styles unstyled rather than
// unwinding to an error boundary. The failure stays cached: dropping it would
// have the render it wakes start the same fetch, so a sheet a deploy removed
// would be asked for again and again.
function fetchText({
    onError,
    sheet,
}: {
    onError: StyleErrorHandler;
    sheet: { readonly href: string; readonly url: string };
}) {
    let text = fetches.get(sheet.url);
    if (text == null) {
        text = fetch(sheet.url)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`${sheet.url} answered ${response.status}`);
                }
                return response.text();
            })
            .catch((error: unknown) => {
                onError(error, sheet);
                return null;
            });
        fetches.set(sheet.url, text);
    }
    return text;
}

// A hoisted `<style>` stays in `<head>` for the life of the document, so once
// this is true for an href it stays true, and a render reading it stays pure.
function getIsInDocument({ doc, href }: { doc: Document; href: string }) {
    return doc.querySelector(`style[data-href~="${CSS.escape(href)}"]`) != null;
}
