import { demoFilesGrader, demoFilesStudent } from './demoCode';

import { Course } from '../../api-client';
import { RubricCategory as RubricCategoryType } from '../../api-client';
import {
  AnonymousSubmissionType,
  AssignmentType,
  CommentTemplateType,
  SubmissionTestType,
  TestCaseType,
  TestCategoryType,
} from '../../types/models';
import { FileType } from '../../utils/file';
import { IRubricCategoryToRubricCommentsMap } from '../../types/common';
import { TestCasesByCategory } from '../../components/core/testFetchUtils';
import { PERMISSION_LEVEL } from './CodeConsoleEnums';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEMO_ASSIGNMENT_ID = -1;
const DEMO_SUBMISSION_ID = 1;

const demoAssignmentBase: AssignmentType = {
  id: DEMO_ASSIGNMENT_ID,
  name: 'codePost Demo',
  isReleased: false,
  feedbackReleased: false,
  hideGrades: false,
  rubricCategories: [1, 2, 3],
  course: -1,
  sortKey: 0,
  anonymousGrading: false,
  allowRegradeRequests: false,
  studentsCanSeeGraders: false,
  regradeInstructions: '',
  regradeDeadline: '',
  hideGradersFromStudents: false,
  points: 20,
  maxLateDays: 5,
  commentFeedback: true,
  allowStudentUpload: false,
  allowStudentUploadWithPartners: false,
  uploadDueDate: '',
  liveFeedbackMode: false,
  collaborativeRubricMode: true,
  additiveGrading: false,
  forcedRubricMode: false,
  templateMode: false,
  files: [],
  fileTemplates: [],
  testCategories: [-1, -2, -3],
  environment: 0,
  showFrequentlyUsedRubricComments: true,
  allowLateUploads: false,
  maxStudentTestRuns: null,
  explanation: '',
  isVisible: true,
  hideFrom: [],
  nudgeMode: false,
  lateDeductions: [],
  dataSets: [],
};

const demoCourseBase: Course = {
  id: -1,
  name: 'Demo',
  period: 'demo',
  assignments: [DEMO_ASSIGNMENT_ID],
  sections: [],
  sendReleasedSubmissionsToBack: false,
  showStudentsStatistics: false,
  timezone: dayjs.tz.guess(),
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
  expirationDate: null,
  studentsCanSeeGraders: false,
  studentCount: 0,
  isRubricEditor: true,
  webhooks: [],
};

const demoRubricCategories: RubricCategoryType[] = [
  {
    id: 1,
    name: 'Correctness',
    rubricComments: [],
    assignment: DEMO_ASSIGNMENT_ID,
    pointLimit: 8,
    sortKey: 0,
    helpText: 'Algorithm should produce correct output across edge cases.',
    atMostOnce: false,
  },
  {
    id: 2,
    name: 'Readability',
    rubricComments: [],
    assignment: DEMO_ASSIGNMENT_ID,
    pointLimit: 6,
    sortKey: 1,
    helpText: 'Code should be easy to read, name, and maintain.',
    atMostOnce: false,
  },
  {
    id: 3,
    name: 'Performance',
    rubricComments: [],
    assignment: DEMO_ASSIGNMENT_ID,
    pointLimit: 6,
    sortKey: 2,
    helpText: 'Solutions should avoid unnecessary repeated work.',
    atMostOnce: false,
  },
];

const demoRubricComments: IRubricCategoryToRubricCommentsMap = {
  1: [
    {
      id: 11,
      text: 'Fails on empty input (missing base case).',
      category: 1,
      pointDelta: 3,
      sortKey: 0,
      explanation: 'Always handle empty collections before recursive decomposition.',
      instructionText: '',
      templateTextOn: false,
    },
    {
      id: 12,
      text: 'Incorrect result for all-negative arrays.',
      category: 1,
      pointDelta: 2,
      sortKey: 1,
      explanation: 'Initialize running max from first element, not from 0.',
      instructionText: '',
      templateTextOn: false,
    },
  ],
  2: [
    {
      id: 21,
      text: 'Variable names should better describe intent.',
      category: 2,
      pointDelta: 1,
      sortKey: 0,
      explanation: '',
      instructionText: '',
      templateTextOn: false,
    },
    {
      id: 22,
      text: 'Add brief docstring for helper behavior and edge cases.',
      category: 2,
      pointDelta: 1,
      sortKey: 1,
      explanation: '',
      instructionText: '',
      templateTextOn: false,
    },
  ],
  3: [
    {
      id: 31,
      text: 'Avoid repeated list slicing in deep recursion.',
      category: 3,
      pointDelta: 1,
      sortKey: 0,
      explanation: 'Pass an index argument to avoid repeatedly allocating sub-lists.',
      instructionText: '',
      templateTextOn: false,
    },
    {
      id: 32,
      text: 'Use built-in reverse or two-pointer approach for linear reverse.',
      category: 3,
      pointDelta: 1,
      sortKey: 1,
      explanation: '',
      instructionText: '',
      templateTextOn: false,
    },
  ],
};

const demoTests: SubmissionTestType[] = [
  {
    id: -1,
    submission: DEMO_SUBMISSION_ID,
    testCase: -1,
    logs: 'Expected 3, received 3',
    passed: true,
    testCategory: -1,
    created: '2026-01-01T00:00:00.000Z',
    modified: '2026-01-01T00:00:00.000Z',
    isError: false,
  },
  {
    id: -2,
    submission: DEMO_SUBMISSION_ID,
    testCase: -2,
    logs: 'Expected -1, received 0',
    passed: false,
    testCategory: -1,
    created: '2026-01-01T00:00:00.000Z',
    modified: '2026-01-01T00:00:00.000Z',
    isError: false,
  },
  {
    id: -3,
    submission: DEMO_SUBMISSION_ID,
    testCase: -3,
    logs: 'IndexError: list index out of range at reverse(values)',
    passed: false,
    testCategory: -1,
    created: '2026-01-01T00:00:00.000Z',
    modified: '2026-01-01T00:00:00.000Z',
    isError: true,
  },
  {
    id: -4,
    submission: DEMO_SUBMISSION_ID,
    testCase: -4,
    logs: 'Expected 6, received 6',
    passed: true,
    testCategory: -2,
    created: '2026-01-01T00:00:00.000Z',
    modified: '2026-01-01T00:00:00.000Z',
    isError: false,
  },
  {
    id: -5,
    submission: DEMO_SUBMISSION_ID,
    testCase: -5,
    logs: 'RecursionError: maximum recursion depth exceeded',
    passed: false,
    testCategory: -2,
    created: '2026-01-01T00:00:00.000Z',
    modified: '2026-01-01T00:00:00.000Z',
    isError: true,
  },
  {
    id: -6,
    submission: DEMO_SUBMISSION_ID,
    testCase: -6,
    logs: 'Notebook renders with 3 cells and includes graph output',
    passed: true,
    testCategory: -3,
    created: '2026-01-01T00:00:00.000Z',
    modified: '2026-01-01T00:00:00.000Z',
    isError: false,
  },
  {
    id: -7,
    submission: DEMO_SUBMISSION_ID,
    testCase: -7,
    logs: 'Expected first markdown cell title to include "Demo notebook".',
    passed: true,
    testCategory: -3,
    created: '2026-01-01T00:00:00.000Z',
    modified: '2026-01-01T00:00:00.000Z',
    isError: false,
  },
];

const demoTestCategories: TestCategoryType[] = [
  {
    id: -1,
    name: 'Loops.py',
    testCases: [-1, -2, -3],
    assignment: DEMO_ASSIGNMENT_ID,
    testScript: undefined,
    maxPoints: undefined,
    sortKey: 0,
    targetFileName: 'Loops.py',
    resources: [],
  },
  {
    id: -2,
    name: 'Recursion.py',
    testCases: [-4, -5],
    assignment: DEMO_ASSIGNMENT_ID,
    testScript: undefined,
    maxPoints: undefined,
    sortKey: 1,
    targetFileName: 'Recursion.py',
    resources: [],
  },
  {
    id: -3,
    name: 'analysis_notebook.ipynb',
    testCases: [-6, -7],
    assignment: DEMO_ASSIGNMENT_ID,
    testScript: undefined,
    maxPoints: undefined,
    sortKey: 2,
    targetFileName: 'analysis_notebook.ipynb',
    resources: [],
  },
];

const demoTestCases: TestCasesByCategory = {
  [-1]: [
    {
      id: -1,
      testCategory: -1,
      sortKey: 0,
      description: 'max_value([1, 2, 3]) returns 3',
      type: 'io',
      pointsFail: 1,
      pointsPass: 0,
      text: '',
      modified: '2026-01-01T00:00:00.000Z',
      fileName: 'Loops.py',
      checkReturn: true,
      exposed: true,
      instances: [DEMO_SUBMISSION_ID],
      explanation: '',
      lastSolutionRun: 0,
      outputIsFile: false,
      isFlexible: false,
      outputIsRegexp: false,
      expectPlot: false,
      dataSet: null,
      targetCellId: null,
    } as TestCaseType,
    {
      id: -2,
      testCategory: -1,
      sortKey: 1,
      description: 'max_value([-1, -2, -3]) returns -1',
      type: 'io',
      pointsFail: 2,
      pointsPass: 0,
      text: '',
      modified: '2026-01-01T00:00:00.000Z',
      fileName: 'Loops.py',
      checkReturn: true,
      exposed: true,
      instances: [DEMO_SUBMISSION_ID],
      explanation: '',
      lastSolutionRun: 0,
      outputIsFile: false,
      isFlexible: false,
      outputIsRegexp: false,
      expectPlot: false,
      dataSet: null,
      targetCellId: null,
    } as TestCaseType,
    {
      id: -3,
      testCategory: -1,
      sortKey: 2,
      description: 'reverse([1,2,3]) returns [3,2,1]',
      type: 'unit',
      pointsFail: 2,
      pointsPass: 0,
      text: '',
      modified: '2026-01-01T00:00:00.000Z',
      fileName: 'Loops.py',
      checkReturn: true,
      exposed: true,
      instances: [DEMO_SUBMISSION_ID],
      explanation: '',
      lastSolutionRun: 0,
      outputIsFile: false,
      isFlexible: false,
      outputIsRegexp: false,
      expectPlot: false,
      dataSet: null,
      targetCellId: null,
    } as TestCaseType,
  ],
  [-2]: [
    {
      id: -4,
      testCategory: -2,
      sortKey: 0,
      description: 'sum_recursive([1,2,3]) returns 6',
      type: 'io',
      pointsFail: 1,
      pointsPass: 0,
      text: '',
      modified: '2026-01-01T00:00:00.000Z',
      fileName: 'Recursion.py',
      checkReturn: true,
      exposed: true,
      instances: [DEMO_SUBMISSION_ID],
      explanation: '',
      lastSolutionRun: 0,
      outputIsFile: false,
      isFlexible: false,
      outputIsRegexp: false,
      expectPlot: false,
      dataSet: null,
      targetCellId: null,
    } as TestCaseType,
    {
      id: -5,
      testCategory: -2,
      sortKey: 1,
      description: 'contains_recursive([], 3) should return False',
      type: 'unit',
      pointsFail: 2,
      pointsPass: 0,
      text: '',
      modified: '2026-01-01T00:00:00.000Z',
      fileName: 'Recursion.py',
      checkReturn: true,
      exposed: true,
      instances: [DEMO_SUBMISSION_ID],
      explanation: '',
      lastSolutionRun: 0,
      outputIsFile: false,
      isFlexible: false,
      outputIsRegexp: false,
      expectPlot: false,
      dataSet: null,
      targetCellId: null,
    } as TestCaseType,
  ],
  [-3]: [
    {
      id: -6,
      testCategory: -3,
      sortKey: 0,
      description: 'Notebook has executed outputs available',
      type: 'unit',
      pointsFail: 1,
      pointsPass: 0,
      text: '',
      modified: '2026-01-01T00:00:00.000Z',
      fileName: 'analysis_notebook.ipynb',
      checkReturn: true,
      exposed: true,
      instances: [DEMO_SUBMISSION_ID],
      explanation: '',
      lastSolutionRun: 0,
      outputIsFile: false,
      isFlexible: false,
      outputIsRegexp: false,
      expectPlot: true,
      dataSet: null,
      targetCellId: null,
    } as TestCaseType,
    {
      id: -7,
      testCategory: -3,
      sortKey: 1,
      description: 'Notebook graph output is present',
      type: 'unit',
      pointsFail: 1,
      pointsPass: 0,
      text: '',
      modified: '2026-01-01T00:00:00.000Z',
      fileName: 'analysis_notebook.ipynb',
      checkReturn: true,
      exposed: true,
      instances: [DEMO_SUBMISSION_ID],
      explanation: '',
      lastSolutionRun: 0,
      outputIsFile: false,
      isFlexible: false,
      outputIsRegexp: false,
      expectPlot: true,
      dataSet: null,
      targetCellId: 'demo-cell-plot',
    } as TestCaseType,
  ],
};

const buildDemoSubmission = (user: string | null): AnonymousSubmissionType => ({
  id: DEMO_SUBMISSION_ID,
  isFinalized: false,
  files: [1, 2, 3, 4] as any,
  students: ['student1@example.edu'],
  assignment: DEMO_ASSIGNMENT_ID,
  dateEdited: '',
  dateUploaded: dayjs().toString(),
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
});

const buildUploadedFiles = (files: any[]): { fileList: FileType[]; commentMap: Record<number, any[]> } => {
  const fileList: FileType[] = [];
  const commentMap: Record<number, any[]> = {};

  files.forEach((file, index) => {
    const fileId = index + 1;
    const extension = file.name.includes('.') ? file.name.split('.').pop() : '';

    fileList.push({
      id: fileId,
      data: file.data,
      comments: [],
      extension,
      name: file.name,
      submission: DEMO_SUBMISSION_ID,
      path: null,
      created: '',
      modified: '',
    });

    commentMap[fileId] = [];
  });

  return { fileList, commentMap };
};

const buildDefaultGraderFiles = (): { fileList: FileType[]; commentMap: Record<number, any[]> } => {
  const fileList: FileType[] = [];
  fileList[0] = demoFilesGrader[0] as FileType;
  fileList[1] = demoFilesGrader[1] as FileType;
  fileList[2] = demoFilesGrader[2] as FileType;
  fileList[3] = {
    id: 4,
    name: 'assignment.pdf',
    data: 'data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmogICUgcGFnZXMKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqICB1cGFnZQo8PAogIC9UeXBlIC9QYWdlCiAgL1BhcmVudCAyIDAgUgogIC9SZXNvdXJjZXMgPDwKICAgIC9Gb250IDw8CiAgICAgIC9GMSA0IDAgUgogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmogICUgZm9udAo8PAogIC9UeXBlIC9Gb250CiAgL1N1YnR5cGUgL1R5cGUxCiAgL0Jhc2VGb250IC9UaW1lcy1Sb21hbgpQPj4KZW5kb2JqCgo1IDAgb2JqICAlIHBhZ2UgY29udGVudAo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAKMDAwMDAwMDE1NyAwMDAwMCBuIAowMDAwMDAwMjU1IDAwMDAwIG4gCjAwMDAwMDAzNDQgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDM5CiUlRU9GCg==',
    comments: [],
    extension: 'pdf',
    submission: DEMO_SUBMISSION_ID,
    path: null,
    created: '',
    modified: '',
  };

  return {
    fileList,
    commentMap: {
      1: [],
      2: [],
      3: [],
      4: [],
    },
  };
};

const buildDefaultStudentFiles = (): {
  fileList: FileType[];
  commentMap: Record<number, any[]>;
  commentRubricComments: Record<number, any>;
} => {
  const fileList: FileType[] = [];
  fileList[0] = demoFilesStudent[0] as FileType;
  fileList[1] = demoFilesStudent[1] as FileType;
  fileList[2] = demoFilesStudent[2] as FileType;
  fileList[3] = {
    id: 4,
    name: 'assignment.pdf',
    data: 'data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmogICUgcGFnZXMKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqICB1cGFnZQo8PAogIC9UeXBlIC9QYWdlCiAgL1BhcmVudCAyIDAgUgogIC9SZXNvdXJjZXMgPDwKICAgIC9Gb250IDw8CiAgICAgIC9GMSA0IDAgUgogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmogICUgZm9udAo8PAogIC9UeXBlIC9Gb250CiAgL1N1YnR5cGUgL1R5cGUxCiAgL0Jhc2VGb250IC9UaW1lcy1Sb21hbgpQPj4KZW5kb2JqCgo1IDAgb2JqICAlIHBhZ2UgY29udGVudAo8PAogIC9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCjcwIDUwIFRECi9GMSAxMiBUZgooSGVsbG8sIHdvcmxkISkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEwIDAwMDAwIG4gCjAwMDAwMDAwNjAgMDAwMDAgbiAKMDAwMDAwMDE1NyAwMDAwMCBuIAowMDAwMDAwMjU1IDAwMDAwIG4gCjAwMDAwMDAzNDQgMDAwMDAgbiAKdHJhaWxlcgo8PAogIC9TaXplIDYKICAvUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKNDM5CiUlRU9GCg==',
    comments: [],
    extension: 'pdf',
    submission: DEMO_SUBMISSION_ID,
    path: null,
    created: '',
    modified: '',
  };

  const comments = [
    {
      startLine: 18,
      endLine: 18,
      startChar: 4,
      endChar: 17,
      id: 1,
      file: 1,
      pointDelta: null,
      text: '',
      rubricComment: 12,
      author: 'grader0@example.edu',
      feedback: 0,
    },
    {
      startLine: 14,
      endLine: 14,
      startChar: 0,
      endChar: 24,
      id: 2,
      file: 1,
      pointDelta: null,
      text: '',
      rubricComment: 32,
      author: 'grader0@example.edu',
      feedback: 0,
    },
    {
      startLine: 8,
      endLine: 8,
      startChar: 4,
      endChar: 20,
      id: 3,
      file: 2,
      pointDelta: null,
      text: '',
      rubricComment: 11,
      author: 'grader0@example.edu',
      feedback: 0,
    },
    {
      startLine: 2,
      endLine: 2,
      startChar: 0,
      endChar: 1,
      id: 4,
      file: 3,
      pointDelta: null,
      text: 'Nice visualization. Add axis labels and a short interpretation in markdown.',
      rubricComment: 22,
      author: 'grader0@example.edu',
      feedback: 0,
    },
  ];

  return {
    fileList,
    commentMap: {
      1: comments.filter((comment) => comment.file === 1),
      2: comments.filter((comment) => comment.file === 2),
      3: comments.filter((comment) => comment.file === 3),
      4: [],
    },
    commentRubricComments: {
      1: demoRubricComments[1][1],
      2: demoRubricComments[3][1],
      3: demoRubricComments[1][0],
      4: demoRubricComments[2][1],
    },
  };
};

export const getDemoPinnedTemplates = (currentUserEmail: string): CommentTemplateType[] => {
  return [
    {
      id: -100,
      owner: currentUserEmail,
      assignment: DEMO_ASSIGNMENT_ID,
      isGlobal: false,
      text: 'Nice decomposition. Consider adding one more test for empty input.',
      pointDelta: -1,
      rubricComment: 22,
      sourceComment: null,
      filePath: null,
      cellId: null,
    },
    {
      id: -101,
      owner: currentUserEmail,
      assignment: DEMO_ASSIGNMENT_ID,
      isGlobal: true,
      text: 'This implementation fails on all-negative arrays because max starts at 0.',
      pointDelta: 2,
      rubricComment: 12,
      sourceComment: null,
      filePath: 'Loops.py',
      cellId: null,
    },
    {
      id: -102,
      owner: currentUserEmail,
      assignment: DEMO_ASSIGNMENT_ID,
      isGlobal: true,
      text: 'Great explanation in comments. Keep that level of clarity throughout.',
      pointDelta: -1,
      rubricComment: null,
      sourceComment: null,
      filePath: null,
      cellId: null,
    },
    {
      id: -103,
      owner: currentUserEmail,
      assignment: DEMO_ASSIGNMENT_ID,
      isGlobal: true,
      text: 'Notebook insight is clear. Next step: explain why the curve is super-linear.',
      pointDelta: -1,
      rubricComment: 22,
      sourceComment: null,
      filePath: 'analysis_notebook.ipynb',
      cellId: 'demo-cell-plot',
    },
  ];
};

export const loadDemoGrader = (files: any[], user: string | null) => {
  const demoAssignment = { ...demoAssignmentBase };
  const demoCourse = { ...demoCourseBase };
  const demoSubmission = buildDemoSubmission(user);

  const { fileList, commentMap } = files.length > 0 ? buildUploadedFiles(files) : buildDefaultGraderFiles();

  return {
    assignment: demoAssignment,
    course: demoCourse,
    submission: demoSubmission,
    files: fileList,
    comments: commentMap,
    commentRubricComments: {},
    selectedFile: fileList.length > 0 ? fileList[0] : undefined,
    rubricCategories: demoRubricCategories,
    rubricComments: demoRubricComments,
    tests: demoTests,
    testCategories: demoTestCategories,
    testCases: demoTestCases,
    permissionLevel: PERMISSION_LEVEL.WRITE,
    isStudent: false,
    hideGrades: false,
  };
};

export const loadDemoStudent = (files: any[], user: string | null) => {
  const demoAssignment = { ...demoAssignmentBase, studentsCanSeeGraders: true };
  const demoCourse = { ...demoCourseBase };
  const demoSubmission = buildDemoSubmission(user);

  const uploadedData = files.length > 0 ? buildUploadedFiles(files) : undefined;
  const defaultData = files.length > 0 ? undefined : buildDefaultStudentFiles();

  const fileList = uploadedData ? uploadedData.fileList : defaultData!.fileList;
  const commentMap = uploadedData ? uploadedData.commentMap : defaultData!.commentMap;
  const commentRubricComments = uploadedData ? {} : defaultData!.commentRubricComments;

  return {
    assignment: demoAssignment,
    course: demoCourse,
    submission: demoSubmission,
    files: fileList,
    comments: commentMap,
    commentRubricComments,
    selectedFile: fileList.length > 0 ? fileList[0] : undefined,
    rubricCategories: demoRubricCategories,
    rubricComments: demoRubricComments,
    tests: demoTests,
    testCategories: demoTestCategories,
    testCases: demoTestCases,
    permissionLevel: PERMISSION_LEVEL.READ,
    readOnlySubmission: demoSubmission,
    isStudent: true,
    hideGrades: false,
  };
};
