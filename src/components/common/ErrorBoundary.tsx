import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("OVMS Error Boundary Caught Exception:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
          <div className="max-w-lg w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center space-y-6 animate-fadein">
            {/* Header Icon */}
            <div className="relative inline-flex items-center justify-center">
              <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-[44px] text-amber-400 animate-pulse">
                  engineering
                </span>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-md">
                !
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-extrabold tracking-wider uppercase rounded-full">
                Maintenance Mode / System Adjustment
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Halaman Sedang Dalam Pemeliharaan
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
                Sistem OVMS sedang mengalami penyesuaian layanan atau kendala sementara. Tim teknis sedang menangani halaman ini.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                Coba Muat Ulang
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-6 py-3 bg-slate-700/80 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl border border-slate-600 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">home</span>
                Kembali ke Beranda
              </button>
            </div>

            {/* Technical Detail Toggle (Optional Debugging) */}
            <div className="pt-4 border-t border-slate-700/50">
              <button
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="text-[11px] text-slate-400 hover:text-slate-300 font-semibold cursor-pointer underline decoration-dotted"
              >
                {this.state.showDetails ? "Sembunyikan Rincian Teknis" : "Lihat Rincian Teknis"}
              </button>

              {this.state.showDetails && (
                <div className="mt-3 p-3 bg-slate-950 rounded-xl text-left font-mono text-[11px] text-red-400 overflow-x-auto max-h-40 border border-slate-800 space-y-1">
                  <div><b>Message:</b> {this.state.error?.message || "Unknown error"}</div>
                  {this.state.errorInfo?.componentStack && (
                    <pre className="text-[10px] text-slate-400 mt-2 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Footer Notice */}
            <div className="text-[11px] text-slate-400">
              PT Widarta Bhakti • OVMS Operational System
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
