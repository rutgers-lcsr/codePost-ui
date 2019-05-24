import * as React from 'react';

interface IErrorBoundaryProps {
  children: React.ReactNode;
}

interface IErrorBoundaryState {
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
  public state: Readonly<IErrorBoundaryState> = {};

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    const payload = {
      error: error.toString(),
      errorInfo,
    };

    // Log errors to server
    fetch(`${process.env.REACT_APP_API_URL}/logs/logError/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token') || ''}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.status === 200) {
          return res.json();
        } else {
          return Promise.reject(res.status);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  public render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '40px' }}>
          <h1>😬 Something went wrong</h1>
          <h2>🕑 We will investigate the issue as soon as possible.</h2>
          <h2>🙏 Feel free to try again or email us at team@codepost.io.</h2>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
