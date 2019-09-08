const domain = 'example.edu';
const studentEmail = `student1@${domain}`;
const sectionName = 'Section 1';

export const demoFiles = [
  {
    id: 0,
    name: 'LoopUtils.java',
    extension: 'java',
    /* tslint:disable */
    code: `/******************************************************************************\n *  Student: ${studentEmail}\n *  Section: ${sectionName}\n *\n *  Description:  Includes a few utility functions useful for working with\n *  arrays (implemented with loops).\n *\n ******************************************************************************/\n\npublic class LoopUtils {\n\n  public static int max(int[] arr) {\n    int maxSoFar = 0;\n\n    for (int i = 0; i < arr.length; i++) {\n      if (arr[i] > maxSoFar) {\n        maxSoFar = arr[i];\n      }\n    }\n\n    return maxSoFar;\n  }\n\n  public static int[] reverse(int[] arr) {\n\n    int[] newArray = new int[arr.length];\n\n    for (int i = 0; i < arr.length; i++) {\n      newArray[i] = arr[arr.length - i];\n    }\n\n    return newArray;\n  }\n\n}`,
    /* tslint:ensable */
    comments: [],
    submission: 1,
    path: null,
  },
  {
    id: 1,
    name: 'RecursionUtils.java',
    extension: 'java',
    /* tslint:disable */
    code: `/******************************************************************************\n *  Student: ${studentEmail}\n *  Section: ${sectionName}\n *\n *  Description:  Includes a few utility functions for working with int arrays.\n *  Implemented using recursion.\n *\n ******************************************************************************/\n\nimport java.util.Arrays;\n\npublic class RecursionUtils {\n\n  // Return sum of values contained within int array\n  public static int sum(int[] arr) {\n    if (arr.length == 1) {\n      return arr[0];\n    } else {\n      int[] partial = Arrays.copyOfRange(arr, 1, arr.length); // lop off first element\n      return (arr[0] + sum(partial));\n    }\n  }\n\n  // Find an element in a (sorted) int array using binary search\n  public static boolean contains(int[] arr, int el) {\n    int lower = 0;\n    int upper = arr.length - 1;\n    int midpoint = (lower + upper) / 2;\n\n    // Have we searched the entire array?\n    if (lower > upper) {\n      return false;\n    } else {\n      // Search the top half of the array\n      if (arr[midpoint] < el) {\n        int[] partial = Arrays.copyOfRange(arr, midpoint + 1, upper);\n        return contains(partial, el);\n      }\n\n      // Srearch the bottom half of the array\n      if (arr[midpoint] > el) {\n        int[] partial = Arrays.copyOfRange(arr, 0, midpoint - 1);\n        return contains(partial, el);\n      }\n\n      // we found the element\n      return true;\n    }\n  }\n\n}`,
    /* tslint:ensable */
    comments: [],
    submission: 1,
    path: null,
  },
];
