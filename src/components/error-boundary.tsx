"use client";
import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-sm font-extrabold mb-1">Terjadi Kesalahan</h3>
            <p className="text-[11px] text-slate-400 mb-4 max-w-xs">
              {this.state.error?.message || "Gagal memuat data"}
            </p>
            <button
              onClick={this.handleReset}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#FF5C00] text-white text-xs font-bold"
            >
              Coba Lagi
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
