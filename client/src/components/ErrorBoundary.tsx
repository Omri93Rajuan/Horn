import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center bg-bg px-6 dark:bg-bg-dark">
          <div className="card w-full max-w-2xl space-y-4 text-center">
            <h1 className="text-2xl font-semibold text-text dark:text-text-dark">משהו השתבש</h1>
            <p className="text-sm text-text-muted dark:text-text-dark-muted">
              אירעה שגיאה לא צפויה. נסה לרענן או לחזור למסך הראשי.
            </p>
            {import.meta.env.DEV && this.state.error ? (
              <pre className="whitespace-pre-wrap rounded-2xl border border-border dark:border-border-dark bg-surface-1/90 dark:bg-surface-1-dark/90 p-4 text-left text-xs text-text-muted dark:text-text-dark-muted">
                {this.state.error.toString()}
              </pre>
            ) : null}
            <button className="action-btn primary" type="button" onClick={this.handleReset}>
              נסה שוב
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
