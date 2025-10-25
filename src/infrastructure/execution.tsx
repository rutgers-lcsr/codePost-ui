/**
 * Code Execution Infrastructure
 *
 * Client for executing code and notebooks via codePost API
 */

import { getHeaders } from './generics';

/**
 * Result of code or notebook execution
 */
export interface ExecutionResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string | null;
  execution_time: number;
  output_data?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Result of file execution (includes file metadata)
 */
export interface FileExecutionResult extends ExecutionResult {
  file_id: number;
  file_name: string;
  submission_id: number;
}

/**
 * Notebook cell output
 */
export interface NotebookCellOutput {
  output_type: string;
  text?: string;
  name?: string;
  data?: Record<string, unknown>;
  execution_count?: number;
  ename?: string;
  evalue?: string;
  traceback?: string[];
}

/**
 * Notebook cell with outputs
 */
export interface NotebookCell {
  source: string;
  outputs: NotebookCellOutput[];
  execution_count: number | null;
}

/**
 * Request to execute code
 */
export interface CodeExecutionRequest {
  code: string;
  language: string;
  timeout?: number;
  working_dir?: string;
}

/**
 * Request to execute notebook
 */
export interface NotebookExecutionRequest {
  notebook_content: string;
  timeout?: number;
  kernel_name?: string;
}

/**
 * Request to execute notebook cell
 */
export interface NotebookCellExecutionRequest {
  cell_code: string;
  cell_index?: number;
  timeout?: number;
  kernel_name?: string;
}

/**
 * Request to execute a file
 */
export interface FileExecutionRequest {
  file_id: number;
  timeout?: number;
  force_execute?: boolean;
}

/**
 * Helper function to make POST requests to execution API
 */
async function executeApiCall<T>(endpoint: string, data: unknown): Promise<T> {
  const url = `${process.env.REACT_APP_API_URL}/autograder/${endpoint}/`;
  const headers = getHeaders();
  const res = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Execution API error: ${res.status} - ${errorText}`);
  }

  return await res.json();
}

/**
 * Execution API Client
 */
export const Execution = {
  /**
   * Execute arbitrary code in a specified language
   */
  executeCode: async (request: CodeExecutionRequest): Promise<ExecutionResult> => {
    return executeApiCall<ExecutionResult>('execute/code', request);
  },

  /**
   * Execute a complete Jupyter notebook
   */
  executeNotebook: async (request: NotebookExecutionRequest): Promise<ExecutionResult> => {
    return executeApiCall<ExecutionResult>('execute/notebook', request);
  },

  /**
   * Execute a single notebook cell
   */
  executeNotebookCell: async (request: NotebookCellExecutionRequest): Promise<ExecutionResult> => {
    return executeApiCall<ExecutionResult>('execute/notebook-cell', request);
  },

  /**
   * Execute a codePost file (code or notebook)
   */
  executeFile: async (request: FileExecutionRequest): Promise<FileExecutionResult> => {
    return executeApiCall<FileExecutionResult>('execute/file', request);
  },
};
