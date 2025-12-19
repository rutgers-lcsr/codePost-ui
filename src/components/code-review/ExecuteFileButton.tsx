import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Button, message, Tooltip } from 'antd';
import React, { useState } from 'react';
import { useExecuteFileAsync } from '../../hooks/useExecuteFileAsync';
import { FileType } from '../../infrastructure/file';
import { colors } from '../../theme/colors';
import { ExecutionResult } from '../../utils/executeFileStreaming';
import { FileExecutionModal } from './FileExecutionModal';

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
  const { execute, isExecuting, result, error } = useExecuteFileAsync();
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [isCached, setIsCached] = React.useState(false);
  const [cachedInfo, setCachedInfo] = React.useState<{
    executedAt?: string;
    executedBy?: string;
    executionTime?: number;
  } | null>(null);

  const [modalVisible, setModalVisible] = useState(false);

  const [lastProcessedResult, setLastProcessedResult] = React.useState<ExecutionResult | null>(null);

  const handleExecute = React.useCallback(
    async (forceExecute: boolean = false) => {
      if (!file) {
        message.warning('No file selected');
        return;
      }

      setShowSuccess(false);
      try {
        await execute(file.id, { force_execute: forceExecute });
      } catch (err) {
        // error handled by hook and displayed in modal
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

        if (!token) return;

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
        }
      } catch (err) {
        console.error('Failed to check cache:', err);
      }
    };

    checkCache();
  }, [file]);

  // Call onExecutionComplete when result is available
  React.useEffect(() => {
    if (result && !isExecuting && result !== lastProcessedResult) {
      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);

        // Update cache info regarding of whether it was cached or fresh
        // Since we just ran it successfully, it is now effectively cached for future
        setIsCached(true);
        setCachedInfo({
          executedAt: result.cached ? result.executed_at : result.timestamp || new Date().toISOString(),
          executedBy: result.cached ? result.executed_by : 'You',
          executionTime: result.execution_time,
        });
      }

      if (file && onExecutionComplete) {
        onExecutionComplete({ ...result, file_id: file.id });
      }
      setLastProcessedResult(result);
    }
  }, [result, isExecuting, file, onExecutionComplete, lastProcessedResult]);

  // Determine if file is executable
  const isExecutable =
    file &&
    (() => {
      const ext = file.extension.toLowerCase().replace(/^\./, '');
      console.log(ext);
      const executableExtensions = ['py', 'ipynb', 'js', 'java', 'cpp', 'c', 'rb', 'go', 'rs', 'sh', 'r'];

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
        backgroundColor: colors.actionGreen,
        borderColor: colors.actionGreen,
        color: 'white',
      };
    }
    // Remove blue for executing as modal shows it
    return {};
  };

  const tooltipTitle = !isExecutable ? 'This file type cannot be executed.' : 'Run this file';

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
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <Tooltip title={tooltipTitle}>
            <Button
              type={getButtonType()}
              size="small"
              icon={getButtonIcon()}
              onClick={() => handleExecute(false)}
              disabled={disabled || !isExecutable || isExecuting}
              style={getButtonStyle()}
            >
              {showSuccess ? `Success (${lastProcessedResult?.execution_time?.toFixed(2) || '0.00'}s)` : 'Run'}
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

          {(result || isExecuting || error) && (
            <Tooltip title="View execution output and logs">
              <Button size="small" icon={<EyeOutlined />} onClick={() => setModalVisible(true)} disabled={false} />
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
      </div>

      <FileExecutionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        result={result}
        isExecuting={isExecuting}
        error={error}
        fileName={file?.name}
      />
    </>
  );
};

export default ExecuteFileButton;
