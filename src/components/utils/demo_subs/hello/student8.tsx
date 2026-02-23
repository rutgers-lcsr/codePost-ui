// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
const submission = (domain: string) => {
  const studentEmail = `student8@${domain}`;
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

        code: `/******************************************************************************\n *  Student: ${studentEmail}\n *  Section: ${sectionName}\n *\n *  Partner: ${partnerEmail}\n *  Partner section: ${partnerSection}\n *\n *  Description:  Prints 'Hello, World' to the terminal.\n *                By tradition, this is everyone's first program.\n *                Brian Kernighan initiated this tradition in 1974.\n *\n ******************************************************************************/\n\npublic class HelloWorld {\n\n    public static void main(String[] args) {\n        System.out.println("Hello, World");\n // Prints Hello, World\n\n    }\n\n}`,
        comments: [
          {
            text: 'Normally we place comments above the line (or block) of code they reference. Your intuition to comment is great, but a simple `System.out.println` statement is self-explanatory, so no need to explain it further with a comment. Once your code becomes more complex, print on the comments!',
            startChar: 1,
            endChar: 23,
            startLine: 17,
            endLine: 17,
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
