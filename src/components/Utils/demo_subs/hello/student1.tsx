const submission = (domain: string) => {
  const studentEmail = `student1@${domain}`;
  const graderEmail = `grader0@${domain}`;
  const sectionName = 'Section 1';
  const partnerSection = 'N/A';
  const partnerEmail = 'none';

  return {
    students: [studentEmail],
    isFinalized: true,
    grader: graderEmail,
    files: [
      {
        name: 'hello.java',
        ext: 'java',
        /* tslint:disable */
        code: `/******************************************************************************\n *  Student: ${studentEmail}\n *  Section: ${sectionName}\n *\n *  Partner: ${partnerEmail}\n *  Partner section: ${partnerSection}\n *\n *  Description:  Prints \'Hello, World\' to the terminal.\n *                By tradition, this is everyone\'s first program.\n *                Brian Kernighan initiated this tradition in 1974.\n *\n ******************************************************************************/\n\npublic class HelloWorld {\n    public static void main(String[] args) {\n        System.out.print("Hello, World");\n\n    }\n}`,
        /* tslint:ensable */
        comments: [
          {
            text: 'nice!',
            startChar: 1,
            endChar: 4,
            startLine: 0,
            endLine: 0,
            pointDelta: 1,
            author: graderEmail,
          },
        ],
      },
    ],
  };
};

export default submission;
