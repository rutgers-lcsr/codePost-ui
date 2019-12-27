export const demoFiles = [
  {
    id: 0,
    name: 'Loops.py',
    extension: 'py',
    /* tslint:disable */
    code: `###################################################################################
#
#  Student: student0@codepost.io
#  Course: CS 101, codePost University
#  Section: Section 42
#
#  Description: Utility functions useful for working with
#  arrays (implemented with loops).
#
###################################################################################


def max(intList):
  """
  This function takes as input a list of integers and returns the maximum
  Its runtime is O(n), where n is the length of the input list
  """

  maxSoFar = 0

  for i in range(0, len(intList)):
    if intList[i] > maxSoFar:
      maxSoFar = intList[i]

  return maxSoFar


def reverse(intList):

  reversed = []
  for i in range(len(intList), -1, -1):
    reversed.append(intList[i])

  return reversed
`,
    /* tslint:ensable */
    comments: [],
    submission: 1,
    path: null,
    created: '',
  },
  {
    id: 1,
    name: 'Recursion.py',
    extension: 'py',
    /* tslint:disable */
    code: `###################################################################################
#
#  Student: student0@codepost.io
#  Course: CS 101, codePost University
#  Section: Section 42
#
#  Description: Utility functions useful for working with
#  arrays (implemented with recursion).
#
###################################################################################


def sum(intList):
  """
  This function takes as input a list of integers and returns the sum
  """

  if len(intList) == 1:
    return intList[0]
  else:
    partial = intList[1:]
    return intList[0] + sum(partial)
`,
    /* tslint:ensable */
    comments: [],
    submission: 1,
    path: null,
    created: '',
  },
];
