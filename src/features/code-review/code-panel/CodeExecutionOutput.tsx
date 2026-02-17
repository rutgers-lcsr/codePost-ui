import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  CodeOutlined,
  FileImageOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Space, Tabs, Tag, Typography } from 'antd';
import React, { useMemo } from 'react';
import { File as CodePostFile, type FileType } from '../../../utils/file';

const { Text } = Typography;

// Design Constants
const SUCCESS_COLOR = '#52c41a';
const ERROR_COLOR = '#ff4d4f';
const WARNING_COLOR = '#faad14';
const TERMINAL_BG = '#1e1e1e';
const TERMINAL_TEXT = '#f0f0f0';
const CODE_FONT = "'Courier New', Courier, monospace";

interface CodeExecutionOutputProps {
  file?: FileType;
  fileName?: string;
  executionResult: {
    success: boolean;
    stdout?: string;
    stderr?: string;
    error?: string;
    execution_time?: number;
    output_data?: {
      cells?: unknown[];
      stdout?: string;
      stderr?: string;
      error?: string;
      [key: string]: any; // Allow other keys like image/png
    };
    cached?: boolean;
    executed_at?: string;
    executed_by?: string;
  };
  onClearOutputs?: () => void;
}

// Helper Component for Terminal Block
const TerminalBlock = ({ content, type }: { content: string; type: 'stdout' | 'stderr' }) => (
  <div style={{ marginBottom: '16px' }}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '4px',
        color: type === 'stderr' ? WARNING_COLOR : '#8c8c8c',
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      <span>{type === 'stderr' ? 'Standard Error' : 'Standard Output'}</span>
    </div>
    <div
      style={{
        backgroundColor: TERMINAL_BG,
        color: type === 'stderr' ? '#ffccc7' : TERMINAL_TEXT,
        padding: '12px',
        borderRadius: '6px',
        border: `1px solid ${type === 'stderr' ? '#431418' : '#303030'}`,
        maxHeight: '400px',
        overflowY: 'auto',
        fontSize: '13px',
        fontFamily: CODE_FONT,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.2)',
      }}
    >
      {content}
    </div>
  </div>
);

// Helper to render a single image
const renderImage = (base64: string, index: number, outputImages: string[] | undefined) => (
  <div key={index} style={{ marginBottom: '24px', textAlign: 'center' }}>
    <img
      src={`data:image/png;base64,${base64}`}
      alt={`Execution Plot ${index + 1}`}
      style={{
        maxWidth: '100%',
        maxHeight: '600px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: '1px solid #f0f0f0',
      }}
    />
    {outputImages && outputImages.length > 1 && (
      <div style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '12px' }}>
        Image {index + 1} of {outputImages.length}
      </div>
    )}
  </div>
);

const CodeExecutionOutput: React.FC<CodeExecutionOutputProps> = ({
  file,
  fileName,
  executionResult,
  onClearOutputs,
}) => {
  // Determine if notebook
  const ext = file?.extension || CodePostFile.extension(fileName || '');
  const isNotebook = ext?.toLowerCase() === 'ipynb';

  // Extract output data
  const stdout = executionResult.stdout || executionResult.output_data?.stdout || '';
  const stderr = executionResult.stderr || executionResult.output_data?.stderr || '';
  const error = executionResult.error || executionResult.output_data?.error || '';
  const outputImage = executionResult.output_data?.['image/png'];
  const outputImages = executionResult.output_data?.['images'] as string[] | undefined;
  const success = executionResult.success;
  const executionTime = executionResult.execution_time || 0;

  // Early returns
  // Early returns
  // if (isNotebook) return null; // Allow notebooks to show console output
  // if (executionResult.output_data?.cells && Array.isArray(executionResult.output_data.cells)) return null; // Allow cells if implemented

  const hasImages = (outputImages && outputImages.length > 0) || !!outputImage;

  // Determine active tab
  const defaultActiveKey = useMemo(() => {
    if (hasImages) return 'plot';
    if (error) return 'console'; // Show console if error (to see traceback)
    return 'console';
  }, [hasImages, error]);

  if (!stdout && !stderr && !error && !hasImages) return null;

  // Format execution time
  const formatExecutionTime = (seconds: number): string => {
    return seconds < 1 ? `${(seconds * 1000).toFixed(0)}ms` : `${seconds.toFixed(2)}s`;
  };

  return (
    <Card
      style={{
        marginTop: '16px',
        marginBottom: '16px',
        borderRadius: '8px',
        border: '1px solid #d9d9d9',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        overflow: 'hidden',
      }}
      bodyStyle={{ padding: 0 }}
    >
      {/* Header Bar */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#fafafa',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Space>
          {success ? (
            <CheckCircleOutlined style={{ fontSize: '18px', color: SUCCESS_COLOR }} />
          ) : (
            <CloseCircleOutlined style={{ fontSize: '18px', color: ERROR_COLOR }} />
          )}
          <Text strong style={{ fontSize: '14px' }}>
            Result
          </Text>
          <Tag color={success ? 'success' : 'error'} style={{ borderRadius: '4px', marginLeft: '8px' }}>
            {success ? 'Success' : 'Failed'}
          </Tag>
          {executionTime > 0 && <Tag icon={<ClockCircleOutlined />}>{formatExecutionTime(executionTime)}</Tag>}
          {executionResult.cached && <Tag color="blue">Cached</Tag>}
          {isNotebook && <Tag color="purple">Notebook</Tag>}
        </Space>
        {onClearOutputs && (
          <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClearOutputs} danger>
            Clear
          </Button>
        )}
      </div>

      {error && (
        <Alert
          message="Execution Error"
          description={error}
          type="error"
          showIcon
          banner
          style={{ borderBottom: '1px solid #ffccc7' }}
        />
      )}

      {/* Content Tabs */}
      <Tabs
        defaultActiveKey={defaultActiveKey}
        tabBarStyle={{ paddingLeft: '16px', marginBottom: 0 }}
        items={[
          // Tab 1: Image (Conditional)
          ...(hasImages
            ? [
                {
                  key: 'plot',
                  label: (
                    <span>
                      <FileImageOutlined /> Image
                      {outputImages && outputImages.length > 1 ? `s (${outputImages.length})` : ''}
                    </span>
                  ),
                  children: (
                    <div style={{ padding: '24px', backgroundColor: '#fff' }}>
                      {outputImages && outputImages.length > 0
                        ? outputImages.map((img, idx) => renderImage(img, idx, outputImages))
                        : outputImage && renderImage(outputImage, 0, outputImages)}
                    </div>
                  ),
                },
              ]
            : []),
          // Tab 2: Console Output
          {
            key: 'console',
            label: (
              <span>
                <CodeOutlined /> Console
              </span>
            ),
            children: (
              <div style={{ padding: '20px' }}>
                {!stdout && !stderr && (
                  <Text type="secondary" italic>
                    No text output produced.
                  </Text>
                )}
                {stdout && <TerminalBlock content={stdout} type="stdout" />}
                {stderr && <TerminalBlock content={stderr} type="stderr" />}
              </div>
            ),
          },
        ]}
      />
    </Card>
  );
};

export default CodeExecutionOutput;
