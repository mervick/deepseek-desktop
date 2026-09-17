import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TabStateIpcHandler } from '../../../../src/main/managers/ipc/TabStateIpcHandler';
import type { IpcHandlerDependencies } from '../../../../src/main/managers/ipc/types';
import { IPC_CHANNELS } from '../../../../src/shared/constants/ipc-channels';
import { DEEPSEEK_APP_URL } from '../../../../src/shared/constants';
import { getTabFrameName } from '../../../../src/shared/types/tabs';
import { createMockLogger, createMockStore, createMockWindowManager } from '../../../helpers/mocks';

const { mockIpcMain } = vi.hoisted(() => {
    const mockIpcMain = {
        on: vi.fn((channel: string, listener: (...args: unknown[]) => void) => {
            mockIpcMain._listeners.set(channel, listener);
        }),
        handle: vi.fn((channel: string, handler: (...args: unknown[]) => unknown) => {
            mockIpcMain._handlers.set(channel, handler);
        }),
        removeAllListeners: vi.fn(),
        removeHandler: vi.fn(),
        _listeners: new Map<string, (...args: unknown[]) => void>(),
        _handlers: new Map<string, (...args: unknown[]) => unknown>(),
        _reset: () => {
            mockIpcMain._listeners.clear();
            mockIpcMain._handlers.clear();
        },
    };

    return { mockIpcMain };
});

const { mockBrowserWindow } = vi.hoisted(() => {
    const mockBrowserWindow = {
        getAllWindows: vi.fn().mockReturnValue([]),
    };
    return { mockBrowserWindow };
});

vi.mock('electron', () => ({
    ipcMain: mockIpcMain,
    BrowserWindow: mockBrowserWindow,
}));

vi.mock('../../../../src/main/store', () => ({
    default: class MockSettingsStore {
        private data: { tabsState: unknown };

        constructor(options: { defaults: { tabsState: unknown } }) {
            this.data = { ...options.defaults };
        }

        get(key: 'tabsState'): unknown {
            return this.data[key];
        }

        set(key: 'tabsState', value: unknown): void {
            this.data[key] = value;
        }
    },
}));

describe('TabStateIpcHandler', () => {
    let handler: TabStateIpcHandler;
    let mockWindowManager: ReturnType<typeof createMockWindowManager>;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
        mockIpcMain._reset();

        mockWindowManager = createMockWindowManager();

        const deps = {
            store: createMockStore({}),
            logger: createMockLogger(),
            windowManager: mockWindowManager,
        } as unknown as IpcHandlerDependencies;

        handler = new TabStateIpcHandler(deps);
    });

    it('registers tab state IPC channels', () => {
        handler.register();

        expect(mockIpcMain.handle).toHaveBeenCalledWith(IPC_CHANNELS.TABS_GET_STATE, expect.any(Function));
        expect(mockIpcMain.on).toHaveBeenCalledWith(IPC_CHANNELS.TABS_SAVE_STATE, expect.any(Function));
        expect(mockIpcMain.on).toHaveBeenCalledWith(IPC_CHANNELS.TABS_SYNC, expect.any(Function));
        expect(mockIpcMain.on).toHaveBeenCalledWith(IPC_CHANNELS.TABS_SET_BOUNDS, expect.any(Function));
        expect(mockIpcMain.on).toHaveBeenCalledWith(IPC_CHANNELS.TABS_SET_MENU_OPEN, expect.any(Function));
        expect(mockIpcMain.on).toHaveBeenCalledWith(IPC_CHANNELS.TABS_UPDATE_TITLE, expect.any(Function));
        expect(mockIpcMain.on).toHaveBeenCalledWith(IPC_CHANNELS.TABS_RELOAD, expect.any(Function));

        handler.unregister();
    });

    it('accepts menu visibility only from the main shell and only as a boolean', () => {
        handler.register();
        const shell = {};
        mockWindowManager.getMainWindow.mockReturnValue({ webContents: shell });
        const listener = mockIpcMain._listeners.get(IPC_CHANNELS.TABS_SET_MENU_OPEN);

        listener?.({ sender: {} }, true);
        listener?.({ sender: shell }, 'true');
        expect(mockWindowManager.setDeepSeekTabMenuOpen).not.toHaveBeenCalled();

        listener?.({ sender: shell }, true);
        listener?.({ sender: shell }, false);
        expect(mockWindowManager.setDeepSeekTabMenuOpen).toHaveBeenNthCalledWith(1, true);
        expect(mockWindowManager.setDeepSeekTabMenuOpen).toHaveBeenNthCalledWith(2, false);
        handler.unregister();
    });

    it('reload handler reloads only active frame from payload tab id', () => {
        handler.register();

        const reloadListener = mockIpcMain._listeners.get(IPC_CHANNELS.TABS_RELOAD);
        const activeTabId = 'tab-active';
        const activeFrame = {
            name: getTabFrameName(activeTabId),
            url: DEEPSEEK_APP_URL,
            isDestroyed: vi.fn().mockReturnValue(false),
            reload: vi.fn().mockReturnValue(true),
        };
        const backgroundFrame = {
            name: getTabFrameName('tab-bg'),
            url: DEEPSEEK_APP_URL,
            isDestroyed: vi.fn().mockReturnValue(false),
            reload: vi.fn().mockReturnValue(true),
        };

        const mockMainWindow = {
            isDestroyed: vi.fn().mockReturnValue(false),
            webContents: {
                mainFrame: {
                    frames: [backgroundFrame, activeFrame],
                },
            },
        };
        vi.spyOn(mockWindowManager, 'getMainWindow').mockReturnValue(mockMainWindow as never);
        mockWindowManager.reloadDeepSeekTab.mockReturnValue(true);

        reloadListener?.({}, { activeTabId });

        expect(mockWindowManager.reloadDeepSeekTab).toHaveBeenCalledExactlyOnceWith(activeTabId);

        handler.unregister();
    });

    it('reload handler uses payload active tab over stored active tab', () => {
        handler.register();

        const saveListener = mockIpcMain._listeners.get(IPC_CHANNELS.TABS_SAVE_STATE);
        const reloadListener = mockIpcMain._listeners.get(IPC_CHANNELS.TABS_RELOAD);

        saveListener?.(
            {},
            {
                tabs: [
                    { id: 'tab-old', title: 'Old', url: DEEPSEEK_APP_URL, createdAt: 1 },
                    { id: 'tab-new', title: 'New', url: DEEPSEEK_APP_URL, createdAt: 2 },
                ],
                activeTabId: 'tab-old',
            }
        );

        const oldFrame = {
            name: getTabFrameName('tab-old'),
            isDestroyed: vi.fn().mockReturnValue(false),
            reload: vi.fn().mockReturnValue(true),
        };
        const newFrame = {
            name: getTabFrameName('tab-new'),
            isDestroyed: vi.fn().mockReturnValue(false),
            reload: vi.fn().mockReturnValue(true),
        };

        const mockMainWindow = {
            isDestroyed: vi.fn().mockReturnValue(false),
            webContents: {
                mainFrame: {
                    frames: [oldFrame, newFrame],
                },
            },
        };
        vi.spyOn(mockWindowManager, 'getMainWindow').mockReturnValue(mockMainWindow as never);
        mockWindowManager.reloadDeepSeekTab.mockReturnValue(true);

        reloadListener?.({}, { activeTabId: 'tab-new' });

        expect(mockWindowManager.reloadDeepSeekTab).toHaveBeenCalledExactlyOnceWith('tab-new');

        handler.unregister();
    });

    it('reload handler skips when main window is destroyed', () => {
        handler.register();
        const reloadListener = mockIpcMain._listeners.get(IPC_CHANNELS.TABS_RELOAD);

        const mockMainWindow = {
            isDestroyed: vi.fn().mockReturnValue(true),
            webContents: {
                mainFrame: {
                    frames: [],
                },
            },
        };
        vi.spyOn(mockWindowManager, 'getMainWindow').mockReturnValue(mockMainWindow as never);

        expect(() => reloadListener?.({}, { activeTabId: 'tab-a' })).not.toThrow();
        handler.unregister();
    });

    it('reload handler skips when target frame is destroyed', () => {
        handler.register();
        const reloadListener = mockIpcMain._listeners.get(IPC_CHANNELS.TABS_RELOAD);

        const targetFrame = {
            name: getTabFrameName('tab-a'),
            isDestroyed: vi.fn().mockReturnValue(true),
            reload: vi.fn().mockReturnValue(true),
        };

        const mockMainWindow = {
            isDestroyed: vi.fn().mockReturnValue(false),
            webContents: {
                mainFrame: {
                    frames: [targetFrame],
                },
            },
        };
        vi.spyOn(mockWindowManager, 'getMainWindow').mockReturnValue(mockMainWindow as never);

        reloadListener?.({}, { activeTabId: 'tab-a' });
        expect(mockWindowManager.reloadDeepSeekTab).toHaveBeenCalledWith('tab-a');

        handler.unregister();
    });

    it('reload handler debounces rapid calls', () => {
        handler.register();
        const reloadListener = mockIpcMain._listeners.get(IPC_CHANNELS.TABS_RELOAD);

        const targetFrame = {
            name: getTabFrameName('tab-a'),
            isDestroyed: vi.fn().mockReturnValue(false),
            reload: vi.fn().mockReturnValue(true),
        };

        const mockMainWindow = {
            isDestroyed: vi.fn().mockReturnValue(false),
            webContents: {
                mainFrame: {
                    frames: [targetFrame],
                },
            },
        };
        vi.spyOn(mockWindowManager, 'getMainWindow').mockReturnValue(mockMainWindow as never);
        mockWindowManager.reloadDeepSeekTab.mockReturnValue(true);

        reloadListener?.({}, { activeTabId: 'tab-a' });
        reloadListener?.({}, { activeTabId: 'tab-a' });

        expect(mockWindowManager.reloadDeepSeekTab).toHaveBeenCalledTimes(1);

        handler.unregister();
    });

    it('reload handler falls back to first deepseek frame when no active tab id payload or store', () => {
        handler.register();
        const reloadListener = mockIpcMain._listeners.get(IPC_CHANNELS.TABS_RELOAD);

        const fallbackFrame = {
            name: getTabFrameName('tab-fallback'),
            url: DEEPSEEK_APP_URL,
            isDestroyed: vi.fn().mockReturnValue(false),
            reload: vi.fn().mockReturnValue(true),
        };

        const mockMainWindow = {
            isDestroyed: vi.fn().mockReturnValue(false),
            webContents: {
                mainFrame: {
                    frames: [fallbackFrame],
                },
            },
        };

        vi.spyOn(mockWindowManager, 'getMainWindow').mockReturnValue(mockMainWindow as never);
        mockWindowManager.getActiveDeepSeekTabId.mockReturnValue('tab-fallback');
        mockWindowManager.reloadDeepSeekTab.mockReturnValue(true);

        reloadListener?.({}, undefined);

        expect(mockWindowManager.reloadDeepSeekTab).toHaveBeenCalledExactlyOnceWith('tab-fallback');
        handler.unregister();
    });

    it('saves and returns normalized tab state', () => {
        handler.register();

        const saveListener = mockIpcMain._listeners.get(IPC_CHANNELS.TABS_SAVE_STATE);
        const getHandler = mockIpcMain._handlers.get(IPC_CHANNELS.TABS_GET_STATE) as () => {
            tabs: Array<{ id: string; title: string; url: string; createdAt: number }>;
            activeTabId: string;
        };

        saveListener?.(
            {},
            {
                tabs: [
                    {
                        id: 'tab-1',
                        title: 'My Tab',
                        url: 'https://example.com/not-deepseek',
                        createdAt: 100,
                    },
                ],
                activeTabId: 'tab-1',
            }
        );

        const state = getHandler();

        expect(state.tabs).toHaveLength(1);
        expect(state.tabs[0]).toEqual({
            id: 'tab-1',
            title: 'My Tab',
            url: DEEPSEEK_APP_URL,
            createdAt: 100,
        });
        expect(state.activeTabId).toBe('tab-1');

        handler.unregister();
    });

    it('falls back to a default tab when saved state is invalid', () => {
        handler.register();

        const saveListener = mockIpcMain._listeners.get(IPC_CHANNELS.TABS_SAVE_STATE);
        const getHandler = mockIpcMain._handlers.get(IPC_CHANNELS.TABS_GET_STATE) as () => {
            tabs: Array<{ id: string; title: string; url: string; createdAt: number }>;
            activeTabId: string;
        };

        saveListener?.({}, { tabs: [], activeTabId: '' });

        const state = getHandler();

        expect(state.tabs).toHaveLength(1);
        expect(state.tabs[0]?.title).toBe('New Chat');
        expect(state.tabs[0]?.url).toBe(DEEPSEEK_APP_URL);
        expect(state.activeTabId).toBe(state.tabs[0]?.id);

        handler.unregister();
    });

    it('updates stored tab title when update payload is valid', () => {
        handler.register();

        const saveListener = mockIpcMain._listeners.get(IPC_CHANNELS.TABS_SAVE_STATE);
        const updateListener = mockIpcMain._listeners.get(IPC_CHANNELS.TABS_UPDATE_TITLE);
        const getHandler = mockIpcMain._handlers.get(IPC_CHANNELS.TABS_GET_STATE) as () => {
            tabs: Array<{ id: string; title: string; url: string; createdAt: number }>;
            activeTabId: string;
        };

        saveListener?.(
            {},
            {
                tabs: [
                    {
                        id: 'tab-1',
                        title: 'My Tab',
                        url: 'https://example.com/not-deepseek',
                        createdAt: 100,
                    },
                ],
                activeTabId: 'tab-1',
            }
        );

        updateListener?.({}, { tabId: 'tab-1', title: 'Updated Title' });

        const state = getHandler();
        expect(state.tabs[0]?.title).toBe('Updated Title');
        expect(mockBrowserWindow.getAllWindows).toHaveBeenCalled();

        handler.unregister();
    });

    it('polls and updates active tab title from conversation title', async () => {
        vi.useFakeTimers();

        const tabId = 'tab-active';

        handler.register();

        const saveListener = mockIpcMain._listeners.get(IPC_CHANNELS.TABS_SAVE_STATE);
        const getHandler = mockIpcMain._handlers.get(IPC_CHANNELS.TABS_GET_STATE) as () => {
            tabs: Array<{ id: string; title: string; url: string; createdAt: number }>;
            activeTabId: string;
        };

        saveListener?.(
            {},
            {
                tabs: [
                    {
                        id: tabId,
                        title: 'New Chat',
                        url: DEEPSEEK_APP_URL,
                        createdAt: 100,
                    },
                ],
                activeTabId: tabId,
            }
        );

        const targetFrame = {
            name: getTabFrameName(tabId),
            url: DEEPSEEK_APP_URL,
            executeJavaScript: vi.fn().mockResolvedValue('Test Conversation Title'),
        };

        const mockMainWindow = {
            isDestroyed: vi.fn().mockReturnValue(false),
            webContents: {
                mainFrame: {
                    frames: [targetFrame],
                },
            },
        };

        vi.spyOn(mockWindowManager, 'getMainWindow').mockReturnValue(mockMainWindow as never);
        mockWindowManager.getDeepSeekTabContents.mockReturnValue({ mainFrame: targetFrame });

        // Advance past the polling interval to trigger title extraction
        await vi.advanceTimersByTimeAsync(3000);

        expect(targetFrame.executeJavaScript).toHaveBeenCalledTimes(1);
        const state = getHandler();
        expect(state.tabs[0]?.title).toBe('Test Conversation Title');
        expect(mockBrowserWindow.getAllWindows).toHaveBeenCalled();

        handler.unregister();
        vi.useRealTimers();
    });

    it('resets tab title to New Chat when extraction returns empty (home page)', async () => {
        vi.useFakeTimers();

        const tabId = 'tab-stale';

        handler.register();

        const saveListener = mockIpcMain._listeners.get(IPC_CHANNELS.TABS_SAVE_STATE);
        const getHandler = mockIpcMain._handlers.get(IPC_CHANNELS.TABS_GET_STATE) as () => {
            tabs: Array<{ id: string; title: string; url: string; createdAt: number }>;
            activeTabId: string;
        };

        // Simulate a stale persisted title from a previous session
        saveListener?.(
            {},
            {
                tabs: [
                    {
                        id: tabId,
                        title: 'Stale Title From Previous Session',
                        url: DEEPSEEK_APP_URL,
                        createdAt: 100,
                    },
                ],
                activeTabId: tabId,
            }
        );

        const targetFrame = {
            name: getTabFrameName(tabId),
            url: DEEPSEEK_APP_URL,
            // Return empty string to simulate home/new chat page (no conversation title)
            executeJavaScript: vi.fn().mockResolvedValue(''),
        };

        const mockMainWindow = {
            isDestroyed: vi.fn().mockReturnValue(false),
            webContents: {
                mainFrame: {
                    frames: [targetFrame],
                },
            },
        };

        vi.spyOn(mockWindowManager, 'getMainWindow').mockReturnValue(mockMainWindow as never);
        mockWindowManager.getDeepSeekTabContents.mockReturnValue({ mainFrame: targetFrame });

        await vi.advanceTimersByTimeAsync(3000);

        expect(targetFrame.executeJavaScript).toHaveBeenCalledTimes(1);
        const state = getHandler();
        expect(state.tabs[0]?.title).toBe('New Chat');
        expect(mockBrowserWindow.getAllWindows).toHaveBeenCalled();

        handler.unregister();
        vi.useRealTimers();
    });

    it('does not broadcast redundant updates when title is already New Chat', async () => {
        vi.useFakeTimers();

        const tabId = 'tab-new';

        handler.register();

        const saveListener = mockIpcMain._listeners.get(IPC_CHANNELS.TABS_SAVE_STATE);
        const getHandler = mockIpcMain._handlers.get(IPC_CHANNELS.TABS_GET_STATE) as () => {
            tabs: Array<{ id: string; title: string; url: string; createdAt: number }>;
            activeTabId: string;
        };

        // Tab already has the default title
        saveListener?.(
            {},
            {
                tabs: [
                    {
                        id: tabId,
                        title: 'New Chat',
                        url: DEEPSEEK_APP_URL,
                        createdAt: 100,
                    },
                ],
                activeTabId: tabId,
            }
        );

        const targetFrame = {
            name: getTabFrameName(tabId),
            url: DEEPSEEK_APP_URL,
            executeJavaScript: vi.fn().mockResolvedValue(''),
        };

        const mockMainWindow = {
            isDestroyed: vi.fn().mockReturnValue(false),
            webContents: {
                mainFrame: {
                    frames: [targetFrame],
                },
            },
        };

        vi.spyOn(mockWindowManager, 'getMainWindow').mockReturnValue(mockMainWindow as never);
        mockBrowserWindow.getAllWindows.mockClear();

        await vi.advanceTimersByTimeAsync(3000);

        // Title was already 'New Chat', so no broadcast should be sent
        const state = getHandler();
        expect(state.tabs[0]?.title).toBe('New Chat');
        expect(mockBrowserWindow.getAllWindows).not.toHaveBeenCalled();

        handler.unregister();
        vi.useRealTimers();
    });

    it('unregister removes TABS_RELOAD listeners', () => {
        handler.register();
        handler.unregister();

        expect(mockIpcMain.removeAllListeners).toHaveBeenCalledWith(IPC_CHANNELS.TABS_RELOAD);
    });
});
