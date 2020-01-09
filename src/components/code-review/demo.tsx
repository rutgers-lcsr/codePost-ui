import { demoFiles } from './demoCode';

import { AssignmentType } from '../../infrastructure/assignment';
import { CourseType } from '../../infrastructure/course';
import { AnonymousSubmissionType } from '../../infrastructure/submission';
import { FileType } from '../../infrastructure/file';
import { IRubricCategoryToRubricCommentsMap } from '../../types/common';
import { CommentType } from '../../infrastructure/comment';
import { RubricCategoryType } from '../../infrastructure/rubricCategory';
import { RubricCommentType } from '../../infrastructure/rubricComment';
import { SubmissionTestType } from '../../infrastructure/submissionTest';
import { TestCategoryType } from '../../infrastructure/testCategory';
import { TestCaseType } from '../../infrastructure/types';
import { TestCasesByCategory } from '../core/testFetchUtils';
import { PERMISSION_LEVEL } from './CodeConsole';

import moment from 'moment-timezone';

export const loadDemo = (files: any[], user: string | null, studentSample?: boolean) => {
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
    regradeDeadline: '',
    hideGradersFromStudents: false,
    mean: null,
    median: null,
    points: 20,
    commentFeedback: true,
    allowStudentUpload: false,
    uploadDueDate: '',
    liveFeedbackMode: false,
    collaborativeRubricMode: false,
    additiveGrading: false,
    forcedRubricMode: false,
    templateMode: false,
    fileTemplates: [],
    testCategories: [-1],
    environment: null,
    showFrequentlyUsedRubricComments: false,
    allowLateUploads: false,
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
    fileList[0] = demoFiles[0];
    fileList[1] = demoFiles[1];
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
      },
      {
        id: 2,
        text: 'Code not separated by newlines into logical blocks',
        category: 1,
        pointDelta: 1,
        sortKey: 1,
        explanation: '',
      },
      {
        id: 3,
        text: "Generic variable name (e.g. `x`) that doesn't describe value",
        category: 1,
        pointDelta: 1,
        sortKey: 2,
        explanation: '',
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
      },
      {
        id: 5,
        text: 'Memoization would improve performance, since these values are frequently recomputed',
        category: 2,
        pointDelta: 1,
        sortKey: 0,
        explanation: '',
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
      },
    ],
  };

  if (studentSample !== undefined && studentSample) {
    const comment = {
      startLine: 12,
      endLine: 12,
      startChar: 4,
      endChar: 17,
      id: 1,
      file: 1,
      pointDelta: null,
      text: '',
      rubricComment: 1,
      author: 'anonymous@university.edu',
      feedback: 0,
    };

    commentMap[0] = [comment];

    const commentRubricComments = {
      1: {
        id: 1,
        text: 'Unnecessary comment - this code speaks for itself!',
        category: 1,
        pointDelta: 0,
        sortKey: 0,
        explanation: '',
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
    };
  } else {
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
    };
  }
};
