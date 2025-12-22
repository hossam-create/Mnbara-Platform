import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  eventId?: string;
}

/**
 * Error Boundary with Sentry Integration
 * Requirements: 20.3 - Configure alerts for payment failures, auction timer drift, and service health
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Report to Sentry with component stack
    const eventId = Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
    
    this.setState({ eventId });
  }

  private handleReportFeedback = () => {
    if (this.state.eventId) {
      Sentry.showReportDialog({ eventId: this.state.eventId });
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center border border-gray-100">
            <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <span className="text-4xl">💊</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong.</h1>
            <p className="text-gray-500 mb-6 text-sm">
                Don't worry, our team has been notified. It's not you, it's us.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-left mb-6 overflow-hidden">
                <code className="text-xs text-red-500 font-mono break-all">
                    {this.state.error?.message}
                </code>
            </div>
            <div className="flex gap-4 justify-center flex-wrap">
                <button 
                    onClick={() => window.location.reload()} 
                    className="btn-primary px-6 py-2"
                >
                    Try Again
                </button>
                <a href="/" className="px-6 py-2 rounded-lg border border-gray-200 font-medium hover:bg-gray-50">
                    Home
                </a>
                {this.state.eventId && (
                    <button 
                        onClick={this.handleReportFeedback}
                        className="px-6 py-2 rounded-lg border border-blue-200 text-blue-600 font-medium hover:bg-blue-50"
                    >
                        Report Feedback
                    </button>
                )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
