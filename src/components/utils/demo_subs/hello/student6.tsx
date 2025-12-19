const submission = (domain: string) => {
  const studentEmail = `student6@${domain}`;
  const graderEmail = `grader3@${domain}`;
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

        code: `/******************************************************************************\n *  Student: ${studentEmail}\n *  Section: ${sectionName}\n *\n *  Partner: ${partnerEmail}\n *  Partner section: ${partnerSection}\n *\n *  Description:  Prints 'Hello, World' to the terminal.\n *                By tradition, this is everyone's first program.\n *                Brian Kernighan initiated this tradition in 1974.\n *\n ******************************************************************************/\n\n public class HelloWorld {\n\n    public static void main(String[] args) {\n        // Prints "Hello, World" to the terminal window.\n        System.out.println("Hello, World");\n    }\n\n}\n`,
        comments: [
          {
            text: 'Nice job this week! Keep it up!',
            startChar: 4,
            endChar: 28,
            startLine: 1,
            endLine: 1,
            pointDelta: 0,
            author: graderEmail,
            rubric: null,
          },
          {
            text: 'Comments that describe simple statements (like a print statement) are usually unnecessary. That said, your intuition to comment will serve you well after your code becomes more complex!',
            startChar: 8,
            endChar: 56,
            startLine: 16,
            endLine: 16,
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
