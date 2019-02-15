import * as t from 'io-ts';
import { compare } from '../components/Utils/SortUtils';
import { createObject, deleteObject, GenericObject, readObject, updateObject } from './generics';

const SubmissionV = t.intersection(
  [
    GenericObject,
    t.type({
      isFinalized: t.boolean,
      files: t.array(t.number),
      students: t.array(t.string),
      assignment: t.number,
      dateEdited: t.string,
      grade: t.union([t.number, t.null]),
    }),
    t.partial({
      grader: t.union([t.string, t.null]),
    }),
  ],
  'Submission',
);

const SubmissionStatusV = t.intersection(
  [
    GenericObject,
    t.type({
      isFinalized: t.boolean,
      students: t.array(t.string),
      assignment: t.number,
    }),
    t.partial({
      files: t.array(t.number),
      dateEdited: t.string,
      grade: t.union([t.number, t.null]),
      grader: t.union([t.string, t.null]),
    }),
  ],
  'Submission',
);

const SubmissionVPost = t.intersection(
  [
    GenericObject,
    t.type({
      isFinalized: t.boolean,
      files: t.array(t.number),
      students: t.array(t.string),
      assignment: t.number,
    }),
    t.partial({
      grader: t.union([t.string, t.null]),
    }),
  ],
  'Submission',
);

const SubmissionVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      isFinalized: t.boolean,
      files: t.array(t.number),
      students: t.array(t.string),
      assignment: t.number,
      grader: t.union([t.string, t.null]),
    }),
  ],
  'SubmissionPatch',
);

type SubmissionType = t.TypeOf<typeof SubmissionV>;
type SubmissionStatusType = t.TypeOf<typeof SubmissionStatusV>;

class Submission {
  public static create = createObject(SubmissionV, SubmissionVPost, 'submissions');
  public static read = readObject(SubmissionV, 'submissions');
  public static update = updateObject(SubmissionV, SubmissionVPatch, 'submissions');
  public static delete = deleteObject(SubmissionV, 'submissions');
}

export enum SUBMISSION_SORT_TYPE {
  students,
  grade,
  grader,
  isFinalized,
  dateEdited,
}

function submissionSort(sortType: SUBMISSION_SORT_TYPE, ascending: boolean, a: SubmissionType, b: SubmissionType) {
  // Sort by email
  if (sortType === SUBMISSION_SORT_TYPE.students) {
    const aStudent = a.students.length > 0 ? a.students[0] : null;
    const bStudent = b.students.length > 0 ? b.students[0] : null;
    return compare(ascending, aStudent, bStudent);
  }
  // Sort by grader
  if (sortType === SUBMISSION_SORT_TYPE.grade) {
    // need to check finalization, because a submission could have a save grade but not be finalized.
    // In tables we want to show unfinalized submissions as equivalent.
    if (!a.isFinalized && b.isFinalized) return ascending ? -1 : 1;
    if (a.isFinalized && !b.isFinalized) return ascending ? 1 : -1;
    if (!a.isFinalized && !b.isFinalized) return 0;
    return compare(ascending, a.grade, b.grade);
  }
  // sort by grade
  if (sortType === SUBMISSION_SORT_TYPE.grader) {
    return compare(ascending, a.grader, b.grader);
  }
  // sort by isFinalized
  if (sortType === SUBMISSION_SORT_TYPE.isFinalized) {
    return compare(ascending, a.isFinalized, b.isFinalized);
  }
  // sort by dateEdited
  if (sortType === SUBMISSION_SORT_TYPE.dateEdited) {
    return compare(ascending, a.dateEdited, b.dateEdited);
  }
  return 0;
}

export { SubmissionType, Submission, SubmissionV, SubmissionStatusV, SubmissionStatusType, submissionSort };
