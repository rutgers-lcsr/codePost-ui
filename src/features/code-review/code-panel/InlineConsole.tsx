// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * Inline Console Component
 *
 * Shows execution output inline below the code, similar to an IDE
 */

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DownOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Alert, Button, Space, Tag, Typography } from 'antd';
import React, { useCallback, useState } from 'react';

import { executeFile } from '../execution/execution';
import type { FileType } from '../../../utils/file';

const { Text } = Typography;

// Design Constants
const SUCCESS_COLOR = '#52c41a';
const ERROR_COLOR = '#ff4d4f';
const CONSOLE_BG = '#1e1e1e';
const CONSOLE_TEXT = '#d4d4d4';
const CODE_FONT = "'Courier New', Courier, monospace";

interface InlineConsoleProps {
  file: FileType;
  readOnly?: boolean;
}

interface ExecutionResultData {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string | null;
  execution_time: number;
  timestamp: string;
}

const InlineConsole: React.FC<InlineConsoleProps> = ({ file, readOnly = false }) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<ExecutionResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle execution
  const handleExecute = useCallback(async () => {
    if (!file.id || isExecuting) return;

    setIsExecuting(true);
    setError(null);
    setIsOpen(true); // Auto-open console when executing

    try {
      const executionResult = await executeFile({
        file_id: file.id,
        timeout: 30,
      });

      setResult(executionResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute code';
      setError(errorMessage);
      setResult(null);
    } finally {
      setIsExecuting(false);
    }
  }, [file.id, isExecuting]);

  // Format execution time
  const formatExecutionTime = (seconds: number): string => {
    if (seconds < 1) {
      return `${(seconds * 1000).toFixed(0)}ms`;
    }
    return `${seconds.toFixed(2)}s`;
  };

  return (
    <div style={{ borderTop: '1px solid #d9d9d9' }}>
      {/* Console Header / Toggle Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          backgroundColor: '#fafafa',
          borderBottom: isOpen ? '1px solid #d9d9d9' : 'none',
          cursor: 'pointer',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Space>
          {isOpen ? <DownOutlined style={{ fontSize: '12px' }} /> : <RightOutlined style={{ fontSize: '12px' }} />}
          <Text strong style={{ fontSize: '14px' }}>
            Console
          </Text>
          {result && !isExecuting && (
            <Tag
              color={result.success ? 'success' : 'error'}
              style={{ margin: 0 }}
              icon={result.success ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            >
              {result.success ? 'Success' : 'Failed'}
            </Tag>
          )}
          {result && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {formatExecutionTime(result.execution_time)}
            </Text>
          )}
        </Space>

        <Button
          type="primary"
          size="small"
          icon={isExecuting ? <LoadingOutlined /> : <PlayCircleOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            handleExecute();
          }}
          loading={isExecuting}
          disabled={readOnly || isExecuting}
        >
          {isExecuting ? 'Running...' : 'Run Code'}
        </Button>
      </div>

      {/* Console Content */}
      {isOpen && (
        <div
          style={{
            backgroundColor: CONSOLE_BG,
            color: CONSOLE_TEXT,
            fontFamily: CODE_FONT,
            fontSize: '13px',
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {/* Error Message */}
          {error && (
            <div style={{ padding: '16px' }}>
              <Alert title="Execution Error" description={error} type="error" showIcon />
            </div>
          )}

          {/* Execution Results */}
          {result && (
            <div>
              {/* Standard Output */}
              {result.stdout && (
                <div style={{ borderBottom: result.stderr || result.error ? '1px solid #3e3e3e' : 'none' }}>
                  <div
                    style={{
                      padding: '4px 16px',
                      backgroundColor: '#2d2d2d',
                      borderBottom: '1px solid #3e3e3e',
                      fontSize: '11px',
                      color: '#999',
                    }}
                  >
                    STDOUT
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: '12px 16px',
                      whiteSpace: 'pre-wrap',
                      color: CONSOLE_TEXT,
                    }}
                  >
                    {result.stdout}
                  </pre>
                </div>
              )}
              {/** If error and stderr exist prefer error */}
              {/* Standard Error */}
              {result.stderr && !result.error && (
                <div style={{ borderBottom: result.error ? '1px solid #3e3e3e' : 'none' }}>
                  <div
                    style={{
                      padding: '4px 16px',
                      backgroundColor: '#2d2d2d',
                      borderBottom: '1px solid #3e3e3e',
                      fontSize: '11px',
                      color: '#999',
                    }}
                  >
                    STDERR
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      padding: '12px 16px',
                      whiteSpace: 'pre-wrap',
                      color: '#f48771',
                    }}
                  >
                    {result.stderr}
                  </pre>
                </div>
              )}

              {/* Error Details */}
              {result.error && (
                <div>
                  <div
                    style={{
                      padding: '4px 16px',
                      backgroundColor: '#2d2d2d',
                      borderBottom: '1px solid #3e3e3e',
                      fontSize: '11px',
                      color: '#999',
                    }}
                  >
                    ERROR
                  </div>
                  <div style={{ padding: '12px 16px' }}>
                    <Text style={{ color: ERROR_COLOR, fontFamily: CODE_FONT, fontSize: '13px' }}>{result.error}</Text>
                  </div>
                </div>
              )}

              {/* Success message if no output */}
              {!result.stdout && !result.stderr && !result.error && result.success && (
                <div style={{ padding: '16px', textAlign: 'center', color: '#999' }}>
                  <CheckCircleOutlined style={{ fontSize: '24px', color: SUCCESS_COLOR, marginBottom: '8px' }} />
                  <div>Code executed successfully with no output</div>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!result && !error && !isExecuting && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#666' }}>
              <PlayCircleOutlined style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.5 }} />
              <div>Click "Run Code" to execute this file</div>
            </div>
          )}

          {/* Executing state */}
          {isExecuting && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#999' }}>
              <LoadingOutlined style={{ fontSize: '32px', marginBottom: '12px' }} />
              <div>Executing code...</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InlineConsole;
