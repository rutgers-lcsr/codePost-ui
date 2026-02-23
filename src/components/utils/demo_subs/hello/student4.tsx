// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
const submission = (domain: string) => {
  const studentEmail = `student4@${domain}`;
  const graderEmail = `grader0@${domain}`;
  const sectionName = 'Section 2';
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

        code: `/******************************************************************************\n *  Student: ${studentEmail}\n *  Section: ${sectionName}\n *\n *  Partner: ${partnerEmail}\n *  Partner section: ${partnerSection}\n *\n *  Description:  Prints 'Hello, World' to the terminal.\n *                By tradition, this is everyone's first program.\n *                Brian Kernighan initiated this tradition in 1974.\n *\n ******************************************************************************/\n\npublic class HelloWorld {\n    public static void main(String[] args) {\n\n        // Store statement we want to print\n        String toPrint = "Hello, World";\n\n        // print the statement\n        System.out.print(toPrint);\n\n    }\n}`,
        comments: [
          {
            text: "Interesting approach! Storing values in variables (and avoiding magic numbers) is a good practice. In this case, it's fine to just print the string, but this intuition will serve you well as programs become more complex.",
            startChar: 8,
            endChar: 39,
            startLine: 17,
            endLine: 17,
            pointDelta: 0,
            author: graderEmail,
            rubric: null,
          },
          {
            text: 'You can do this by either including a \n in your `toPrint` variable, or by using `System.out.println` (which automatically places a newline at the end of whatever you pass to it).',
            startChar: 8,
            endChar: 34,
            startLine: 20,
            endLine: 20,
            pointDelta: 1,
            author: graderEmail,
            rubric: 'You forgot to print a newline at the end of your string!',
          },
        ],
      },
    ],
  };
};

export default submission;
