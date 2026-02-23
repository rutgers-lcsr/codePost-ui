// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
const submission = (domain: string) => {
  const studentEmail = `student0@${domain}`;
  const graderEmail = `grader0@${domain}`;
  const sectionName = 'Section 1';
  const partnerEmail = `student5@${domain}`;
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
        code: `/******************************************************************************\n *  Student: ${studentEmail}\n *  Section: ${sectionName}\n *\n *  Partner: ${partnerEmail}\n *  Partner section: ${partnerSection}\n *\n *  Description:  Includes a few utility functions useful for working with\n *  arrays (implemented with loops).\n *\n ******************************************************************************/\n\npublic class LoopUtils {\n\n  // Find the maximum element in an int array\n  public static int max(int[] arr) {\n    int maxSoFar = Integer.MIN_VALUE;\n\n    for (int i = 0; i < arr.length; i++) {\n      if (arr[i] > maxSoFar) {\n        maxSoFar = arr[i];\n      }\n    }\n\n    return maxSoFar;\n  }\n\n  // Reverse an int array\n  public static int[] reverse(int[] arr) {\n\n    // in-place merge (O(n) time and O(1) space)\n    for (int i = 0; i < arr.length/2; i++) {\n      int temp = arr[i];\n      arr[i] = arr[arr.length - i - 1];\n      arr[arr.length - i - 1] = temp;\n    }\n\n    return arr;\n  }\n\n  // Find an element in a (sorted) int array using binary search\n  public static boolean contains(int[] arr, int el) {\n    int lower = 0;\n    int upper = arr.length - 1;\n\n    while (lower <= upper) {\n      int midpoint = (lower + upper) / 2;\n\n      // See if we've found the target and can stop searching\n      if (arr[midpoint] == el) {\n        return true;\n      }\n\n      // Decide which half of the array to partition away\n      if (arr[midpoint] < el) {\n        lower = midpoint + 1;\n      } else if (arr[midpoint] > el) {\n        upper = midpoint - 1;\n      }\n    }\n\n    // if upper and lower cross, we have searched the entire array\n    // and not found el\n    return false;\n  }\n\n}`,
        /* tslint:ensable */
        comments: [
          {
            text: 'great work on this assignment!',
            startChar: 13,
            endChar: 22,
            startLine: 12,
            endLine: 12,
            pointDelta: 0,
            author: graderEmail,
            rubric: null,
          },
          {
            text: 'great job on this! Nailing the in-place merge is tricky!',
            startChar: 7,
            endChar: 48,
            startLine: 30,
            endLine: 30,
            pointDelta: -1,
            author: graderEmail,
            rubric: 'Correct in-place merge: nice job!',
          },
          {
            text: 'great commenting is especially helpful when logic is complex - like it is here',
            startChar: 4,
            endChar: 23,
            startLine: 61,
            endLine: 62,
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
