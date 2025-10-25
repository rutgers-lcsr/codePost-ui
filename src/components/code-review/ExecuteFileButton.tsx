import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Button, message, Tooltip } from 'antd';
import React from 'react';
import { useExecuteFileStreaming } from '../../hooks/useExecuteFileStreaming';
import { FileType } from '../../infrastructure/file';
import { ExecutionResult } from '../../utils/executeFileStreaming';

interface ExecuteFileButtonProps {
  file: FileType | undefined;
  disabled?: boolean;
  onExecutionComplete?: (result: ExecutionResult) => void;
  canWrite?: boolean; // Whether user has write permissions (grader/admin)
}

export const ExecuteFileButton: React.FC<ExecuteFileButtonProps> = ({
  file,
  disabled = false,
  onExecutionComplete,
  canWrite = false,
}) => {
  const { execute, isExecuting, progress, result, error } = useExecuteFileStreaming();
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [isCached, setIsCached] = React.useState(false);
  const [cachedInfo, setCachedInfo] = React.useState<{
    executedAt?: string;
    executedBy?: string;
    executionTime?: number;
  } | null>(null);

  const handleExecute = React.useCallback(
    async (forceExecute: boolean = false) => {
      if (!file) {
        message.warning('No file selected');
        return;
      }

      setShowSuccess(false);
      try {
        await execute(file.id, { force_execute: forceExecute });
        setShowSuccess(true);
        // Hide success indicator after 3 seconds
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (err) {
        message.error(`Execution failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    },
    [file, execute],
  );

  // Check for cached result on mount
  React.useEffect(() => {
    if (!file) return;

    const checkCache = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        const token = localStorage.getItem('token');

        if (!token) {
          console.warn('No authentication token found for cache check');
          return;
        }

        const response = await fetch(`${API_URL}/autograder/execute/file/cache/check/?file_id=${file.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.has_cache) {
            setIsCached(true);
            setCachedInfo({
              executedAt: data.executed_at,
              executedBy: data.executed_by,
              executionTime: data.execution_time,
            });
          } else {
            setIsCached(false);
            setCachedInfo(null);
          }
        } else {
          console.warn('Failed to check cache:', response.status, await response.text());
        }
      } catch (err) {
        console.error('Failed to check cache:', err);
      }
    };

    checkCache();
  }, [file]);

  // Call onExecutionComplete when result is available
  React.useEffect(() => {
    if (result && onExecutionComplete && file) {
      // Include file_id in the result
      onExecutionComplete({ ...result, file_id: file.id });

      // Check if result is cached
      if ('cached' in result && result.cached) {
        setIsCached(true);
        const execResult = result as ExecutionResult & {
          executed_at?: string;
          executed_by?: string;
        };
        setCachedInfo({
          executedAt: execResult.executed_at,
          executedBy: execResult.executed_by,
          executionTime: result.execution_time,
        });
      } else {
        setIsCached(false);
        setCachedInfo(null);
      }
    }
  }, [result, onExecutionComplete, file]);

  // Determine if file is executable
  // Extensions can be stored with or without the dot prefix
  const isExecutable =
    file &&
    (() => {
      const ext = file.extension.toLowerCase().replace(/^\./, ''); // Remove leading dot if present
      const executableExtensions = [
        'py', // Python
        'ipynb', // Jupyter Notebook
        'js', // JavaScript
        'java', // Java
        'cpp', // C++
        'c', // C
        'rb', // Ruby
        'go', // Go
        'rs', // Rust
        'sh', // Shell script
      ];
      return executableExtensions.includes(ext);
    })();

  const getButtonIcon = () => {
    if (showSuccess) return <CheckCircleOutlined />;
    if (isExecuting) return <LoadingOutlined />;
    return <PlayCircleOutlined />;
  };

  const getButtonType = () => {
    if (showSuccess) return 'default';
    return 'primary';
  };

  const getButtonStyle = (): React.CSSProperties => {
    if (showSuccess) {
      return {
        backgroundColor: '#52c41a',
        borderColor: '#52c41a',
        color: 'white',
      };
    }
    if (isExecuting) {
      return {
        backgroundColor: '#1890ff',
        borderColor: '#1890ff',
      };
    }
    return {};
  };

  const tooltipTitle = !isExecutable
    ? 'This file type cannot be executed. Supported: .py, .ipynb, .js, .java, .cpp, .c, .rb, .go, .rs, .sh'
    : showSuccess
      ? 'Execution completed successfully'
      : isExecuting
        ? 'Executing...'
        : 'Run this file';

  const formatCachedTime = (executedAt?: string) => {
    if (!executedAt) return '';
    const date = new Date(executedAt);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <Tooltip title={canWrite ? 'Run (use cache if available)' : tooltipTitle}>
          <Button
            type={getButtonType()}
            size="small"
            icon={getButtonIcon()}
            onClick={() => handleExecute(false)}
            disabled={disabled || !isExecutable || isExecuting}
            style={getButtonStyle()}
          >
            {showSuccess ? 'Success' : isExecuting ? 'Running' : 'Run'}
          </Button>
        </Tooltip>

        {canWrite && !isExecuting && isExecutable && (
          <Tooltip title="Force re-execute (ignore cache)">
            <Button
              type="default"
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => handleExecute(true)}
              disabled={disabled || isExecuting}
              style={{
                borderColor: isCached ? '#faad14' : '#d9d9d9',
                color: isCached ? '#faad14' : '#595959',
                backgroundColor: isCached ? '#fffbe6' : 'transparent',
              }}
            >
              Force Run
            </Button>
          </Tooltip>
        )}
      </div>

      {isCached && !isExecuting && cachedInfo && (
        <div
          style={{
            fontSize: '10px',
            maxWidth: '220px',
            textAlign: 'center',
            color: '#8c8c8c',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            justifyContent: 'center',
          }}
        >
          <ClockCircleOutlined style={{ fontSize: '10px' }} />
          <span>
            Cached result
            {cachedInfo.executedAt && ` ${formatCachedTime(cachedInfo.executedAt)}`}
          </span>
        </div>
      )}

      {isExecuting && progress && (
        <div
          style={{
            fontSize: '11px',
            maxWidth: '200px',
            textAlign: 'center',
            color: '#595959',
            fontWeight: 500,
          }}
        >
          {progress}
        </div>
      )}

      {error && !isExecuting && (
        <div
          style={{
            color: '#ff4d4f',
            fontSize: '11px',
            maxWidth: '200px',
            textAlign: 'center',
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

export default ExecuteFileButton;
