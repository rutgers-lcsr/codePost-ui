// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { useCallback } from 'react';
import { autograderApi } from '../api-client/clients';
import { message } from 'antd';

export const useTaskPolling = () => {
  const pollTask = useCallback(async (taskId: string): Promise<Record<string, unknown>> => {
    // Poll every 1 second
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    let attempts = 0;
    const maxAttempts = 120; // 2 minutes timeout (approx)

    while (attempts < maxAttempts) {
      try {
        const statusResponse = await autograderApi.tasksRetrieve({ id: taskId });

        if (statusResponse.status === 'SUCCESS') {
          return statusResponse.result as Record<string, unknown>;
        }

        if (statusResponse.status === 'FAILURE' || statusResponse.status === 'REVOKED') {
          message.error('Task failed or was revoked.');
          throw new Error('Task failed or was revoked.');
        }

        // PENDING, STARTED, RETRY -> wait and retry
        await delay(1000);
        attempts++;
      } catch (err) {
        // If retrieving status fails (network error), we might want to retry or fail
        console.error('Failed to poll task status:', err);
        throw err;
      }
    }

    throw new Error('Execution timed out.');
  }, []);

  return { pollTask };
};
