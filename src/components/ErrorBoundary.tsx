import React from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { SkillClashEmblem } from './BrandIcons';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
  isPermissionError: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
      isPermissionError: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let message = error?.message || 'An unexpected error occurred.';
    let isPermissionError = false;

    try {
      const parsed = JSON.parse(message) as { error?: string; operationType?: string; path?: string };
      if (parsed && typeof parsed.error === 'string') {
        isPermissionError = parsed.error.toLowerCase().includes('permission') || parsed.error.toLowerCase().includes('insufficient');
        message = isPermissionError
          ? 'Access restricted. Please make sure your email is verified and you are signed in with the right account.'
          : parsed.error;
      }
    } catch {
      if (message.toLowerCase().includes('permission')) {
        isPermissionError = true;
      }
    }

    return { hasError: true, message, isPermissionError };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('SkillBattle ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[#0B0C10] text-white flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-16 h-16 rounded-full bg-black border border-zinc-800 overflow-hidden flex items-center justify-center shadow-lg">
          <SkillClashEmblem className="w-full h-full" />
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
          <ShieldAlert className="w-4 h-4" />
          <span>{this.state.isPermissionError ? 'Security / Access Notice' : 'Application Error'}</span>
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h1 className="font-display font-extrabold text-xl tracking-tight">SkillBattle</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">{this.state.message}</p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-5 h-11 rounded-lg bg-[#54E397] hover:bg-[#43d688] text-zinc-950 font-bold text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reload App</span>
        </button>
      </div>
    );
  }
}
