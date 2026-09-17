import { renderHook, act, waitFor as _waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDeepSeekIframe } from './useDeepSeekIframe';
import * as useNetworkStatusModule from './useNetworkStatus';

// Mock useNetworkStatus
vi.mock('./useNetworkStatus', () => ({
    useNetworkStatus: vi.fn(() => true),
}));

const mockReloadTabs = vi.fn();
Object.defineProperty(window, 'electronAPI', {
    value: {
        reloadTabs: mockReloadTabs,
    },
    writable: true,
    configurable: true,
});

describe('useDeepSeekIframe', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default to online
        vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue(true);
        // Mock fetch for connectivity checks - default to success
        global.fetch = vi.fn(() => Promise.resolve({} as Response));
    });

    it('initializes with loading state', () => {
        const { result } = renderHook(() => useDeepSeekIframe());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.error).toBeNull();
        expect(result.current.isOnline).toBe(true);
    });

    it('provides network status from useNetworkStatus', () => {
        vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue(false);

        const { result } = renderHook(() => useDeepSeekIframe());

        expect(result.current.isOnline).toBe(false);
    });

    it('handleLoad sets loading to false and clears error', async () => {
        const { result } = renderHook(() => useDeepSeekIframe());

        await act(async () => {
            await result.current.handleLoad();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('handleError sets loading to false and sets error message', () => {
        const { result } = renderHook(() => useDeepSeekIframe());

        act(() => {
            result.current.handleError();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Failed to load DeepSeek');
    });

    it('retry clears error state, sets loading, and calls reloadTabs', () => {
        const { result } = renderHook(() => useDeepSeekIframe());

        // First set error state
        act(() => {
            result.current.handleError();
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe('Failed to load DeepSeek');

        // Then retry
        act(() => {
            result.current.retry();
        });

        expect(result.current.error).toBeNull();
        expect(result.current.isLoading).toBe(true);
        expect(mockReloadTabs).toHaveBeenCalledTimes(1);
    });

    it('handleLoad after error clears error state', async () => {
        const { result } = renderHook(() => useDeepSeekIframe());

        // Set error
        act(() => {
            result.current.handleError();
        });

        expect(result.current.error).toBe('Failed to load DeepSeek');

        // Then load successfully
        await act(async () => {
            await result.current.handleLoad();
        });

        expect(result.current.error).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });

    it('provides stable callback references', () => {
        const { result, rerender } = renderHook(() => useDeepSeekIframe());

        const initialHandleLoad = result.current.handleLoad;
        const initialHandleError = result.current.handleError;
        const initialRetry = result.current.retry;

        rerender();

        expect(result.current.handleLoad).toBe(initialHandleLoad);
        expect(result.current.handleError).toBe(initialHandleError);
        expect(result.current.retry).toBe(initialRetry);
    });

    it('network status updates are reflected', () => {
        const { result, rerender } = renderHook(() => useDeepSeekIframe());

        expect(result.current.isOnline).toBe(true);

        // Change network status
        vi.mocked(useNetworkStatusModule.useNetworkStatus).mockReturnValue(false);
        rerender();

        expect(result.current.isOnline).toBe(false);
    });
});
