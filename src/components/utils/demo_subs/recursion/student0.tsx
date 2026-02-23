// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
const submission = (domain: string) => {
  const studentEmail = `student0@${domain}`;
  const graderEmail = `grader4@${domain}`;
  const sectionName = 'Section 1';
  const partnerEmail = `student5@${domain}`;
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
        code: `/******************************************************************************\n *  Student: ${studentEmail}\n *  Section: ${sectionName}\n *\n *  Partner: ${partnerEmail}\n *  Partner section: ${partnerSection}\n *\n *  Description:  Includes a few utility functions for working with int arrays.\n *  Implemented using recursion.\n *\n ******************************************************************************/\n\nimport java.util.Arrays;\n\npublic class RecursionUtils {\n\n  // Return sum of values contained within int array\n  public static int sum(int[] arr) {\n    if (arr.length == 0) {\n      return 0;\n    }\n\n    if (arr.length == 1) {\n      return arr[0];\n    } else {\n      int[] partial = Arrays.copyOfRange(arr, 1, arr.length); // lop off first element\n      return (arr[0] + sum(partial));\n    }\n  }\n\n  // Find an element in a (sorted) int array using binary search\n  public static boolean contains(int[] arr, int el) {\n    int lower = 0;\n    int upper = arr.length - 1;\n    int midpoint = (lower + upper) / 2;\n\n    // Have we searched the entire array?\n    if (lower > upper) {\n      return false;\n    }\n\n    // Have we found the element?\n    if (arr[midpoint] == el) {\n      return true;\n    }\n\n    // Search the top half of the array\n    if (arr[midpoint] < el) {\n      int[] partial = Arrays.copyOfRange(arr, midpoint + 1, upper);\n      return contains(partial, el);\n    }\n\n\n    // Srearch the bottom half of the array\n    if (arr[midpoint] > el) {\n      int[] partial = Arrays.copyOfRange(arr, 0, midpoint - 1);\n      return contains(partial, el);\n    }\n\n    // Won't reach here\n    return false;\n  }\n\n}`,
        /* tslint:ensable */
        comments: [
          {
            text: "This logic is correct, but it requires you to create a new arrays of sizes `n-1, n-2, ..., 1` (where n is the length of the original array). You can get around this by creating a helper function and passing the index of the 'new' array to it.",
            startChar: 6,
            endChar: 61,
            startLine: 25,
            endLine: 25,
            pointDelta: 1,
            author: graderEmail,
            rubric: 'Uses extra arrays',
          },
          {
            text: 'The same concept applies here as in my comment above. Instead of creating a new array, you can create a helper function that takes as argument a `lower` and `upper` bound.',
            startChar: 22,
            endChar: 66,
            startLine: 48,
            endLine: 48,
            pointDelta: 1,
            author: graderEmail,
            rubric: 'Uses extra arrays',
          },
          {
            text: "This works (and satisfies the compiler). But it's weird to have a never reached statement in your code. Instead, use, `if...else` logic (instead of serial ifs) to encode mutually exclusive paths.",
            startChar: 4,
            endChar: 17,
            startLine: 60,
            endLine: 60,
            pointDelta: 0,
            author: graderEmail,
            rubric: null,
          },
          {
            text: "Nice job! Let me know if you'd like to discuss how to effectively use helper functions in future assignments.",
            startChar: 13,
            endChar: 27,
            startLine: 14,
            endLine: 14,
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
