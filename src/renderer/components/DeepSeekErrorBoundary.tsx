import { Component, ErrorInfo, ReactNode } from 'react';
import { createRendererLogger } from '../utils';

const logger = createRendererLogger('[DeepSeekErrorBoundary]');

interface DeepSeekErrorBoundaryProps {
    children: ReactNode;
    /** Custom fallback to render on error */
    fallback?: ReactNode;
    /** Callback when an error is caught */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface DeepSeekErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

/**
 * Specialized Error Boundary for the DeepSeek view area.
 *
 * Catches rendering errors in the iframe container and provides
 * a more specific error message than the global ErrorBoundary.
 * Also allows a custom fallback and error callback.
 */
export class DeepSeekErrorBoundary extends Component<DeepSeekErrorBoundaryProps, DeepSeekErrorBoundaryState> {
    private unsubscribeDebug?: () => void;

    constructor(props: DeepSeekErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: undefined };
    }

    componentDidMount(): void {
        // Listen for debug error triggers (e2e testing)
        if (window.electronAPI?.onDebugTriggerError) {
            this.unsubscribeDebug = window.electronAPI.onDebugTriggerError(() => {
                // Simulate an error state for testing
                this.setState({
                    hasError: true,
                    error: new Error('Debug Manual Error Triggered'),
                });
            });
        }

        // Expose direct trigger for E2E tests (bypasses IPC channel complexity)
        // @ts-expect-error: dynamic E2E trigger key is attached to window only in test runtime
        window.__DEEPSEEK_TRIGGER_FATAL_ERROR__ = () => {
            this.setState({
                hasError: true,
                error: new Error('Global Trigger Manual Error'),
            });
        };
    }

    componentWillUnmount(): void {
        this.unsubscribeDebug?.();
    }

    static getDerivedStateFromError(error: Error): DeepSeekErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo): void {
        logger.error('DeepSeek content error:', {
            error,
            componentStack: info.componentStack,
            timestamp: new Date().toISOString(),
        });

        // Call optional error callback
        this.props.onError?.(error, info);
    }

    private handleReload = (): void => {
        this.setState({ hasError: false, error: undefined });
        // Force a re-render of children
        window.location.reload();
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="deepseek-error-fallback" data-testid="deepseek-error-fallback">
                    <div className="deepseek-error-content">
                        <h3>DeepSeek couldn&apos;t load</h3>
                        <p>There was a problem displaying the DeepSeek interface.</p>
                        {this.state.error && (
                            <details>
                                <summary>Technical Details</summary>
                                <pre>{this.state.error.message}</pre>
                            </details>
                        )}
                        <button type="button" onClick={this.handleReload}>
                            Reload
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
