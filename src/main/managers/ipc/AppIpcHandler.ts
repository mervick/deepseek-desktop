/**
 * App IPC Handler.
 *
 * Handles application-level IPC channels for opening options windows
 * and DeepSeek sign-in authentication.
 *
 * @module ipc/AppIpcHandler
 */

import { app, ipcMain, session } from 'electron';
import { BaseIpcHandler } from './BaseIpcHandler';
import { IPC_CHANNELS, GOOGLE_ACCOUNTS_URL } from '../../utils/constants';

/**
 * Handler for application-level IPC operations.
 *
 * Currently handles:
 * - `open-options` - Opens the options window, optionally to a specific tab
 * - `open-google-signin` - Opens DeepSeek sign-in authentication window
 */
export class AppIpcHandler extends BaseIpcHandler {
    /**
     * Register app IPC handlers with ipcMain.
     */
    register(): void {
        // Open options window (optionally to a specific tab)
        ipcMain.on(IPC_CHANNELS.OPEN_OPTIONS, (_event, tab?: 'settings' | 'about') => {
            try {
                this.deps.windowManager.createOptionsWindow(tab);
            } catch (error) {
                this.logger.error('Error opening options window:', error);
            }
        });

        // Open DeepSeek sign-in using WindowManager's createAuthWindow
        ipcMain.handle(IPC_CHANNELS.OPEN_GOOGLE_SIGNIN, async (): Promise<void> => {
            try {
                const authWindow = this.deps.windowManager.createAuthWindow(GOOGLE_ACCOUNTS_URL);

                // Return a promise that resolves when window is closed
                return new Promise((resolve) => {
                    authWindow.on('closed', () => resolve());
                });
            } catch (error) {
                this.logger.error('Error opening DeepSeek sign-in:', error);
                throw error;
            }
        });

        ipcMain.handle(
            IPC_CHANNELS.IMPORT_DEEPSEEK_COOKIES,
            async (event, rawCookieHeader: unknown): Promise<{ success: boolean; error?: string }> => {
                const senderWindow = this.getWindowFromEvent(event);
                if (!senderWindow || typeof rawCookieHeader !== 'string') {
                    return { success: false, error: 'Invalid cookie input.' };
                }

                const cookieHeader = rawCookieHeader.replace(/^cookie:\s*/i, '').trim();
                const parts = cookieHeader
                    .split(';')
                    .map((part) => part.trim())
                    .filter(Boolean);
                const cookies = parts.map((part) => {
                    const separatorIndex = part.indexOf('=');
                    const name = separatorIndex >= 0 ? part.slice(0, separatorIndex).trim() : '';
                    const value = separatorIndex >= 0 ? part.slice(separatorIndex + 1).trim() : '';
                    return { name, value };
                });

                if (
                    cookies.length === 0 ||
                    cookies.some(({ name, value }) => !/^[\w!#$%&'*+.^`|~-]+$/.test(name) || value.length === 0)
                ) {
                    return { success: false, error: 'Paste a valid Cookie header, for example: name=value; name2=value2' };
                }

                try {
                    const activeContents = this.deps.windowManager.getActiveDeepSeekContents();
                    const targetSession = activeContents?.session ?? session.defaultSession;
                    for (const { name, value } of cookies) {
                        await targetSession.cookies.set({
                            url: 'https://chat.deepseek.com/',
                            name,
                            value,
                            path: '/',
                            secure: true,
                            // Cookie headers do not include the HttpOnly flag. Setting the
                            // imported value as HttpOnly allows replacing an existing
                            // HttpOnly cookie without exposing it to page JavaScript.
                            httpOnly: true,
                        });
                    }

                    if (activeContents && !activeContents.isDestroyed()) activeContents.reload();
                    return { success: true };
                } catch (error) {
                    this.logger.error('Failed to import DeepSeek cookies:', error);
                    const message = error instanceof Error ? error.message : 'unknown error';
                    return { success: false, error: `Could not save cookies: ${message}` };
                }
            }
        );

        ipcMain.handle(IPC_CHANNELS.APP_RESTART, async (): Promise<void> => {
            try {
                app.relaunch({ args: process.argv.slice(1) });
                app.exit(0);
            } catch (error) {
                this.logger.error('Error restarting app:', error);
                throw error;
            }
        });

        // Quit application
        ipcMain.on(IPC_CHANNELS.APP_QUIT, () => {
            try {
                app.quit();
            } catch (error) {
                this.logger.error('Error quitting app:', error);
            }
        });
    }

    /** Unregister all IPC handlers. */
    unregister(): void {
        ipcMain.removeAllListeners(IPC_CHANNELS.OPEN_OPTIONS);
        ipcMain.removeHandler(IPC_CHANNELS.OPEN_GOOGLE_SIGNIN);
        ipcMain.removeHandler(IPC_CHANNELS.IMPORT_DEEPSEEK_COOKIES);
        ipcMain.removeHandler(IPC_CHANNELS.APP_RESTART);
        ipcMain.removeAllListeners(IPC_CHANNELS.APP_QUIT);
    }
}
