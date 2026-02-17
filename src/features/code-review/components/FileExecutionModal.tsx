import React from 'react';
import { Modal, Tabs, Spin, Alert, Typography } from 'antd';
import { ExecutionResult } from '../../../utils/fileExecution';

const { Text } = Typography;

interface FileExecutionModalProps {
  visible: boolean;
  onClose: () => void;
  result: ExecutionResult | null;
  isExecuting: boolean;
  error: string | null;
  fileName?: string;
}

export const FileExecutionModal: React.FC<FileExecutionModalProps> = ({
  visible,
  onClose,
  result,
  isExecuting,
  error,
  fileName,
}) => {
  const renderContent = () => {
    if (isExecuting) {
      return (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" tip="Running on CodePost Autograder..." />
          <div style={{ marginTop: 16 }}>Queued</div>
        </div>
      );
    }

    if (error) {
      return <Alert type="error" title="Execution Error" description={error} />;
    }

    if (!result) {
      return <div>No results.</div>;
    }

    return (
      <div>
        <div style={{ marginBottom: 16, display: 'flex', gap: '16px', fontSize: '12px', color: '#666' }}>
          <span>Time: {result.execution_time?.toFixed(3)}s</span>
          <span>Success: {result.success ? 'Yes' : 'No'}</span>
          {result.cached && <span>(Cached)</span>}
        </div>

        {result.error && (
          <Alert
            type="error"
            title="Runtime Error"
            description={<pre style={{ maxHeight: 200, overflow: 'auto' }}>{result.error}</pre>}
            style={{ marginBottom: 16 }}
          />
        )}

        <Tabs defaultActiveKey="stdout">
          <Tabs.TabPane tab="Standard Output" key="stdout">
            <div
              style={{
                backgroundColor: '#f5f5f5',
                padding: '12px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                maxHeight: '400px',
                overflow: 'auto',
              }}
            >
              {result.stdout || <Text type="secondary">No output</Text>}
            </div>
          </Tabs.TabPane>
          <Tabs.TabPane tab="Standard Error" key="stderr">
            <div
              style={{
                backgroundColor: '#fff1f0',
                padding: '12px',
                borderRadius: '4px',
                fontFamily: 'monospace',
                whiteSpace: 'pre-wrap',
                maxHeight: '400px',
                overflow: 'auto',
                border: '1px solid #ffa39e',
              }}
            >
              {result.stderr || <Text type="secondary">No errors</Text>}
            </div>
          </Tabs.TabPane>
          {result.output_data && Object.keys(result.output_data).length > 0 && (
            <Tabs.TabPane tab="Raw Data" key="raw">
              <div
                style={{
                  backgroundColor: '#fcfcfc',
                  padding: '12px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '400px',
                  overflow: 'auto',
                  border: '1px solid #eee',
                }}
              >
                {JSON.stringify(result.output_data, null, 2)}
              </div>
            </Tabs.TabPane>
          )}
          {result.system_logs && result.system_logs.length > 0 && (
            <Tabs.TabPane tab="System Logs" key="system_logs">
              <div
                style={{
                  backgroundColor: '#f5f5f5',
                  padding: '12px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '400px',
                  overflow: 'auto',
                  color: '#555',
                }}
              >
                {result.system_logs.join('\n')}
              </div>
            </Tabs.TabPane>
          )}
        </Tabs>
      </div>
    );
  };

  return (
    <Modal
      title={`Execution: ${fileName || 'Unknown File'}`}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnHidden
    >
      {renderContent()}
    </Modal>
  );
};
