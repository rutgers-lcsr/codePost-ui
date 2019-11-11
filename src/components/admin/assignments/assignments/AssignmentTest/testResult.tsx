const MAX_TRIES = 15;

export function awaitTestResult(id: string, callback: (result: any) => any, progressCallback?: (progress: any) => any) {
  let tries = 0;
  const interval = setInterval(() => {
    checkAndRefreshTimer(id, interval, callback, progressCallback);
    if (++tries === MAX_TRIES) {
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
  if (res.status == 200) {
    const result = await res.json();
    if (result.status == 'SUCCESS' || result.status == 'FAILURE') {
      callback(result.result);
      clearInterval(interval);
    } else if (result.result && progressCallback) {
      progressCallback(result.result);
    }
  } else {
    clearInterval(interval);
  }
}
