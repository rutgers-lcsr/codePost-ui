import { getAuthToken } from '../utils/auth';

const API_BASE = process.env.REACT_APP_API_URL || '';

const getAuthHeader = async (): Promise<string> => {
  const token = getAuthToken();
  if (!token) return '';
  if (token.includes('.')) {
    return `Bearer ${token}`;
  }
  return `Token ${token}`;
};

const buildUrl = (path: string) => `${API_BASE}${path}`;

const requestJson = async <T>(path: string, options: RequestInit): Promise<T> => {
  const auth = await getAuthHeader();
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: auth } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const message = data?.error || data?.detail || response.statusText || 'Request failed';
    throw new Error(message);
  }

  return data as T;
};

export interface ShellMountInfo {
  host: string;
  container: string;
  mode: string;
}

export interface ShellStartResponse {
  containerId: string;
  image: string;
  expiresAt: string;
  workingDir: string;
  mounts: ShellMountInfo[];
}

export interface ShellExecResponse {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface ShellStopResponse {
  success: boolean;
}

export interface ShellStartRequest {
  timeoutSeconds?: number;
  includeDatasets?: boolean;
  includeAssignmentFiles?: boolean;
  networkAccess?: boolean;
}

export interface ShellExecRequest {
  containerId: string;
  command: string;
  workdir?: string;
  timeoutSeconds?: number;
}

export interface ShellStopRequest {
  containerId: string;
}

export const startShellSession = async (
  environmentId: number,
  body: ShellStartRequest,
): Promise<ShellStartResponse> => {
  return requestJson<ShellStartResponse>(`/autograder/environments/${environmentId}/shell/start/`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export const execShellCommand = async (environmentId: number, body: ShellExecRequest): Promise<ShellExecResponse> => {
  return requestJson<ShellExecResponse>(`/autograder/environments/${environmentId}/shell/exec/`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export const stopShellSession = async (environmentId: number, body: ShellStopRequest): Promise<ShellStopResponse> => {
  return requestJson<ShellStopResponse>(`/autograder/environments/${environmentId}/shell/stop/`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
};
