import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-10 bg-red-50 text-red-900 rounded-xl border border-red-200 m-4">
          <AlertTriangle size={48} className="mb-4 text-red-600" />
          <h2 className="text-xl font-bold mb-2">Erro de Renderização</h2>
          <p className="text-sm mb-6 font-mono bg-white p-2 rounded border border-red-100 max-w-lg break-words">
            {this.state.error?.message || 'Erro desconhecido.'}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            <RefreshCcw size={16} /> Recarregar Módulo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}