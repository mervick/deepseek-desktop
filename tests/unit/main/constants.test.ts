/**
 * Unit tests for constants utility.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
    INTERNAL_DOMAINS,
    OAUTH_DOMAINS,
    GOOGLE_ACCOUNTS_URL,
    AUTH_WINDOW_CONFIG,
    isInternalDomain,
    isOAuthDomain,
    getDevUrl,
    DEV_SERVER_URL,
    DEV_SERVER_PORT,
    MAIN_WINDOW_CONFIG,
    OPTIONS_WINDOW_CONFIG,
    QUICK_CHAT_WINDOW_CONFIG,
    QUICK_CHAT_WIDTH,
    QUICK_CHAT_HEIGHT,
    BASE_WINDOW_CONFIG,
    getBaseWebPreferences,
    GITHUB_REPO_URL,
    GITHUB_ISSUES_URL,
    GITHUB_LICENSE_URL,
    GITHUB_DISCLAIMER_URL,
    GOOGLE_TOS_URL,
    GOOGLE_GENAI_TERMS_URL,
    GOOGLE_SIGNIN_URL,
    DEEPSEEK_APP_URL,
} from '../../../src/main/utils/constants';

describe('Constants', () => {
    describe('INTERNAL_DOMAINS', () => {
        it('includes chat.deepseek.com', () => {
            expect(INTERNAL_DOMAINS).toContain('chat.deepseek.com');
        });

        it('is an array', () => {
            expect(Array.isArray(INTERNAL_DOMAINS)).toBe(true);
        });
    });

    describe('OAUTH_DOMAINS', () => {
        it('includes chat.deepseek.com', () => {
            expect(OAUTH_DOMAINS).toContain('chat.deepseek.com');
        });

        it('does not include unrelated OAuth domains', () => {
            expect(OAUTH_DOMAINS).not.toContain('chat.deepseek.com/login');
        });

        it('is an array', () => {
            expect(Array.isArray(OAUTH_DOMAINS)).toBe(true);
        });
    });

    describe('GOOGLE_ACCOUNTS_URL', () => {
        it('is the correct URL', () => {
            expect(GOOGLE_ACCOUNTS_URL).toBe('https://chat.deepseek.com/login');
        });
    });

    describe('AUTH_WINDOW_CONFIG', () => {
        const config = AUTH_WINDOW_CONFIG as any;

        it('has correct dimensions', () => {
            expect(config.width).toBe(500);
            expect(config.height).toBe(700);
        });

        it('has correct title', () => {
            expect(config.title).toBe('Sign in to DeepSeek');
        });

        it('has autoHideMenuBar enabled', () => {
            expect(config.autoHideMenuBar).toBe(true);
        });

        it('has secure webPreferences', () => {
            expect(config.webPreferences.contextIsolation).toBe(true);
            expect(config.webPreferences.nodeIntegration).toBe(false);
        });

        it('uses shared session (no partition) for cookie-based auth', () => {
            // Critical security & functionality test:
            // The auth window must NOT have a session partition, so it shares
            // the default session with the main window. This allows auth cookies
            // set during DeepSeek sign-in to be immediately available to the main
            // window when it reloads after auth completes.
            expect(config.webPreferences.partition).toBeUndefined();
        });
    });

    describe('URL constants', () => {
        it('has correct GITHUB_REPO_URL', () => {
            expect(GITHUB_REPO_URL).toBe('https://github.com/mervick/deepseek-desktop');
        });

        it('has correct GITHUB_ISSUES_URL', () => {
            expect(GITHUB_ISSUES_URL).toContain(GITHUB_REPO_URL);
            expect(GITHUB_ISSUES_URL).toContain('/issues');
        });

        it('has correct GITHUB_LICENSE_URL', () => {
            expect(GITHUB_LICENSE_URL).toContain(GITHUB_REPO_URL);
            expect(GITHUB_LICENSE_URL).toContain('/LICENSE');
        });

        it('has correct GITHUB_DISCLAIMER_URL', () => {
            expect(GITHUB_DISCLAIMER_URL).toContain(GITHUB_REPO_URL);
            expect(GITHUB_DISCLAIMER_URL).toContain('/DISCLAIMER');
        });

        it('has correct GOOGLE_TOS_URL', () => {
            expect(GOOGLE_TOS_URL).toBe('https://cdn.deepseek.com/policies/terms');
        });

        it('has correct GOOGLE_GENAI_TERMS_URL', () => {
            expect(GOOGLE_GENAI_TERMS_URL).toBe('https://cdn.deepseek.com/policies/privacy');
        });

        it('has correct GOOGLE_SIGNIN_URL', () => {
            expect(GOOGLE_SIGNIN_URL).toContain(GOOGLE_ACCOUNTS_URL);
        });

        it('has correct DEEPSEEK_APP_URL', () => {
            expect(DEEPSEEK_APP_URL).toBe('https://chat.deepseek.com/');
        });
    });

    describe('Window Config Constants', () => {
        it('getBaseWebPreferences returns security settings', () => {
            const prefs = getBaseWebPreferences();
            expect(prefs!.contextIsolation).toBe(true);
            expect(prefs!.nodeIntegration).toBe(false);
            expect(prefs!.sandbox).toBe(true);
        });

        it('BASE_WINDOW_CONFIG has show:false to prevent flash', () => {
            expect(BASE_WINDOW_CONFIG.show).toBe(false);
            expect(BASE_WINDOW_CONFIG.webPreferences).toBeDefined();
        });

        it('MAIN_WINDOW_CONFIG has correct dimensions', () => {
            expect(MAIN_WINDOW_CONFIG.width).toBe(1200);
            expect(MAIN_WINDOW_CONFIG.height).toBe(800);
            expect(MAIN_WINDOW_CONFIG.minWidth).toBe(350);
            expect(MAIN_WINDOW_CONFIG.minHeight).toBe(600);
            expect(MAIN_WINDOW_CONFIG.frame).toBe(false);
        });

        it('OPTIONS_WINDOW_CONFIG has correct dimensions', () => {
            expect(OPTIONS_WINDOW_CONFIG.width).toBe(600);
            expect(OPTIONS_WINDOW_CONFIG.height).toBe(400);
            expect(OPTIONS_WINDOW_CONFIG.maximizable).toBe(false);
        });

        it('QUICK_CHAT constants are correct', () => {
            expect(QUICK_CHAT_WIDTH).toBe(600);
            expect(QUICK_CHAT_HEIGHT).toBe(80);
        });

        it('QUICK_CHAT_WINDOW_CONFIG has transparency settings', () => {
            expect(QUICK_CHAT_WINDOW_CONFIG.transparent).toBe(true);
            expect(QUICK_CHAT_WINDOW_CONFIG.alwaysOnTop).toBe(true);
            expect(QUICK_CHAT_WINDOW_CONFIG.skipTaskbar).toBe(true);
            expect(QUICK_CHAT_WINDOW_CONFIG.backgroundColor).toBeUndefined();
        });
    });

    describe('Dev Server Constants', () => {
        it('has correct DEV_SERVER_URL', () => {
            expect(DEV_SERVER_URL).toBe('http://localhost:1420');
        });

        it('has correct DEV_SERVER_PORT', () => {
            expect(DEV_SERVER_PORT).toBe(1420);
        });
    });
});

describe('isInternalDomain', () => {
    it('returns true for chat.deepseek.com', () => {
        expect(isInternalDomain('chat.deepseek.com')).toBe(true);
    });

    it('returns true for subdomain of chat.deepseek.com', () => {
        expect(isInternalDomain('share.chat.deepseek.com')).toBe(true);
    });

    it('returns true for the DeepSeek root domain', () => {
        expect(isInternalDomain('deepseek.com')).toBe(true);
    });

    it('returns false for external domains', () => {
        expect(isInternalDomain('example.com')).toBe(false);
    });

    it('returns false for partial matches', () => {
        expect(isInternalDomain('notdeepseek.com')).toBe(false);
    });
});

describe('isOAuthDomain', () => {
    it('returns true for subdomain of OAuth domain', () => {
        expect(isOAuthDomain('sub.chat.deepseek.com')).toBe(true);
    });

    it('returns true for chat.deepseek.com', () => {
        expect(isOAuthDomain('chat.deepseek.com')).toBe(true);
    });

    it('returns false for external domains', () => {
        expect(isOAuthDomain('deepseek.com')).toBe(false);
        expect(isOAuthDomain('example.com')).toBe(false);
    });

    it('returns false for partial matches', () => {
        expect(isOAuthDomain('fakechat.deepseek.com')).toBe(false);
    });
});

describe('getTitleBarStyle', () => {
    const originalPlatform = process.platform;

    afterEach(() => {
        Object.defineProperty(process, 'platform', {
            value: originalPlatform,
            configurable: true,
            writable: true,
        });
    });

    it('returns "hidden" on macOS (darwin)', async () => {
        Object.defineProperty(process, 'platform', {
            value: 'darwin',
            configurable: true,
            writable: true,
        });

        vi.resetModules();
        const { getTitleBarStyle: getTitleBarStyleMocked } = await import('../../../src/main/utils/constants');
        expect(getTitleBarStyleMocked()).toBe('hidden');
    });

    it('returns undefined on Windows (win32)', async () => {
        Object.defineProperty(process, 'platform', {
            value: 'win32',
            configurable: true,
            writable: true,
        });

        vi.resetModules();
        const { getTitleBarStyle: getTitleBarStyleMocked } = await import('../../../src/main/utils/constants');
        expect(getTitleBarStyleMocked()).toBeUndefined();
    });

    it('returns undefined on Linux', async () => {
        Object.defineProperty(process, 'platform', {
            value: 'linux',
            configurable: true,
            writable: true,
        });

        vi.resetModules();
        const { getTitleBarStyle: getTitleBarStyleMocked } = await import('../../../src/main/utils/constants');
        expect(getTitleBarStyleMocked()).toBeUndefined();
    });
});

describe('getDevUrl', () => {
    it('returns base URL when no page is provided', () => {
        expect(getDevUrl()).toBe('http://localhost:1420');
    });

    it('returns base URL with empty string', () => {
        expect(getDevUrl('')).toBe('http://localhost:1420');
    });

    it('returns URL with page when page is provided', () => {
        expect(getDevUrl('src/windows/options/options.html')).toBe(
            'http://localhost:1420/src/windows/options/options.html'
        );
    });

    it('returns URL with quickchat.html', () => {
        expect(getDevUrl('src/windows/quickchat/quickchat.html')).toBe(
            'http://localhost:1420/src/windows/quickchat/quickchat.html'
        );
    });
});
