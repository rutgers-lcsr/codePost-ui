// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * Code Execution Panel Component
 *
 * Provides UI for executing code files and notebooks with output display
 */

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Collapse, Space, Tag, Typography } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';

import { executeFile } from '../execution/execution';
import type { FileType } from '../../../utils/file';
import { colors } from '../../../theme/colors';

const { Text } = Typography;
const { Panel } = Collapse;

// Design Constants
const SUCCESS_COLOR = colors.actionGreen;
const ERROR_COLOR = colors.actionRed;
const INFO_COLOR = colors.actionBlue;
const WARNING_COLOR = colors.actionYellow;
const PANEL_BG = '#fafafa';
const OUTPUT_BG = '#f5f5f5';
const CODE_FONT = "'Courier New', Courier, monospace";

interface CodeExecutionPanelProps {
  file: FileType;
  readOnly?: boolean;
}

interface NotebookOutput {
  output_type: string;
  text?: string;
  name?: string;
  data?: Record<string, string>;
  execution_count?: number;
  ename?: string;
  evalue?: string;
  traceback?: string[];
}

interface NotebookCellData {
  cell_type: 'code' | 'markdown';
  source: string;
  outputs?: NotebookOutput[];
  execution_count?: number | null;
}

interface ExecutionResultData {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string | null;
  execution_time: number;
  output_data?: {
    cells?: NotebookCellData[];
    [key: string]: unknown;
  };
  timestamp: string;
  file_id?: number;
  file_name?: string;
  submission_id?: number;
}

interface ExecutionState {
  isExecuting: boolean;
  result: ExecutionResultData | null;
  error: string | null;
}

const CodeExecutionPanel: React.FC<CodeExecutionPanelProps> = ({ file, readOnly = false }) => {
  const [state, setState] = useState<ExecutionState>({
    isExecuting: false,
    result: null,
    error: null,
  });
  const [forceReExecution, setForceReExecution] = useState(false);

  // Determine if file is executable
  const isExecutable = useMemo(() => {
    if (!file.extension) return false;
    const executableExtensions = ['py', 'js', 'java', 'c', 'cpp', 'rb', 'go', 'rs', 'sh', 'ipynb', 'r'];

    return executableExtensions.includes(file.extension.toLowerCase());
  }, [file.extension]);

  // Check if file is a notebook
  const isNotebook = useMemo(() => {
    return file.extension?.toLowerCase() === 'ipynb';
  }, [file.extension]);

  // Handle execution
  const handleExecute = useCallback(async () => {
    if (!file.id || state.isExecuting) return;

    setState((prev) => ({
      ...prev,
      isExecuting: true,
      error: null,
    }));

    try {
      const result = await executeFile({
        file_id: file.id,
        timeout: 30,
        force_execute: forceReExecution,
      });

      setState({
        isExecuting: false,
        result,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Execution failed';
      setState({
        isExecuting: false,
        result: null,
        error: errorMessage,
      });
    }
  }, [file.id, state.isExecuting, forceReExecution]);

  // Format execution time
  const formatExecutionTime = (seconds: number): string => {
    if (seconds < 1) {
      return `${(seconds * 1000).toFixed(0)}ms`;
    }
    return `${seconds.toFixed(2)}s`;
  };

  // Don't render if file is not executable
  if (!isExecutable) {
    return null;
  }

  const { isExecuting, result, error } = state;

  return (
    <Card
      style={{
        marginTop: '10px',
        backgroundColor: PANEL_BG,
        borderRadius: '8px',
      }}
      bodyStyle={{ padding: '16px' }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        {/* Execution Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <PlayCircleOutlined style={{ fontSize: '18px', color: INFO_COLOR }} />
            <Text strong style={{ fontSize: '16px' }}>
              Code Execution
            </Text>
            <Tag color="blue">{file.extension?.toUpperCase()}</Tag>
          </Space>

          <Space>
            {isNotebook && (
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={forceReExecution}
                  onChange={(e) => setForceReExecution(e.target.checked)}
                  disabled={readOnly || isExecuting}
                  style={{ marginRight: '6px' }}
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Force re-execution
                </Text>
              </label>
            )}
            <Button
              type="primary"
              icon={isExecuting ? <LoadingOutlined /> : <PlayCircleOutlined />}
              onClick={handleExecute}
              loading={isExecuting}
              disabled={readOnly || isExecuting}
            >
              {isExecuting ? 'Executing...' : 'Run Code'}
            </Button>
          </Space>
        </div>

        {/* Error Display */}
        {error && (
          <Alert
            message="Execution Error"
            description={error}
            type="error"
            showIcon
            icon={<CloseCircleOutlined />}
            closable
            onClose={() => setState((prev) => ({ ...prev, error: null }))}
          />
        )}

        {/* Result Display */}
        {result && (
          <Card
            style={{
              backgroundColor: result.success ? '#f6ffed' : '#fff2f0',
              border: `1px solid ${result.success ? SUCCESS_COLOR : ERROR_COLOR}`,
            }}
          >
            {/* Result Header */}
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}
            >
              <Space>
                {result.success ? (
                  <CheckCircleOutlined style={{ fontSize: '20px', color: SUCCESS_COLOR }} />
                ) : (
                  <CloseCircleOutlined style={{ fontSize: '20px', color: ERROR_COLOR }} />
                )}
                <Text strong>{result.success ? 'Execution Successful' : 'Execution Failed'}</Text>
              </Space>

              <Space>
                <ClockCircleOutlined />
                <Text type="secondary">{formatExecutionTime(result.execution_time)}</Text>
              </Space>
            </div>

            {/* Output Sections */}
            <Collapse
              bordered={false}
              defaultActiveKey={result.success ? ['stdout'] : ['stderr', 'error']}
              style={{ backgroundColor: 'transparent' }}
            >
              {/* Standard Output */}
              {result.stdout && (
                <Panel header={<Text strong>Standard Output (stdout)</Text>} key="stdout">
                  <div
                    style={{
                      backgroundColor: OUTPUT_BG,
                      padding: '12px',
                      borderRadius: '4px',
                      border: '1px solid #d9d9d9',
                    }}
                  >
                    <pre
                      style={{
                        margin: 0,
                        fontFamily: CODE_FONT,
                        fontSize: '13px',
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                      }}
                    >
                      {result.stdout}
                    </pre>
                  </div>
                </Panel>
              )}

              {/* Standard Error */}
              {result.stderr && (
                <Panel
                  header={
                    <Text strong style={{ color: WARNING_COLOR }}>
                      Standard Error (stderr)
                    </Text>
                  }
                  key="stderr"
                >
                  <div
                    style={{
                      backgroundColor: '#fffbe6',
                      padding: '12px',
                      borderRadius: '4px',
                      border: `1px solid ${WARNING_COLOR}`,
                    }}
                  >
                    <pre
                      style={{
                        margin: 0,
                        fontFamily: CODE_FONT,
                        fontSize: '13px',
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word',
                        color: '#d48806',
                      }}
                    >
                      {result.stderr}
                    </pre>
                  </div>
                </Panel>
              )}

              {/* Error Details */}
              {result.error && (
                <Panel
                  header={
                    <Text strong style={{ color: ERROR_COLOR }}>
                      Error Details
                    </Text>
                  }
                  key="error"
                >
                  <Alert message={result.error} type="error" showIcon />
                </Panel>
              )}

              {/* Notebook Cells - Jupyter-style layout */}
              {result.output_data && result.output_data.cells && (
                <Panel header={<Text strong>Notebook Cells</Text>} key="notebook">
                  <Space direction="vertical" style={{ width: '100%', gap: '12px' }}>
                    {result.output_data.cells.map((cell, index) => {
                      // Check if this is a markdown cell
                      const isMarkdown = cell.cell_type === 'markdown';

                      if (isMarkdown) {
                        // Render markdown cell
                        return (
                          <div
                            key={index}
                            style={{
                              border: '1px solid #e8e8e8',
                              borderRadius: '4px',
                              padding: '16px',
                              backgroundColor: '#fff',
                            }}
                          >
                            <div
                              style={{
                                lineHeight: '1.6',
                                color: '#000',
                              }}
                              dangerouslySetInnerHTML={{
                                __html: cell.source
                                  // Convert markdown to basic HTML
                                  .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                                  .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                                  .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                  .replace(/`(.*?)`/g, '<code>$1</code>')
                                  .replace(/\n\n/g, '</p><p>')
                                  .replace(/^\s*[-*]\s+(.*)$/gim, '<li>$1</li>')
                                  .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
                                  .replace(/\n/g, '<br/>'),
                              }}
                            />
                          </div>
                        );
                      }

                      // Render code cell
                      return (
                        <div
                          key={index}
                          style={{
                            border: '1px solid #d9d9d9',
                            borderRadius: '4px',
                            overflow: 'hidden',
                          }}
                        >
                          {/* Cell Header */}
                          <div
                            style={{
                              backgroundColor: '#fafafa',
                              padding: '4px 12px',
                              borderBottom: '1px solid #d9d9d9',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              In [{cell.execution_count ?? ' '}]:
                            </Text>
                            <Tag color="blue" style={{ fontSize: '10px', margin: 0 }}>
                              Cell {index + 1}
                            </Tag>
                          </div>

                          {/* Cell Source Code */}
                          <div style={{ backgroundColor: '#f7f7f7' }}>
                            <pre
                              style={{
                                margin: 0,
                                padding: '12px',
                                fontFamily: CODE_FONT,
                                fontSize: '13px',
                                lineHeight: '1.5',
                                whiteSpace: 'pre-wrap',
                                backgroundColor: '#f7f7f7',
                                color: '#000',
                              }}
                            >
                              {cell.source}
                            </pre>
                          </div>

                          {/* Cell Outputs */}
                          {cell.outputs && cell.outputs.length > 0 && (
                            <div style={{ backgroundColor: '#fff' }}>
                              <div
                                style={{
                                  backgroundColor: '#fafafa',
                                  padding: '4px 12px',
                                  borderTop: '1px solid #d9d9d9',
                                  borderBottom: '1px solid #e8e8e8',
                                }}
                              >
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  Out[{cell.execution_count ?? ' '}]:
                                </Text>
                              </div>
                              <div style={{ padding: '12px' }}>
                                {cell.outputs.map((output, outIndex: number) => (
                                  <div
                                    key={outIndex}
                                    style={{
                                      marginBottom: outIndex < (cell.outputs?.length ?? 0) - 1 ? '8px' : 0,
                                    }}
                                  >
                                    {output.output_type === 'stream' && (
                                      <pre
                                        style={{
                                          margin: 0,
                                          fontFamily: CODE_FONT,
                                          fontSize: '12px',
                                          whiteSpace: 'pre-wrap',
                                          color: '#000',
                                        }}
                                      >
                                        {output.text}
                                      </pre>
                                    )}
                                    {output.output_type === 'error' && (
                                      <Alert
                                        message={`${output.ename}: ${output.evalue}`}
                                        description={
                                          <pre style={{ fontSize: '11px', margin: 0 }}>
                                            {output.traceback?.join('\n')}
                                          </pre>
                                        }
                                        type="error"
                                        showIcon
                                        style={{ marginTop: 0 }}
                                      />
                                    )}
                                    {(output.output_type === 'execute_result' ||
                                      output.output_type === 'display_data') && (
                                      <div>
                                        {output.data && output.data['text/plain'] && (
                                          <pre
                                            style={{
                                              margin: 0,
                                              fontFamily: CODE_FONT,
                                              fontSize: '12px',
                                              whiteSpace: 'pre-wrap',
                                              color: '#000',
                                            }}
                                          >
                                            {output.data['text/plain']}
                                          </pre>
                                        )}
                                        {output.data && output.data['text/html'] && (
                                          <div dangerouslySetInnerHTML={{ __html: output.data['text/html'] }} />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </Space>
                </Panel>
              )}
            </Collapse>
          </Card>
        )}
      </Space>
    </Card>
  );
};

export default CodeExecutionPanel;
