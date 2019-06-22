import * as React from 'react';

import { FileType } from './infrastructure/file';

import { Collapse } from 'antd';

const { Panel } = Collapse;

type ErrorBoundaryType = 'app' | 'codepanel';

interface IErrorBoundaryProps {
  children: React.ReactNode;
  type: ErrorBoundaryType;
  submissionID?: number;
  file?: FileType;
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
      if (this.props.type === 'codepanel') {
        return (
          <div style={{ padding: '40px' }}>
            <h1>😬 Something went wrong</h1>
            <h2>🕑 We will investigate the issue as soon as possible.</h2>
            <h2>🙏 Feel free to try again or email us at team@codepost.io.</h2>
            <br />
            <br />
            <div style={{ padding: '50px' }}>
              <h3>Details:</h3>
              <div style={{ paddingTop: '20px' }}>
                <h4>Submission ID: {this.props.submissionID ? this.props.submissionID : '?'}</h4>
                <h4>File ID: {this.props.file ? this.props.file.id : '?'}</h4>
                <Collapse>
                  <Panel header="Code at fault" key="1">
                    <p style={{ maxHeight: '280px', overflow: 'scroll' }}>
                      {this.props.file ? this.props.file.code : '?'}
                    </p>
                  </Panel>
                </Collapse>
              </div>
            </div>
          </div>
        );
      } else {
        return (
          <div style={{ padding: '40px' }}>
            <h1>😬 Something went wrong</h1>
            <h2>🕑 We will investigate the issue as soon as possible.</h2>
            <h2>🙏 Feel free to try again or email us at team@codepost.io.</h2>
          </div>
        );
      }
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
