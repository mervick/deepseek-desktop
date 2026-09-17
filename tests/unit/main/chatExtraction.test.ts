import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

import { CHAT_EXTRACTION_SCRIPT } from '../../../src/main/utils/chatExtraction';

describe('DeepSeek chat extraction script', () => {
    it('exports user messages and final answers while excluding reasoning-only blocks', () => {
        const dom = new JSDOM(`
            <main>
                <div class="ds-virtual-list-visible-items">
                    <div class="hashed-user-row another-hash" data-virtual-list-item-key="1">
                        <div class="ds-collapsible-text">User question <span role="button">Edit</span></div>
                    </div>
                    <div class="hashed-assistant-row another-hash" data-virtual-list-item-key="2">
                        <div class="ds-think-content"><div class="ds-markdown">Private reasoning</div></div>
                        <div class="ds-markdown ds-assistant-message-main-content">
                            <p>Final answer</p><button>Copy</button><span role="button">Feedback</span>
                        </div>
                    </div>
                </div>
            </main>
        `);

        const extract = new Function('document', `return (${CHAT_EXTRACTION_SCRIPT})`) as (
            document: Document
        ) => { conversation: Array<{ role: string; text: string }> };
        const result = extract(dom.window.document);

        expect(result.conversation).toHaveLength(2);
        expect(result.conversation[0]).toMatchObject({ role: 'user', text: 'User question' });
        expect(result.conversation[1]).toMatchObject({ role: 'model', text: 'Final answer' });
        expect(result.conversation[1]?.html).toContain('<p>Final answer</p>');
        expect(result.conversation[1]?.html).not.toContain('Copy');
        expect(result.conversation[1]?.html).not.toContain('Feedback');
    });
});
