// @vitest-environment happy-dom
import { afterEach, expect, it } from 'vitest';

import replaceText from './replaceText.js';

afterEach(() => {
    document.head.replaceChildren();
    document.body.replaceChildren();
});

function addStyle({
    css,
    doc = document,
    hrefs,
}: {
    css: string;
    doc?: Document;
    hrefs: Array<string>;
}) {
    const style = doc.createElement('style');
    style.dataset.href = hrefs.join(' ');
    style.textContent = css;
    doc.head.appendChild(style);
    return style;
}

it('swaps the sheet’s text inside the server’s merged <style>', () => {
    const style = addStyle({
        css: '.a{color:red}.b{color:blue}',
        hrefs: ['a.css', 'b.css'],
    });
    const sheet = { css: '.b{color:blue}', href: 'b.css' };

    replaceText(sheet, '.b{color:green}');

    expect(style.textContent).toBe('.a{color:red}.b{color:green}');
    expect(sheet.css).toBe('.b{color:green}');
});

it('inserts new CSS as it is, without expanding replacement patterns', () => {
    const style = addStyle({ css: '.a{color:red}', hrefs: ['a.css'] });

    replaceText({ css: '.a{color:red}', href: 'a.css' }, `.a::after{content:"$&$'$$"}`);

    expect(style.textContent).toBe(`.a::after{content:"$&$'$$"}`);
});

it('leaves a <style> alone that doesn’t list the href', () => {
    const style = addStyle({ css: '.a{color:red}', hrefs: ['a.css.map', 'other/a.css'] });

    replaceText({ css: '.a{color:red}', href: 'a.css' }, '.a{color:blue}');

    expect(style.textContent).toBe('.a{color:red}');
});

it('appends the new text when the old text isn’t found', () => {
    const style = addStyle({ css: '.a{color:red}', hrefs: ['a.css'] });

    replaceText({ css: '.a{color:pink}', href: 'a.css' }, '.a{color:blue}');

    expect(style.textContent).toBe('.a{color:red}.a{color:blue}');
});

// an empty string is found at the start of any text, ahead of every other
// sheet the server merged into the same <style>
it('appends the text of a sheet that was empty', () => {
    const style = addStyle({ css: '.a{color:red}', hrefs: ['a.css', 'empty.css'] });

    replaceText({ css: '', href: 'empty.css' }, '.empty{color:blue}');

    expect(style.textContent).toBe('.a{color:red}.empty{color:blue}');
});

function addFrame(doc: Document) {
    const frame = doc.createElement('iframe');
    frame.srcdoc = '<!doctype html><html><head></head><body></body></html>';
    const loaded = new Promise((resolve) => frame.addEventListener('load', resolve));
    doc.body.appendChild(frame);
    return loaded.then(() => frame.contentDocument!);
}

it('swaps the text in a frame inside a frame', async () => {
    const outer = await addFrame(document);
    const inner = await addFrame(outer);
    const style = addStyle({ css: '.a{color:red}', doc: inner, hrefs: ['a.css'] });

    replaceText({ css: '.a{color:red}', href: 'a.css' }, '.a{color:blue}');

    expect(style.textContent).toBe('.a{color:blue}');
});

// what Vite passes on when an update fails
it('leaves the text as it is when there is no new text', () => {
    const style = addStyle({ css: '.a{color:red}', hrefs: ['a.css'] });
    const sheet = { css: '.a{color:red}', href: 'a.css' };

    replaceText(sheet, undefined);

    expect(style.textContent).toBe('.a{color:red}');
    expect(sheet.css).toBe('.a{color:red}');
});

it('swaps the text in a same-origin frame’s document too, and skips any other frame', async () => {
    const frame = document.createElement('iframe');
    frame.srcdoc = '<!doctype html><html><head></head><body></body></html>';
    const loaded = new Promise((resolve) => frame.addEventListener('load', resolve));
    document.body.appendChild(frame);
    await loaded;
    // a cross-origin frame, whose document the page can’t reach
    const crossOrigin = document.createElement('iframe');
    // a document of its own, so happy-dom doesn’t try (and fail) to load one
    crossOrigin.srcdoc = '<!doctype html><html><head></head><body></body></html>';
    Object.defineProperty(crossOrigin, 'contentDocument', { value: null });
    document.body.appendChild(crossOrigin);
    const frameDocument = frame.contentDocument!;
    const inPage = addStyle({ css: '.a{color:red}', hrefs: ['a.css'] });
    const inFrame = addStyle({
        css: '.a{color:red}',
        doc: frameDocument,
        hrefs: ['a.css'],
    });

    replaceText({ css: '.a{color:red}', href: 'a.css' }, '.a{color:blue}');

    expect(inPage.textContent).toBe('.a{color:blue}');
    expect(inFrame.textContent).toBe('.a{color:blue}');
});
