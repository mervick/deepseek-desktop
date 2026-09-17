import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dialog, type WebContents } from 'electron';
import * as fs from 'fs/promises';
import ExportManager from '../../../../src/main/managers/exportManager';

// Mock electron-log
vi.mock('electron-log', () => ({
    default: {
        transports: {
            file: { level: 'info' },
        },
        scope: vi.fn().mockReturnThis(),
        log: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}));

// Mock electron
vi.mock('electron', () => ({
    app: {
        getPath: vi.fn().mockReturnValue('/mock/downloads'),
    },
    dialog: {
        showSaveDialog: vi.fn().mockResolvedValue({ canceled: true }),
    },
    BrowserWindow: vi.fn(),
}));

// Mock turndown - use class constructor for proper instantiation
vi.mock('turndown', () => ({
    default: class MockTurndownService {
        use() {}
        addRule() {}
        turndown() {
            return 'mocked markdown';
        }
    },
}));

vi.mock('turndown-plugin-gfm', () => ({
    gfm: {},
}));

vi.mock('marked', () => ({
    marked: {
        parse: vi.fn().mockReturnValue('<p>mocked html</p>'),
    },
}));

vi.mock('fs/promises', () => ({ writeFile: vi.fn().mockResolvedValue(undefined) }));

describe('Markdown export from a top-level DeepSeek tab', () => {
    beforeEach(() => vi.clearAllMocks());

    it('saves the active conversation and notifies the React shell', async () => {
        vi.mocked(dialog.showSaveDialog).mockResolvedValue({ canceled: false, filePath: '/tmp/deepseek-test.md' });
        const target = {
            getURL: () => 'https://chat.deepseek.com/chat/123',
            mainFrame: {
                executeJavaScript: vi.fn().mockResolvedValue({
                    title: 'Test chat',
                    timestamp: '2026-09-17T00:00:00.000Z',
                    conversation: [
                        { role: 'user', text: 'Question' },
                        {
                            role: 'model',
                            text: 'Answer',
                            html: '<p>Answer</p>',
                            reasoning: 'Reasoning details',
                            reasoningHtml: '<p>Reasoning details</p>',
                        },
                    ],
                }),
            },
        } as unknown as WebContents;
        const shell = { send: vi.fn() } as unknown as WebContents;

        await new ExportManager().exportToMarkdown(target, shell);

        expect(target.mainFrame.executeJavaScript).toHaveBeenCalledOnce();
        expect(fs.writeFile).toHaveBeenCalledWith('/tmp/deepseek-test.md', expect.stringContaining('## DeepSeek'));
        expect(vi.mocked(fs.writeFile).mock.calls[0]?.[1]).toContain('## You\n\nQuestion');
        expect(vi.mocked(fs.writeFile).mock.calls[0]?.[1]).toContain('### Reasoning\n\nmocked markdown');
        expect(vi.mocked(fs.writeFile).mock.calls[0]?.[1]).toContain('### Answer\n\nmocked markdown');
        expect(shell.send).toHaveBeenCalledWith('toast:show', {
            message: 'Chat exported to Markdown',
            type: 'success',
        });
    });

    it('does not save an empty or unrecognized conversation', async () => {
        const target = {
            getURL: () => 'https://chat.deepseek.com/',
            mainFrame: {
                executeJavaScript: vi.fn().mockResolvedValue({
                    title: 'DeepSeek',
                    timestamp: '2026-09-17T00:00:00.000Z',
                    conversation: [],
                }),
            },
        } as unknown as WebContents;
        const shell = { send: vi.fn() } as unknown as WebContents;

        await new ExportManager().exportToMarkdown(target, shell);

        expect(dialog.showSaveDialog).not.toHaveBeenCalled();
        expect(fs.writeFile).not.toHaveBeenCalled();
        expect(shell.send).toHaveBeenCalledWith('toast:show', {
            message: 'No DeepSeek messages found to export',
            type: 'error',
        });
    });
});

describe('ExportManager URL Validation Security', () => {
    let exportManager: ExportManager;

    beforeEach(() => {
        exportManager = new ExportManager();
    });

    /**
     * These tests verify the fix for CodeQL alert:
     * "Incomplete URL substring sanitization - 'chat.deepseek.com' can be anywhere in the URL"
     *
     * The vulnerability was that using `.includes('chat.deepseek.com')` allowed bypass attacks like:
     * - attacker.com/chat.deepseek.com (path injection)
     * - chat.deepseek.com.attacker.com (subdomain prefix)
     * - evilchat.deepseek.com (no dot separation)
     */
    describe('isAllowedGeminiUrl (security)', () => {
        // Access private method for testing
        const isAllowedUrl = (url: string): boolean => {
            return (exportManager as any).isAllowedGeminiUrl(url);
        };

        describe('should ALLOW legitimate Gemini URLs', () => {
            it('allows exact chat.deepseek.com domain', () => {
                expect(isAllowedUrl('https://chat.deepseek.com/')).toBe(true);
                expect(isAllowedUrl('https://chat.deepseek.com/app')).toBe(true);
                expect(isAllowedUrl('https://chat.deepseek.com/chat/abc123')).toBe(true);
            });

            it('allows chat.deepseek.com subdomains', () => {
                expect(isAllowedUrl('https://api.chat.deepseek.com/')).toBe(true);
                expect(isAllowedUrl('https://staging.chat.deepseek.com/')).toBe(true);
                expect(isAllowedUrl('https://deep.sub.chat.deepseek.com/')).toBe(true);
            });

            it('allows exact chat.deepseek.com domain', () => {
                expect(isAllowedUrl('https://chat.deepseek.com/')).toBe(true);
                expect(isAllowedUrl('https://chat.deepseek.com/prompts')).toBe(true);
            });

            it('allows chat.deepseek.com subdomains', () => {
                expect(isAllowedUrl('https://api.chat.deepseek.com/')).toBe(true);
            });

            it('handles case insensitivity', () => {
                expect(isAllowedUrl('https://CHAT.DEEPSEEK.COM/')).toBe(true);
                expect(isAllowedUrl('https://Chat.DeepSeek.Com/app')).toBe(true);
            });
        });

        describe('should REJECT bypass attempts (security critical)', () => {
            it('rejects domain in URL path (path injection)', () => {
                // attacker.com/chat.deepseek.com should NOT be allowed
                expect(isAllowedUrl('https://attacker.com/chat.deepseek.com')).toBe(false);
                expect(isAllowedUrl('https://evil.com/fake/chat.deepseek.com/app')).toBe(false);
            });

            it('rejects domain as subdomain prefix (subdomain injection)', () => {
                // chat.deepseek.com.attacker.com should NOT be allowed
                expect(isAllowedUrl('https://chat.deepseek.com.attacker.com/')).toBe(false);
                expect(isAllowedUrl('https://chat.deepseek.com.evil.org/')).toBe(false);
            });

            it('rejects domains without dot separation (suffix attack)', () => {
                // evilchat.deepseek.com should NOT be allowed
                expect(isAllowedUrl('https://deepseek.com.evil.example/')).toBe(false);
                expect(isAllowedUrl('https://deepseek.com.attacker.test/')).toBe(false);
                expect(isAllowedUrl('https://notdeepseek.com/')).toBe(false);
            });

            it('rejects similar-looking but different domains', () => {
                expect(isAllowedUrl('https://gemini-deepseek.com/')).toBe(false);
                expect(isAllowedUrl('https://gemini.google.org/')).toBe(false);
                expect(isAllowedUrl('https://deepseek.org/')).toBe(false);
                expect(isAllowedUrl('https://gemini.com/')).toBe(false);
            });

            it('rejects domain in query string', () => {
                expect(isAllowedUrl('https://attacker.com/?redirect=chat.deepseek.com')).toBe(false);
            });

            it('rejects domain in fragment', () => {
                expect(isAllowedUrl('https://attacker.com/#chat.deepseek.com')).toBe(false);
            });

            it('rejects domain in username/password', () => {
                expect(isAllowedUrl('https://chat.deepseek.com@attacker.com/')).toBe(false);
            });
        });

        describe('should handle edge cases safely', () => {
            it('rejects invalid URLs', () => {
                expect(isAllowedUrl('not-a-url')).toBe(false);
                expect(isAllowedUrl('')).toBe(false);
                expect(isAllowedUrl('javascript:alert(1)')).toBe(false);
            });

            it('rejects file:// protocol', () => {
                expect(isAllowedUrl('file:///C:/chat.deepseek.com')).toBe(false);
            });

            it('handles URLs with ports', () => {
                expect(isAllowedUrl('https://chat.deepseek.com:443/')).toBe(true);
                expect(isAllowedUrl('https://chat.deepseek.com:8080/')).toBe(true);
            });
        });
    });
});
