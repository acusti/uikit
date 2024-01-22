// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';

import {
    clearRegistry,
    getRegisteredStyles,
    getStyleRegistryKeys,
    registerStyles,
    unregisterStyles,
    updateStyles,
} from './style-registry.js';

describe('@acusti/styling', () => {
    describe('style-registry.ts', () => {
        const mockStyles = '.test { color: red; }';

        // reset styleRegistry before each test
        beforeEach(clearRegistry);

        describe('registerStyles', () => {
            it('should add styles to the registry keyed by the style string', () => {
                const payload = { ownerDocument: document, styles: mockStyles };
                registerStyles(payload);
                const styleRegistryKeys = getStyleRegistryKeys();
                const keysArray = [...styleRegistryKeys];
                expect(keysArray.length).toBe(1);
                expect(keysArray[0]).toBe(mockStyles);
                const result = getRegisteredStyles(payload);
                expect(result!.element).toBeDefined();
                expect(result!.referenceCount).toBe(1);
            });

            it('should allow registering styles without a DOM via ownerDocument: "global"', () => {
                const payload = Object.freeze({
                    ownerDocument: 'global',
                    styles: mockStyles,
                });
                registerStyles(payload);
                const registryKeys = [...getStyleRegistryKeys()];
                expect(registryKeys.length).toBe(1);
                expect(registryKeys[0]).toBe(mockStyles);
                const result = getRegisteredStyles(payload);
                expect(result!.element).toBeNull();
                expect(result!.referenceCount).toBe(1);
            });
        });

        describe('getRegisteredStyles', () => {
            it('should retrieve registered styles', () => {
                const payload = { ownerDocument: document, styles: mockStyles };
                registerStyles(payload);
                const result = getRegisteredStyles(payload);
                expect(result!.element!.tagName).toBe('STYLE');
                expect(result!.referenceCount).toBe(1);
            });
        });

        describe('unregisterStyles', () => {
            it('should remove styles from the registry if no other references to same styles exist', () => {
                const payload = { ownerDocument: document, styles: mockStyles };
                const otherPayload = Object.freeze({
                    ownerDocument: 'global',
                    styles: mockStyles,
                });
                registerStyles(payload);
                registerStyles(otherPayload);
                expect(getStyleRegistryKeys().next().value).toBe(mockStyles);
                expect(getRegisteredStyles(payload)!.referenceCount).toBe(1);
                expect(getRegisteredStyles(otherPayload)!.referenceCount).toBe(1);
                unregisterStyles(payload);
                // style registry for this style should still exist
                expect(getStyleRegistryKeys().next().value).toBe(mockStyles);
                // but this document’s styles item should be cleared
                expect(getRegisteredStyles(payload)).toBeNull();
                unregisterStyles(otherPayload);
                // now the style registry should be empty
                expect([...getStyleRegistryKeys()].length).toBe(0);
            });
        });

        describe('updateStyles', () => {
            it('should update styles in the registry, reusing the existing DOM element if no other reference', () => {
                const previousStyles = '.previous { color: blue; }';
                const payload = {
                    ownerDocument: document,
                    styles: previousStyles,
                };
                registerStyles(payload);
                const previousStylesItem = getRegisteredStyles(payload)!;
                expect(previousStylesItem.element!.innerText).toBe(previousStyles);
                updateStyles({
                    ownerDocument: document,
                    previousStyles,
                    styles: mockStyles,
                });
                const stylesItem = getRegisteredStyles({
                    ownerDocument: document,
                    styles: mockStyles,
                })!;
                expect(previousStylesItem.element).toBe(stylesItem.element);
                expect(stylesItem.element!.innerText).toBe(mockStyles);
                expect(getRegisteredStyles(payload)).toBeNull();
            });

            it('should update styles in the registry, creating a new DOM element if there are other references', () => {
                const previousStyles = '.previous { color: blue; }';
                const payload = { ownerDocument: document, styles: previousStyles };
                registerStyles(payload);
                // create multiple references to the same styles and document
                registerStyles(payload);
                const previousStylesItem = getRegisteredStyles(payload)!;
                expect(previousStylesItem.referenceCount).toBe(2);
                expect(previousStylesItem.element!.innerText).toBe(previousStyles);
                updateStyles({
                    ownerDocument: document,
                    previousStyles,
                    styles: mockStyles,
                });
                const stylesItem = getRegisteredStyles({
                    ownerDocument: document,
                    styles: mockStyles,
                })!;
                expect(previousStylesItem.element).not.toBe(stylesItem.element);
                expect(stylesItem.element!.innerText).toBe(mockStyles);
                expect(getRegisteredStyles(payload)!.referenceCount).toBe(1);
            });
        });
    });
});
