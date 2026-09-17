import { randomUUID } from 'node:crypto';

import { ipcMain } from 'electron';

import { BaseIpcHandler } from './BaseIpcHandler';
import { IPC_CHANNELS, isDeepSeekDomain } from '../../utils/constants';
import type { DeepSeekReadyPayload } from '../../../shared/types/tabs';
import { InjectionScriptBuilder, InjectionResult } from '../../utils/injectionScript';

interface PendingQuickChatRequest {
    requestId: string;
    targetTabId: string;
    text: string;
    createdAt: number;
}

const REQUEST_TTL_MS = 2 * 60 * 1000;

function isDeepSeekReadyPayload(payload: unknown): payload is DeepSeekReadyPayload {
    if (typeof payload !== 'object' || payload === null) {
        return false;
    }

    const candidate = payload as Partial<DeepSeekReadyPayload>;
    return (
        typeof candidate.requestId === 'string' &&
        candidate.requestId.trim().length > 0 &&
        typeof candidate.targetTabId === 'string' &&
        candidate.targetTabId.trim().length > 0
    );
}

export class QuickChatIpcHandler extends BaseIpcHandler {
    private readonly pendingRequests = new Map<string, PendingQuickChatRequest>();
    private readonly latestRequestByTab = new Map<string, string>();

    private _clearLatestRequestByTabIfMatches(tabId: string, requestId: string): void {
        const latestRequestId = this.latestRequestByTab.get(tabId);
        if (latestRequestId === requestId) {
            this.latestRequestByTab.delete(tabId);
        }
    }

    register(): void {
        ipcMain.on(IPC_CHANNELS.QUICK_CHAT_SUBMIT, (_event, text: string) => {
            this._handleSubmit(text);
        });

        ipcMain.on(IPC_CHANNELS.DEEPSEEK_READY, async (_event, payload: unknown) => {
            await this._handleDeepSeekReady(payload);
        });

        ipcMain.on(IPC_CHANNELS.QUICK_CHAT_HIDE, () => {
            this._handleHide();
        });

        ipcMain.on(IPC_CHANNELS.QUICK_CHAT_CANCEL, () => {
            this._handleCancel();
        });
    }

    private _cleanupExpiredRequests(): void {
        const now = Date.now();
        for (const [requestId, request] of this.pendingRequests.entries()) {
            if (now - request.createdAt > REQUEST_TTL_MS) {
                this.pendingRequests.delete(requestId);
                this._clearLatestRequestByTabIfMatches(request.targetTabId, requestId);
            }
        }
    }

    private _handleSubmit(text: string): void {
        try {
            this._cleanupExpiredRequests();
            this.logger.log('Quick Chat submit received:', text.substring(0, 50));

            this.deps.windowManager.hideQuickChat();
            this.deps.windowManager.focusMainWindow();

            const mainWindow = this.deps.windowManager.getMainWindow();
            if (!mainWindow) {
                this.logger.error('Cannot navigate: main window not found');
                return;
            }

            const requestId = randomUUID();
            const targetTabId = randomUUID();

            const request: PendingQuickChatRequest = {
                requestId,
                targetTabId,
                text,
                createdAt: Date.now(),
            };

            this.pendingRequests.set(requestId, request);
            this.latestRequestByTab.set(targetTabId, requestId);

            this.logger.log('Quick Chat navigation requested:', {
                requestId,
                targetTabId,
                activeTabId: mainWindow.webContents.id,
                windowId: mainWindow.id,
            });

            mainWindow.webContents.send(IPC_CHANNELS.DEEPSEEK_NAVIGATE, {
                requestId,
                targetTabId,
                text,
            });
        } catch (error) {
            this.handleError('handling quick chat submit', error);
        }
    }

    private async _handleDeepSeekReady(payload: unknown): Promise<void> {
        try {
            this._cleanupExpiredRequests();

            if (!isDeepSeekReadyPayload(payload)) {
                this.logger.warn('Ignoring invalid deepseek:ready payload');
                return;
            }

            const e2eBuffer = (
                global as typeof globalThis & {
                    __e2eDeepSeekReadyBuffer?: { enabled?: boolean; pending?: DeepSeekReadyPayload[] };
                }
            ).__e2eDeepSeekReadyBuffer;
            const shouldBuffer = process.argv.includes('--e2e-disable-auto-submit') && e2eBuffer?.enabled;

            this.logger.log('DeepSeek ready received:', payload);

            const request = this.pendingRequests.get(payload.requestId);
            if (!request) {
                this.logger.warn('Ignoring stale deepseek:ready payload with unknown requestId');
                return;
            }

            if (request.targetTabId !== payload.targetTabId) {
                this.logger.warn('Ignoring deepseek:ready payload with mismatched targetTabId');
                return;
            }

            const latestRequestId = this.latestRequestByTab.get(payload.targetTabId);
            if (latestRequestId !== payload.requestId) {
                this.logger.warn('Ignoring out-of-order deepseek:ready payload for stale request');
                return;
            }

            if (shouldBuffer) {
                if (!Array.isArray(e2eBuffer?.pending)) {
                    if (e2eBuffer) {
                        e2eBuffer.pending = [];
                    }
                }
                e2eBuffer?.pending?.push(payload);
                this.logger.log('Buffered deepseek:ready payload for E2E');
                return;
            }

            await this._injectTextIntoDeepSeekIframe(request);
            this.pendingRequests.delete(payload.requestId);
            this._clearLatestRequestByTabIfMatches(request.targetTabId, payload.requestId);
        } catch (error) {
            this.handleError('handling deepseek ready', error);
        }
    }

    public flushE2EBufferedReady(): void {
        try {
            const e2eBuffer = (
                global as typeof globalThis & {
                    __e2eDeepSeekReadyBuffer?: { enabled?: boolean; pending?: DeepSeekReadyPayload[] };
                }
            ).__e2eDeepSeekReadyBuffer;

            if (!process.argv.includes('--e2e-disable-auto-submit') || !e2eBuffer?.enabled) {
                return;
            }

            const pending = Array.isArray(e2eBuffer.pending) ? [...e2eBuffer.pending] : [];
            e2eBuffer.pending = [];
            e2eBuffer.enabled = false;

            for (const payload of pending) {
                void this._handleDeepSeekReady(payload);
            }

            e2eBuffer.enabled = true;
        } catch (error) {
            this.handleError('flushing E2E deepseek ready buffer', error);
        }
    }

    private _handleHide(): void {
        try {
            this.deps.windowManager.hideQuickChat();
        } catch (error) {
            this.handleError('hiding quick chat', error);
        }
    }

    private _handleCancel(): void {
        try {
            this.deps.windowManager.hideQuickChat();
            this.logger.log('Quick Chat cancelled');
        } catch (error) {
            this.handleError('cancelling quick chat', error);
        }
    }

    private async _injectTextIntoDeepSeekIframe(request: PendingQuickChatRequest): Promise<void> {
        const mainWindow = this.deps.windowManager.getMainWindow();
        if (!mainWindow) {
            this.logger.error('Cannot inject text: main window not found');
            return;
        }

        const targetFrame = this.deps.windowManager.getDeepSeekTabContents(request.targetTabId)?.mainFrame;

        this.logger.log('Quick Chat injection lookup:', {
            requestId: request.requestId,
            targetTabId: request.targetTabId,
            found: !!targetFrame,
        });

        if (!targetFrame) {
            this.logger.error('Cannot inject text: target tab frame not found');
            return;
        }

        if (!isDeepSeekDomain(targetFrame.url)) {
            this.logger.error('Cannot inject text: target frame URL is not DeepSeek domain');
            return;
        }

        const isE2EMode = process.argv.includes('--e2e-disable-auto-submit');
        const injectionScript = new InjectionScriptBuilder().withText(request.text).withAutoSubmit(!isE2EMode).build();

        try {
            const result = (await targetFrame.executeJavaScript(injectionScript)) as InjectionResult;

            if (result?.success) {
                this.logger.log('Text injected into DeepSeek successfully');
            } else {
                this.logger.error('Injection script returned failure:', {
                    error: result?.error,
                    details: result?.details,
                });
            }
        } catch (error) {
            this.logger.error('Failed to inject text into DeepSeek:', error);
        }
    }

    unregister(): void {
        ipcMain.removeAllListeners(IPC_CHANNELS.QUICK_CHAT_SUBMIT);
        ipcMain.removeAllListeners(IPC_CHANNELS.DEEPSEEK_READY);
        ipcMain.removeAllListeners(IPC_CHANNELS.QUICK_CHAT_HIDE);
        ipcMain.removeAllListeners(IPC_CHANNELS.QUICK_CHAT_CANCEL);
        this.pendingRequests.clear();
        this.latestRequestByTab.clear();
    }
}
