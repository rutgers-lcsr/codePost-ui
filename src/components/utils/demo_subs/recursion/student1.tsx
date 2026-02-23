// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
const submission = (domain: string) => {
  const studentEmail = `student1@${domain}`;
  const graderEmail = `grader4@${domain}`;
  const sectionName = 'Section 1';
  const partnerEmail = `student6@${domain}`;
  const partnerSection = 'Section 2';

  return {
    students: [studentEmail, partnerEmail],
    isFinalized: true,
    grader: graderEmail,
    files: [
      {
        name: 'RecursionUtils.java',
        ext: 'java',
        /* tslint:disable */
        code: `/******************************************************************************\n *  Student: ${studentEmail}\n *  Section: ${sectionName}\n *\n *  Partner: ${partnerEmail}\n *  Partner section: ${partnerSection}\n *\n *  Description:  Includes a few utility functions for working with int arrays.\n *  Implemented using recursion.\n *\n ******************************************************************************/\n\nimport java.util.Arrays;\n\npublic class RecursionUtils {\n\n  // Return sum of values contained within int array\n  public static int sum(int[] arr) {\n    if (arr.length == 1) {\n      return arr[0];\n    } else {\n      int[] partial = Arrays.copyOfRange(arr, 1, arr.length); // lop off first element\n      return (arr[0] + sum(partial));\n    }\n  }\n\n  // Find an element in a (sorted) int array using binary search\n  public static boolean contains(int[] arr, int el) {\n    int lower = 0;\n    int upper = arr.length - 1;\n    int midpoint = (lower + upper) / 2;\n\n    // Have we searched the entire array?\n    if (lower > upper) {\n      return false;\n    } else {\n      // Search the top half of the array\n      if (arr[midpoint] < el) {\n        int[] partial = Arrays.copyOfRange(arr, midpoint + 1, upper);\n        return contains(partial, el);\n      }\n\n      // Srearch the bottom half of the array\n      if (arr[midpoint] > el) {\n        int[] partial = Arrays.copyOfRange(arr, 0, midpoint - 1);\n        return contains(partial, el);\n      }\n\n      // we found the element\n      return true;\n    }\n  }\n\n}`,
        /* tslint:ensable */
        comments: [
          {
            text: "This logic is correct, but it requires you to create a new arrays of sizes `n-1, n-2, ..., 1` (where n is the length of the original array). You can get around this by creating a helper function and passing the index of the 'new' array to it.",
            startChar: 22,
            endChar: 60,
            startLine: 21,
            endLine: 21,
            pointDelta: 1,
            author: graderEmail,
            rubric: 'Uses extra arrays',
          },
          {
            text: 'Nice use of the `if...else` pattern to encode mutually exclusive logic.',
            startChar: 4,
            endChar: 24,
            startLine: 33,
            endLine: 33,
            pointDelta: 0,
            author: graderEmail,
            rubric: null,
          },
          {
            text: 'The same concept applies here as in my comment above. Instead of creating a new array, you can create a helper function that takes as argument a `lower` and `upper` bound.',
            startChar: 24,
            endChar: 64,
            startLine: 44,
            endLine: 44,
            pointDelta: 1,
            author: graderEmail,
            rubric: 'Uses extra arrays',
          },
          {
            text: "Don't forget to catch the case where `arr.length == 0`! Right now, if I let `arr = []`, your code produces an `IndexOutofBounds` error when trying to access `arr[0]`.",
            startChar: 2,
            endChar: 36,
            startLine: 17,
            endLine: 17,
            pointDelta: 0,
            author: graderEmail,
            rubric: "Doesn't gracefully handle length-0 arrays.",
          },
        ],
      },
    ],
  };
};

export default submission;
