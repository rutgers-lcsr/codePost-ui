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

import { RubricCategoryV } from './rubricCategory';
import { RubricCommentV } from './rubricComment';
import { AnonymousSubmissionV, StudentSubmissionV, SubmissionV } from './submission';
import { SubmissionHistoryV } from './submissionHistory';

const AssignmentV = t.intersection(
  [
    GenericObject,
    t.type({
      name: t.string,
      points: t.number,
      isReleased: t.boolean,
      hideGrades: t.boolean,
      commentFeedback: t.boolean,
      allowStudentUpload: t.boolean,
      uploadDueDate: t.union([t.string, t.null]),
      liveFeedbackMode: t.boolean,
      additiveGrading: t.boolean,
      rubricCategories: t.array(t.number),
      course: t.number,
      sortKey: t.number,
      anonymousGrading: t.boolean,
      collaborativeRubricMode: t.boolean,
      allowRegradeRequests: t.boolean,
      regradeDeadline: t.union([t.null, t.string]),
      hideGradersFromStudents: t.boolean,
      forcedRubricMode: t.boolean,
      templateMode: t.boolean,
      fileTemplates: t.array(t.number),
      mean: t.union([t.number, t.null, t.undefined]),
      median: t.union([t.number, t.null, t.undefined]),
      showFrequentlyUsedRubricComments: t.boolean,
      allowLateUploads: t.boolean,
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
      rubricCategories: t.array(t.number),
      course: t.number,
    }),
    t.partial({
      hideGrades: t.boolean,
      allowStudentUpload: t.boolean,
      additiveGrading: t.boolean,
      uploadDueDate: t.union([t.string, t.null]),
      liveFeedbackMode: t.boolean,
      sortKey: t.number,
      anonymousGrading: t.boolean,
      allowRegradeRequests: t.boolean,
      regradeDeadline: t.union([t.null, t.string]),
      hideGradersFromStudents: t.boolean,
      mean: t.union([t.number, t.null, t.undefined]),
      median: t.union([t.number, t.null, t.undefined]),
      points: t.number,
      allowLateUploads: t.boolean,
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
      hideGrades: t.boolean,
      rubricCategories: t.array(t.number),
    }),
    t.partial({
      anonymousGrading: t.boolean,
      hideGradersFromStudents: t.boolean,
      course: t.number,
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
      hideGrades: t.boolean,
      rubricCategories: t.array(t.number),
      course: t.number,
      anonymousGrading: t.boolean,
      hideGradersFromStudents: t.boolean,
      commentFeedback: t.boolean,
      allowRegradeRequests: t.boolean,
      regradeDeadline: t.union([t.null, t.string]),
      allowStudentUpload: t.boolean,
      uploadDueDate: t.union([t.string, t.null]),
      liveFeedbackMode: t.boolean,
      collaborativeRubricMode: t.boolean,
      additiveGrading: t.boolean,
      forcedRubricMode: t.boolean,
      templateMode: t.boolean,
      allowLateUploads: t.boolean,
      showFrequentlyUsedRubricComments: t.boolean,
    }),
  ],
  'AssignmentPatch',
);

export type AssignmentType = t.TypeOf<typeof AssignmentV>;
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
  'Roster',
);

export type RubricType = t.TypeOf<typeof RubricV>;

export class Assignment {
  public static create = createObject(AssignmentV, AssignmentVPost, 'assignments');
  public static read = readObject(AssignmentV, 'assignments');
  public static update = updateObject(AssignmentV, AssignmentVPatch, 'assignments');
  public static delete = deleteObject(AssignmentV, 'assignments');

  public static readRubric = readObjectDetail(RubricV, 'assignments', 'rubric');
  public static readSubmissions = readObjectDetail(t.array(SubmissionV), 'assignments', 'submissions');
  public static readSubmissionsAnonymous = readObjectDetail(
    t.array(AnonymousSubmissionV),
    'assignments',
    'submissions',
  );
  public static readSubmissionsStudent = readObjectDetail(t.array(StudentSubmissionV), 'assignments', 'submissions');
  public static readSubmissionHistories = readObjectDetail(
    t.array(SubmissionHistoryV),
    'assignments',
    'submissionHistories',
  );
}

// Type for getting and patching student upload
const StudentUploadData = t.intersection([
  GenericObject,
  t.type({
    files: t.array(
      t.intersection([
        t.type({
          code: t.string,
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
]);

// tslint:disable
export class AssignmentStudent {
  public static read = readObject(AssignmentVStudent, 'assignments');
  public static readSubmissions = readObjectDetail(t.array(StudentSubmissionV), 'assignments', 'submissions');
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
}

export const sortAssignments = (assignments: AssignmentType[]): AssignmentType[] => {
  // First sort by Assignment 'sortKey', then by ID
  const compareAssignments = (a: AssignmentType, b: AssignmentType) => {
    if (a.sortKey === b.sortKey) {
      return a.id - b.id; // lower ids first
    } else {
      return a.sortKey - b.sortKey; // lower sortKeys first
    }
  };

  return assignments.sort(compareAssignments);
};

// export { AssignmentType, AssignmentPatchType, AssignmentStudent, Assignment, sortAssignments, RubricType };
