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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFileExecutionAsync } from '../../../hooks/useFileExecutionAsync';
import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';
import { File as FileUtil, type FileType } from '../../../utils/file';
import { colors } from '../../../theme/colors';
import { ExecutionResult } from '../../../utils/fileExecution';
import { FileExecutionModal } from './FileExecutionModal';

// Force refresh
type FileWithId = FileType & { id: number };

const executionCacheKeys = {
  check: (fileId: number) => ['execution', 'cache', fileId] as const,
};

type CacheCheckResponse = {
  has_cache: boolean;
  execution_time?: number;
  executed_at?: string;
  executed_by?: string;
};

const fetchCacheStatus = async (fileId: number): Promise<CacheCheckResponse> => {
  const API_URL = process.env.REACT_APP_API_URL;
  const token = localStorage.getItem('token');
  if (!token) return { has_cache: false };

  const response = await fetch(`${API_URL}/autograder/execute/file/cache/check/?file_id=${fileId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return { has_cache: false };
  return response.json();
};

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
  const queryClient = useQueryClient();
  const [showSuccess, setShowSuccess] = React.useState(false);

  const isExecutable = FileUtil.isExecutable(file);

  // Use React Query for cache check — deduplicates requests and caches across file switches.
  // staleTime of 5 minutes means switching back to a previously checked file won't re-fetch.
  const { data: cacheData } = useQuery({
    queryKey: executionCacheKeys.check(file?.id ?? -1),
    queryFn: () => fetchCacheStatus(file!.id),
    enabled: !!file && isExecutable,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const isCached = cacheData?.has_cache ?? false;
  const cachedInfo = isCached
    ? {
        executedAt: cacheData?.executed_at,
        executedBy: cacheData?.executed_by,
        executionTime: cacheData?.execution_time,
      }
    : null;

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

  // Call onExecutionComplete when result is available
  React.useEffect(() => {
    if (result && !isExecuting && result !== lastProcessedResult) {
      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);

        // Invalidate the cache check so it re-fetches with the new cached result
        if (file) {
          queryClient.invalidateQueries({ queryKey: executionCacheKeys.check(file.id) });
        }
      }

      if (file && onExecutionComplete) {
        onExecutionComplete({ ...result, file_id: file.id });
      }
      setLastProcessedResult(result);
    }
  }, [result, isExecuting, file, onExecutionComplete, lastProcessedResult, queryClient]);

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
