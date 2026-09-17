import { useCallback, useEffect, useRef } from 'react';

import type { TabState } from '../../../shared/types/tabs';
import { TAB_TEST_IDS } from '../../utils/testIds';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

interface ActiveTabStatus {
    isOnline: boolean;
    error: string | null;
    retry: () => void;
}

interface TabPanelProps {
    tabs: TabState[];
    activeTabId: string;
    onTabReady?: (tabId: string) => void;
    onActiveStatusChange?: (status: ActiveTabStatus) => void;
}

/** The native WebContentsView is positioned over this placeholder by the main process. */
export function TabPanel({ tabs, activeTabId, onTabReady, onActiveStatusChange }: TabPanelProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const activeTabIdRef = useRef(activeTabId);
    const isOnline = useNetworkStatus();

    useEffect(() => {
        activeTabIdRef.current = activeTabId;
    }, [activeTabId]);

    const retry = useCallback(() => {
        window.electronAPI?.setTabVisible?.(true);
        window.electronAPI?.reloadTabs(activeTabIdRef.current);
    }, []);

    useEffect(() => {
        window.electronAPI?.syncTabs?.({ tabs, activeTabId });
        window.electronAPI?.setTabVisible?.(isOnline);
        onActiveStatusChange?.({ isOnline, error: null, retry });
    }, [tabs, activeTabId, isOnline, onActiveStatusChange, retry]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const updateBounds = () => {
            const rect = container.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                window.electronAPI?.setTabBounds?.({
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                });
            }
        };
        const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateBounds) : null;
        observer?.observe(container);
        window.addEventListener('resize', updateBounds);
        updateBounds();
        return () => {
            observer?.disconnect();
            window.removeEventListener('resize', updateBounds);
        };
    }, []);

    useEffect(() => {
        const unsubscribeReady = window.electronAPI?.onTabReady?.((tabId) => {
            onTabReady?.(tabId);
            if (tabId === activeTabIdRef.current) {
                window.electronAPI?.setTabVisible?.(true);
                onActiveStatusChange?.({ isOnline: true, error: null, retry });
            }
        });
        const unsubscribeError = window.electronAPI?.onTabLoadError?.(({ tabId, error }) => {
            if (tabId === activeTabIdRef.current) {
                window.electronAPI?.setTabVisible?.(false);
                onActiveStatusChange?.({ isOnline, error, retry });
            }
        });
        return () => {
            unsubscribeReady?.();
            unsubscribeError?.();
        };
    }, [onTabReady, onActiveStatusChange, retry, isOnline]);

    return <div ref={containerRef} className="webview-container" data-testid={TAB_TEST_IDS.TAB_PANEL} />;
}
