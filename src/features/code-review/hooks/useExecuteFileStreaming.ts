// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**
 * React hooks for streaming file execution
 */

import { useCallback, useRef, useState } from 'react';
import {
  executeFileWithStreaming,
  ExecutionOptions,
  ExecutionProgress,
  ExecutionResult,
} from '@code-review/execution/executeFileStreaming';

export interface UseExecuteFileStreamingResult {
  execute: (fileId: number, options?: ExecutionOptions) => Promise<void>;
  isExecuting: boolean;
  progress: string;
  progressStatus: string;
  result: ExecutionResult | null;
  error: string | null;
  cancel: () => void;
}

/**
 * Hook for executing files with streaming progress updates
 *
 * @returns Object with execute function and state
 *
 * @example
 * ```tsx
 * const { execute, isExecuting, progress, result, error } = useExecuteFileStreaming();
 *
 * const handleExecute = () => {
 *   execute(fileId, { timeout: 60, force_execution: true });
 * };
 *
 * return (
 *   <div>
 *     <button onClick={handleExecute} disabled={isExecuting}>
 *       Execute
 *     </button>
 *     {isExecuting && <p>{progress}</p>}
 *     {error && <p>Error: {error}</p>}
 *     {result && <p>Done! Processed {result.cells?.length} cells</p>}
 *   </div>
 * );
 * ```
 */
export function useExecuteFileStreaming(): UseExecuteFileStreamingResult {
  // TODO: Deprecate this if not being used, I believe we are doing celery tasks for it, all ui updates should be done through polling.

  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState('');
  const [progressStatus, setProgressStatus] = useState('');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsExecuting(false);
    setProgress('Cancelled');
    setProgressStatus('cancelled');
  }, []);

  const execute = useCallback(async (fileId: number, options?: ExecutionOptions) => {
    setIsExecuting(true);
    setProgress('Starting execution...');
    setProgressStatus('starting');
    setResult(null);
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      await executeFileWithStreaming(fileId, options, {
        onProgress: (prog: ExecutionProgress) => {
          setProgress(prog.message);
          setProgressStatus(prog.status);
        },
        onComplete: (res: ExecutionResult) => {
          setResult(res);
          setIsExecuting(false);
          setProgress(res.success ? 'Execution complete' : 'Execution failed');
          setProgressStatus('complete');
        },
        onError: (err: string) => {
          setError(err);
          setIsExecuting(false);
          setProgress('');
          setProgressStatus('error');
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setIsExecuting(false);
      setProgressStatus('error');
    }
  }, []);

  return {
    execute,
    isExecuting,
    progress,
    progressStatus,
    result,
    error,
    cancel,
  };
}
