import * as t from 'io-ts';

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

import { slack } from '../components/core/slack';

import { message } from 'antd';

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
      dateUploaded: t.string,
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
      dateUploaded: t.string,
      hasGrader: t.boolean,
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
      dateUploaded: t.string,
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
/* Methods exposed
/*****************************************************************************/

class Submission {
  public static create = createObject(SubmissionV, SubmissionVPost, 'submissions');
  public static read = readObject(SubmissionV, 'submissions');
  public static update = updateObject(SubmissionV, SubmissionVPatch, 'submissions');
  public static delete = deleteObject(SubmissionV, 'submissions');
  public static readAnonymous = readObject(AnonymousSubmissionV, 'submissions');
  public static readReadOnly = readObject(StudentSubmissionV, 'submissions');
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

    try {
      const files = await loadIDList(submission.files, File);
      const comments: IFileToCommentsMap = {};
      await Promise.all(
        files.map(async (file: FileType) => {
          comments[file.id] = (await loadIDList(file.comments, CommentIO)).sort(CommentIO.compare);
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
    } catch (err) {
      const payload = {
        error: `Error loading submission ${submission.id}`,
        errorDetail: JSON.stringify(err),
        url: window.location.href,
      };

      slack(`${process.env.REACT_APP_API_URL}/logs/logError/`, payload);

      message.error('Something went wrong loading the submission. Please try again or contact team@codepost.io');
      return [[], {}, {}];
    }
  };
}

/*****************************************************************************/
/* Exports
/*****************************************************************************/

export {
  SubmissionType,
  Submission,
  SubmissionV,
  StudentSubmissionV,
  StudentSubmissionType,
  AnonymousSubmissionType,
  AnonymousSubmissionV,
};
