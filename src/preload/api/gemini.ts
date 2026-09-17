import { ipcRenderer } from 'electron';

import { IPC_CHANNELS } from '../../shared/constants/ipc-channels';
import type { ElectronAPI } from '../../shared/types';
import type { GeminiNavigatePayload, TabShortcutPayload } from '../../shared/types/tabs';
import { createSubscription } from '../createSubscription';

export const geminiAPI: Pick<
    ElectronAPI,
    | 'onGeminiNavigate'
    | 'signalGeminiReady'
    | 'getTabState'
    | 'saveTabState'
    | 'syncTabs'
    | 'setTabBounds'
    | 'setTabVisible'
    | 'setTabMenuOpen'
    | 'toggleTabDevTools'
    | 'onTabReady'
    | 'onTabLoadError'
    | 'onTabShortcutTriggered'
    | 'onTabTitleUpdated'
    | 'updateTabTitle'
    | 'reloadTabs'
> = {
    onGeminiNavigate: createSubscription<GeminiNavigatePayload>(IPC_CHANNELS.GEMINI_NAVIGATE),
    signalGeminiReady: (payload) => ipcRenderer.send(IPC_CHANNELS.GEMINI_READY, payload),
    getTabState: () => ipcRenderer.invoke(IPC_CHANNELS.TABS_GET_STATE),
    saveTabState: (state) => ipcRenderer.send(IPC_CHANNELS.TABS_SAVE_STATE, state),
    syncTabs: (state) => ipcRenderer.send(IPC_CHANNELS.TABS_SYNC, state),
    setTabBounds: (bounds) => ipcRenderer.send(IPC_CHANNELS.TABS_SET_BOUNDS, bounds),
    setTabVisible: (visible) => ipcRenderer.send(IPC_CHANNELS.TABS_SET_VISIBLE, visible),
    setTabMenuOpen: (open) => ipcRenderer.send(IPC_CHANNELS.TABS_SET_MENU_OPEN, open),
    toggleTabDevTools: () => ipcRenderer.send(IPC_CHANNELS.TABS_TOGGLE_DEVTOOLS),
    onTabReady: createSubscription<string>(IPC_CHANNELS.TABS_READY),
    onTabLoadError: createSubscription<{ tabId: string; error: string }>(IPC_CHANNELS.TABS_LOAD_ERROR),
    onTabShortcutTriggered: createSubscription<TabShortcutPayload>(IPC_CHANNELS.TABS_SHORTCUT_TRIGGERED),
    onTabTitleUpdated: createSubscription<{ tabId: string; title: string }>(IPC_CHANNELS.TABS_TITLE_UPDATED),
    updateTabTitle: (tabId, title) => ipcRenderer.send(IPC_CHANNELS.TABS_UPDATE_TITLE, { tabId, title }),
    reloadTabs: (activeTabId) => ipcRenderer.send(IPC_CHANNELS.TABS_RELOAD, activeTabId ? { activeTabId } : undefined),
};
