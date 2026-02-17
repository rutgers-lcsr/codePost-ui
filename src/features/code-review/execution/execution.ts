import { getAuthToken } from '../../../utils/auth';

export interface FileExecutionRequest {
  file_id: number;
  timeout?: number;
  force_execute?: boolean;
  test_code?: string;
  example_code?: string;
}

export interface FileExecutionResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  error?: string | null;
  execution_time: number;
  output_data?: Record<string, unknown>;
  timestamp: string;
  file_id?: number;
  file_name?: string;
  submission_id?: number;
}

const executeApiCall = async <T>(endpoint: string, data: unknown): Promise<T> => {
  const url = `${process.env.REACT_APP_API_URL}/autograder/${endpoint}/`;
  const token = getAuthToken();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Execution API error: ${res.status} - ${errorText}`);
  }

  return res.json();
};

export const executeFile = (request: FileExecutionRequest): Promise<FileExecutionResult> =>
  executeApiCall<FileExecutionResult>('execute/file', request);
