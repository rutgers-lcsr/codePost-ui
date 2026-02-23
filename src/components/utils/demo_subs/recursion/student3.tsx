// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
const submission = (domain: string) => {
  const studentEmail = `student3@${domain}`;
  const graderEmail = `grader4@${domain}`;
  const sectionName = 'Section 1';
  const partnerEmail = `student8@${domain}`;
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
        code: `/******************************************************************************\n *  Student: ${studentEmail}\n *  Section: ${sectionName}\n *\n *  Partner: ${partnerEmail}\n *  Partner section: ${partnerSection}\n *\n *  Description:  Includes a few utility functions for working with int arrays.\n *  Implemented using recursion.\n *\n ******************************************************************************/\n\nimport java.util.Arrays;\n\npublic class RecursionUtils {\n\n  // Return sum of values contained within int array\n  public static int sum(int[] arr) {\n    if (arr.length == 0) {\n      return 0;\n    }\n\n    return sumHelper(arr, 0);\n  }\n\n  private static int sumHelper(int[] arr, int index) {\n    if (index == arr.length - 1) {\n      // If we have reached the end of the array, return value only\n      return arr[index];\n    } else {\n      // Peel off value and increment index\n      return arr[index] + sumHelper(arr, index++);\n    }\n  }\n\n  // Find an element in a (sorted) int array using binary search\n  public static boolean contains(int[] arr, int el) {\n    int lower = 0;\n    int upper = arr.length - 1;\n    return containsHelper(arr, el, 0, arr.length);\n  }\n\n  private static boolean containsHelper(int[] arr, int el, int lower, int upper) {\n    int midpoint = (lower + upper) / 2;\n\n    // Have we searched the entire array?\n    if (lower > upper) {\n      return false;\n    } else {\n      // Search the top half of the array\n      if (arr[midpoint] < el) {\n        return containsHelper(arr, el, midpoint+1, upper);\n      }\n\n      // Srearch the bottom half of the array\n      if (arr[midpoint] > el) {\n        return containsHelper(arr, el, 0, midpoint-1);\n      }\n\n      // we found the element\n      return true;\n    }\n  }\n\n}`,
        /* tslint:ensable */
        comments: [
          {
            text: 'Careful! The `++` operator, when placed _after_ the variable name, increments the value of the variable after it is evaluated. This means that if `someVar = 1`, `someFunction(someVar++)` is equivalent to `someFunction(1)`.\n\
\nBecause of this behavior, your code infinitely loops, continually calling `sumHelper(arr, 0)` and never reaching your base case.',

            startChar: 41,
            endChar: 48,
            startLine: 31,
            endLine: 31,
            pointDelta: 3,
            author: graderEmail,
            rubric: null,
          },
        ],
      },
    ],
  };
};

export default submission;
