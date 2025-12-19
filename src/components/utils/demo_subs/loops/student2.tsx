const submission = (domain: string) => {
  const studentEmail = `student2@${domain}`;
  const graderEmail = `grader2@${domain}`;
  const sectionName = 'Section 1';
  const partnerSection = 'N/A';
  const partnerEmail = 'none';

  return {
    students: [studentEmail],
    isFinalized: true,
    grader: graderEmail,
    files: [
      {
        name: 'LoopUtils.java',
        ext: 'java',
        /* tslint:disable */
        code: `/******************************************************************************\n *  Student: ${studentEmail}\n *  Section: ${sectionName}\n *\n *  Partner: ${partnerEmail}\n *  Partner section: ${partnerSection}\n *\n *  Description:  Includes a few utility functions useful for working with\n *  arrays (implemented with loops).\n *\n ******************************************************************************/\n\npublic class LoopUtils {\n\n  public static int max(int[] arr) {\n    int maxSoFar = Integer.MIN_VALUE;\n\n    for (int i = 0; i < arr.length; i++) {\n      if (arr[i] > maxSoFar) {\n        maxSoFar = arr[i];\n      }\n    }\n\n    return maxSoFar;\n  }\n\n  public static int[] reverse(int[] arr) {\n\n    int[] newArray = new int[arr.length];\n\n    for (int i = 0; i < arr.length; i++) {\n      newArray[arr.length - i - 1] = arr[i];\n    }\n\n    return newArray;\n  }\n\n  // Find an element in a (sorted) int array using binary search\n  public static boolean contains(int[] arr, int el) {\n    int lower = 0;\n    int upper = arr.length - 1;\n\n    while (lower <= upper) {\n      int midpoint = (lower + upper) / 2;\n\n      if (arr[midpoint] == el) {\n        return true;\n      }\n\n      if (arr[midpoint] < el) {\n        lower = midpoint;\n      } else if (arr[midpoint] > el) {\n        upper = midpoint;\n      }\n    }\n\n    return false;\n  }\n\n}`,
        /* tslint:ensable */
        comments: [
          {
            text: 'nice!',
            startChar: 4,
            endChar: 37,
            startLine: 15,
            endLine: 15,
            pointDelta: 0,
            author: graderEmail,
            rubric: null,
          },
          {
            text: 'it would be helpful to comment your if statements in this `while` body (this will be even more true next week, when we re-write this function using recursion).',
            startChar: 6,
            endChar: 32,
            startLine: 45,
            endLine: 45,
            pointDelta: 0,
            author: graderEmail,
            rubric: null,
          },
          {
            text: 'As we discussed in class, you can re-write this line to `maxSoFar = Math.max(maxSoFar, arr[i])` to avoid the if statement (but your code totally works too!)',
            startChar: 6,
            endChar: 7,
            startLine: 18,
            endLine: 20,
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
