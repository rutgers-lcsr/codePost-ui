// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
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
const DEMO_PDF_DATA_URI =
  'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCAzMDAgMTQ0XSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA0OCA+PgpzdHJlYW0KQlQKL0YxIDE4IFRmCjQwIDkwIFRkCihjb2RlUG9zdCBEZW1vIFBERikgVGoKRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8IC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL0hlbHZldGljYSA+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQxIDAwMDAwIG4gCjAwMDAwMDAzMzggMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA2IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgo0MDgKJSVFT0YK';

type DemoUploadFile = {
  name?: string;
  data?: string;
  code?: string;
};

const demoAssignmentBase: AssignmentType = {
  id: DEMO_ASSIGNMENT_ID,
  name: 'codePost Demo',
  isReleased: false,
  feedbackReleased: false,
  hideGrades: false,
  rubricCategories: [1, 2, 3, 4],
  course: -1,
  sortKey: 0,
  anonymousGrading: false,
  allowRegradeRequests: false,
  studentsCanSeeGraders: false,
  regradeInstructions: '',
  regradeDeadline: '',
  hideGradersFromStudents: false,
  points: 25,
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
  testCategories: [-1, -2, -3, -4],
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
  capabilities: {},
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
  {
    id: 4,
    name: 'Design',
    rubricComments: [],
    assignment: DEMO_ASSIGNMENT_ID,
    pointLimit: 5,
    sortKey: 3,
    helpText: 'Data structure choice and edge-case handling.',
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
  4: [
    {
      id: 41,
      text: 'remove() does not handle removing the head element.',
      category: 4,
      pointDelta: 2,
      sortKey: 0,
      explanation: 'Check if head itself matches before walking the rest of the list.',
      instructionText: '',
      templateTextOn: false,
    },
    {
      id: 42,
      text: 'toString() crashes on an empty list (NullPointerException).',
      category: 4,
      pointDelta: 1,
      sortKey: 1,
      explanation: 'Guard against head == null before accessing head.data.',
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
    hiddenSummary: null,
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
    hiddenSummary: null,
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
    hiddenSummary: null,
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
    hiddenSummary: null,
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
    hiddenSummary: null,
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
    hiddenSummary: null,
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
    hiddenSummary: null,
  },
  {
    id: -8,
    submission: DEMO_SUBMISSION_ID,
    testCase: -8,
    logs: 'add(1), add(2): size() returned 2',
    passed: true,
    testCategory: -4,
    created: '2026-01-01T00:00:00.000Z',
    modified: '2026-01-01T00:00:00.000Z',
    isError: false,
    hiddenSummary: null,
  },
  {
    id: -9,
    submission: DEMO_SUBMISSION_ID,
    testCase: -9,
    logs: 'NullPointerException: Cannot invoke "Object.toString()" on empty list',
    passed: false,
    testCategory: -4,
    created: '2026-01-01T00:00:00.000Z',
    modified: '2026-01-01T00:00:00.000Z',
    isError: true,
    hiddenSummary: null,
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
  {
    id: -4,
    name: 'LinkedList.java',
    testCases: [-8, -9],
    assignment: DEMO_ASSIGNMENT_ID,
    testScript: undefined,
    maxPoints: undefined,
    sortKey: 3,
    targetFileName: 'LinkedList.java',
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
      pointsPass: 2,
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
      pointsPass: 3,
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
      pointsPass: 3,
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
      pointsPass: 2,
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
      pointsPass: 3,
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
      pointsPass: 2,
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
      pointsPass: 2,
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
  [-4]: [
    {
      id: -8,
      testCategory: -4,
      sortKey: 0,
      description: 'add(1), add(2), size() returns 2',
      type: 'io',
      pointsFail: 1,
      pointsPass: 2,
      text: '',
      modified: '2026-01-01T00:00:00.000Z',
      fileName: 'LinkedList.java',
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
      id: -9,
      testCategory: -4,
      sortKey: 1,
      description: 'toString() on empty list throws NullPointerException',
      type: 'unit',
      pointsFail: 2,
      pointsPass: 3,
      text: '',
      modified: '2026-01-01T00:00:00.000Z',
      fileName: 'LinkedList.java',
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
};

const buildDemoSubmission = (user: string | null, fileIds: number[]): AnonymousSubmissionType => ({
  id: DEMO_SUBMISSION_ID,
  isFinalized: false,
  files: fileIds as unknown as AnonymousSubmissionType['files'],
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

const inferExtension = (fileName: string): string => {
  if (!fileName || !fileName.includes('.')) {
    return '';
  }

  return fileName.split('.').pop()?.toLowerCase() || '';
};

const normalizeUploadFile = (file: DemoUploadFile | null | undefined, index: number): Required<DemoUploadFile> => {
  const fallbackName = `uploaded_file_${index + 1}.txt`;
  const safeName = typeof file?.name === 'string' && file.name.trim().length > 0 ? file.name : fallbackName;

  const safeDataCandidate = file?.data ?? file?.code ?? '';
  const safeData = typeof safeDataCandidate === 'string' ? safeDataCandidate : String(safeDataCandidate);

  return {
    name: safeName,
    data: safeData,
    code: safeData,
  };
};

const buildUploadedFiles = (
  files: DemoUploadFile[],
): { fileList: FileType[]; commentMap: Record<number, unknown[]> } => {
  const fileList: FileType[] = [];
  const commentMap: Record<number, unknown[]> = {};

  files.forEach((rawFile, index) => {
    const file = normalizeUploadFile(rawFile, index);
    const fileId = index + 1;
    const extension = inferExtension(file.name);

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

const buildDefaultGraderFiles = (): { fileList: FileType[]; commentMap: Record<number, unknown[]> } => {
  const fileList: FileType[] = [];
  fileList[0] = demoFilesGrader[0] as FileType;
  fileList[1] = demoFilesGrader[1] as FileType;
  fileList[2] = demoFilesGrader[2] as FileType;
  fileList[3] = {
    id: 4,
    name: 'assignment.pdf',
    data: DEMO_PDF_DATA_URI,
    comments: [],
    extension: 'pdf',
    submission: DEMO_SUBMISSION_ID,
    path: null,
    created: '',
    modified: '',
  };
  fileList[4] = demoFilesGrader[3] as FileType;

  return {
    fileList,
    commentMap: {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    },
  };
};

const buildDefaultStudentFiles = (): {
  fileList: FileType[];
  commentMap: Record<number, unknown[]>;
  commentRubricComments: Record<number, unknown>;
} => {
  const fileList: FileType[] = [];
  fileList[0] = demoFilesStudent[0] as FileType;
  fileList[1] = demoFilesStudent[1] as FileType;
  fileList[2] = demoFilesStudent[2] as FileType;
  fileList[3] = {
    id: 4,
    name: 'assignment.pdf',
    data: DEMO_PDF_DATA_URI,
    comments: [],
    extension: 'pdf',
    submission: DEMO_SUBMISSION_ID,
    path: null,
    created: '',
    modified: '',
  };
  fileList[4] = demoFilesStudent[3] as FileType;

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
      5: comments.filter((comment) => comment.file === 5),
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

export const loadDemoGrader = (files: DemoUploadFile[], user: string | null) => {
  const demoAssignment = { ...demoAssignmentBase };
  const demoCourse = { ...demoCourseBase };

  const { fileList, commentMap } = files.length > 0 ? buildUploadedFiles(files) : buildDefaultGraderFiles();
  const demoSubmission = buildDemoSubmission(
    user,
    fileList.map((file) => file.id || 0).filter((id) => id > 0),
  );

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

export const loadDemoStudent = (files: DemoUploadFile[], user: string | null) => {
  const demoAssignment = { ...demoAssignmentBase, studentsCanSeeGraders: true };
  const demoCourse = { ...demoCourseBase };

  const uploadedData = files.length > 0 ? buildUploadedFiles(files) : undefined;
  const defaultData = files.length > 0 ? undefined : buildDefaultStudentFiles();

  const fileList = uploadedData ? uploadedData.fileList : defaultData!.fileList;
  const commentMap = uploadedData ? uploadedData.commentMap : defaultData!.commentMap;
  const commentRubricComments = uploadedData ? {} : defaultData!.commentRubricComments;
  const demoSubmission = buildDemoSubmission(
    user,
    fileList.map((file) => file.id || 0).filter((id) => id > 0),
  );

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
