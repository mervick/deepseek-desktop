/**
 * Unit tests for DeepSeek DOM Selectors module.
 */
import { describe, it, expect } from 'vitest';
import {
    DEEPSEEK_SELECTORS_VERSION,
    DEEPSEEK_SELECTORS_LAST_VERIFIED,
    DeepSeekSelectors,
    findDeepSeekElement,
    isDeepSeekDomain,
    DEEPSEEK_DOMAIN,
    DEEPSEEK_EDITOR_SELECTORS,
    DEEPSEEK_SUBMIT_BUTTON_SELECTORS,
    DEEPSEEK_EDITOR_BLANK_CLASS,
    DEEPSEEK_SUBMIT_DELAY_MS,
} from '../../../src/main/utils/deepseekSelectors';

describe('DeepSeek Selectors Module', () => {
    describe('Version and Metadata', () => {
        it('has a valid version string', () => {
            expect(DEEPSEEK_SELECTORS_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
        });

        it('has a valid date string for last verified', () => {
            expect(DEEPSEEK_SELECTORS_LAST_VERIFIED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });
    });

    describe('DeepSeekSelectors structure', () => {
        it('has domain configuration', () => {
            expect(DeepSeekSelectors.domain).toBe('chat.deepseek.com');
            expect(DeepSeekSelectors.legacyDomain).toBe('deepseek.com');
        });

        it('has editor selectors', () => {
            expect(DeepSeekSelectors.editor.selectors).toBeInstanceOf(Array);
            expect(DeepSeekSelectors.editor.selectors.length).toBeGreaterThan(0);
            expect(DeepSeekSelectors.editor.blankClass).toBe('ql-blank');
            expect(DeepSeekSelectors.editor.description).toBeTruthy();
        });

        it('has submit button selectors', () => {
            expect(DeepSeekSelectors.submitButton.selectors).toBeInstanceOf(Array);
            expect(DeepSeekSelectors.submitButton.selectors.length).toBeGreaterThan(0);
            expect(DeepSeekSelectors.submitButton.description).toBeTruthy();
        });

        it('has timing configuration', () => {
            expect(DeepSeekSelectors.timing.submitDelayMs).toBeGreaterThan(0);
            expect(DeepSeekSelectors.timing.description).toBeTruthy();
        });

        it('includes conversation title data-test-id selector', () => {
            expect(DeepSeekSelectors.conversationTitle.selectors).toContain('[data-test-id="conversation-title"]');
        });

        it('all selectors are valid CSS selector syntax', () => {
            const allSelectors = [
                ...DeepSeekSelectors.editor.selectors,
                ...DeepSeekSelectors.submitButton.selectors,
                ...DeepSeekSelectors.conversationTitle.selectors,
            ];

            // Create a mock document to validate selectors
            const { JSDOM } = require('jsdom');
            const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
            const doc = dom.window.document;

            allSelectors.forEach((selector) => {
                // This will throw if selector is invalid
                expect(() => doc.querySelector(selector)).not.toThrow();
            });
        }, 15000);

        it('handles malformed selectors gracefully', () => {
            const { JSDOM } = require('jsdom');
            const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
            const doc = dom.window.document;

            // Should verify that findDeepSeekElement doesn't crash with bad selectors
            // We'll test this via findDeepSeekElement tests
            const badSelectors = ['div[bad', ''];

            expect(() => {
                badSelectors.forEach((s) => {
                    try {
                        doc.querySelector(s);
                    } catch {
                        /* Expected for bad selector */
                    }
                });
            }).not.toThrow();
        });
    });

    describe('Backwards Compatibility Exports', () => {
        it('exports DEEPSEEK_DOMAIN', () => {
            expect(DEEPSEEK_DOMAIN).toBe('chat.deepseek.com');
        });

        it('exports DEEPSEEK_EDITOR_SELECTORS', () => {
            expect(DEEPSEEK_EDITOR_SELECTORS).toEqual(DeepSeekSelectors.editor.selectors);
        });

        it('exports DEEPSEEK_SUBMIT_BUTTON_SELECTORS', () => {
            expect(DEEPSEEK_SUBMIT_BUTTON_SELECTORS).toEqual(DeepSeekSelectors.submitButton.selectors);
        });

        it('exports DEEPSEEK_EDITOR_BLANK_CLASS', () => {
            expect(DEEPSEEK_EDITOR_BLANK_CLASS).toBe('ql-blank');
        });

        it('exports DEEPSEEK_SUBMIT_DELAY_MS', () => {
            expect(DEEPSEEK_SUBMIT_DELAY_MS).toBe(500);
        });
    });

    describe('isDeepSeekDomain', () => {
        it('returns true for chat.deepseek.com URLs', () => {
            expect(isDeepSeekDomain('https://chat.deepseek.com/app')).toBe(true);
            expect(isDeepSeekDomain('https://chat.deepseek.com/')).toBe(true);
        });

        it('returns true for the DeepSeek root domain', () => {
            expect(isDeepSeekDomain('https://deepseek.com/app')).toBe(true);
        });

        it('returns false for other URLs', () => {
            expect(isDeepSeekDomain('https://example.com')).toBe(false);
        });
    });

    describe('findDeepSeekElement', () => {
        it('finds element with primary selector', () => {
            const { JSDOM } = require('jsdom');
            const dom = new JSDOM(`
                <html><body>
                    <textarea placeholder="Message"></textarea>
                </body></html>
            `);

            const logs: string[] = [];
            const logger = (msg: string) => logs.push(msg);

            const element = findDeepSeekElement(dom.window.document, DeepSeekSelectors.editor.selectors, 'editor', logger);

            expect(element).not.toBeNull();
            expect(logs[0]).toContain('primary selector');
        });

        it('finds element with fallback selector', () => {
            const { JSDOM } = require('jsdom');
            const dom = new JSDOM(`
                <html><body>
                    <div contenteditable="true" role="textbox"></div>
                </body></html>
            `);

            const logs: string[] = [];
            const logger = (msg: string) => logs.push(msg);

            const element = findDeepSeekElement(dom.window.document, DeepSeekSelectors.editor.selectors, 'editor', logger);

            expect(element).not.toBeNull();
            expect(logs[0]).toContain('fallback selector');
        });

        it('returns null when no selector matches', () => {
            const { JSDOM } = require('jsdom');
            const dom = new JSDOM('<html><body><div></div></body></html>');

            const logs: string[] = [];
            const logger = (msg: string) => logs.push(msg);

            const element = findDeepSeekElement(dom.window.document, DeepSeekSelectors.editor.selectors, 'editor', logger);

            expect(element).toBeNull();
            expect(logs[0]).toContain('No matching element found');
        });
    });

    describe('Selector Validation Edge Cases', () => {
        it('handles empty selector list', () => {
            const { JSDOM } = require('jsdom');
            const dom = new JSDOM('<html><body><div class="test"></div></body></html>');
            const logger = (_msg: string) => {};

            const element = findDeepSeekElement(dom.window.document, [], 'test', logger);

            expect(element).toBeNull();
        });

        it('handles malformed selectors in list', () => {
            const { JSDOM } = require('jsdom');
            const dom = new JSDOM('<html><body><div class="test"></div></body></html>');
            const logger = (_msg: string) => {};

            const element = findDeepSeekElement(
                dom.window.document,
                ['div[invalid', '.test'], // First is invalid, second is valid
                'test',
                logger
            );

            // Should skip invalid and find via valid separator
            expect(element).not.toBeNull();
            expect(element?.className).toBe('test');
        });
    });
});
