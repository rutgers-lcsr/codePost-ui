// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useCallback, useState } from 'react';
import { autograderApi } from '../api-client/clients';
import { ResponseError } from '../api-client/runtime';
import { getAuthToken } from '../utils/auth';
import { normalizeExecutionResult, type ExecutionResult } from '../utils/fileExecution';
import { useTaskPolling } from './useTaskPolling';

type ExecuteOptions = {
  force_execute?: boolean;
  forceExecute?: boolean;
  timeout?: number;
  testCode?: string;
  codeOverride?: string;
};

const parseErrorMessage = async (response: Response): Promise<string> => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const payload = (await response.json()) as Record<string, unknown>;
      const message =
        (payload.detail as string | undefined) ||
        (payload.error as string | undefined) ||
        (payload.message as string | undefined);
      if (message) return message;
      return JSON.stringify(payload);
    } catch {
      return `Request failed (${response.status})`;
    }
  }

  try {
    const text = await response.text();
    return text || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
};

export const useFileExecutionAsync = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { pollTask } = useTaskPolling();

  const execute = useCallback(
    async (fileId: number, options: ExecuteOptions = {}) => {
      setIsExecuting(true);
      setError(null);

      const token = getAuthToken();
      if (!token) {
        const authError = 'You must be logged in to run files.';
        setError(authError);
        setIsExecuting(false);
        throw new Error(authError);
      }

      try {
        // 1. Initiate Async Execution
        const asyncResponse = await autograderApi.executeFileAsyncCreate({
          asyncExecutionRequest: {
            fileId,
            timeout: options.timeout,
            forceExecute: options.forceExecute ?? options.force_execute,
            testCode: options.testCode,
            codeOverride: options.codeOverride,
          },
        });

        console.log('Async response:', asyncResponse);
        // Check if taskId is present, handle potential snake_case from raw response
        const taskId = asyncResponse.taskId || (asyncResponse as any).task_id;

        if (!taskId) {
          throw new Error('Failed to start execution: No task ID returned');
        }

        // 2. Poll for Result
        const rawResult = await pollTask(taskId);

        // 3. Normalize and Set Result
        const normalized = normalizeExecutionResult(rawResult);
        setResult(normalized);
        setIsExecuting(false);
        return normalized;
      } catch (err) {
        let message = 'Failed to execute file.';
        if (err instanceof ResponseError) {
          message = await parseErrorMessage(err.response);
        } else if (err instanceof Error) {
          message = err.message;
        }
        setError(message);
        setIsExecuting(false);
        throw new Error(message, { cause: err });
      }
    },
    [pollTask],
  );

  return {
    execute,
    isExecuting,
    result,
    error,
  };
};
