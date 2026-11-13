/**
 * Runs in the browser, in dev only: the plugin inlines its source into each
 * `?style` module, so it must not reference anything outside its own body.
 *
 * React never updates the text of a hoisted `<style>` whose href it has
 * already inserted, and a server render folds every sheet of one precedence
 * into one `<style>`. So the sheet’s old text is swapped inside whichever
 * element lists its href, in the page and in every same-origin frame, nested
 * ones included. A sheet that was empty has no text to find, so its new text
 * goes at the end, where a reload would put it among its precedence’s others.
 *
 * Vite hands an accept callback no module when the update failed, and then
 * there is no new text to put in.
 */
export default function replaceText(
    sheet: { css: string; href: string },
    css: string | undefined,
) {
    if (css == null) return;
    const documents = [document];
    // grows as it goes, so each frame’s own frames are visited too
    for (const doc of documents) {
        for (const frame of doc.querySelectorAll('iframe')) {
            if (frame.contentDocument != null) documents.push(frame.contentDocument);
        }

        for (const style of doc.querySelectorAll('style[data-href]')) {
            const hrefs = style.getAttribute('data-href')?.split(' ') ?? [];
            if (!hrefs.includes(sheet.href)) continue;
            const text = style.textContent ?? '';
            // replaced by a function, since a replacement string would expand
            // any `$&` or `$'` in the new CSS
            style.textContent =
                sheet.css !== '' && text.includes(sheet.css)
                    ? text.replace(sheet.css, () => css)
                    : text + css;
        }
    }
    sheet.css = css;
}
