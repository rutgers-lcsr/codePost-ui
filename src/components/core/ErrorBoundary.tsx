// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import { FileType, getFileContent } from '../../utils/file';

import { Logger, getDiagnosticConsent, setDiagnosticConsent } from '../../utils/logger';
import {
  gatherBrowserContext,
  getLastScreenshot,
  recentConsoleLogs,
  stopScreenshotTimer,
} from '../../utils/diagnostics';

import { Result, Button, Collapse, Typography, Space, Card, theme, Divider, Modal } from 'antd';
import {
  ReloadOutlined,
  MailOutlined,
  BugOutlined,
  FileTextOutlined,
  CodeOutlined,
  GlobalOutlined,
  CameraOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const { Text, Paragraph, Title } = Typography;

type ErrorBoundaryType = 'app' | 'codepanel';

interface IErrorBoundaryProps {
  children: React.ReactNode;
  type: ErrorBoundaryType;
  submissionID?: number;
  file?: FileType;
}

type DiagnosticConsentState = 'pending' | 'previewing-screenshot' | 'accepted' | 'declined';

interface IErrorBoundaryState {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  url?: string;
  /** Controls the consent UI for sending diagnostic details */
  diagnosticConsent?: DiagnosticConsentState;
  /** Full error payload assembled at crash time, sent only on consent */
  pendingPayload?: { error: string; errorDetail: string; url: string; screenshot?: string };
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
          <pre
            style={{
              background: token.colorBgContainer,
              padding: '12px',
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '200px',
              fontSize: '11px',
            }}
          >
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
        <pre
          style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            whiteSpace: 'pre-wrap',
            background: token.colorBgContainer,
            padding: '12px',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '300px',
          }}
        >
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
        <pre
          style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            whiteSpace: 'pre-wrap',
            background: token.colorBgContainer,
            padding: '12px',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '300px',
          }}
        >
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
        <Collapse items={collapseItems} size="small" style={{ marginTop: '8px' }} />
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
      <Title level={5} style={{ marginTop: 0 }}>
        ⭐ Troubleshooting
      </Title>
      <Paragraph>codePost needs permission from your browser to run. Please follow these steps:</Paragraph>

      <Title level={5} style={{ marginBottom: '8px' }}>
        Google Chrome
      </Title>
      <ol style={{ paddingLeft: '20px', marginBottom: '16px' }}>
        <li>
          Open Chrome cookie settings: <Text code>chrome://settings/content/cookies</Text>
        </li>
        <li>
          Click <Text strong>Allow → Add → https://codepost.cs.rutgers.edu</Text>
        </li>
        <li>Refresh the page</li>
      </ol>

      <Title level={5} style={{ marginBottom: '8px' }}>
        Firefox
      </Title>
      <ol style={{ paddingLeft: '20px', marginBottom: 0 }}>
        <li>
          Open settings: <Text code>about:preferences#privacy</Text>
        </li>
        <li>
          Click <Text strong>Cookies and Site Data → Manage Permissions</Text>
        </li>
        <li>
          Add <Text strong>https://codepost.cs.rutgers.edu</Text> and Allow
        </li>
        <li>Refresh the page</li>
      </ol>
    </Card>
  );
};

class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
  public state: Readonly<IErrorBoundaryState> = {};

  // Flag to prevent infinite loops when errors occur within the ErrorBoundary itself
  private hasHandledError = false;

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

    // Stop the periodic screenshot timer — we've crashed
    stopScreenshotTimer();

    // ── Always send: bare error string only (no identifying info) ──
    Logger.errorMinimal(error.toString());

    // Assemble the full diagnostic payload but do NOT send it yet
    const fullPayload = {
      error: error.toString(),
      errorDetail: JSON.stringify(
        {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: (error as any).cause ?? null,
          componentStack: errorInfo.componentStack,
          boundaryType: this.props.type,
          submissionId: this.props.submissionID ?? null,
          fileId: this.props.file?.id ?? null,
          fileName: this.props.file?.name ?? null,
          timestamp: new Date().toISOString(),
          ...gatherBrowserContext(),
          recentConsoleLogs: [...recentConsoleLogs],
        },
        null,
        2,
      ),
      url: window.location.href,
      screenshot: getLastScreenshot() ?? undefined,
    };

    console.error('ErrorBoundary caught an error:', error.toString());

    // If user previously consented, send everything immediately
    if (getDiagnosticConsent() === 'accepted') {
      Logger.errorFull(fullPayload);
      this.setState({ diagnosticConsent: 'accepted' });
    } else {
      // Store payload and wait for consent
      this.setState({ diagnosticConsent: 'pending', pendingPayload: fullPayload });
    }
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handlePreviewScreenshot = () => {
    this.setState({ diagnosticConsent: 'previewing-screenshot' });
  };

  private handleDiagnosticConsent = () => {
    setDiagnosticConsent('accepted');
    this.setState({ diagnosticConsent: 'accepted' });
    const payload = this.state.pendingPayload;
    if (payload) {
      Logger.errorFull(payload);
    }
  };

  private handleDiagnosticDecline = () => {
    setDiagnosticConsent('declined');
    this.setState({ diagnosticConsent: 'declined' });
    Logger.clearQueue();
  };

  private renderDiagnosticConsent() {
    const { diagnosticConsent } = this.state;
    if (!diagnosticConsent || diagnosticConsent === 'declined') return null;

    if (diagnosticConsent === 'accepted') {
      return (
        <Card
          size="small"
          style={{
            marginTop: '16px',
            maxWidth: '500px',
            border: '1px solid #b7eb8f',
            background: '#f6ffed',
          }}
        >
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <Text>Diagnostic details sent. Thank you for helping us improve codePost!</Text>
          </Space>
        </Card>
      );
    }

    return (
      <>
        <Card
          size="small"
          style={{
            marginTop: '16px',
            maxWidth: '500px',
            border: '1px solid #91caff',
            background: '#e6f4ff',
          }}
        >
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space>
              <BugOutlined style={{ color: '#1677ff' }} />
              <Text strong>Help us fix this</Text>
            </Space>
            <Text>
              Would you like to share diagnostic details with the codePost team? This includes a screenshot of what you
              were seeing, your browser info, and technical error details. No personal data is shared beyond what is
              visible on screen.
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Your preference will be remembered for future errors.
            </Text>
            <Space style={{ marginTop: '4px' }}>
              <Button type="primary" size="small" icon={<BugOutlined />} onClick={this.handleDiagnosticConsent}>
                Share Diagnostics
              </Button>
              {getLastScreenshot() && (
                <Button size="small" icon={<CameraOutlined />} onClick={this.handlePreviewScreenshot}>
                  Preview Screenshot
                </Button>
              )}
              <Button size="small" onClick={this.handleDiagnosticDecline}>
                No Thanks
              </Button>
            </Space>
          </Space>
        </Card>
        <Modal
          open={diagnosticConsent === 'previewing-screenshot'}
          title="Screenshot Preview"
          onOk={this.handleDiagnosticConsent}
          onCancel={() => this.setState({ diagnosticConsent: 'pending' })}
          okText="Share Diagnostics"
          cancelText="Back"
          width={720}
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Text type="secondary">
              This is the screenshot that will be included with the diagnostic report. It shows what was on screen
              shortly before the error occurred.
            </Text>
            {getLastScreenshot() && (
              <img
                src={getLastScreenshot()!}
                alt="Screenshot preview"
                style={{
                  width: '100%',
                  borderRadius: '8px',
                  border: '1px solid #d9d9d9',
                }}
              />
            )}
          </Space>
        </Modal>
      </>
    );
  }

  public render() {
    if (this.state.error) {
      const showTroubleshooting = localStorage.getItem('source') !== 'codePost';

      // Compact error view for code panel
      if (this.props.type === 'codepanel') {
        return (
          <div
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minHeight: '200px',
              justifyContent: 'center',
            }}
          >
            <Result
              status="error"
              title="Failed to load content"
              subTitle="There was an error rendering this file. Our team has been notified."
              extra={[
                <Button key="retry" icon={<ReloadOutlined />} onClick={this.handleRefresh}>
                  Retry
                </Button>,
                <Button key="email" type="link" icon={<MailOutlined />} href="mailto:codepost@cs.rutgers.edu">
                  Contact Support
                </Button>,
              ]}
            />
            {this.renderDiagnosticConsent()}
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
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            background: 'linear-gradient(180deg, #f0f2f5 0%, #ffffff 100%)',
          }}
        >
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
              <Button key="email" type="link" icon={<MailOutlined />} href="mailto:codepost@cs.rutgers.edu">
                Contact Support
              </Button>,
            ]}
          />
          {this.renderDiagnosticConsent()}
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
