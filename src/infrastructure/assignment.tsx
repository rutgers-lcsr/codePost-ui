import * as t from 'io-ts';
import {
  createObject,
  createObjectDetail,
  deleteObject,
  GenericObject,
  readObject,
  readObjectDetail,
  updateObject,
  updateObjectDetail,
} from './generics';
import { convertToPaginatedFunction, paginatedType } from './pagination';

import { CommentV } from './comment';
import { AssignmentFileV } from './file';
import { RubricCategoryV } from './rubricCategory';
import { RubricCommentV } from './rubricComment';
import {
  AnonymousSubmissionInfoV,
  StudentSubmissionV,
  SubmissionInfoType,
  SubmissionInfoV,
  SubmissionWithTestsType,
  SubmissionWithTestsV,
} from './submission';
import { SubmissionHistoryType, SubmissionHistoryV } from './submissionHistory';
import { StudentTestCaseV } from './testCase';
import { TestCategoryV } from './testCategory';

const AssignmentV = t.intersection(
  [
    GenericObject,
    t.type({
      name: t.string,
      points: t.number,
      isReleased: t.boolean,
      submissionsReleased: t.boolean,
      hideGrades: t.boolean,
      commentFeedback: t.boolean,
      allowStudentUpload: t.boolean,
      allowStudentUploadWithPartners: t.boolean,
      uploadDueDate: t.union([t.string, t.null]),
      maxLateDays: t.number,
      liveFeedbackMode: t.boolean,
      additiveGrading: t.boolean,
      rubricCategories: t.array(t.number),
      course: t.number,
      sortKey: t.number,
      anonymousGrading: t.boolean,
      collaborativeRubricMode: t.boolean,
      allowRegradeRequests: t.boolean,
      regradeInstructions: t.string,
      regradeDeadline: t.union([t.null, t.string]),
      hideGradersFromStudents: t.boolean,
      studentsCanSeeGraders: t.union([t.boolean, t.null]),
      forcedRubricMode: t.boolean,
      templateMode: t.boolean,
      files: t.array(t.number),
      mean: t.union([t.number, t.null, t.undefined]),
      median: t.union([t.number, t.null, t.undefined]),
      testCategories: t.array(t.number),
      dataSets: t.array(t.number),
      environment: t.union([t.number, t.null]),
      showFrequentlyUsedRubricComments: t.boolean,
      allowLateUploads: t.boolean,
      maxStudentTestRuns: t.union([t.null, t.number]),
      explanation: t.string,
      isVisible: t.boolean,
      hideFrom: t.array(t.number),
      nudgeMode: t.boolean,
      lateDeductions: t.array(t.number),
    }),
    t.partial({
      submissions_count: t.number,
      submissions_finalized_count: t.number,
      submissions_inprogress_count: t.number,
      submissions_unclaimed_count: t.number,
      submissions_missing_count: t.number,
      stats_max: t.number,
      stats_min: t.number,
      stats_mean: t.number,
      fileTemplates: t.array(t.number),
    }),
  ],
  'Assignment',
);

const AssignmentVStudent = t.intersection(
  [
    GenericObject,
    t.type({
      name: t.string,
      isReleased: t.boolean,
      submissionsReleased: t.boolean,
      rubricCategories: t.array(t.number),
      course: t.number,
      allowLateUploads: t.boolean,
      files: t.array(t.union([t.number, AssignmentFileV])),
      maxStudentTestRuns: t.union([t.null, t.number]),
      sortKey: t.number,
      environment: t.union([t.number, t.null]),
      explanation: t.string,
      isVisible: t.boolean,
      hideFrom: t.array(t.number),
      nudgeMode: t.boolean,
      lateDeductions: t.array(t.number),
    }),
    t.partial({
      hideGrades: t.boolean,
      allowStudentUpload: t.boolean,
      allowStudentUploadWithPartners: t.boolean,
      additiveGrading: t.boolean,
      uploadDueDate: t.union([t.string, t.null]),
      maxLateDays: t.number,
      liveFeedbackMode: t.boolean,
      anonymousGrading: t.boolean,
      allowRegradeRequests: t.boolean,
      regradeInstructions: t.string,
      regradeDeadline: t.union([t.null, t.string]),
      hideGradersFromStudents: t.boolean,
      studentsCanSeeGraders: t.union([t.boolean, t.null]),
      mean: t.union([t.number, t.null, t.undefined]),
      median: t.union([t.number, t.null, t.undefined]),
      points: t.number,
      fileTemplates: t.array(t.number),
    }),
  ],
  'Assignment',
);

const AssignmentVPost = t.intersection(
  [
    GenericObject,
    t.type({
      name: t.string,
      points: t.number,
      isReleased: t.boolean,
      submissionsReleased: t.boolean,
      hideGrades: t.boolean,
      rubricCategories: t.array(t.number),
    }),
    t.partial({
      anonymousGrading: t.boolean,
      hideGradersFromStudents: t.boolean,
      studentsCanSeeGraders: t.union([t.boolean, t.null]),
      course: t.number,
      allowStudentUpload: t.boolean,
      uploadDueDate: t.union([t.string, t.null]),
      isVisible: t.boolean,
      sortKey: t.number,
    }),
  ],
  'Assignment',
);

const AssignmentVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      name: t.string,
      points: t.number,
      isReleased: t.boolean,
      submissionsReleased: t.boolean,
      hideGrades: t.boolean,
      rubricCategories: t.array(t.number),
      course: t.number,
      anonymousGrading: t.boolean,
      hideGradersFromStudents: t.boolean,
      studentsCanSeeGraders: t.union([t.boolean, t.null]),
      commentFeedback: t.boolean,
      allowRegradeRequests: t.boolean,
      regradeInstructions: t.string,
      regradeDeadline: t.union([t.null, t.string]),
      allowStudentUpload: t.boolean,
      allowStudentUploadWithPartners: t.boolean,
      uploadDueDate: t.union([t.string, t.null]),
      maxLateDays: t.number,
      liveFeedbackMode: t.boolean,
      collaborativeRubricMode: t.boolean,
      additiveGrading: t.boolean,
      forcedRubricMode: t.boolean,
      templateMode: t.boolean,
      sortKey: t.number,
      allowLateUploads: t.boolean,
      showFrequentlyUsedRubricComments: t.boolean,
      explanation: t.string,
      isVisible: t.boolean,
      lateDeductions: t.array(t.number),
      fileTemplates: t.array(t.number),
    }),
  ],
  'AssignmentPatch',
);

export type AssignmentType = t.TypeOf<typeof AssignmentV>;
export type AssignmentStudentType = t.TypeOf<typeof AssignmentVStudent>;
export type AssignmentPatchType = t.TypeOf<typeof AssignmentVPatch>;

const RubricV = t.intersection(
  [
    GenericObject,
    t.type({
      rubricCategories: t.array(RubricCategoryV),
      rubricComments: t.array(RubricCommentV),
    }),
    t.partial({}),
  ],
  'Rubric',
);

// Only called by students - filters for only exposed test if assignment isn't published
const TestsV = t.intersection(
  [
    GenericObject,
    t.type({
      testCases: t.array(StudentTestCaseV),
      testCategories: t.array(TestCategoryV),
    }),
  ],
  'Tests',
);

export type RubricType = t.TypeOf<typeof RubricV>;

export class Assignment {
  public static create = createObject(AssignmentV, AssignmentVPost, 'assignments');
  public static read = readObject(AssignmentV, 'assignments');
  public static update = updateObject(AssignmentV, AssignmentVPatch, 'assignments');
  public static delete = deleteObject(AssignmentV, 'assignments');

  // Clone an assignment to a course
  public static clone = async (assignmentId: number, destinationCourseId: number): Promise<AssignmentType> => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/assignments/${assignmentId}/clone/`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      method: 'POST',
      body: JSON.stringify({ course: destinationCourseId }),
    });

    if (res.status === 200) {
      const data = await res.json();
      const decoded = AssignmentV.decode(data);
      if (decoded._tag === 'Right') {
        return decoded.right;
      }
      throw new Error('Invalid assignment data received from clone endpoint');
    }

    throw new Error(`Failed to clone assignment: ${res.status} ${res.statusText}`);
  };

  public static readRubric = readObjectDetail(RubricV, 'assignments', 'rubric');
  public static readSubmissions = readObjectDetail(t.array(SubmissionInfoV), 'assignments', 'submissions');
  public static readSubmissionsAnonymous = readObjectDetail(
    t.array(AnonymousSubmissionInfoV),
    'assignments',
    'submissions',
  );
  public static readSubmissionsStudent = readObjectDetail(t.array(StudentSubmissionV), 'assignments', 'submissions');
  public static readSubmissionHistories = readObjectDetail(
    t.array(SubmissionHistoryV),
    'assignments',
    'submissionHistories',
  );

  public static readComments = readObjectDetail(t.array(CommentV), 'assignments', 'comments');

  // Paginated requests - for admin console performance on large courses
  public static readPaginatedSubmissions = convertToPaginatedFunction<SubmissionInfoType>(
    readObjectDetail(paginatedType(SubmissionInfoV), 'assignments', 'submissions'),
  );
  public static readPaginatedSubmissionHistories = convertToPaginatedFunction<SubmissionHistoryType>(
    readObjectDetail(paginatedType(SubmissionHistoryV), 'assignments', 'submissionHistories'),
  );
  public static readPaginatedTestResults = convertToPaginatedFunction<SubmissionWithTestsType>(
    readObjectDetail(paginatedType(SubmissionWithTestsV), 'assignments', 'submissionTests'),
  );
}

// Type for getting and patching student upload
const StudentUploadData = t.intersection([
  GenericObject,
  t.type({
    files: t.array(
      t.intersection([
        t.type({
          data: t.string,
          name: t.string,
          extension: t.string,
        }),
        t.partial({
          id: t.number,
          submisssion: t.number,
        }),
      ]),
    ),
  }),
  t.partial({
    sendConfirmationEmail: t.boolean,
  }),
]);

// Type for getting and patching student upload
const StudentUploadInformation = t.intersection([
  t.type({
    daysLate: t.number,
    pointsOff: t.number,
  }),
  t.partial({
    lateDayCreditsAvailable: t.number,
    lateDayCreditsToUse: t.number,
    adjustedDaysLate: t.number,
  }),
]);
export type StudentUploadInformationType = t.TypeOf<typeof StudentUploadInformation>;

export class AssignmentStudent {
  public static read = readObject(AssignmentVStudent, 'assignments');
  public static readSubmissions = readObjectDetail(t.array(StudentSubmissionV), 'assignments', 'submissions');
  public static downloadAssignmentZip = readObjectDetail(
    t.type({
      zip: t.string,
      filename: t.string,
    }),
    'assignments',
    'download',
  );
  public static createStudentUpload = createObjectDetail(
    StudentSubmissionV,
    StudentUploadData,
    'assignments',
    'studentUpload',
  );
  public static updateStudentUpload = updateObjectDetail(
    StudentSubmissionV,
    StudentUploadData,
    'assignments',
    'studentUpload',
  );
  public static readStudentUpload = readObjectDetail(StudentUploadData, 'assignments', 'studentUpload');
  public static readStudentTests = readObjectDetail(TestsV, 'assignments', 'studentTests');

  public static beforeStudentUpload = readObjectDetail(StudentUploadInformation, 'assignments', 'beforeStudentUpload');
}

interface sortableObject {
  id: number;
  sortKey: number;
}

export function sortAssignments<T extends sortableObject>(objs: T[]): T[] {
  // First sort by Assignment 'sortKey', then by ID
  const compareObjs = (a: T, b: T) => {
    if (a.sortKey === b.sortKey) {
      return a.id - b.id; // lower ids first
    } else {
      return a.sortKey - b.sortKey; // lower sortKeys first
    }
  };

  return objs.sort(compareObjs);
}

// export { AssignmentType, AssignmentPatchType, AssignmentStudent, Assignment, sortAssignments, RubricType };
