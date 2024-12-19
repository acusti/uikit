/**
 * Adapted from:
 * https://github.com/jbleuzen/node-cssmin/blob/master/cssmin.js
 * node-cssmin
 * A simple module for Node.js that minify CSS
 * Author : Johan Bleuzen
 */

/**
 * cssmin.js
 * Author: Stoyan Stefanov - http://phpied.com/
 * This is a JavaScript port of the CSS minification tool
 * distributed with YUICompressor, itself a port
 * of the cssmin utility by Isaac Schlueter - http://foohack.com/
 * Permission is hereby granted to use the JavaScript version under the same
 * conditions as the YUICompressor (original YUICompressor note below).
 */

/*
 * YUI Compressor
 * http://developer.yahoo.com/yui/compressor/
 * Author: Julien Lecomte - http://www.julienlecomte.net/
 * Copyright (c) 2011 Yahoo! Inc. All rights reserved.
 * The copyrights embodied in the content of this file are licensed
 * by Yahoo! Inc. under the BSD (revised) open source license.
 */

export function minifyStyles(css: string) {
    const preservedTokens: Array<string> = [];
    const comments: Array<string> = [];
    const totalLength = css.length;
    let startIndex = 0,
        endIndex = 0,
        token = '',
        placeholder = '';

    // collect all comment blocks...
    while ((startIndex = css.indexOf('/*', startIndex)) >= 0) {
        endIndex = css.indexOf('*/', startIndex + 2);
        if (endIndex < 0) {
            endIndex = totalLength;
        }
        token = css.slice(startIndex + 2, endIndex);
        comments.push(token);
        css =
            css.slice(0, startIndex + 2) +
            '___PRESERVE_CANDIDATE_COMMENT_' +
            (comments.length - 1) +
            '___' +
            css.slice(endIndex);
        startIndex += 2;
    }

    // preserve strings so their content doesn't get accidentally minified
    css = css.replace(/("([^\\"]|\\.|\\)*")|('([^\\']|\\.|\\)*')/g, function (match) {
        const quote = match.substring(0, 1);

        match = match.slice(1, -1);

        // maybe the string contains a comment-like substring?
        // one, maybe more? put'em back then
        if (match.indexOf('___PRESERVE_CANDIDATE_COMMENT_') >= 0) {
            for (let i = 0, max = comments.length; i < max; i++) {
                match = match.replace(
                    '___PRESERVE_CANDIDATE_COMMENT_' + i + '___',
                    comments[i],
                );
            }
        }

        preservedTokens.push(match);
        return (
            quote + '___PRESERVED_TOKEN_' + (preservedTokens.length - 1) + '___' + quote
        );
    });

    // strings are safe, now wrestle the comments
    for (let i = 0, max = comments.length; i < max; i = i + 1) {
        token = comments[i];
        placeholder = '___PRESERVE_CANDIDATE_COMMENT_' + i + '___';

        // ! in the first position of the comment means preserve
        // so push to the preserved tokens keeping the !
        if (token.charAt(0) === '!') {
            preservedTokens.push(token);
            css = css.replace(
                placeholder,
                '___PRESERVED_TOKEN_' + (preservedTokens.length - 1) + '___',
            );
            continue;
        }

        // otherwise, kill the comment
        css = css.replace('/*' + placeholder + '*/', '');
    }

    // Normalize all whitespace strings to single spaces. Easier to work with that way.
    css = css.replace(/\s+/g, ' ');

    // Remove the spaces before the things that should not have spaces before them.
    // But, be careful not to turn "p :link {...}" into "p:link{...}"
    // Swap out any pseudo-class colons with the token, and then swap back.
    css = css.replace(/(^|\})(([^{:])+:)+([^{]*\{)/g, function (m) {
        return m.replace(/:/g, '___PSEUDOCLASSCOLON___');
    });

    // Preserve spaces in calc expressions
    css = css.replace(/calc\s*\(\s*(.*?)\s*\)/g, function (m, c: string) {
        return m.replace(c, c.replace(/\s+/g, '___SPACE_IN_CALC___'));
    });

    css = css.replace(/\s+([!{};:>+()\],])/g, '$1');
    css = css.replace(/___PSEUDOCLASSCOLON___/g, ':');

    // no space after the end of a preserved comment
    css = css.replace(/\*\/ /g, '*/');

    // If there is a @charset, then only allow one, and push to the top of the file.
    css = css.replace(/^(.*)(@charset "[^"]*";)/gi, '$2$1');
    css = css.replace(/^(\s*@charset [^;]+;\s*)+/gi, '$1');

    // Put the space back in some cases, to support stuff like
    // @media screen and (-webkit-min-device-pixel-ratio:0){
    css = css.replace(/\band\(/gi, 'and (');

    // Remove the spaces after the things that should not have spaces after them.
    css = css.replace(/([!{}:;>+([,])\s+/g, '$1');

    // Restore preserved spaces in calc expressions
    css = css.replace(/___SPACE_IN_CALC___/g, ' ');

    // remove unnecessary semicolons
    css = css.replace(/;+\}/g, '}');

    // Replace 0(px,em,%) with 0.
    css = css.replace(/([\s:])(0)(px|em|%|in|cm|mm|pc|pt|ex)/gi, '$1$2');

    // Replace 0 0 0 0; with 0.
    css = css.replace(/:0 0 0 0(;|\})/g, ':0$1');
    css = css.replace(/:0 0 0(;|\})/g, ':0$1');
    css = css.replace(/:0 0(;|\})/g, ':0$1');

    // Replace background-position:0; with background-position:0 0;
    // same for transform-origin
    css = css.replace(
        /(background-position|transform-origin):0(;|\})/gi,
        function (_all, prop: string, tail: string) {
            return prop.toLowerCase() + ':0 0' + tail;
        },
    );

    // Replace 0.6 to .6, but only when preceded by : or a white-space
    css = css.replace(/(:|\s)0+\.(\d+)/g, '$1.$2');

    // border: none -> border:0
    css = css.replace(
        /(border|border-top|border-right|border-bottom|border-right|outline|background):none(;|\})/gi,
        function (_all, prop: string, tail: string) {
            return prop.toLowerCase() + ':0' + tail;
        },
    );

    // Remove empty rules.
    css = css.replace(/[^};{/]+\{\}/g, '');

    // Replace multiple semi-colons in a row by a single one
    // See SF bug #1980989
    css = css.replace(/;;+/g, ';');

    // restore preserved comments and strings
    for (let i = 0, max = preservedTokens.length; i < max; i = i + 1) {
        css = css.replace('___PRESERVED_TOKEN_' + i + '___', preservedTokens[i]);
    }

    return css.trim();
}

export default minifyStyles;
