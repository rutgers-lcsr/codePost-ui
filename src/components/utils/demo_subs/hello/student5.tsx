const submission = (domain: string) => {
  const studentEmail = `student5@${domain}`;
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
        // eslint-disable-next-line
        code: `/******************************************************************************\n *  Student: ${studentEmail}\n *  Section: ${sectionName}\n *\n *  Partner: ${partnerEmail}\n *  Partner section: ${partnerSection}\n *\n *  Description:  Prints 'Hello, World' to the terminal.\n *                By tradition, this is everyone's first program.\n *                Brian Kernighan initiated this tradition in 1974.\n *\n ******************************************************************************/\n\npublic class HelloWorld {\n    public static void main(String[] args) {\n\n        //print statement\n        System.out.println("Hello, World");\n    }\n}`,
        comments: [
          {
            text: 'Nice job this week! Keep it up!',
            startChar: 13,
            endChar: 28,
            startLine: 1,
            endLine: 1,
            pointDelta: 0,
            author: graderEmail,
            rubric: null,
          },
          {
            text:
              "Comments that describe simple statements like print are unnecessary -- it's usually better to let your code speak for itself. That said, when your code becomes more complex, comments will be crucial, so your intuition will serve you well in future weeks.",
            startChar: 8,
            endChar: 25,
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
