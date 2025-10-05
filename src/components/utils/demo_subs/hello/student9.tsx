const submission = (domain: string) => {
  const studentEmail = `student9@${domain}`;
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
        code: `/******************************************************************************\n *  Student: ${studentEmail}\n *  Section: ${sectionName}\n *\n *  Partner: ${partnerEmail}\n *  Partner section: ${partnerSection}\n *\n *  Description:  Prints 'Hello, World' to the terminal.\n *                By tradition, this is everyone's first program.\n *                Brian Kernighan initiated this tradition in 1974.\n *\n ******************************************************************************/\n\npublic class HelloWorld {\n    public static void main(String[] args)\n    {\n\n        //Printing out a string of characters\n        System.out.println("Hello, World");\n    }\n\n}`,
        comments: [
          {
            text: 'Nice job!',
            startChar: 13,
            endChar: 33,
            startLine: 1,
            endLine: 1,
            pointDelta: 0,
            author: graderEmail,
            rubric: null,
          },
          {
            text:
              'Try to avoid unnecessary whitespace (like the line between the start of your `main` function body and your comment).',
            startChar: 4,
            endChar: 42,
            startLine: 14,
            endLine: 14,
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
