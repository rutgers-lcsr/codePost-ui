const submission = (domain: string) => {
  return {
    students: [`student0@${domain}`],
    isFinalized: true,
    grader: `grader0@${domain}`,
    files: [
      {
        name: 'hello.java',
        ext: 'java',
        code: 'hello!',
        comments: [
          {
            text: 'nice!',
            startChar: 1,
            endChar: 4,
            startLine: 0,
            endLine: 0,
            pointDelta: 1,
          },
        ],
      },
    ],
  };
};
