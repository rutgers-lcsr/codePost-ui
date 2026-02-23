// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useCallback, useRef, useState } from 'react';
import { ExecutionResult, ExecutionOptions } from '@code-review/execution/executeFileStreaming';
import { getHeaders } from '../../../utils/generics';

export interface UseExecuteFileAsyncResult {
  execute: (fileId: number, options?: ExecutionOptions) => Promise<void>;
  isExecuting: boolean;
  result: ExecutionResult | null;
  error: string | null;
}

export function useExecuteFileAsync(): UseExecuteFileAsyncResult {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const execute = useCallback(async (fileId: number, options: ExecutionOptions = {}) => {
    setIsExecuting(true);
    setResult(null);
    setError(null);

    try {
      // 1. Start Execution
      const res = await fetch(`${process.env.REACT_APP_API_URL}/autograder/execute/file/async/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          file_id: fileId,
          timeout: options.timeout || 30,
          force_execute: options.force_execute || false,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to start execution: ${res.statusText}`);
      }

      const { task_id } = await res.json();

      // 2. Poll for results
      const poll = async () => {
        try {
          const statusRes = await fetch(`${process.env.REACT_APP_API_URL}/autograder/tasks/${task_id}/`, {
            headers: getHeaders(),
          });

          if (!statusRes.ok) {
            // If 404, task might not be registered yet? Or failed.
            // We'll retry a few times? Or assume error.
            throw new Error('Failed to check task status');
          }

          const data = await statusRes.json();

          if (data.status === 'SUCCESS') {
            setResult(data.result);
            setIsExecuting(false);
          } else if (data.status === 'FAILURE' || data.status === 'REVOKED') {
            setError(data.result || 'Execution failed');
            setIsExecuting(false);
          } else {
            // PENDING, STARTED, RETRY
            pollTimeoutRef.current = setTimeout(poll, 1000);
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Polling error');
          setIsExecuting(false);
        }
      };

      poll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsExecuting(false);
    }
  }, []);

  return { execute, isExecuting, result, error };
}
