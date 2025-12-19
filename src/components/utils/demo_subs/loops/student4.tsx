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
        name: 'LoopUtils.java',
        ext: 'java',
        /* tslint:disable */
        code: `/******************************************************************************\n *  Student: ${studentEmail}\n *  Section: ${sectionName}\n *\n *  Partner: ${partnerEmail}\n *  Partner section: ${partnerSection}\n *\n *  Description:  Includes a few utility functions useful for working with\n *  arrays (implemented with loops).\n *\n ******************************************************************************/\n\npublic class LoopUtils {\n\n  public static int max(int[] arr) {\n    int maxSoFar = Integer.MIN_VALUE;\n    for (int i = 0; i < arr.length; i++) {\n      if (arr[i] > maxSoFar) {\n\n        maxSoFar = arr[i];\n\n      }\n    }\n\n    return maxSoFar;\n  }\n\n  // Reverse an int array\n  public static int[] reverse(int[] arr) {\n    for (int i = 0; i < arr.length/2+1; i++) {\n      int temp = arr[i];\n      arr[i] = arr[arr.length - i - 1];\n      arr[arr.length - i - 1] = temp;\n    }\n\n    return arr;\n  }\n\n  // Find an element in a (sorted) int array using binary search\n  public static boolean contains(int[] arr, int el) {\n    int lower = 0;\n    int upper = arr.length - 1;\n\n    while (lower < upper) {\n      int midpoint = (lower + upper) / 2;\n\n      if (arr[midpoint] < el) {\n        lower = midpoint + 1;\n      }\n\n      if (arr[midpoint] > el) {\n        upper = midpoint - 1;\n      }\n\n      if (arr[midpoint] == el) {\n        return true;\n      }\n    }\n\n    // Done Searching\n    return false;\n  }\n\n}`,
        /* tslint:ensable */
        comments: [
          {
            text: 'Whoops! Your loop goes one step too far. Try working through an even-length example like `arr = [1,2,3,4].`\n\
Here, `arr.length == 4`, so `arr.length/2 + 1 == 3`.\n\
At `i = 0`: `arr = [4, 2, 3, 1]` (good)\n\
At `i = 1`: `arr = [4, 3, 2, 1]` (good)\n\
At `i = 2`: `arr = [4, 2, 3, 1]` (one too many swaps!)',

            startChar: 20,
            endChar: 38,
            startLine: 29,
            endLine: 29,
            pointDelta: 3,
            author: graderEmail,
            rubric: "Doesn't correctly loop through array.",
          },
          {
            text: 'These if statements would benefit from comments,. since the logic necessary to implement binary search is fairly complex!',
            startChar: 6,
            endChar: 29,
            startLine: 50,
            endLine: 50,
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
