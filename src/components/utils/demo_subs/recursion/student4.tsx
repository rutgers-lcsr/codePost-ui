const submission = (domain: string) => {
  const studentEmail = `student4@${domain}`;
  const graderEmail = `grader4@${domain}`;
  const sectionName = 'Section 2';
  const partnerEmail = `student9@${domain}`;
  const partnerSection = 'Section 3';

  return {
    students: [studentEmail, partnerEmail],
    isFinalized: true,
    grader: graderEmail,
    files: [
      {
        name: 'RecursionUtils.java',
        ext: 'java',
        /* tslint:disable */
        code: `/******************************************************************************\n *  Student: ${studentEmail}\n *  Section: ${sectionName}\n *\n *  Partner: ${partnerEmail}\n *  Partner section: ${partnerSection}\n *\n *  Description:  Includes a few utility functions for working with int arrays.\n *  Implemented using recursion.\n *\n ******************************************************************************/\n\nimport java.util.Arrays;\n\npublic class RecursionUtils {\n\n  // Return sum of values contained within int array\n  public static int sum(int[] arr) {\n    if (arr.length == 0) {\n      return 0;\n    }\n\n    return sumHelper(arr, 0);\n  }\n\n  private static int sumHelper(int[] arr, int index) {\n    if (index == arr.length - 1) {\n      return arr[index];\n    } else {\n        return arr[index] + sumHelper(arr, index + 1);\n    }\n  }\n\n  // Find an element in a (sorted) int array using binary search\n  public static boolean contains(int[] arr, int el) {\n    int lower = 0;\n    int upper = arr.length - 1;\n    return containsHelper(arr, el, 0, arr.length);\n  }\n\n  private static boolean containsHelper(int[] arr, int el, int lower, int upper) {\n    int midpoint = (lower + upper) / 2;\n\n    // Have we searched the entire array?\n    if (lower > upper) {\n      return false;\n    } else {\n      // Search the top half of the array\n      if (arr[midpoint] > el) {\n        return containsHelper(arr, el, midpoint, upper);\n      }\n\n      // Srearch the bottom half of the array\n      if (arr[midpoint] < el) {\n        return containsHelper(arr, el, 0, midpoint);\n      }\n\n      // we found the element\n      return true;\n    }\n  }\n\n}`,
        /* tslint:ensable */
        comments: [
          {
            text: 'You actually need to pass `midpoint + 1` here. Why? Because you know `arr[midpoint] != el`, so you no longer need to keep it around.',
            startChar: 39,
            endChar: 47,
            startLine: 49,
            endLine: 49,
            pointDelta: 2,
            author: graderEmail,
            rubric: null,
          },
          {
            text: 'Same here, you need to pass `midpoint - 1` instead of midpoint for the logic to work correctly.',
            startChar: 42,
            endChar: 50,
            startLine: 54,
            endLine: 54,
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
