import * as React from 'react';

import { FileType } from '../../infrastructure/file';

import { slack } from './slack';

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
  url?: string;
}

class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
  public state: Readonly<IErrorBoundaryState> = {};

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
      url: window.location.href,
    });

    const payload = {
      error: error.toString(),
      errorDetail: JSON.stringify(error, Object.getOwnPropertyNames(error)),
      url: window.location.href,
    };

    slack(`${process.env.REACT_APP_API_URL}/logs/logError/`, payload);
  }

  public render() {
    if (this.state.error) {
      const siteDataSettingsBlurb = (
        <div
          style={{
            backgroundColor: 'lightblue',
            borderRadius: '4px',
            padding: '16px',
            boxShadow: '0 4px 8px 0 rgba(0,0,0,0.2)',
          }}
        >
          <h2>⭐ Troubleshooting</h2>
          <br />
          <div style={{ fontSize: '18px' }}>
            <div>
              codePost needs permission from your browser to run. Please follow these steps for your current browser...
            </div>
            <br />
            <b>Google Chrome:</b>
            <ul>
              <li>
                Open up Chrome cookie settings:{' '}
                <a href="chrome://settings/content/cookies">chrome://settings/content/cookies</a>
              </li>
              <li>
                Click Allow -> Add -> https://codepost.cs.rutgers.edu
                <br />
                See a screenshot here:{' '}
                <a href="https://share.getcloudapp.com/eDu69Dnz">https://share.getcloudapp.com/eDu69Dnz</a>
              </li>
              <li>Try refreshing!</li>
            </ul>
            <br />
            <b>Firefox:</b>
            <ul>
              <li>
                Open up Firefox cookie settings: <a href="about:preferences#privacy">about:preferences#privacy</a>
              </li>
              <li>Click Cookies and Site Data -> Manage Permissions</li>
              <li>Type in https://codepost.cs.rutgers.edu -> Allow -> Save Changes</li>
              <li>Try refreshing!</li>
            </ul>
          </div>
        </div>
      );

      if (this.props.type === 'codepanel') {
        return (
          <div style={{ padding: '40px' }}>
            <h1>Something went wrong</h1>
            <h2>
              <span role="img" aria-label="downvote">
                🕑
              </span>{' '}
              Our team has been notified, and we will investigate the issue as soon as possible.
            </h2>
            <h2>
              <span role="img" aria-label="downvote">
                🙏
              </span>{' '}
              Feel free to try again, or email us at team@codepost.io.
            </h2>
            <br />
            {localStorage.getItem('source') !== 'codePost' ? siteDataSettingsBlurb : null}
            <br />
            <div style={{ padding: '50px' }}>
              <h3>Details:</h3>
              <div style={{ paddingTop: '20px' }}>
                <h4>Submission ID: {this.props.submissionID ? this.props.submissionID : '?'}</h4>
                <h4>File ID: {this.props.file ? this.props.file.id : '?'}</h4>
                <Collapse>
                  <Panel header="File Code" key="1">
                    <p style={{ maxHeight: '280px', overflow: 'auto' }}>
                      {this.props.file ? this.props.file.code : '?'}
                    </p>
                  </Panel>
                  <Panel header="Error Info" key="2">
                    <p style={{ maxHeight: '280px', overflow: 'auto' }}>
                      {this.state.error ? this.state.error.toString() : '...'}
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
            <h1>Something went wrong.</h1>
            <h2>
              <span role="img" aria-label="downvote">
                🕑
              </span>{' '}
              Our team has been notified, and we will investigate the issue as soon as possible.
            </h2>
            {localStorage.getItem('source') !== 'codePost' ? (
              siteDataSettingsBlurb
            ) : (
              <h2>
                <span role="img" aria-label="downvote">
                  🙏
                </span>{' '}
                Try refreshing the page to get back to codePost! Or,{' '}
                <b>try switching to Chrome if you're using a different browser</b>. If that doesn't work, email us at{' '}
                <a href="mailto:team@codepost.io">team@codepost.io</a> if the problem persists.
              </h2>
            )}
          </div>
        );
      }
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
