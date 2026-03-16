// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { Button, message, Tag, Tooltip } from 'antd';
import React, { useState } from 'react';
import { useFileExecutionAsync } from '../../../hooks/useFileExecutionAsync';
import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';
import type { FileType } from '../../../utils/file';
import { colors } from '../../../theme/colors';
import { ExecutionResult } from '../../../utils/fileExecution';
import { FileExecutionModal } from './FileExecutionModal';

// Force refresh
type FileWithId = FileType & { id: number };

interface ExecuteFileButtonProps {
  file: FileWithId | undefined;
  disabled?: boolean;
  onExecutionComplete?: (result: ExecutionResult) => void;
  canWrite?: boolean; // Whether user has write permissions (grader/admin)
  codeOverride?: string; // Temporary edit content to send instead of disk content
}

export const ExecuteFileButton: React.FC<ExecuteFileButtonProps> = ({
  file,
  disabled = false,
  onExecutionComplete,
  canWrite = false,
  codeOverride,
}) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const isDarkTheme = consoleThemes.dark === consoleTheme;

  const { execute, isExecuting, result, error } = useFileExecutionAsync();
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
        await execute(file.id, { force_execute: forceExecute, codeOverride: codeOverride });
      } catch {
        // error handled by hook and displayed in modal
      }
    },
    [file, execute, codeOverride],
  );

  // Check for cached result on mount
  React.useEffect(() => {
    if (!file) return;

    const checkCache = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
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
      const executableExtensions = ['py', 'ipynb', 'js', 'java', 'cpp', 'c', 'rb', 'go', 'rs', 'sh', 'r'];

      return executableExtensions.includes(ext);
    })();

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

  const hasLogs = !!(result || isExecuting || error);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '0px', alignItems: 'center' }}>
          <Tooltip title={tooltipTitle}>
            <Button
              type="primary"
              size="middle"
              icon={isExecuting ? <LoadingOutlined /> : <PlayCircleOutlined />}
              onClick={() => handleExecute(false)}
              disabled={disabled || !isExecutable || isExecuting}
              style={{
                backgroundColor: colors.actionGreen,
                borderColor: colors.actionGreen,
              }}
            >
              Run
            </Button>
          </Tooltip>

          {canWrite && !isExecuting && isExecutable && (
            <Tooltip title="Force Run (Ignore Cache)">
              <Button
                icon={<ThunderboltOutlined />}
                onClick={() => handleExecute(true)}
                disabled={disabled}
                style={{
                  marginLeft: '8px',
                  ...(isDarkTheme
                    ? {
                        backgroundColor: consoleTheme.buttonSecondaryBg,
                        border: consoleTheme.buttonSecondaryBorder,
                        color: consoleTheme.buttonSecondaryColor,
                      }
                    : {}),
                }}
              />
            </Tooltip>
          )}

          {hasLogs && !isExecuting && (
            <Tooltip title="View Execution Logs">
              <Button
                type="text"
                size="small"
                icon={<FileTextOutlined />}
                onClick={() => setModalVisible(true)}
                style={{
                  marginLeft: '4px',
                  color: isDarkTheme ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)',
                }}
              />
            </Tooltip>
          )}
        </div>

        {showSuccess && !isExecuting && (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Success ({lastProcessedResult?.execution_time?.toFixed(2) || '0.00'}s)
          </Tag>
        )}

        {isCached && !isExecuting && !showSuccess && cachedInfo && (
          <Tooltip
            title={
              canWrite && cachedInfo.executedBy ? `Executed by ${cachedInfo.executedBy}` : 'Result retrieved from cache'
            }
          >
            <Tag
              icon={<ClockCircleOutlined />}
              color={isDarkTheme ? undefined : 'gold'}
              style={
                isDarkTheme
                  ? {
                      backgroundColor: 'rgba(250, 173, 20, 0.18)',
                      borderColor: '#d89614',
                      color: '#ffd666',
                    }
                  : undefined
              }
            >
              {`Cached${canWrite ? ` ${formatCachedTime(cachedInfo.executedAt)}` : ''}`}
            </Tag>
          </Tooltip>
        )}
      </div>

      <FileExecutionModal
        open={modalVisible}
        onClose={() => setModalVisible(false)}
        result={result}
        isExecuting={isExecuting}
        error={error}
        fileName={file?.name}
        fileId={file?.id}
      />
    </>
  );
};

export default ExecuteFileButton;
