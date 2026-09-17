import { describe, expect, it, vi } from 'vitest';
import type { BrowserWindow } from 'electron';

import { DeepSeekTabs } from '../../../src/main/windows/deepSeekTabs';

const { views } = vi.hoisted(() => ({
    views: [] as Array<{
        options: unknown;
        webContents: {
            loadURL: ReturnType<typeof vi.fn>;
            close: ReturnType<typeof vi.fn>;
            getURL: ReturnType<typeof vi.fn>;
            _listeners: Map<string, (...args: unknown[]) => void>;
        };
        setBounds: ReturnType<typeof vi.fn>;
    }>,
}));

vi.mock('electron', () => ({
    shell: { openExternal: vi.fn() },
    WebContentsView: class {
        options: unknown;
        webContents = {
            loadURL: vi.fn().mockResolvedValue(undefined),
            close: vi.fn(),
            isDestroyed: vi.fn().mockReturnValue(false),
            getURL: vi.fn().mockReturnValue('https://chat.deepseek.com/'),
            getUserAgent: vi.fn().mockReturnValue('Mozilla/5.0 Chrome/130.0 Electron/39.0 Safari/537.36'),
            setUserAgent: vi.fn(),
            on: vi.fn((event: string, listener: (...args: unknown[]) => void) => {
                this.webContents._listeners.set(event, listener);
            }),
            setWindowOpenHandler: vi.fn(),
            _listeners: new Map<string, (...args: unknown[]) => void>(),
        };
        setBounds = vi.fn();

        constructor(options: unknown) {
            this.options = options;
            views.push(this);
        }
    },
}));

function createWindow() {
    return {
        on: vi.fn(),
        isDestroyed: vi.fn().mockReturnValue(false),
        getContentBounds: vi.fn().mockReturnValue({ x: 50, y: 60, width: 800, height: 600 }),
        contentView: { addChildView: vi.fn(), removeChildView: vi.fn() },
        webContents: { send: vi.fn() },
    };
}

describe('DeepSeekTabs', () => {
    it('loads each chat as a sandboxed top-level page and attaches only the active one', () => {
        views.length = 0;
        const window = createWindow();
        const manager = new DeepSeekTabs(window as unknown as BrowserWindow);
        const state = {
            tabs: [
                { id: 'one', title: 'One', url: 'https://chat.deepseek.com/', createdAt: 1 },
                { id: 'two', title: 'Two', url: 'https://chat.deepseek.com/', createdAt: 2 },
            ],
            activeTabId: 'one',
        };

        manager.sync(state);
        manager.setBounds({ x: 0, y: 80, width: 800, height: 520 });

        expect(views).toHaveLength(2);
        expect(views[0]?.options).toMatchObject({
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: true,
            },
        });
        expect(views[0]?.webContents.loadURL).toHaveBeenCalledWith('https://chat.deepseek.com/');
        expect(window.contentView.addChildView).toHaveBeenCalledWith(views[0]);
        expect(manager.getActiveContents()).toBe(views[0]?.webContents);

        manager.sync({ ...state, activeTabId: 'two' });
        expect(window.contentView.removeChildView).toHaveBeenCalledWith(views[0]);
        expect(window.contentView.addChildView).toHaveBeenCalledWith(views[1]);
        expect(manager.getActiveContents()).toBe(views[1]?.webContents);

        manager.setVisible(false);
        expect(window.contentView.removeChildView).toHaveBeenCalledWith(views[1]);

        manager.setMenuOpen(true);
        manager.setVisible(true);
        expect(window.contentView.addChildView).toHaveBeenCalledTimes(2);
        expect(manager.getActiveContents()).toBe(views[1]?.webContents);
        expect(views[1]?.webContents.close).not.toHaveBeenCalled();
        manager.setMenuOpen(false);
        expect(window.contentView.addChildView).toHaveBeenCalledTimes(3);
        expect(manager.getActiveContents()).toBe(views[1]?.webContents);
        expect(views[1]?.webContents.close).not.toHaveBeenCalled();
    });

    it('rejects navigation outside the DeepSeek HTTPS hosts', () => {
        views.length = 0;
        const manager = new DeepSeekTabs(createWindow() as unknown as BrowserWindow);
        manager.sync({
            tabs: [{ id: 'one', title: 'One', url: 'https://chat.deepseek.com/', createdAt: 1 }],
            activeTabId: 'one',
        });
        const listener = views[0]?.webContents._listeners.get('will-navigate');
        const event = { preventDefault: vi.fn() };

        listener?.(event, 'https://chat.deepseek.com.evil.example/');
        expect(event.preventDefault).toHaveBeenCalledOnce();
        event.preventDefault.mockClear();
        listener?.(event, 'https://chat.deepseek.com/chat/123');
        expect(event.preventDefault).not.toHaveBeenCalled();
    });
});
