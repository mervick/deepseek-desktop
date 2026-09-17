import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeepSeekErrorBoundary } from './DeepSeekErrorBoundary';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow?: boolean }) => {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>Working component</div>;
};

describe('DeepSeekErrorBoundary', () => {
    // Suppress console.error during tests
    const originalError = console.error;
    beforeEach(() => {
        console.error = vi.fn();
    });

    afterEach(() => {
        console.error = originalError;
    });

    it('renders children when there is no error', () => {
        render(
            <DeepSeekErrorBoundary>
                <div data-testid="child">Child content</div>
            </DeepSeekErrorBoundary>
        );

        expect(screen.getByTestId('child')).toBeInTheDocument();
        expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('renders default error fallback when error is caught', () => {
        render(
            <DeepSeekErrorBoundary>
                <ThrowError shouldThrow={true} />
            </DeepSeekErrorBoundary>
        );

        expect(screen.getByTestId('deepseek-error-fallback')).toBeInTheDocument();
        expect(screen.getByText("DeepSeek couldn't load")).toBeInTheDocument();
        expect(screen.getByText('There was a problem displaying the DeepSeek interface.')).toBeInTheDocument();
    });

    it('displays error message in technical details', () => {
        render(
            <DeepSeekErrorBoundary>
                <ThrowError shouldThrow={true} />
            </DeepSeekErrorBoundary>
        );

        expect(screen.getByText('Technical Details')).toBeInTheDocument();
        expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('renders reload button in default fallback', () => {
        const reloadMock = vi.fn();
        Object.defineProperty(window, 'location', {
            value: { reload: reloadMock },
            writable: true,
        });

        render(
            <DeepSeekErrorBoundary>
                <ThrowError shouldThrow={true} />
            </DeepSeekErrorBoundary>
        );

        const reloadButton = screen.getByRole('button', { name: /reload/i });
        expect(reloadButton).toBeInTheDocument();

        reloadButton.click();
        expect(reloadMock).toHaveBeenCalled();
    });

    it('renders custom fallback when provided', () => {
        const customFallback = <div data-testid="custom-fallback">Custom error message</div>;

        render(
            <DeepSeekErrorBoundary fallback={customFallback}>
                <ThrowError shouldThrow={true} />
            </DeepSeekErrorBoundary>
        );

        expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
        expect(screen.getByText('Custom error message')).toBeInTheDocument();
        expect(screen.queryByTestId('deepseek-error-fallback')).not.toBeInTheDocument();
    });

    it('calls onError callback when error is caught', () => {
        const onErrorMock = vi.fn();

        render(
            <DeepSeekErrorBoundary onError={onErrorMock}>
                <ThrowError shouldThrow={true} />
            </DeepSeekErrorBoundary>
        );

        expect(onErrorMock).toHaveBeenCalled();
        expect(onErrorMock).toHaveBeenCalledWith(
            expect.any(Error),
            expect.objectContaining({
                componentStack: expect.any(String),
            })
        );
    });

    it('error callback receives correct error object', () => {
        const onErrorMock = vi.fn();

        render(
            <DeepSeekErrorBoundary onError={onErrorMock}>
                <ThrowError shouldThrow={true} />
            </DeepSeekErrorBoundary>
        );

        const errorArg = onErrorMock.mock.calls[0][0];
        expect(errorArg.message).toBe('Test error');
    });
});
