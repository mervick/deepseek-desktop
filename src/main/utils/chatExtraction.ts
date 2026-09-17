/** Scripts executed only in an allowlisted DeepSeek webContents. */
export const CHAT_EXTRACTION_SCRIPT = `
(() => {
    try {
        const text = (element) => (element?.innerText || element?.textContent || '').trim();
        const selectors = '[data-role="user"], [data-role="assistant"], [data-message-role="user"], [data-message-role="assistant"], .ds-message, [data-testid="chat-message"]';
        const nodes = Array.from(document.querySelectorAll(selectors));
        const conversation = [];

        for (const node of nodes) {
            // A message container can contain nested role-marked elements; export each turn once.
            if (nodes.some((other) => other !== node && node.contains(other))) continue;
            const roleAttribute = node.getAttribute('data-role') || node.getAttribute('data-message-role');
            const markdown = node.querySelector('.ds-markdown, .markdown, [data-testid="message-content"]');
            const user = roleAttribute === 'user' || node.matches('.ds-user-message, .user-message, [data-testid="user-message"]');
            const model = roleAttribute === 'assistant' || roleAttribute === 'model' || !!markdown;
            if (!user && !model) continue;
            const content = markdown || node.querySelector('.ds-message__content, .message-content') || node;
            const value = text(content);
            if (!value) continue;
            conversation.push({ role: user ? 'user' : 'model', text: value,
                ...(user ? {} : { html: content.innerHTML }) });
        }

        const titleElement = document.querySelector('[data-testid="conversation-title"], [aria-current="page"]');
        const title = text(titleElement) || document.title.replace(/\\s*[-|]\\s*DeepSeek.*$/i, '').trim();
        return {
            title: title && title !== 'DeepSeek' ? title : 'Untitled Conversation',
            timestamp: new Date().toISOString(),
            conversation,
            diagnostics: { candidates: nodes.length, capturedTurns: conversation.length }
        };
    } catch (error) {
        return { title: 'Error', timestamp: new Date().toISOString(), conversation: [],
            error: String(error) };
    }
})()
`;

export const TITLE_EXTRACTION_SCRIPT = `
(() => {
    const titleElement = document.querySelector('[data-testid="conversation-title"], [aria-current="page"]');
    const title = (titleElement?.innerText || titleElement?.textContent ||
        document.title.replace(/\\s*[-|]\\s*DeepSeek.*$/i, '')).trim();
    return title === 'DeepSeek' ? '' : title;
})()
`;
