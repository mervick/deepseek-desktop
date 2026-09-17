/**
 * DeepSeek DOM Selectors Module
 *
 * Centralizes all CSS selectors for interacting with the DeepSeek website.
 * Designed for easy updates when chat.deepseek.com changes its DOM structure.
 *
 * MAINTENANCE GUIDE:
 * - When DeepSeek changes, update selectors here
 * - Run E2E tests to verify: npm run test:e2e
 * - Update DEEPSEEK_SELECTORS_LAST_VERIFIED after manual verification
 *
 * @module deepseekSelectors
 */

/**
 * Version of the selector configuration.
 * Increment when making breaking changes to selector structure.
 */
export const DEEPSEEK_SELECTORS_VERSION = '1.0.0';

/**
 * Date when selectors were last manually verified against chat.deepseek.com.
 * Update this after confirming selectors work on the live site.
 */
export const DEEPSEEK_SELECTORS_LAST_VERIFIED = '2025-12-23';

/**
 * DeepSeek selector configuration organized by component.
 * Each component has:
 * - selectors: Array of CSS selectors in priority order (first match wins)
 * - description: Human-readable description for debugging
 * - Additional component-specific properties
 */
export const DeepSeekSelectors = {
    /**
     * Domain for matching DeepSeek view URLs.
     */
    domain: 'chat.deepseek.com',

    /**
     * Legacy domain that may still appear in some URLs.
     */
    legacyDomain: 'deepseek.com',

    /**
     * Chat input editor configuration.
     * DeepSeek uses Quill.js for the rich text editor.
     */
    editor: {
        /**
         * CSS selectors for finding the chat input editor.
         * Ordered by specificity - first match wins.
         */
        selectors: [
            'textarea[placeholder*="message" i]',
            'textarea',
            '[contenteditable="true"][role="textbox"]',
        ] as const,

        /**
         * CSS class that indicates the editor is empty/blank.
         * Must be removed when injecting text.
         */
        blankClass: 'ql-blank',

        /**
         * Description for logging/debugging.
         */
        description: 'Quill-based rich text editor',
    },

    /**
     * Submit/send button configuration.
     */
    submitButton: {
        /**
         * CSS selectors for finding the send message button.
         * Ordered by specificity - first match wins.
         */
        selectors: ['button[aria-label="Send"]', 'button[type="submit"]', 'button.send-button'] as const,

        /**
         * Description for logging/debugging.
         */
        description: 'Send message button',
    },

    /**
     * Microphone button configuration.
     * Used for speech dictation / voice input.
     */
    microphoneButton: {
        /**
         * CSS selectors for finding the microphone button.
         * Ordered by specificity - first match wins.
         */
        selectors: ['button[aria-label*="microphone" i]', 'button[aria-label*="voice" i]'] as const,

        /**
         * Description for logging/debugging.
         */
        description: 'Speech dictation microphone button',
    },

    /**
     * Error toast / snackbar configuration.
     * Used to detect permission errors displayed to the user.
     */
    errorToast: {
        /**
         * CSS selectors for finding error toast messages.
         * DeepSeek uses Angular Material snackbar for toasts.
         */
        selectors: ['[matsnackbarlabel]', '.mat-mdc-snack-bar-label', '.mdc-snackbar__label'] as const,

        /**
         * Error message text for microphone permission denied.
         * Used to detect if microphone access failed.
         */
        microphoneErrorText: 'Unable to access the microphone',

        /**
         * Description for logging/debugging.
         */
        description: 'Error toast / snackbar message',
    },

    /**
     * Timing configuration for DOM interactions.
     */
    timing: {
        /**
         * Delay in milliseconds before clicking submit after text injection.
         * Allows Angular/Quill to process the text injection.
         */
        submitDelayMs: 500,

        /**
         * Description for logging/debugging.
         */
        description: 'Delay timings for DOM interactions',
    },

    /**
     * Conversation title configuration.
     * Used for determining the default filename for exports.
     */
    conversationTitle: {
        /**
         * CSS selectors for finding the conversation title.
         */
        selectors: ['[data-test-id="conversation-title"]', '.conversation-title', 'span.conversation-title'] as const,

        /**
         * Description for logging/debugging.
         */
        description: 'Conversation title element',
    },
} as const;

/**
 * Type for the DeepSeekSelectors configuration object.
 */
export type DeepSeekSelectorsConfig = typeof DeepSeekSelectors;

/**
 * Find the first matching element from an array of selectors.
 * Logs which selector matched for debugging.
 *
 * @param document - The document to search in
 * @param selectors - Array of CSS selectors to try
 * @param componentName - Name of the component for logging (e.g., 'editor', 'submitButton')
 * @param logger - Optional logger function (defaults to console.log)
 * @returns The first matching element or null
 */
export function findDeepSeekElement(
    document: Document,
    selectors: readonly string[],
    componentName: string,
    logger?: (message: string) => void
): Element | null {
    const log = logger || console.log;

    for (let i = 0; i < selectors.length; i++) {
        const selector = selectors[i];
        if (!selector) {
            continue;
        }
        const element = document.querySelector(selector);

        if (element) {
            if (i === 0) {
                log(`[DeepSeekSelectors] ${componentName}: Found with primary selector`);
            } else {
                log(`[DeepSeekSelectors] ${componentName}: Found with fallback selector #${i + 1}: "${selector}"`);
            }
            return element;
        }
    }

    log(`[DeepSeekSelectors] ${componentName}: No matching element found`);
    return null;
}

/**
 * Check if a URL belongs to a DeepSeek domain.
 * Uses proper URL parsing to prevent substring bypass attacks (CWE-20).
 *
 * @param url - URL string to check
 * @returns True if the URL is for DeepSeek
 */
export function isDeepSeekDomain(url: string): boolean {
    try {
        const hostname = new URL(url).hostname;
        return (
            hostname === DeepSeekSelectors.domain ||
            hostname.endsWith(`.${DeepSeekSelectors.domain}`) ||
            hostname === DeepSeekSelectors.legacyDomain ||
            hostname.endsWith(`.${DeepSeekSelectors.legacyDomain}`)
        );
    } catch {
        // Invalid URL
        return false;
    }
}

// Re-export individual selector arrays for backwards compatibility
export const DEEPSEEK_DOMAIN = DeepSeekSelectors.domain;
export const DEEPSEEK_EDITOR_SELECTORS = DeepSeekSelectors.editor.selectors;
export const DEEPSEEK_SUBMIT_BUTTON_SELECTORS = DeepSeekSelectors.submitButton.selectors;
export const DEEPSEEK_EDITOR_BLANK_CLASS = DeepSeekSelectors.editor.blankClass;
export const DEEPSEEK_SUBMIT_DELAY_MS = DeepSeekSelectors.timing.submitDelayMs;
export const DEEPSEEK_ERROR_TOAST_SELECTORS = DeepSeekSelectors.errorToast.selectors;
export const DEEPSEEK_MICROPHONE_ERROR_TEXT = DeepSeekSelectors.errorToast.microphoneErrorText;
export const DEEPSEEK_CONVERSATION_TITLE_SELECTORS = DeepSeekSelectors.conversationTitle.selectors;
