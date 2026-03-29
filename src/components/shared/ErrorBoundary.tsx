import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	static getDerivedStateFromError(error: Error): State {
		// Update state so the next render will show the fallback UI
		return {
			hasError: true,
			error,
			errorInfo: null,
		};
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// Log the error to console and external service if needed
		console.error('ErrorBoundary caught an error:', error, errorInfo);
		
		// Update state with error info
		this.setState({
			errorInfo,
		});

		// Call optional error handler
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}
	}

	handleRetry = () => {
		// Reset error state to retry rendering
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		});
	};

	handleReload = () => {
		// Reload the entire page as a last resort
		window.location.reload();
	};

	render() {
		if (this.state.hasError) {
			// Custom fallback UI if provided
			if (this.props.fallback) {
				return this.props.fallback;
			}

			// Default error UI
			return (
				<div className="min-h-screen bg-background flex items-center justify-center p-4">
					<div className="max-w-md w-full text-center space-y-6">
						<div className="space-y-2">
							<h1 className="text-2xl font-bold text-foreground">
								Something went wrong
							</h1>
							<p className="text-muted-foreground">
								We encountered an unexpected error. This might be due to a translation loading issue or a temporary glitch.
							</p>
						</div>

						{/* Error details in development */}
						{process.env.NODE_ENV === 'development' && this.state.error && (
							<details className="text-left bg-muted p-4 rounded-lg">
								<summary className="cursor-pointer font-medium mb-2">
									Error Details (Development)
								</summary>
								<pre className="text-xs overflow-auto whitespace-pre-wrap">
									{this.state.error.toString()}
									{this.state.errorInfo?.componentStack}
								</pre>
							</details>
						)}

						<div className="flex flex-col sm:flex-row gap-3 justify-center">
							<Button 
								variant="default" 
								onClick={this.handleRetry}
								className="w-full sm:w-auto"
							>
								Try Again
							</Button>
							<Button 
								variant="outline" 
								onClick={this.handleReload}
								className="w-full sm:w-auto"
							>
								Reload Page
							</Button>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
