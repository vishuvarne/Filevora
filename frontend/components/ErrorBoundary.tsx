"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 h-full flex flex-col items-center justify-center">
                    <div className="text-3xl mb-2">⚠️</div>
                    <h3 className="font-bold">Something went wrong.</h3>
                    <p className="text-sm mt-1 mb-4 text-center max-w-xs opacity-80">{this.state.error?.message}</p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="text-xs bg-white border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors font-bold text-red-500"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
