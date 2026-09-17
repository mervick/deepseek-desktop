/* @vitest-environment jsdom */

import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TabPanel } from '../../../../../src/renderer/components/tabs/TabPanel';
import { setupMockElectronAPI } from '../../../../helpers/mocks';

vi.mock('../../../../../src/renderer/hooks/useNetworkStatus', () => ({
    useNetworkStatus: () => true,
}));

describe('TabPanel native view coordination', () => {
    const tabs = [
        { id: 'tab-1', title: 'First', url: 'https://chat.deepseek.com/', createdAt: 1 },
        { id: 'tab-2', title: 'Second', url: 'https://chat.deepseek.com/', createdAt: 2 },
    ];
    let ready: (tabId: string) => void;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => cleanup());

    it('syncs tab state without embedding any iframe', () => {
        const api = setupMockElectronAPI();
        render(<TabPanel tabs={tabs} activeTabId="tab-1" />);

        expect(screen.getByTestId('tab-panel')).toBeTruthy();
        expect(document.querySelectorAll('iframe')).toHaveLength(0);
        expect(api.syncTabs).toHaveBeenCalledWith({ tabs, activeTabId: 'tab-1' });
        expect(api.setTabVisible).toHaveBeenCalledWith(true);
    });

    it('reports native tab readiness to Quick Chat', () => {
        const api = setupMockElectronAPI({
            onTabReady: vi.fn((callback) => {
                ready = callback;
                return () => {};
            }),
        });
        const onTabReady = vi.fn();
        render(<TabPanel tabs={tabs} activeTabId="tab-1" onTabReady={onTabReady} />);

        act(() => ready('tab-2'));
        expect(onTabReady).toHaveBeenCalledWith('tab-2');
        expect(api.onTabReady).toHaveBeenCalledOnce();
    });

    it('updates active native tab when the React selection changes', () => {
        const api = setupMockElectronAPI();
        const { rerender } = render(<TabPanel tabs={tabs} activeTabId="tab-1" />);
        rerender(<TabPanel tabs={tabs} activeTabId="tab-2" />);

        expect(api.syncTabs).toHaveBeenLastCalledWith({ tabs, activeTabId: 'tab-2' });
    });
});
