import { sendSlack } from '../../../core/slack';
import { message } from 'antd';

const MAX_TRIES = 25;

export function awaitTestResult(id: string, callback: (result: any) => any, progressCallback?: (progress: any) => any) {
  let tries = 0;
  const interval = setInterval(() => {
    checkAndRefreshTimer(id, interval, callback, progressCallback);
    if (++tries === MAX_TRIES && !progressCallback) {
      sendSlack(
        'No test result received after polling - infinite loop',
        window.location.href,
        '#cc0000',
        '#autograder_bugs',
      );
      message.error(
        'Your test is taking longer than usual to complete. Please try again in a few minutes, or contact the codePost team using the chatbox on the bottom right of this page if the problem persists.',
        25,
      );
      window.clearInterval(interval);
    }
  }, 2000);
}

async function checkAndRefreshTimer(
  id: string,
  interval: any,
  callback: (result: any) => any,
  progressCallback?: (progress: any) => any,
) {
  const res = await fetch(`${process.env.REACT_APP_API_URL}/autograder/tasks/${id}/`, {
    headers: {
      Authorization: `JWT ${localStorage.getItem('token') || ''}`,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  });
  if (res.status === 200) {
    const result = await res.json();
    if (result.status === 'SUCCESS' || result.status === 'FAILURE') {
      callback(result.result);
      clearInterval(interval);
    } else if (result.result && progressCallback) {
      progressCallback(result.result);
    }
  } else {
    clearInterval(interval);
  }
}
