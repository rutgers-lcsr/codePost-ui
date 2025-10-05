const submission = (domain: string) => {
  const studentEmail = `student7@${domain}`;
  const graderEmail = `grader1@${domain}`;
  const sectionName = 'Section 3';
  const partnerSection = 'N/A';
  const partnerEmail = 'none';

  return {
    students: [studentEmail],
    isFinalized: true,
    grader: graderEmail,
    files: [
      {
        name: 'HelloWorld.java',
        ext: 'java',
        // eslint-disable-next-line
        code: `/******************************************************************************\n *  Student: ${studentEmail}\n *  Section: ${sectionName}\n *\n *  Partner: ${partnerEmail}\n *  Partner section: ${partnerSection}\n *\n *  Description:  Prints 'Hello, World' to the terminal.\n *                By tradition, this is everyone's first program.\n *                Brian Kernighan initiated this tradition in 1974.\n *\n ******************************************************************************/\n\n\n\n\npublic class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello, World");\n\n\n    }\n}`,
        comments: [
          {
            text:
              'Try avoid unnecessary whitespace (like the lines between the end of your `System.out.println` call and the end of the `main` function body).',
            startChar: 4,
            endChar: 5,
            startLine: 17,
            endLine: 21,
            pointDelta: 0,
            author: graderEmail,
            rubric: null,
          },
        ],
      },
    ],
  };
};

export default submission;
