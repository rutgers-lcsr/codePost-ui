const openHelpDoc = (link: string) => {
  return () => {
    window.open(link);
  };
};

const buildQuery = (text: string, link: string) => {
  return {
    kind: 'action' as const,
    value: text,
    label: text,
    callback: () => {
      window.open(link);
    },
  };
};

const helpQueryMap = [
  buildQuery(
    'How to: Deduct points from submission',
    'https://help.codepost.io/en/articles/3164748-how-to-deduct-points-from-submission',
  ),
  buildQuery(
    'How to: Apply a rubric comment to a submission',
    'https://help.codepost.io/en/articles/3164750-how-to-apply-a-rubric-comment-to-a-submission',
  ),
  buildQuery(
    'How to: Add bonus points / extra credit to a submission',
    'https://help.codepost.io/en/articles/3164752-how-to-add-bonus-points-extra-credit-to-a-submission',
  ),
  buildQuery(
    'How to: How to grade Jupyter Notebooks',
    'https://help.codepost.io/en/articles/3176545-how-to-how-to-grade-jupyter-notebooks',
  ),
  buildQuery('How to: Comment on code', 'https://help.codepost.io/en/articles/3164747-how-to-comment-on-code'),
  buildQuery(
    'How to: Use Markdown in comments',
    'https://help.codepost.io/en/articles/3176539-how-to-use-markdown-in-comments',
  ),
  buildQuery(
    'How to: Assign a grader to a submission',
    'https://help.codepost.io/en/articles/3164753-how-to-assign-a-grader-to-a-submission',
  ),
];

export { helpQueryMap };
