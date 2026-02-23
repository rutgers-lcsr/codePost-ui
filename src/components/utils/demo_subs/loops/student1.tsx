// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
const submission = (domain: string) => {
  const studentEmail = `student1@${domain}`;
  const graderEmail = `grader1@${domain}`;
  const sectionName = 'Section 1';
  const partnerEmail = `student6@${domain}`;
  const partnerSection = 'Section 2';

  return {
    students: [studentEmail, partnerEmail],
    isFinalized: true,
    grader: graderEmail,
    files: [
      {
        name: 'LoopUtils.java',
        ext: 'java',
        /* tslint:disable */
        code: `/******************************************************************************\n *  Student: ${studentEmail}\n *  Section: ${sectionName}\n *\n *  Partner: ${partnerEmail}\n *  Partner section: ${partnerSection}\n *\n *  Description:  Includes a few utility functions useful for working with\n *  arrays (implemented with loops).\n *\n ******************************************************************************/\n\npublic class LoopUtils {\n\n  public static int max(int[] arr) {\n    int maxSoFar = 0;\n\n    for (int i = 0; i < arr.length; i++) {\n      if (arr[i] > maxSoFar) {\n        maxSoFar = arr[i];\n      }\n    }\n\n    return maxSoFar;\n  }\n\n  public static int[] reverse(int[] arr) {\n\n    int[] newArray = new int[arr.length];\n\n    for (int i = 0; i < arr.length; i++) {\n      newArray[i] = arr[arr.length - i - 1];\n    }\n\n    return newArray;\n  }\n\n  // Find an element in a (sorted) int array using binary search\n  public static boolean contains(int[] arr, int el) {\n    int lower = 0;\n    int upper = arr.length - 1;\n\n    while (lower <= upper) {\n      int midpoint = (lower + upper) / 2;\n\n\n      // See if we've found the target and can stop searching\n      if (arr[midpoint] == el) {\n        return true;\n      }\n\n      // Decide which half of the array to partition away\n      if (arr[midpoint] < el) {\n        lower = midpoint + 1;\n      } else if (arr[midpoint] > el) {\n        upper = midpoint - 1;\n      }\n    }\n\n    // we are done searching\n    return false;\n  }\n\n}`,
        /* tslint:ensable */
        comments: [
          {
            text: 'Try working through an example where you input `arr = [-1, -2, -3]`. Since no element of `arr` is greater than the initial value of `maxSoFar`, your `max` function will incorrectly report 0 as the maximum element. Remember, ints can be negative!',
            startChar: 4,
            endChar: 21,
            startLine: 15,
            endLine: 15,
            pointDelta: 1,
            author: graderEmail,
            rubric: 'Incorrectly initializes maximum element.',
          },
          {
            text: 'great comments!',
            startChar: 2,
            endChar: 64,
            startLine: 37,
            endLine: 37,
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
