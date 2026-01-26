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
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>משהו השתבש</h1>
          <p>אירעה שגיאה לא צפויה באפליקציה.</p>
          {import.meta.env.DEV && this.state.error ? (
            <pre>{this.state.error.toString()}</pre>
          ) : null}
          <button type="button" onClick={this.handleReset}>
            נסה שוב
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
