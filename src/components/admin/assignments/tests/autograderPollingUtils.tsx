// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { sendSlack } from '../../../core/slack';
import { message } from 'antd';

const MAX_TRIES_RUN = 45;
const MAX_TRIES_BUILD = 120;

// Running a test
export function awaitTestResult(id: string, callback: (result: any) => any, progressCallback?: (progress: any) => any) {
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
  interval: any,
  callback: (result: any) => any,
  progressCallback?: (progress: any) => any,
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

// Running a build
export function awaitBuildResult(id: number, callback: (result: any) => any) {
  let tries = 0;
  const interval = setInterval(() => {
    pollBuildResult(id, interval, callback);
    if (++tries === MAX_TRIES_BUILD) {
      sendSlack('Long build notification - over 2 minutes', window.location.href, '#f7f7f7', '#autograder_bugs');
      message.info('Your build is taking a long time to complete. Try coming back later to check on the results.', 25);
      window.clearInterval(interval);
    }
  }, 1000);
}

async function pollBuildResult(id: number, interval: any, callback: (result: any) => any) {
  // We use fetch instead of io-ts functions because we need to turn off the timer in case
  //    of a failed response (e.g., 404)
  const res = await fetch(`${process.env.REACT_APP_API_URL}/autograder/environments/${id}/build_status/`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  });
  if (res.status === 200) {
    const result = await res.json();

    callback(result);
    if (!result.inProgress) {
      clearInterval(interval);
    }
  } else {
    clearInterval(interval);
  }
}
