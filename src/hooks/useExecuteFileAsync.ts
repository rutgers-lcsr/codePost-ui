import { useCallback, useState } from 'react';
import { autograderApi } from '../api-client/clients';
import { ResponseError } from '../api-client/runtime';
import { getAuthToken } from '../utils/auth';
import { normalizeExecutionResult, type ExecutionResult } from '../utils/fileExecution';

type ExecuteOptions = {
  force_execute?: boolean;
  forceExecute?: boolean;
  timeout?: number;
  testCode?: string;
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

export const useExecuteFileAsync = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (fileId: number, options: ExecuteOptions = {}) => {
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
      const payload = await autograderApi.executeFileCreate({
        fileExecutionRequest: {
          fileId,
          timeout: options.timeout,
          forceExecute: options.forceExecute ?? options.force_execute,
          testCode: options.testCode,
        },
      });
      const normalized = normalizeExecutionResult(payload as unknown as Record<string, unknown>);
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
      throw new Error(message);
    }
  }, []);

  return {
    execute,
    isExecuting,
    result,
    error,
  };
};
