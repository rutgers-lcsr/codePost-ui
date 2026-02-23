// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
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
        name: 'HelloWorld.java',
        ext: 'java',

        code: `/******************************************************************************\n *  Student: ${studentEmail}\n *  Section: ${sectionName}\n *\n *  Partner: ${partnerEmail}\n *  Partner section: ${partnerSection}\n *\n *  Description:  Prints 'Hello, World' to the terminal.\n *                By tradition, this is everyone's first program.\n *                Brian Kernighan initiated this tradition in 1974.\n *\n ******************************************************************************/\n\npublic class HelloWorld {\n    public static void main(String[] args) {\n        System.out.print("Hello, World");\n\n    }\n}`,
        comments: [
          {
            text: 'Nice job! Keep up the good work!',
            startChar: 13,
            endChar: 33,
            startLine: 1,
            endLine: 1,
            pointDelta: 0,
            author: graderEmail,
            rubric: null,
          },
          {
            text: "This program is really simple, so it's fine that you didn't comment anything. That said, when your programs become more complex, comments will be crucial for helping others (like me!) understand your code.",
            startChar: 4,
            endChar: 44,
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
