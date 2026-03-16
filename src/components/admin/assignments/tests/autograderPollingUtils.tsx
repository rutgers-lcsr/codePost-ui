// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { sendSlack } from '../../../core/slack';
import { message } from 'antd';

const MAX_TRIES_RUN = 150;

// Running a test
export function awaitTestResult(
  id: string,
  callback: (result: unknown) => void,
  progressCallback?: (progress: unknown) => void,
) {
  let tries = 0;
  const interval = setInterval(() => {
    pollTestResult(id, interval, callback, progressCallback);
    if (++tries === MAX_TRIES_RUN && !progressCallback) {
      // sendSlack(
      //   `No test result received after polling - infinite loop ${id}`,
      //   window.location.href,
      //   '#cc0000',
      //   '#autograder_bugs',
      // );
      message.error(
        'Your test is taking longer than usual to complete. Please try again in a few minutes, or contact the codePost team using the chatbox on the bottom right of this page if the problem persists.',
        25,
      );
      window.clearInterval(interval);
    }
  }, 2000);
}

async function pollTestResult(
  id: string,
  interval: ReturnType<typeof setInterval>,
  callback: (result: unknown) => void,
  progressCallback?: (progress: unknown) => void,
) {
  const res = await fetch(`${process.env.REACT_APP_API_URL}/autograder/tasks/${id}/`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  });

  if (res.status !== 200) {
    // Should never hit a non 200 autograder result
    sendSlack(
      `NO RESULT test result: ${id} ${window.location.href}`,
      `${JSON.stringify(res)}`,
      '#cc0000',
      '#autograder_bugs',
    );
    message.error(
      'An error occured. The codePost team has been notified and will be in touch shortly. In the meantime, please try refreshing and running the test again.',
      25,
    );
    clearInterval(interval);
    return;
  }

  const result = await res.json();
  if (result.status === 'SUCCESS') {
    // Case 1: Successful result
    if (result.result !== null && result.result !== undefined) {
      callback(result.result);
      clearInterval(interval);
    }
    // If the result is null or undefined, but a success, that means the data hasn't been written yet so we keep polling
  } else if (result.status === 'FAILURE') {
    // Case 2: Result failed for some reason (e.g., excessive logging, db timeouts)
    sendSlack(
      `FAILURE test result: ${id} ${window.location.href}`,
      `${JSON.stringify(result.result)}`,
      '#cc0000',
      '#autograder_bugs',
    );
    clearInterval(interval);
    message.error(
      'An error occured. The codePost team has been notified and will be in touch shortly. In the meantime, please try refreshing and running the test again.',
      25,
    );
  } else if (result.result && progressCallback) {
    // Case 3: Result is a progress result
    progressCallback(result.result);
  }
  // Case 4: Pending result -- do nothing
}
