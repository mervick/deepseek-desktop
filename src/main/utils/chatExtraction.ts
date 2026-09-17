/** Scripts executed only in an allowlisted DeepSeek webContents. */
export const CHAT_EXTRACTION_SCRIPT = `
(() => {
    try {
        const text = (element) => (element?.innerText || element?.textContent || '').trim();
        const withoutControls = (element) => {
            const copy = element.cloneNode(true);
            copy.querySelectorAll('button, [role="button"]').forEach((control) => control.remove());
            return copy;
        };
        const conversationRoot = document.querySelector('[data-conversation-scroll], .ds-virtual-list-visible-items');
        const selectors = '[data-role="user"], [data-role="assistant"], [data-message-role="user"], [data-message-role="assistant"], .ds-message, [data-testid="chat-message"]';
        const nodes = Array.from(document.querySelectorAll(selectors));
        const conversation = [];

        // Current DeepSeek renders the conversation as virtual-list rows. Use
        // semantic DS markers rather than hashed CSS-module classes: user text
        // is in ds-collapsible-text and the final answer is in
        // ds-assistant-message-main-content.
        if (conversationRoot) {
            const currentNodes = Array.from(conversationRoot.querySelectorAll('[data-virtual-list-item-key]'));

            for (const node of currentNodes) {
                const userContent = node.querySelector('.ds-collapsible-text');
                const assistantContent = node.querySelector('.ds-assistant-message-main-content');
                const reasoningContent = node.querySelector('.ds-think-content .ds-markdown');
                const isUser = !!userContent;
                const isAssistant = !!assistantContent;
                if ((!isUser && !isAssistant) || (isUser && isAssistant)) continue;

                const content = isUser ? userContent : assistantContent;
                const cleanContent = content ? withoutControls(content) : null;
                const cleanReasoning = reasoningContent ? withoutControls(reasoningContent) : null;
                const value = cleanContent ? text(cleanContent) : '';
                const reasoning = cleanReasoning ? text(cleanReasoning) : '';
                if (!value && !reasoning) continue;
                conversation.push({
                    role: isUser ? 'user' : 'model',
                    text: value || reasoning,
                    ...(!isUser && value ? { html: cleanContent.innerHTML } : {}),
                    ...(!isUser && reasoning ? { reasoning, reasoningHtml: cleanReasoning.innerHTML } : {}),
                });
            }
        }

        if (conversation.length === 0) for (const node of nodes) {
            // A message container can contain nested role-marked elements; export each turn once.
            if (nodes.some((other) => other !== node && node.contains(other))) continue;
            const roleAttribute = node.getAttribute('data-role') || node.getAttribute('data-message-role');
            const markdown = node.querySelector('.ds-markdown, .markdown, [data-testid="message-content"]');
            const user = roleAttribute === 'user' || node.matches('.ds-user-message, .user-message, [data-testid="user-message"]');
            const model = roleAttribute === 'assistant' || roleAttribute === 'model' || !!markdown;
            if (!user && !model) continue;
            const content = markdown || node.querySelector('.ds-message__content, .message-content') || node;
            const cleanContent = withoutControls(content);
            const value = text(cleanContent);
            if (!value) continue;
            conversation.push({ role: user ? 'user' : 'model', text: value,
                ...(user ? {} : { html: cleanContent.innerHTML }) });
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
