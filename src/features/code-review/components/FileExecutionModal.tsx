// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import { Modal, Tabs, Spin, Alert, Button, message, Tag, Tooltip, Empty } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  CopyOutlined,
  DownloadOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { ExecutionResult } from '../../../utils/fileExecution';
import { filesApi } from '../../../api-client/clients';
import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';

interface FileExecutionModalProps {
  open: boolean;
  onClose: () => void;
  result: ExecutionResult | null;
  isExecuting: boolean;
  error: string | null;
  fileName?: string;
  fileId?: number;
}

const LogViewer: React.FC<{
  content: string;
  language?: string;
  placeholder?: string;
  theme: { [key: string]: React.CSSProperties };
  wrapLines?: boolean;
  maxHeight?: number | string;
}> = ({ content, language = 'text', placeholder = 'No output', theme, wrapLines = true, maxHeight = '60vh' }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    message.success('Copied to clipboard');
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `execution_log_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!content) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 150,
          border: '1px dashed rgba(0,0,0,0.1)',
          borderRadius: 6,
          backgroundColor: 'rgba(0,0,0,0.02)',
        }}
      >
        <Empty description={placeholder} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 6, overflow: 'hidden' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '4px 8px',
          backgroundColor: 'rgba(0,0,0,0.03)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          gap: 8,
        }}
      >
        <Tooltip title="Copy to Clipboard">
          <Button size="small" type="text" icon={<CopyOutlined />} onClick={handleCopy} />
        </Tooltip>
        <Tooltip title="Download as Text">
          <Button size="small" type="text" icon={<DownloadOutlined />} onClick={handleDownload} />
        </Tooltip>
      </div>
      <div style={{ maxHeight, overflow: 'auto' }}>
        <SyntaxHighlighter
          language={language}
          style={theme}
          showLineNumbers={false} // Logs usually don't need line numbers unless requested
          wrapLines={wrapLines}
          wrapLongLines={wrapLines}
          customStyle={{
            margin: 0,
            padding: '12px',
            fontSize: '13px',
            lineHeight: '1.5',
            fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace",
            borderRadius: '0 0 6px 6px',
          }}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export const FileExecutionModal: React.FC<FileExecutionModalProps> = ({
  open,
  onClose,
  result,
  isExecuting,
  error,
  fileName,
  fileId,
}) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const isDark = consoleThemes.dark === consoleTheme;

  const [rawContent, setRawContent] = React.useState<string | null>(null);
  const [loadingRaw, setLoadingRaw] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('stdout');

  // Clear state when modal closes
  React.useEffect(() => {
    if (!open) {
      setRawContent(null);
      setLoadingRaw(false);
      setActiveTab('stdout');
    }
  }, [open]);

  const fetchRawContent = async () => {
    if (!fileId || loadingRaw || rawContent) return;
    setLoadingRaw(true);
    try {
      const file = await filesApi.retrieve({ id: fileId });
      if (file && file.data) {
        setRawContent(file.data);
      } else {
        setRawContent('No content available.');
      }
    } catch (err) {
      console.error('Failed to fetch raw file:', err);
      setRawContent('Failed to load raw content.');
    } finally {
      setLoadingRaw(false);
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === 'raw_notebook') {
      fetchRawContent();
    }
  };

  const isNotebook = fileName?.endsWith('.ipynb');

  const renderStatusHeader = () => {
    if (isExecuting) return null;
    if (error) return <Alert type="error" message="Execution Failed" description={error} showIcon />;
    if (!result) return null;

    const items = [
      {
        icon: result.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
        label: result.success ? 'Success' : 'Failed',
        color: result.success ? 'success' : 'error',
      },
      {
        icon: <ClockCircleOutlined />,
        label: `${result.execution_time?.toFixed(3)}s`,
        color: 'default',
      },
      result.cached
        ? {
            icon: <ThunderboltOutlined />,
            label: 'Cached Result',
            color: 'warning',
          }
        : null,
    ].filter(Boolean) as { icon: React.ReactNode; label: string; color: string }[];

    return (
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        {items.map((item, i) => (
          <Tag key={i} icon={item.icon} color={item.color} style={{ padding: '4px 10px', fontSize: 13 }}>
            {item.label}
          </Tag>
        ))}
        {result.timestamp && (
          <span style={{ marginLeft: 'auto', fontSize: 12, color: isDark ? '#aaa' : '#888' }}>
            Run at {new Date(result.timestamp).toLocaleString()}
          </span>
        )}
      </div>
    );
  };

  const codeTheme = isDark ? consoleThemes.dark.codeTheme : consoleThemes.light.codeTheme;

  const renderContent = () => {
    if (isExecuting) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Spin size="large" tip="Running code..." />
          <div style={{ marginTop: 20, color: isDark ? '#aaa' : '#666' }}>
            Sending to secure execution environment...
          </div>
        </div>
      );
    }

    if (!result && !error) {
      return <Empty description="No execution results yet." />;
    }

    const items = [
      {
        label: (
          <span>
            <FileTextOutlined /> Standard Output
          </span>
        ),
        key: 'stdout',
        children: (
          <LogViewer
            content={result?.stdout || ''}
            language="text"
            placeholder="No standard output was produced."
            theme={codeTheme}
            maxHeight="60vh"
          />
        ),
      },
      {
        label: (
          <span style={{ color: result?.stderr ? '#ff4d4f' : undefined }}>
            <CloseCircleOutlined /> Standard Error
          </span>
        ),
        key: 'stderr',
        children: (
          <LogViewer
            content={result?.stderr || ''}
            language="text"
            placeholder="No errors were logged to stderr."
            theme={codeTheme}
            maxHeight="60vh"
          />
        ),
      },
    ];

    if (result?.output_data && Object.keys(result.output_data).length > 0) {
      items.push({
        label: (
          <span>
            <CodeOutlined /> Structured Data
          </span>
        ),
        key: 'raw',
        children: (
          <LogViewer
            content={JSON.stringify(result.output_data, null, 2)}
            language="json"
            placeholder="No structured data output."
            theme={codeTheme}
            maxHeight="60vh"
          />
        ),
      });
    }

    // Check for system logs in both top-level and output_data (common in cached results)
    const systemLogs = (() => {
      if (result?.system_logs && result.system_logs.length > 0) return result.system_logs;
      if (result?.output_data && typeof result.output_data === 'object') {
        const logs = (result.output_data as Record<string, unknown>).system_logs;
        if (Array.isArray(logs) && logs.length > 0) return logs.map(String);
      }
      return [];
    })();

    if (systemLogs.length > 0) {
      items.push({
        label: (
          <span>
            <ClockCircleOutlined /> System Logs
          </span>
        ),
        key: 'system_logs',
        children: <LogViewer content={systemLogs.join('\n')} language="bash" theme={codeTheme} maxHeight="60vh" />,
      });
    }

    if (isNotebook) {
      items.push({
        label: (
          <span>
            <FileTextOutlined /> Raw Notebook
          </span>
        ),
        key: 'raw_notebook',
        children: loadingRaw ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <Spin />
          </div>
        ) : (
          <LogViewer
            content={rawContent || ''}
            language="json"
            theme={codeTheme}
            maxHeight="60vh"
            placeholder="Notebook content empty."
          />
        ),
      });
    }

    return (
      <>
        {result?.error ? (
          <Alert
            message="Runtime Error"
            description={
              <pre
                style={{
                  maxHeight: 150,
                  overflow: 'auto',
                  marginTop: 8,
                  whiteSpace: 'pre-wrap',
                  fontSize: 12,
                }}
              >
                {result.error}
              </pre>
            }
            type="error"
            showIcon
            style={{ marginBottom: 20 }}
          />
        ) : null}

        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={items}
          type="card"
          style={{ marginTop: result?.error ? 0 : 8 }}
        />
      </>
    );
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileTextOutlined />
          <span>Execution Details: {fileName || 'Unknown File'}</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={
        <Button onClick={onClose} type="primary">
          Close
        </Button>
      }
      width={900}
      centered
      destroyOnClose
      maskClosable={!isExecuting}
    >
      {renderStatusHeader()}
      {renderContent()}
    </Modal>
  );
};
