import * as React from 'react';

import { FileType, getFileContent } from '../../infrastructure/file';

import { slack } from './slack';

import { Result, Button, Collapse, Typography, Space, Card, theme, Divider } from 'antd';
import { ReloadOutlined, MailOutlined, BugOutlined, FileTextOutlined, CodeOutlined, GlobalOutlined } from '@ant-design/icons';

const { Text, Paragraph, Title } = Typography;

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

// Helper component for development debug info
const DebugInfoPanel: React.FC<{
  error?: Error;
  errorInfo?: React.ErrorInfo;
  url?: string;
  submissionID?: number;
  file?: FileType;
}> = ({ error, errorInfo, url, submissionID, file }) => {
  const { token } = theme.useToken();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const collapseItems = [
    {
      key: 'error',
      label: (
        <Space>
          <BugOutlined />
          <span>Error Details</span>
        </Space>
      ),
      children: (
        <div style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
          <Paragraph>
            <Text strong>Name:</Text> {error?.name}
          </Paragraph>
          <Paragraph>
            <Text strong>Message:</Text> {error?.message}
          </Paragraph>
          <Divider style={{ margin: '8px 0' }} />
          <Text strong>Stack Trace:</Text>
          <pre style={{
            background: token.colorBgContainer,
            padding: '12px',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '200px',
            fontSize: '11px',
          }}>
            {error?.stack}
          </pre>
        </div>
      ),
    },
    {
      key: 'component',
      label: (
        <Space>
          <CodeOutlined />
          <span>Component Stack</span>
        </Space>
      ),
      children: (
        <pre style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          whiteSpace: 'pre-wrap',
          background: token.colorBgContainer,
          padding: '12px',
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '300px',
        }}>
          {errorInfo?.componentStack}
        </pre>
      ),
    },
  ];

  // Add file content panel if file exists
  if (file) {
    collapseItems.push({
      key: 'file',
      label: (
        <Space>
          <FileTextOutlined />
          <span>File Content ({file.name})</span>
        </Space>
      ),
      children: (
        <pre style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          whiteSpace: 'pre-wrap',
          background: token.colorBgContainer,
          padding: '12px',
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '300px',
        }}>
          {getFileContent(file)}
        </pre>
      ),
    });
  }

  return (
    <Card
      size="small"
      title={
        <Space>
          <BugOutlined style={{ color: token.colorWarning }} />
          <span>Developer Debug Info</span>
        </Space>
      }
      style={{
        marginTop: '24px',
        background: token.colorBgLayout,
        border: `1px solid ${token.colorBorderSecondary}`,
        minWidth: '500px',
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <Space split={<Divider type="vertical" />}>
          <Text type="secondary">
            <GlobalOutlined /> {url}
          </Text>
          {submissionID && <Text type="secondary">Submission: {submissionID}</Text>}
          {file && <Text type="secondary">File: {file.id}</Text>}
        </Space>
        <Collapse
          items={collapseItems}
          size="small"
          style={{ marginTop: '8px' }}
        />
      </Space>
    </Card>
  );
};

// Troubleshooting blurb for cookie/permissions issues
const TroubleshootingCard: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <Card
      size="small"
      style={{
        marginTop: '24px',
        background: token.colorInfoBg,
        border: `1px solid ${token.colorInfoBorder}`,
        maxWidth: '600px',
      }}
    >
      <Title level={5} style={{ marginTop: 0 }}>⭐ Troubleshooting</Title>
      <Paragraph>
        codePost needs permission from your browser to run. Please follow these steps:
      </Paragraph>

      <Title level={5} style={{ marginBottom: '8px' }}>Google Chrome</Title>
      <ol style={{ paddingLeft: '20px', marginBottom: '16px' }}>
        <li>Open Chrome cookie settings: <Text code>chrome://settings/content/cookies</Text></li>
        <li>Click <Text strong>Allow → Add → https://codepost.cs.rutgers.edu</Text></li>
        <li>Refresh the page</li>
      </ol>

      <Title level={5} style={{ marginBottom: '8px' }}>Firefox</Title>
      <ol style={{ paddingLeft: '20px', marginBottom: 0 }}>
        <li>Open settings: <Text code>about:preferences#privacy</Text></li>
        <li>Click <Text strong>Cookies and Site Data → Manage Permissions</Text></li>
        <li>Add <Text strong>https://codepost.cs.rutgers.edu</Text> and Allow</li>
        <li>Refresh the page</li>
      </ol>
    </Card>
  );
};

class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
  public state: Readonly<IErrorBoundaryState> = {};

  // Flag to prevent infinite loops when errors occur within the ErrorBoundary itself
  private hasHandledError = false;

  // This static method is called during the render phase to update state and show fallback UI
  public static getDerivedStateFromError(error: Error): Partial<IErrorBoundaryState> {
    return {
      error,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Prevent infinite loops - only handle the first error
    if (this.hasHandledError) {
      return;
    }
    this.hasHandledError = true;

    // Store errorInfo which is only available in componentDidCatch (not in getDerivedStateFromError)
    this.setState({ errorInfo });

    const payload = {
      // Basic error info
      error: error.toString(),
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      errorDetail: JSON.stringify(error, Object.getOwnPropertyNames(error)),

      // React component stack
      componentStack: errorInfo.componentStack,

      // Context
      url: window.location.href,
      boundaryType: this.props.type,
      submissionId: this.props.submissionID ?? null,
      fileId: this.props.file?.id ?? null,
      fileName: this.props.file?.name ?? null,

      // Browser/environment info
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    };
    console.error('ErrorBoundary caught an error:', payload);
    slack(`${process.env.REACT_APP_API_URL}/logs/logError/`, payload);
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.error) {
      const showTroubleshooting = localStorage.getItem('source') !== 'codePost';

      // Compact error view for code panel
      if (this.props.type === 'codepanel') {
        return (
          <div style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: '200px',
            justifyContent: 'center',
          }}>
            <Result
              status="error"
              title="Failed to load content"
              subTitle="There was an error rendering this file. Our team has been notified."
              extra={[
                <Button key="retry" icon={<ReloadOutlined />} onClick={this.handleRefresh}>
                  Retry
                </Button>,
                <Button key="email" type="link" icon={<MailOutlined />} href="mailto:help@cs.rutgers.edu">
                  Contact Support
                </Button>,
              ]}
            />
            {showTroubleshooting && <TroubleshootingCard />}
            <DebugInfoPanel
              error={this.state.error}
              errorInfo={this.state.errorInfo}
              url={this.state.url}
              submissionID={this.props.submissionID}
              file={this.props.file}
            />
          </div>
        );
      }

      // Full-page error view for app-level errors
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          background: 'linear-gradient(180deg, #f0f2f5 0%, #ffffff 100%)',
        }}>
          <Result
            status="500"
            title="Something went wrong"
            subTitle="Our team has been notified and we're working to fix this. Please try refreshing the page."
            extra={[
              <Button key="refresh" type="primary" icon={<ReloadOutlined />} onClick={this.handleRefresh} size="large">
                Refresh Page
              </Button>,
              <Button key="home" onClick={this.handleGoHome} size="large">
                Go to Homepage
              </Button>,
              <Button key="email" type="link" icon={<MailOutlined />} href="mailto:help@cs.rutgers.edu">
                Contact Support
              </Button>,
            ]}
          />
          {showTroubleshooting && <TroubleshootingCard />}
          <DebugInfoPanel
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            url={this.state.url}
            submissionID={this.props.submissionID}
            file={this.props.file}
          />
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
