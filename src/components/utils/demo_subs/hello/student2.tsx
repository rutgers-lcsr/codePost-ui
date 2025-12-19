const submission = (domain: string) => {
  const studentEmail = `student2@${domain}`;
  const graderEmail = `grader2@${domain}`;
  const sectionName = 'Section 1';
  const partnerEmail = `student7@${domain}`;
  const partnerSection = 'Section 3';

  return {
    students: [studentEmail],
    isFinalized: true,
    grader: graderEmail,
    files: [
      {
        name: 'HelloWorld.java',
        ext: 'java',

        code: `/******************************************************************************\n *  Student: ${studentEmail}\n *  Section: ${sectionName}\n *\n *  Partner: ${partnerEmail}\n *  Partner section: ${partnerSection}\n *\n *  Description:  Prints 'Hello, World' to the terminal.\n *                By tradition, this is everyone's first program.\n *                Brian Kernighan initiated this tradition in 1974.\n *\n ******************************************************************************/\n\npublic class HelloWorld  {\n    public static void main (String []  args)  {\n        System.out.println ("Hello, wurld") ;\n    }\n}`,
        comments: [
          {
            text: "Don't sweat the missed points this week. You'll have plenty more opportunities this semester.",
            startChar: 13,
            endChar: 33,
            startLine: 1,
            endLine: 1,
            pointDelta: 0,
            author: graderEmail,
            rubric: null,
          },
          {
            text: 'Whoops!  Make sure to follow the output specifications to the letter next time.',
            startChar: 28,
            endChar: 42,
            startLine: 15,
            endLine: 15,
            pointDelta: 1,
            author: graderEmail,
            rubric: 'You printed out the wrong string!',
          },
        ],
      },
    ],
  };
};

export default submission;
