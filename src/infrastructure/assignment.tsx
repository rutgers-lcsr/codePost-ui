import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, readObjectDetail, updateObject } from './generics';

import { RubricCategoryV } from './rubricCategory';
import { RubricCommentV } from './rubricComment';
import { AnonymousSubmissionV, StudentSubmissionV, SubmissionV } from './submission';

const AssignmentV = t.intersection(
  [
    GenericObject,
    t.type({
      name: t.string,
      points: t.number,
      isReleased: t.boolean,
      hideGrades: t.boolean,
      rubricCategories: t.array(t.number),
      course: t.number,
      sortKey: t.number,
      anonymousGrading: t.boolean,
    }),
    t.partial({
      mean: t.union([t.number, t.null]),
      median: t.union([t.number, t.null]),
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
    }),
  ],
  'AssignmentPatch',
);

type AssignmentType = t.TypeOf<typeof AssignmentV>;

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

class Assignment {
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
}

const sortAssignments = (assignments: AssignmentType[]): AssignmentType[] => {
  // First sort by Assignment 'sortKey', then by ID
  const compareAssignments = (a: AssignmentType, b: AssignmentType) => {
    if (a.sortKey === b.sortKey) {
      return a.id - b.id;
    } else {
      return a.sortKey - b.sortKey;
    }
  };

  return assignments.sort(compareAssignments);
};

export { AssignmentType, Assignment, sortAssignments };
