import * as t from 'io-ts';
import { compare } from '../components/Utils/SortUtils';
import {
  createObject,
  deleteObject,
  GenericObject,
  loadIDList,
  readObject,
  readObjectDetail,
  updateObject,
  updateObjectDetail,
} from './generics';

import { ICommentToRubricCommentMap, IFileToCommentsMap } from '../types/common';
import { CommentIO, CommentType } from './comment';
import { File, FileType } from './file';
import { RubricComment } from './rubricComment';
import { SubmissionHistoryV, SubmissionHistoryVPatch } from './submissionHistory';

/*****************************************************************************/
/* Type Definitions
/*****************************************************************************/

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
      grader: t.union([t.string, t.null]),
    }),
  ],
  'Submission',
);

const StudentSubmissionV = t.intersection(
  [
    GenericObject,
    t.type({
      isFinalized: t.boolean,
      students: t.array(t.string),
      assignment: t.number,
    }),
    t.partial({
      files: t.array(t.number),
      grade: t.union([t.number, t.null]),
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

const AnonymousSubmissionV = t.intersection(
  [
    GenericObject,
    t.type({
      isFinalized: t.boolean,
      files: t.array(t.number),
      assignment: t.number,
      dateEdited: t.string,
      grade: t.union([t.number, t.null]),
      grader: t.union([t.string, t.null]),
    }),
    t.partial({
      students: t.array(t.string),
    }),
  ],
  'Submission',
);

type SubmissionType = t.TypeOf<typeof SubmissionV>;
type StudentSubmissionType = t.TypeOf<typeof StudentSubmissionV>;
type AnonymousSubmissionType = t.TypeOf<typeof AnonymousSubmissionV>;

/*****************************************************************************/

class Submission {
  public static create = createObject(SubmissionV, SubmissionVPost, 'submissions');
  public static read = readObject(SubmissionV, 'submissions');
  public static update = updateObject(SubmissionV, SubmissionVPatch, 'submissions');
  public static delete = deleteObject(SubmissionV, 'submissions');
  public static readAnonymous = readObject(AnonymousSubmissionV, 'submissions');
  public static readHistory = readObjectDetail(t.array(SubmissionHistoryV), 'submissions', 'history');
  public static updateHistory = updateObjectDetail(
    SubmissionHistoryV,
    SubmissionHistoryVPatch,
    'submissions',
    'history',
  );

  // FIXME, duplicate
  public static loadData = async (
    submission: SubmissionType | StudentSubmissionType | AnonymousSubmissionType,
  ): Promise<[FileType[], IFileToCommentsMap, ICommentToRubricCommentMap]> => {
    if (!submission.files) {
      return [[], {}, {}];
    }

    const files = await loadIDList(submission.files, File);
    const comments: IFileToCommentsMap = {};
    await Promise.all(
      files.map(async (file: FileType) => {
        comments[file.id] = await loadIDList(file.comments, CommentIO);
        return;
      }),
    );

    const commentRubricComments: ICommentToRubricCommentMap = {};
    await Promise.all(
      Object.values(comments)
        .flat()
        .map(async (comment: CommentType) => {
          if (comment.rubricComment) {
            commentRubricComments[comment.id] = await RubricComment.read(comment.rubricComment);
          }
          return;
        }),
    );

    return [files, comments, commentRubricComments];
  };
}

export enum SUBMISSION_SORT_TYPE {
  students,
  grade,
  grader,
  isFinalized,
  dateEdited,
}

function sortSubmissions(sortType: SUBMISSION_SORT_TYPE, ascending: boolean, a: SubmissionType, b: SubmissionType) {
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

export {
  SubmissionType,
  Submission,
  SubmissionV,
  StudentSubmissionV,
  StudentSubmissionType,
  sortSubmissions,
  AnonymousSubmissionType,
  AnonymousSubmissionV,
};
