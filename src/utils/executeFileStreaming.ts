/**
 * Streaming execution utility for notebooks and code files
 *
 * This module provides a streaming API for executing files that sends progress
 * updates via Server-Sent Events, preventing timeout issues with long-running executions.
 */

export interface ExecutionProgress {
  status: string;
  message: string;
  dataset_count?: number;
}

export interface ExecutionResult {
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cells?: any[]; // For notebooks (legacy, use output_data)
  stdout?: string; // For code (legacy, use output_data)
  stderr?: string; // For code (legacy, use output_data)
  error?: string;
  execution_time: number;
  file_id?: number;
  file_name?: string;
  submission_id?: number;
  cached?: boolean; // Whether result is from cache
  executed_at?: string; // ISO timestamp of when cached result was executed
  executed_by?: string; // Username who executed cached result
  timestamp?: string; // ISO timestamp from fresh execution
  system_logs?: string[];
  output_data?: {
    cells?: any[];
    [key: string]: any;
  };
}

export interface ExecutionCallbacks {
  onProgress?: (progress: ExecutionProgress) => void;
  onComplete?: (result: ExecutionResult) => void;
  onError?: (error: string) => void;
}

export interface ExecutionOptions {
  timeout?: number;
  force_execute?: boolean;
}

/**
 * Execute a file with streaming progress updates
 *
 * @param fileId - ID of the file to execute
 * @param options - Execution options (timeout, force_execute)
 * @param callbacks - Callbacks for progress, completion, and errors
 */
export async function executeFileWithStreaming(
  fileId: number,
  options: ExecutionOptions = {},
  callbacks: ExecutionCallbacks = {},
): Promise<void> {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const token = localStorage.getItem('token');

  if (!token) {
    callbacks.onError?.('No authentication token found');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/autograder/execute/file/streaming/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_id: fileId,
        timeout: options.timeout || 60,
        force_execute: options.force_execute || false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      callbacks.onError?.(`HTTP error ${response.status}: ${errorText}`);
      return;
    }

    // Process SSE stream
    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError?.('Response body is not readable');
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let currentEvent = '';
    let receivedComplete = false;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Check if we received a complete message before the stream ended
        if (!receivedComplete) {
          callbacks.onError?.('Connection closed unexpectedly');
        }
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
          const data = line.substring(5).trim();

          if (!data) continue;

          try {
            const parsed = JSON.parse(data);

            if (currentEvent === 'progress') {
              callbacks.onProgress?.(parsed as ExecutionProgress);
            } else if (currentEvent === 'complete') {
              receivedComplete = true;
              callbacks.onComplete?.(parsed as ExecutionResult);
              return; // Done
            } else if (currentEvent === 'error') {
              receivedComplete = true;
              callbacks.onError?.(parsed.error || 'Unknown error');
              return; // Done
            }
          } catch (e) {
            console.error('[executeFileStreaming] Failed to parse SSE data:', e, 'Data was:', data);
          }
        }
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    callbacks.onError?.(errorMessage);
  }
}

/**
 * Legacy non-streaming execution (fallback)
 *
 * @param fileId - ID of the file to execute
 * @param options - Execution options
 * @returns Promise with execution result
 */
export async function executeFile(fileId: number, options: ExecutionOptions = {}): Promise<ExecutionResult> {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const token = localStorage.getItem('token');

  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/autograder/execute/file/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file_id: fileId,
      timeout: options.timeout || 60,
      force_execute: options.force_execute || false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error ${response.status}: ${errorText}`);
  }

  return await response.json();
}
