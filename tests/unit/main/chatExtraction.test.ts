import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

import { CHAT_EXTRACTION_SCRIPT, TITLE_EXTRACTION_SCRIPT } from '../../../src/main/utils/chatExtraction';

describe('DeepSeek conversation extraction', () => {
    it('preserves message order and HTML for Markdown conversion', () => {
        const dom = new JSDOM(
            `<!doctype html><title>Project notes - DeepSeek</title>
            <main>
                <div class="ds-message" data-role="user"><div class="message-content">How are you?</div></div>
                <div class="ds-message" data-role="assistant"><div class="ds-markdown"><p>Fine, <strong>thanks</strong>.</p></div></div>
            </main>`,
            { runScripts: 'outside-only', url: 'https://chat.deepseek.com/chat/test' }
        );
        const data = dom.window.eval(CHAT_EXTRACTION_SCRIPT);

        expect(data.title).toBe('Project notes');
        expect(data.conversation).toEqual([
            { role: 'user', text: 'How are you?' },
            { role: 'model', text: 'Fine, thanks.', html: '<p>Fine, <strong>thanks</strong>.</p>' },
        ]);
        expect(dom.window.eval(TITLE_EXTRACTION_SCRIPT)).toBe('Project notes');
    });

    it('returns no turns on the home page instead of exporting unrelated UI text', () => {
        const dom = new JSDOM('<!doctype html><title>DeepSeek</title><nav>Previous chats</nav>', {
            runScripts: 'outside-only',
            url: 'https://chat.deepseek.com/',
        });
        expect(dom.window.eval(CHAT_EXTRACTION_SCRIPT).conversation).toEqual([]);
    });
});
