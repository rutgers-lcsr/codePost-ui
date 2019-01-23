function openSubmission(submissionID: number | string) {
  if (window) {
    window.open(`/grade/${submissionID}`, 'test', `width=${screen.availWidth * 0.9},height=${screen.availHeight}0.9`);
  }
}

export { openSubmission };
