import { BrowserWindow, WebContentsView, shell, type WebContents } from 'electron';

import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';
import { GEMINI_APP_URL } from '../../shared/constants/urls';
import type { TabsState } from '../../shared/types/tabs';

/** Native, top-level web contents for each chat tab. The React shell never frames DeepSeek. */
export class DeepSeekTabs {
    private readonly views = new Map<string, WebContentsView>();
    private activeId: string | null = null;
    private attachedId: string | null = null;
    private bounds: Electron.Rectangle | null = null;
    private visible = true;
    private menuOpen = false;

    constructor(private readonly window: BrowserWindow) {
        window.on('closed', () => this.dispose());
    }

    sync(state: TabsState): void {
        const ids = new Set(state.tabs.map((tab) => tab.id));
        for (const [id, view] of this.views) {
            if (ids.has(id)) continue;
            if (this.attachedId === id) {
                this.window.contentView.removeChildView(view);
                this.attachedId = null;
            }
            view.webContents.close();
            this.views.delete(id);
        }

        for (const tab of state.tabs) {
            if (this.views.has(tab.id)) continue;
            const view = new WebContentsView({
                webPreferences: {
                    contextIsolation: true,
                    nodeIntegration: false,
                    sandbox: true,
                },
            });
            const contents = view.webContents;
            // Keep Chromium's normal UA, without Electron's product token, as in the working wrapper.
            contents.setUserAgent(contents.getUserAgent().replace(/\sElectron\/[^ ]+/g, ''));
            this.views.set(tab.id, view);
            contents.on('will-navigate', (event, url) => {
                if (!this.isAllowedUrl(url)) event.preventDefault();
            });
            contents.setWindowOpenHandler(({ url }) => {
                if (this.isAllowedUrl(url)) void contents.loadURL(url);
                else if (this.isExternalUrl(url)) void shell.openExternal(url);
                return { action: 'deny' };
            });
            contents.on('did-finish-load', () => {
                if (!this.window.isDestroyed()) {
                    this.window.webContents.send(IPC_CHANNELS.TABS_READY, tab.id);
                }
            });
            contents.on('did-fail-load', (_event, code, description, _url, isMainFrame) => {
                if (isMainFrame && code !== -3 && !this.window.isDestroyed()) {
                    this.window.webContents.send(IPC_CHANNELS.TABS_LOAD_ERROR, { tabId: tab.id, error: description });
                }
            });
            void contents.loadURL(GEMINI_APP_URL);
        }

        this.activeId = ids.has(state.activeTabId) ? state.activeTabId : (state.tabs[0]?.id ?? null);
        this.showActive();
    }

    setBounds(raw: Electron.Rectangle): void {
        const { width: maxWidth, height: maxHeight } = this.window.getContentBounds();
        const values = [raw.x, raw.y, raw.width, raw.height];
        if (!values.every(Number.isFinite)) return;
        const x = Math.round(raw.x);
        const y = Math.round(raw.y);
        const width = Math.round(raw.width);
        const height = Math.round(raw.height);
        if (x < 0 || y < 0 || width < 1 || height < 1 || x + width > maxWidth + 1 || y + height > maxHeight + 1) {
            return;
        }
        this.bounds = { x, y, width, height };
        this.showActive();
    }

    setVisible(visible: boolean): void {
        this.visible = visible;
        this.showActive();
    }

    setMenuOpen(open: boolean): void {
        this.menuOpen = open;
        this.showActive();
    }

    toggleDevTools(): void {
        const contents = this.getActiveContents();
        if (!contents || contents.isDestroyed()) return;

        if (contents.isDevToolsOpened()) {
            contents.closeDevTools();
        } else {
            contents.openDevTools({ mode: 'detach' });
        }
    }

    getContents(tabId: string): WebContents | null {
        return this.views.get(tabId)?.webContents ?? null;
    }

    getActiveContents(): WebContents | null {
        return this.activeId ? this.getContents(this.activeId) : null;
    }

    getActiveId(): string | null {
        return this.activeId;
    }

    reload(tabId: string): boolean {
        const contents = this.getContents(tabId);
        if (!contents || contents.isDestroyed()) return false;
        contents.reload();
        return true;
    }

    dispose(): void {
        for (const view of this.views.values()) {
            if (!this.window.isDestroyed() && this.attachedId && this.views.get(this.attachedId) === view) {
                this.window.contentView.removeChildView(view);
            }
            if (!view.webContents.isDestroyed()) view.webContents.close();
        }
        this.views.clear();
        this.activeId = null;
        this.attachedId = null;
    }

    private getActiveView(): WebContentsView | null {
        return this.activeId ? (this.views.get(this.activeId) ?? null) : null;
    }

    private showActive(): void {
        if (this.attachedId && (this.attachedId !== this.activeId || !this.visible || this.menuOpen)) {
            const previous = this.views.get(this.attachedId);
            if (previous) this.window.contentView.removeChildView(previous);
            this.attachedId = null;
        }
        const active = this.getActiveView();
        if (active && this.bounds && this.visible && !this.menuOpen) {
            active.setBounds(this.bounds);
            if (this.attachedId !== this.activeId) {
                this.window.contentView.addChildView(active);
                this.attachedId = this.activeId;
            }
        }
    }

    private isAllowedUrl(value: string): boolean {
        try {
            const url = new URL(value);
            return (
                url.protocol === 'https:' &&
                ['chat.deepseek.com', 'deepseek.com', 'login.deepseek.com'].includes(url.hostname)
            );
        } catch {
            return false;
        }
    }

    private isExternalUrl(value: string): boolean {
        try {
            return new URL(value).protocol === 'https:';
        } catch {
            return false;
        }
    }
}
