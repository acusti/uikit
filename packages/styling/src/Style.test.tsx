// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { type ReactNode, startTransition, useState } from 'react';
import { createPortal } from 'react-dom';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import {
    Style,
    type StyleErrorHandler,
    StyleProvider,
    type StyleSheet,
    StyleText,
} from './index.js';

// React never removes a hoisted <style>, and the tests in this file share one
// document, so each test names its sheets after itself.

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

function getHoisted(href: string, doc = document) {
    return doc.head.querySelectorAll<HTMLStyleElement>(`style[data-href~="${href}"]`);
}

function getHoistedText(href: string, doc = document) {
    return [...getHoisted(href, doc)].map((style) => style.textContent);
}

// what a page’s client gets for every sheet its server render drew: the
// server folds a precedence’s sheets into one <style> listing their hrefs
function addServedStyle({ css, hrefs }: { css: string; hrefs: Array<string> }) {
    const served = document.createElement('style');
    served.dataset.precedence = 'medium';
    served.dataset.href = hrefs.join(' ');
    served.textContent = css;
    document.head.appendChild(served);
    return served;
}

// An iframe with its own document, which renders its children there, as a
// frame or a canvas in an editor does
function Frame({ children }: { children: ReactNode }) {
    const [body, setBody] = useState<HTMLElement | null>(null);
    return (
        <>
            {body == null
                ? null
                : createPortal(
                      <StyleProvider document={body.ownerDocument}>
                          {children}
                      </StyleProvider>,
                      body,
                  )}
            <iframe
                onLoad={(event) =>
                    setBody(event.currentTarget.contentDocument?.body ?? null)
                }
                srcDoc="<!doctype html><html><head></head><body></body></html>"
                title="frame"
            />
        </>
    );
}

function getFrameDocument(container: HTMLElement) {
    return container.querySelector('iframe')!.contentDocument!;
}

it('hoists a sheet that carries its text, as a server and an unstripped client render it', () => {
    render(
        <Style sheet={{ css: '.with-text{color:red}', href: 'test/with-text.css' }} />,
    );

    expect(getHoistedText('test/with-text.css')).toEqual(['.with-text{color:red}']);
    expect(getHoisted('test/with-text.css')[0]!.dataset.precedence).toBe('medium');
    expect(fetchMock).not.toHaveBeenCalled();
});

it('hoists a sheet at the precedence it is given', () => {
    render(
        <Style
            precedence="high"
            sheet={{ css: '.high{color:red}', href: 'test/high.css' }}
        />,
    );

    expect(getHoisted('test/high.css')[0]!.dataset.precedence).toBe('high');
});

it('reads a stripped sheet from the server-rendered <style> that lists it, without a fetch', () => {
    const served = addServedStyle({
        css: '.a{color:red}.b{color:blue}',
        hrefs: ['test/served-a.css', 'test/served-b.css'],
    });

    render(
        <>
            <Style sheet={{ href: 'test/served-b.css', url: '/assets/served-b.css' }} />
            <p>drawn</p>
        </>,
    );

    expect(screen.getByText('drawn')).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
    expect([...getHoisted('test/served-b.css')]).toEqual([served]);
    expect(served.textContent).toBe('.a{color:red}.b{color:blue}');
});

// What a server-rendered page does, end to end: the server renders two sheets
// with their text, React folds them into one <style>, and the client, whose
// build carries neither text, hydrates against it. Every such page relies on
// React adopting that element as it is, so a React release that read the
// client’s children instead would empty them all. CI runs this file against
// React canary to catch that first.
it('hydrates a server render with stripped sheets and keeps the server’s text', async () => {
    const recoverable: Array<unknown> = [];
    vi.spyOn(console, 'error').mockImplementation((...args) => {
        recoverable.push(args);
    });
    const page = (sheets: { a: StyleSheet; b: StyleSheet }) => (
        <main>
            <Style sheet={sheets.a} />
            <Style sheet={sheets.b} />
            <p>hydrated page</p>
        </main>
    );
    const container = document.createElement('div');
    container.innerHTML = renderToString(
        page({
            a: { css: '.hydrated-a{color:red}', href: 'test/hydrated-a.css' },
            b: { css: '.hydrated-b{color:blue}', href: 'test/hydrated-b.css' },
        }),
    );
    document.body.appendChild(container);

    await act(async () => {
        hydrateRoot(
            container,
            page({
                a: { href: 'test/hydrated-a.css', url: '/assets/hydrated-a.css' },
                b: { href: 'test/hydrated-b.css', url: '/assets/hydrated-b.css' },
            }),
            { onRecoverableError: (error) => recoverable.push(error) },
        );
    });

    expect(recoverable).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(
        [...document.querySelectorAll('style[data-href~="test/hydrated-a.css"]')].map(
            (style) => [style.getAttribute('data-href'), style.textContent],
        ),
    ).toEqual([
        [
            'test/hydrated-a.css test/hydrated-b.css',
            '.hydrated-a{color:red}.hydrated-b{color:blue}',
        ],
    ]);
    container.remove();
});

// a client navigation to a page with a component the first page didn’t draw
it('fetches a stripped sheet the document lacks and holds the render until it arrives', async () => {
    let respond: ((text: string) => void) | undefined;
    fetchMock.mockReturnValue(
        new Promise((resolve) => {
            respond = (text) => resolve(new Response(text));
        }),
    );

    const view = render(<p>before</p>);
    // an act left unawaited never commits the transition
    await act(async () => {
        startTransition(() => {
            view.rerender(
                <>
                    <Style
                        sheet={{ href: 'test/fetched.css', url: '/assets/fetched-1.css' }}
                    />
                    <p>after</p>
                </>,
            );
        });
    });

    expect(fetchMock).toHaveBeenCalledWith('/assets/fetched-1.css');
    expect(screen.getByText('before')).toBeTruthy();
    expect(getHoisted('test/fetched.css')).toHaveLength(0);

    await act(async () => respond!('.fetched{color:green}'));

    expect(screen.getByText('after')).toBeTruthy();
    expect(getHoistedText('test/fetched.css')).toEqual(['.fetched{color:green}']);
});

// Runtime CSS rendered after a sheet overrides it only if it lands after it.
// A <link> for the sheet would land first: React puts new <link>s ahead of
// every <style> new in the same commit.
it('inserts a fetched sheet in render order, ahead of a <style> rendered after it', async () => {
    fetchMock.mockResolvedValue(new Response('.fetched-order{color:red}'));

    const view = render(<p>first page</p>);
    await act(async () => {
        startTransition(() => {
            view.rerender(
                <>
                    <Style
                        sheet={{
                            href: 'test/fetched-order.css',
                            url: '/assets/fetched-order-1.css',
                        }}
                    />
                    <StyleText href="test/fetched-order-tokens">
                        {'.fetched-order{color:blue}'}
                    </StyleText>
                    <p>second page</p>
                </>,
            );
        });
    });

    expect(screen.getByText('second page')).toBeTruthy();
    const hoisted = [...document.head.querySelectorAll('style[data-href]')];
    const sheetIndex = hoisted.indexOf(getHoisted('test/fetched-order.css')[0]!);
    expect(sheetIndex).toBeGreaterThanOrEqual(0);
    expect(hoisted.indexOf(getHoisted('test/fetched-order-tokens')[0]!)).toBe(
        sheetIndex + 1,
    );
    expect(getHoistedText('test/fetched-order.css')).toEqual([
        '.fetched-order{color:red}',
    ]);
});

it('fetches a stripped sheet for a frame that lacks it, though the page has it', async () => {
    addServedStyle({ css: '.in-page{color:red}', hrefs: ['test/in-page.css'] });
    fetchMock.mockResolvedValue(new Response('.in-page{color:red}'));

    const { container } = render(
        <Frame>
            <Style sheet={{ href: 'test/in-page.css', url: '/assets/in-page-1.css' }} />
            <p>in the frame</p>
        </Frame>,
    );

    const frameDocument = getFrameDocument(container);
    await expect.poll(() => frameDocument.body.textContent).toBe('in the frame');
    expect(fetchMock).toHaveBeenCalledWith('/assets/in-page-1.css');
    expect(getHoistedText('test/in-page.css', frameDocument)).toEqual([
        '.in-page{color:red}',
    ]);
});

// A tab left open across a deploy asks for a sheet the new deploy no longer
// serves. A page with no boundary below its root must leave the content of a
// sheet that first mounts on a navigation unstyled rather than take the page
// with it, and must not ask for the sheet again.
it('draws content unstyled when its sheet fails to load, and doesn’t ask again', async () => {
    fetchMock.mockResolvedValue(new Response('not found', { status: 404 }));
    const onError = vi.fn<StyleErrorHandler>();
    const sheet = { href: 'test/missing.css', url: '/assets/missing-1.css' };

    const view = render(
        <StyleProvider onError={onError}>
            <p>landing page</p>
        </StyleProvider>,
    );
    await act(async () => {
        startTransition(() => {
            view.rerender(
                <StyleProvider onError={onError}>
                    <Style sheet={sheet} />
                    <p>next page</p>
                </StyleProvider>,
            );
        });
    });

    expect(screen.getByText('next page')).toBeTruthy();
    expect(getHoisted('test/missing.css')).toHaveLength(0);
    expect(onError).toHaveBeenCalledExactlyOnceWith(
        new Error('/assets/missing-1.css answered 404'),
        sheet,
    );

    // a later page with the same footer, which mounts it afresh
    await act(async () => {
        startTransition(() => {
            view.rerender(
                <StyleProvider onError={onError}>
                    <Style key="third" sheet={sheet} />
                    <p>third page</p>
                </StyleProvider>,
            );
        });
    });

    expect(screen.getByText('third page')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
});

it('reports a failed fetch as an uncaught error when no provider handles it', async () => {
    const error = new TypeError('Failed to fetch');
    fetchMock.mockRejectedValue(error);
    const reportError = vi.fn<typeof globalThis.reportError>();
    vi.stubGlobal('reportError', reportError);

    await act(async () => {
        render(
            <Style sheet={{ href: 'test/offline.css', url: '/assets/offline-1.css' }} />,
        );
    });

    expect(reportError).toHaveBeenCalledExactlyOnceWith(error);
    expect(getHoisted('test/offline.css')).toHaveLength(0);
});

it('keeps the error handler of the provider above when a frame names its document', async () => {
    fetchMock.mockResolvedValue(new Response('gone', { status: 410 }));
    const onError = vi.fn<StyleErrorHandler>();

    const { container } = render(
        <StyleProvider onError={onError}>
            <Frame>
                <Style
                    sheet={{
                        href: 'test/frame-missing.css',
                        url: '/assets/frame-missing-1.css',
                    }}
                />
                <p>framed</p>
            </Frame>
        </StyleProvider>,
    );

    const frameDocument = getFrameDocument(container);
    await expect.poll(() => frameDocument.body.textContent).toBe('framed');
    expect(onError).toHaveBeenCalledOnce();
});

// React can’t hydrate a hoisted <style> whose href has a space, since a
// server render lists the hrefs of the sheets it merges separated by spaces
it('encodes a StyleText href, which a space would split', () => {
    render(<StyleText href="test/theme a">{'.theme-a{color:red}'}</StyleText>);

    expect(getHoistedText('test/theme%20a')).toEqual(['.theme-a{color:red}']);
});

// a provider for errors alone, inside a frame’s, must not reset its document
it('keeps the document of the provider above when one names only its error handler', async () => {
    addServedStyle({ css: '.nested{color:red}', hrefs: ['test/nested.css'] });
    fetchMock.mockResolvedValue(new Response('.nested{color:red}'));
    const onError = vi.fn<StyleErrorHandler>();

    const { container } = render(
        <Frame>
            <StyleProvider onError={onError}>
                <Style sheet={{ href: 'test/nested.css', url: '/assets/nested-1.css' }} />
                <p>nested in the frame</p>
            </StyleProvider>
        </Frame>,
    );

    const frameDocument = getFrameDocument(container);
    await expect.poll(() => frameDocument.body.textContent).toBe('nested in the frame');
    expect(fetchMock).toHaveBeenCalledWith('/assets/nested-1.css');
    expect(getHoistedText('test/nested.css', frameDocument)).toEqual([
        '.nested{color:red}',
    ]);
    expect(onError).not.toHaveBeenCalled();
});

it('hoists runtime CSS with StyleText, in render order with sheets', () => {
    render(
        <>
            <Style sheet={{ css: '.ordered{color:red}', href: 'test/ordered.css' }} />
            <StyleText href="test/ordered-tokens">{'.ordered{color:blue}'}</StyleText>
        </>,
    );

    const hoisted = [...document.head.querySelectorAll('style[data-href]')];
    const sheetIndex = hoisted.indexOf(getHoisted('test/ordered.css')[0]!);
    const tokensIndex = hoisted.indexOf(getHoisted('test/ordered-tokens')[0]!);
    expect(sheetIndex).toBeGreaterThanOrEqual(0);
    expect(tokensIndex).toBe(sheetIndex + 1);
    expect(getHoistedText('test/ordered-tokens')).toEqual(['.ordered{color:blue}']);
});
