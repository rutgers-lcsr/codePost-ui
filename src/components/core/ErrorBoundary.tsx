// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import { FileType, getFileContent } from '../../utils/file';

import { Logger } from '../../utils/logger';

import { Result, Button, Collapse, Typography, Space, Card, theme, Divider } from 'antd';
import {
  ReloadOutlined,
  MailOutlined,
  BugOutlined,
  FileTextOutlined,
  CodeOutlined,
  GlobalOutlined,
} from '@ant-design/icons';

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

// ── Sensitive data helpers ────────────────────────────────────────────────────
// Keys matching these patterns are excluded from storage key listings.
const SENSITIVE_KEY_RE = /token|auth|jwt|secret|password|credential|bearer|api[_-]?key/i;

/**
 * Redact common credential patterns from a log string so auth tokens are never
 * persisted in the error report.
 */
function redactSensitiveData(str: string): string {
  return (
    str
      // Bearer / Token header values
      .replace(/\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]')
      // JWT (three base64url segments)
      .replace(/eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_.+/]*/g, '[REDACTED_JWT]')
      // key/token/auth/Authorization followed by = or : and a value
      .replace(/\b(token|api[_\-]?key|auth|authorization)(\s*[:=]\s*["']?)([^\s"',}\]]+)/gi, '$1$2[REDACTED]')
  );
}

// ── Console interceptor ────────────────────────────────────────────────────────
// Captures the last 30 console errors/warnings so they're available at crash time.
const MAX_CONSOLE_LOGS = 30;
const recentConsoleLogs: Array<{ level: string; message: string; at: string }> = [];

/** Serialize a single console argument to a readable string. */
function serializeArg(a: unknown): string {
  if (typeof a === 'string') return a;
  if (a instanceof Error) return `[Error: ${a.message}]`;
  try {
    const s = JSON.stringify(a);
    return s !== undefined ? s : String(a);
  } catch {
    return String(a);
  }
}

/**
 * Perform printf-style substitution on console arguments.
 * Handles %s, %o/%O, %d/%i, %f, %c — matching browser DevTools behaviour.
 * Falls back to space-joining when the first arg is not a format string.
 */
function formatConsoleArgs(args: unknown[]): string {
  if (args.length === 0) return '';

  if (typeof args[0] === 'string' && /%[oOsdifc]/.test(args[0])) {
    let i = 1;
    const formatted = args[0].replace(/%([oOsdifc])/g, (_match, spec: string): string => {
      if (i >= args.length) return `%${spec}`;
      const val = args[i++];
      switch (spec) {
        case 'o':
        case 'O':
          return serializeArg(val);
        case 's':
          return String(val);
        case 'd':
        case 'i':
          return String(Math.trunc(Number(val)));
        case 'f':
          return String(Number(val));
        case 'c':
          return ''; // CSS styling — discard
        default:
          return `%${spec}`;
      }
    });
    // Append any surplus args that had no matching specifier
    const surplus = args.slice(i).map(serializeArg);
    return surplus.length ? `${formatted} ${surplus.join(' ')}` : formatted;
  }

  return args.map(serializeArg).join(' ');
}

if (typeof window !== 'undefined') {
  (['error', 'warn'] as const).forEach((level) => {
    const original = console[level].bind(console) as (...args: unknown[]) => void;
    console[level] = (...args: unknown[]) => {
      const raw = formatConsoleArgs(args);
      recentConsoleLogs.push({
        level,
        message: redactSensitiveData(raw),
        at: new Date().toISOString(),
      });
      if (recentConsoleLogs.length > MAX_CONSOLE_LOGS) recentConsoleLogs.shift();
      original(...args);
    };
  });
}

// ── Pre-crash screenshot ───────────────────────────────────────────────────────
// Capture a screenshot so we have a snapshot of the page *before* the error
// boundary fallback UI renders. Strategy:
//   • Once, 4 s after page load (initial state)
//   • Every 5 minutes as a background safety net
//   • On user activity (click / keydown), throttled to at most once per 60 s
//     so idle sessions pay no cost but active sessions stay up-to-date.
let lastScreenshot: string | null = null;
let screenshotBusy = false;
let lastCaptureTime = 0;

async function captureScreenshot(): Promise<void> {
  if (screenshotBusy) return;
  screenshotBusy = true;
  try {
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await Promise.race<HTMLCanvasElement>([
      html2canvas(document.body, { logging: false, allowTaint: true, useCORS: true }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ]);
    lastScreenshot = canvas.toDataURL('image/jpeg', 0.5);
    lastCaptureTime = Date.now();
  } catch {
    // keep previous screenshot on failure
  } finally {
    screenshotBusy = false;
  }
}

if (typeof window !== 'undefined') {
  // Initial capture once the page has settled
  setTimeout(() => void captureScreenshot(), 4000);
  // Background safety net every 5 minutes
  setInterval(() => void captureScreenshot(), 5 * 60_000);
  // On user activity, capture at most once per 60 s
  const onActivity = () => {
    if (Date.now() - lastCaptureTime > 60_000) {
      void captureScreenshot();
    }
  };
  window.addEventListener('click', onActivity, { passive: true });
  window.addEventListener('keydown', onActivity, { passive: true });
}

// ── Browser context helper ─────────────────────────────────────────────────────
function gatherBrowserContext() {
  const timing: Record<string, number> = {};
  try {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    if (nav) {
      timing.domContentLoadedMs = Math.round(nav.domContentLoadedEventEnd - nav.startTime);
      timing.pageLoadMs = Math.round(nav.loadEventEnd - nav.startTime);
      timing.ttfbMs = Math.round(nav.responseStart - nav.startTime);
      timing.dnsMs = Math.round(nav.domainLookupEnd - nav.domainLookupStart);
      timing.connectMs = Math.round(nav.connectEnd - nav.connectStart);
    }
  } catch {
    /* ignore */
  }

  const memory: Record<string, unknown> = {};
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mem = (performance as any).memory;
    if (mem) {
      memory.usedJSHeapSizeMB = Math.round(mem.usedJSHeapSize / 1048576);
      memory.totalJSHeapSizeMB = Math.round(mem.totalJSHeapSize / 1048576);
      memory.jsHeapSizeLimitMB = Math.round(mem.jsHeapSizeLimit / 1048576);
    }
  } catch {
    /* ignore */
  }

  const connection: Record<string, unknown> = {};
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conn =
      (navigator as any).connection ?? (navigator as any).mozConnection ?? (navigator as any).webkitConnection;
    if (conn) {
      connection.effectiveType = conn.effectiveType;
      connection.downlinkMbps = conn.downlink;
      connection.rttMs = conn.rtt;
      connection.saveData = conn.saveData;
    }
  } catch {
    /* ignore */
  }

  let localStorageKeys: Record<string, string> = {};
  let sessionStorageKeys: Record<string, string> = {};
  const storageVal = (store: Storage, key: string): string => {
    const v = store.getItem(key) ?? '';
    return v.length > 80 ? `${v.slice(0, 80)}…` : v;
  };
  try {
    Object.keys(localStorage)
      .filter((k) => !SENSITIVE_KEY_RE.test(k))
      .forEach((k) => {
        localStorageKeys[k] = storageVal(localStorage, k);
      });
  } catch {
    /* ignore */
  }
  try {
    Object.keys(sessionStorage)
      .filter((k) => !SENSITIVE_KEY_RE.test(k))
      .forEach((k) => {
        sessionStorageKeys[k] = storageVal(sessionStorage, k);
      });
  } catch {
    /* ignore */
  }

  // Recent failed resource loads (images, scripts, etc.)
  const failedResources: string[] = [];
  try {
    performance.getEntriesByType('resource').forEach((entry) => {
      const r = entry as PerformanceResourceTiming;
      if (r.transferSize === 0 && r.decodedBodySize === 0 && r.duration === 0) {
        failedResources.push(r.name);
      }
    });
  } catch {
    /* ignore */
  }

  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    maxTouchPoints: navigator.maxTouchPoints,
    cookiesEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    screen: {
      resolution: `${screen.width}x${screen.height}`,
      available: `${screen.availWidth}x${screen.availHeight}`,
      devicePixelRatio: window.devicePixelRatio,
      colorDepth: screen.colorDepth,
    },
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    referrer: document.referrer || null,
    timeOnPageSeconds: Math.round(performance.now() / 1000),
    localStorageKeys,
    sessionStorageKeys,
    timing,
    memory,
    connection,
    failedResources: failedResources.slice(-10),
  };
}

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

    const basePayload = {
      error: error.toString(),
      errorDetail: JSON.stringify(
        {
          // ── Error ──────────────────────────────────────────────────────────
          name: error.name,
          message: error.message,
          stack: error.stack,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cause: (error as any).cause ?? null,

          // ── React context ──────────────────────────────────────────────────
          componentStack: errorInfo.componentStack,
          boundaryType: this.props.type,
          submissionId: this.props.submissionID ?? null,
          fileId: this.props.file?.id ?? null,
          fileName: this.props.file?.name ?? null,

          // ── Browser & environment ──────────────────────────────────────────
          timestamp: new Date().toISOString(),
          ...gatherBrowserContext(),

          // ── Recent console errors / warnings before crash ──────────────────
          recentConsoleLogs: [...recentConsoleLogs],
        },
        null,
        2,
      ),
      url: window.location.href,
    };

    console.error('ErrorBoundary caught an error:', basePayload);

    // Use the last periodic pre-crash screenshot (captured before the fallback UI rendered)
    Logger.errorFull({ ...basePayload, screenshot: lastScreenshot ?? undefined });
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
