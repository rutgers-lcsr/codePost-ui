import { demoFilesGrader, demoFilesStudent } from './demoCode';

import { AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { FileType } from '../../infrastructure/file';
import { RubricCategoryType } from '../../infrastructure/rubricCategory';
import { AnonymousSubmissionType } from '../../infrastructure/submission';
import { SubmissionTestType } from '../../infrastructure/submissionTest';
import { TestCategoryType } from '../../infrastructure/testCategory';
import { IRubricCategoryToRubricCommentsMap } from '../../types/common';
import { TestCasesByCategory } from '../core/testFetchUtils';
import { PERMISSION_LEVEL } from './CodeConsoleEnums';

import moment from 'moment-timezone';

export const loadDemoGrader = (files: any[], user: string | null) => {
  const demoAssignment: AssignmentType = {
    id: -1,
    name: 'codePost Demo',
    isReleased: false,
    hideGrades: false,
    rubricCategories: [],
    course: -1,
    sortKey: 0,
    anonymousGrading: false,
    allowRegradeRequests: false,
    regradeInstructions: '',
    regradeDeadline: '',
    hideGradersFromStudents: false,
    mean: null,
    median: null,
    points: 20,
    maxLateDays: 5,
    commentFeedback: true,
    allowStudentUpload: false,
    allowStudentUploadWithPartners: false,
    uploadDueDate: '',
    liveFeedbackMode: false,
    collaborativeRubricMode: false,
    additiveGrading: false,
    forcedRubricMode: false,
    templateMode: false,
    files: [],
    fileTemplates: [],
    testCategories: [-1],
    environment: null,
    showFrequentlyUsedRubricComments: false,
    allowLateUploads: false,
    maxStudentTestRuns: null,
    exposeDumpLogs: false,
    explanation: '',
    isVisible: true,
    hideFrom: [],
    nudgeMode: false,
    lateDeductions: [],
  };

  const demoCourse: CourseType = {
    id: -1,
    name: 'Demo',
    period: 'demo',
    assignments: [-1],
    sections: [],
    sendReleasedSubmissionsToBack: false,
    showStudentsStatistics: false,
    timezone: moment.tz.guess(),
    emailNewUsers: false,
    anonymousGradingDefault: false,
    minComments: 0,
    noUnfinalize: false,
    lateDayCreditsAllowable: null,
    archived: false,
    activateQueue: true,
    inviteCode: '',
    emailWhitelist: '',
    inviteCodeEnabled: false,
    enableStudentFeedbackNotifications: false,
  };

  const demoSubmission: AnonymousSubmissionType = {
    id: 1,
    isFinalized: false,
    files: [1, 2, 3],
    students: ['student1@example.edu'],
    assignment: -1,
    dateEdited: '',
    dateUploaded: moment().toString(),
    grade: null,
    grader: user,
    questionText: '',
    questionIsOpen: false,
    questionResponder: 'grader0@example.edu',
    questionResponse: '',
    questionIsRegrade: false,
    questionDate: '',
    responseDate: '',
    tests: [],
    lateDayCreditsUsed: 0,
    testRunsCompleted: 0,
  };

  const fileList: FileType[] = [];
  const commentMap: any = {};
  if (files.length > 0) {
    files.forEach((file, index) => {
      fileList.push({
        id: index,
        code: file.data,
        comments: [],
        extension: file.name.split('.')[1],
        name: file.name,
        submission: 1,
        path: null,
        created: '',
      });

      commentMap[index] = [];
    });
  } else {
    fileList[0] = demoFilesGrader[0];
    fileList[1] = demoFilesGrader[1];
    commentMap[0] = [];
    commentMap[1] = [];
  }

  const rubricCategoryList: RubricCategoryType[] = [
    {
      id: 1,
      name: 'Style',
      rubricComments: [],
      assignment: 1,
      pointLimit: null,
      sortKey: 0,
      helpText: '',
      atMostOnce: false,
    },
    {
      id: 2,
      name: 'Performance',
      rubricComments: [],
      assignment: 1,
      pointLimit: null,
      sortKey: 1,
      helpText: '',
      atMostOnce: false,
    },
  ];

  const rubricCommentsMap: IRubricCategoryToRubricCommentsMap = {
    1: [
      {
        id: 1,
        text: 'Unnecessary comment - this code speaks for itself!',
        category: 1,
        pointDelta: 1,
        sortKey: 0,
        explanation: '',
        instructionText: '',
        templateTextOn: false,
      },
      {
        id: 2,
        text: 'Code not separated by newlines into logical blocks',
        category: 1,
        pointDelta: 1,
        sortKey: 1,
        explanation: '',
        instructionText: '',
        templateTextOn: false,
      },
      {
        id: 3,
        text: "Generic variable name (e.g. `x`) that doesn't describe value",
        category: 1,
        pointDelta: 1,
        sortKey: 2,
        explanation: '',
        instructionText: '',
        templateTextOn: false,
      },
    ],
    2: [
      {
        id: 4,
        text: 'Sorting followed by binary search would be faster than performing a `O(n^2)` search every time',
        category: 2,
        pointDelta: 2,
        sortKey: 0,
        explanation: '',
        instructionText: '',
        templateTextOn: false,
      },
      {
        id: 5,
        text: 'Memoization would improve performance, since these values are frequently recomputed',
        category: 2,
        pointDelta: 1,
        sortKey: 0,
        explanation: '',
        instructionText: '',
        templateTextOn: false,
      },
    ],
  };

  const tests: SubmissionTestType[] = [
    {
      id: -1,
      submission: 1,
      testCase: -1,
      logs: '',
      passed: true,
      testCategory: -1,
      created: '2019-12-16T23:16:19.737805Z',
      modified: '2019-12-16T23:16:19.737823Z',
      isError: false,
    },
    {
      id: -2,
      submission: 1,
      testCase: -2,
      logs: `Traceback (most recent call last):
  File "./Loops.py", line 37, in <module>
    reverse([1, 2, 3])
  File "./Loops.py", line 33, in reverse
    reversed.append(intList[i])
IndexError: list index out of range`,
      passed: false,
      testCategory: -1,
      created: '2019-12-16T23:16:19.737805Z',
      modified: '2019-12-16T23:16:19.737823Z',
      isError: false,
    },
  ];

  const testCategories: TestCategoryType[] = [
    {
      id: -1,
      name: 'Correctness',
      testCases: [-1, -2],
      assignment: demoAssignment.id,
    },
  ];

  const testCases: TestCasesByCategory = {
    '-1': [
      {
        id: -1,
        testCategory: -1,
        sortKey: 0,
        description: 'Test max [1,2,3]',
        type: 'io',
        pointsFail: 1,
        pointsPass: 0,
        text: '',
        modified: '2019-12-16T23:09:44.686902Z',
        function: 'max',
        fileName: 'Loops.py',
        expectedOutput: '3',
        input: '[1,2,3]',
        checkReturn: true,
        exposed: false,
        instances: [-1],
        explanation: '',
        lastSolutionRun: 0,
        outputIsFile: false,
        isFlexible: false,
        outputIsRegexp: false,
      },
      {
        id: -2,
        testCategory: -1,
        sortKey: 0,
        description: 'Test reverse [1,2,3]',
        type: 'io',
        pointsFail: -2,
        pointsPass: 0,
        text: '',
        modified: '2019-12-16T23:09:44.686902Z',
        function: 'reverse',
        fileName: 'Loops.py',
        expectedOutput: '[3,2,1]',
        input: '[1,2,3]',
        checkReturn: true,
        exposed: false,
        instances: [-1],
        explanation: '',
        lastSolutionRun: 0,
        outputIsFile: false,
        isFlexible: false,
        outputIsRegexp: false,
      },
    ],
  };

  return {
    assignment: demoAssignment,
    course: demoCourse,
    submission: demoSubmission,
    files: fileList,
    comments: commentMap,
    commentRubricComments: {},
    selectedFile: fileList.length > 0 ? fileList[0] : undefined,
    rubricCategories: rubricCategoryList,
    rubricComments: rubricCommentsMap,
    tests,
    testCategories,
    testCases,
    permissionLevel: PERMISSION_LEVEL.WRITE,
    isStudent: false,
    hideGrades: false,
  };
};

export const loadDemoStudent = (files: any[], user: string | null) => {
  const demoAssignment: AssignmentType = {
    id: -1,
    name: 'codePost Demo',
    isReleased: false,
    hideGrades: false,
    rubricCategories: [],
    course: -1,
    sortKey: 0,
    anonymousGrading: false,
    allowRegradeRequests: false,
    regradeInstructions: '',
    regradeDeadline: '',
    hideGradersFromStudents: false,
    mean: null,
    median: null,
    points: 20,
    maxLateDays: 5,
    commentFeedback: true,
    allowStudentUpload: false,
    allowStudentUploadWithPartners: false,
    uploadDueDate: '',
    liveFeedbackMode: false,
    collaborativeRubricMode: false,
    additiveGrading: false,
    forcedRubricMode: false,
    templateMode: false,
    files: [],
    fileTemplates: [],
    testCategories: [-1],
    environment: null,
    showFrequentlyUsedRubricComments: false,
    allowLateUploads: false,
    maxStudentTestRuns: null,
    exposeDumpLogs: false,
    explanation: '',
    isVisible: true,
    hideFrom: [],
    nudgeMode: false,
    lateDeductions: [],
  };

  const demoCourse: CourseType = {
    id: -1,
    name: 'Demo',
    period: 'demo',
    assignments: [-1],
    sections: [],
    sendReleasedSubmissionsToBack: false,
    showStudentsStatistics: false,
    timezone: moment.tz.guess(),
    emailNewUsers: false,
    anonymousGradingDefault: false,
    minComments: 0,
    noUnfinalize: false,
    lateDayCreditsAllowable: null,
    archived: false,
    activateQueue: true,
    inviteCode: '',
    emailWhitelist: '',
    inviteCodeEnabled: false,
    enableStudentFeedbackNotifications: false,
  };

  const demoSubmission: AnonymousSubmissionType = {
    id: 1,
    isFinalized: false,
    files: [1, 2, 3],
    students: ['student1@example.edu'],
    assignment: -1,
    dateEdited: '',
    dateUploaded: moment().toString(),
    grade: null,
    grader: user,
    questionText: '',
    questionIsOpen: false,
    questionResponder: 'grader0@example.edu',
    questionResponse: '',
    questionIsRegrade: false,
    questionDate: '',
    responseDate: '',
    tests: [],
    lateDayCreditsUsed: 0,
    testRunsCompleted: 0,
  };

  const comments = [
    {
      startLine: 11,
      endLine: 11,
      startChar: 0,
      endChar: 18,
      id: 1,
      file: 1,
      pointDelta: null,
      text: '',
      rubricComment: 6,
      author: '',
      feedback: 0,
    },
    {
      startLine: 28,
      endLine: 28,
      startChar: 2,
      endChar: 8,
      id: 2,
      file: 1,
      pointDelta: null,
      text: '',
      rubricComment: 3,
      author: '',
      feedback: 0,
    },
  ];

  const fileList: FileType[] = [];
  const commentMap: any = {};
  if (files.length > 0) {
    files.forEach((file, index) => {
      fileList.push({
        id: index,
        code: file.data,
        comments: [],
        extension: file.name.split('.')[1],
        name: file.name,
        submission: 1,
        path: null,
        created: '',
      });

      commentMap[index] = [];
    });
  } else {
    fileList[0] = demoFilesStudent[0];
    fileList[1] = demoFilesStudent[1];
    commentMap[0] = comments;
    commentMap[1] = [];
  }

  const rubricCategoryList: RubricCategoryType[] = [
    {
      id: 1,
      name: 'Style',
      rubricComments: [],
      assignment: 1,
      pointLimit: null,
      sortKey: 0,
      helpText: '',
      atMostOnce: false,
    },
    {
      id: 2,
      name: 'Performance',
      rubricComments: [],
      assignment: 1,
      pointLimit: null,
      sortKey: 1,
      helpText: '',
      atMostOnce: false,
    },
  ];

  const rubricCommentsMap: IRubricCategoryToRubricCommentsMap = {
    1: [
      {
        id: 3,
        text: "This is too generic of a variable name that doesn't describe value. What would be better would be something like `reversed`.",
        category: 1,
        pointDelta: 0,
        sortKey: 2,
        explanation: '',
        instructionText: '',
        templateTextOn: false,
      },
    ],
    2: [
      {
        id: 6,
        text: 'This function will correctly sort the list, though very slowly in the worst case! The implementation here is known as [Bubble Sort](https://algs4.cs.princeton.edu/21elementary/Bubble.java.html). If the list is in reverse order, then every element will need to be swapped, resulting in `O(n^2)` runtime complexity in the worst case. For other ideas of how to sort a list, checkout the [Algs4 cheatsheet](https://algs4.cs.princeton.edu/cheatsheet/).',
        category: 2,
        pointDelta: 0,
        sortKey: 0,
        explanation: '',
        instructionText: '',
        templateTextOn: false,
      },
    ],
  };

  const commentRubricComments = {
    1: {
      id: 6,
      text: 'This function will correctly sort the list, though very slowly in the worst case! The implementation here is known as [Bubble Sort](https://algs4.cs.princeton.edu/21elementary/Bubble.java.html). If the list is in reverse order, then every element will need to be swapped, resulting in `O(n^2)` runtime complexity in the worst case. For other ideas of how to sort a list, checkout the [Algs4 cheatsheet](https://algs4.cs.princeton.edu/cheatsheet/).',
      category: 2,
      pointDelta: 0,
      sortKey: 0,
      explanation: '',
      instructionText: '',
      templateTextOn: false,
    },
    2: {
      id: 3,
      text: "This is too generic of a variable name that doesn't describe value. What would be better would be something like `reversed`.",
      category: 1,
      pointDelta: 0,
      sortKey: 2,
      explanation: '',
      instructionText: '',
      templateTextOn: false,
    },
  };

  return {
    assignment: demoAssignment,
    course: demoCourse,
    submission: demoSubmission,
    files: fileList,
    comments: commentMap,
    commentRubricComments,
    selectedFile: fileList.length > 0 ? fileList[0] : undefined,
    rubricCategories: rubricCategoryList,
    rubricComments: rubricCommentsMap,
    tests: [],
    testCategories: [],
    testCases: {},
    permissionLevel: PERMISSION_LEVEL.READ,
    readOnlySubmission: demoSubmission,
    isStudent: true,
    hideGrades: true,
  };
};
