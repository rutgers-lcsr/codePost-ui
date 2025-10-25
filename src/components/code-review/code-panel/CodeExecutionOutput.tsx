/**
 * Code Execution Output Display Component
 *
 * Displays execution results for code files (Python, JavaScript, etc.)
 * with stdout, stderr, and error output
 */

import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, CloseOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Space, Tag, Typography } from 'antd';
import React from 'react';
import { FileType } from '../../../infrastructure/file';

const { Text } = Typography;

// Design Constants
const SUCCESS_COLOR = '#52c41a';
const ERROR_COLOR = '#ff4d4f';
const WARNING_COLOR = '#faad14';
const OUTPUT_BG = '#1e1e1e';
const OUTPUT_TEXT = '#d4d4d4';
const CODE_FONT = "'Courier New', Courier, monospace";

interface CodeExecutionOutputProps {
  file: FileType;
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
    };
    cached?: boolean;
    executed_at?: string;
    executed_by?: string;
  };
  onClearOutputs?: () => void;
}

const CodeExecutionOutput: React.FC<CodeExecutionOutputProps> = ({ file, executionResult, onClearOutputs }) => {
  // Don't display if this is a notebook file (handled by Jupyter component)
  const isNotebook = file.extension?.toLowerCase() === 'ipynb';
  if (isNotebook) {
    return null;
  }

  // Don't display if the execution result is for a notebook (has cells)
  // This happens when switching from a notebook to a code file before clearing
  if (executionResult.output_data?.cells && Array.isArray(executionResult.output_data.cells)) {
    return null;
  }

  // Extract output data - handle both direct properties and nested output_data
  const stdout = executionResult.stdout || executionResult.output_data?.stdout || '';
  const stderr = executionResult.stderr || executionResult.output_data?.stderr || '';
  const error = executionResult.error || executionResult.output_data?.error || '';
  const success = executionResult.success;
  const executionTime = executionResult.execution_time || 0;

  // Don't display if there's no output
  if (!stdout && !stderr && !error) {
    return null;
  }

  // Format execution time
  const formatExecutionTime = (seconds: number): string => {
    if (seconds < 1) {
      return `${(seconds * 1000).toFixed(0)}ms`;
    }
    return `${seconds.toFixed(2)}s`;
  };

  return (
    <Card
      style={{
        marginTop: '16px',
        marginBottom: '16px',
        border: `1px solid ${success ? SUCCESS_COLOR : ERROR_COLOR}`,
        backgroundColor: success ? '#f6ffed' : '#fff2f0',
      }}
      bodyStyle={{ padding: '16px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Space>
          {success ? (
            <CheckCircleOutlined style={{ fontSize: '20px', color: SUCCESS_COLOR }} />
          ) : (
            <CloseCircleOutlined style={{ fontSize: '20px', color: ERROR_COLOR }} />
          )}
          <Text strong style={{ fontSize: '16px' }}>
            Execution Output
          </Text>
          <Tag color={success ? 'success' : 'error'}>{success ? 'Success' : 'Failed'}</Tag>
          {executionResult.cached && <Tag color="blue">Cached</Tag>}
        </Space>

        <Space>
          {executionTime > 0 && (
            <>
              <ClockCircleOutlined />
              <Text type="secondary">{formatExecutionTime(executionTime)}</Text>
            </>
          )}
          {onClearOutputs && (
            <Button size="small" icon={<CloseOutlined />} onClick={onClearOutputs}>
              Clear
            </Button>
          )}
        </Space>
      </div>

      {/* Cached execution info */}
      {executionResult.cached && executionResult.executed_at && (
        <Alert
          message={<span>Cached result from {new Date(executionResult.executed_at).toLocaleString()}</span>}
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Standard Output */}
      {stdout && (
        <div style={{ marginBottom: stderr || error ? '16px' : 0 }}>
          <Text strong style={{ display: 'block', marginBottom: '8px', color: SUCCESS_COLOR }}>
            Standard Output (stdout):
          </Text>
          <div
            style={{
              backgroundColor: OUTPUT_BG,
              color: OUTPUT_TEXT,
              padding: '16px',
              borderRadius: '4px',
              border: '1px solid #303030',
              maxHeight: '400px',
              overflowY: 'auto',
            }}
          >
            <pre
              style={{
                margin: 0,
                fontFamily: CODE_FONT,
                fontSize: '13px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {stdout}
            </pre>
          </div>
        </div>
      )}

      {/* Standard Error */}
      {stderr && (
        <div style={{ marginBottom: error ? '16px' : 0 }}>
          <Text strong style={{ display: 'block', marginBottom: '8px', color: WARNING_COLOR }}>
            Standard Error (stderr):
          </Text>
          <div
            style={{
              backgroundColor: '#fffbe6',
              padding: '16px',
              borderRadius: '4px',
              border: `1px solid ${WARNING_COLOR}`,
              maxHeight: '300px',
              overflowY: 'auto',
            }}
          >
            <pre
              style={{
                margin: 0,
                fontFamily: CODE_FONT,
                fontSize: '13px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#d48806',
              }}
            >
              {stderr}
            </pre>
          </div>
        </div>
      )}

      {/* Error Details */}
      {error && (
        <div>
          <Text strong style={{ display: 'block', marginBottom: '8px', color: ERROR_COLOR }}>
            Error:
          </Text>
          <Alert
            message={error}
            type="error"
            showIcon
            style={{
              fontFamily: CODE_FONT,
              fontSize: '13px',
            }}
          />
        </div>
      )}
    </Card>
  );
};

export default CodeExecutionOutput;
