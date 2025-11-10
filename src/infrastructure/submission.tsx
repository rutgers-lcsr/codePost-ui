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

import { slack } from '../components/core/slack';
import { ICommentToRubricCommentMap, IFileToCommentsMap } from '../types/common';
import { CommentIO, CommentType } from './comment';
import { File, FileType, SubmissionFileV } from './file';
import { RubricComment } from './rubricComment';
import { SubmissionHistoryV, SubmissionHistoryVPatch } from './submissionHistory';
import { SubmissionTestV } from './submissionTest';

import { message } from 'antd';

/*****************************************************************************/
/* Type Definitions
/*****************************************************************************/

export const SubmissionV = t.intersection(
  [
    GenericObject,
    t.type({
      isFinalized: t.boolean,
      files: t.union([t.array(t.number), t.array(SubmissionFileV)]),
      students: t.array(t.string),
      assignment: t.number,
      dateEdited: t.string,
      dateUploaded: t.union([t.string, t.null]),
      grade: t.union([t.number, t.null]),
      grader: t.union([t.string, t.null]),
      questionIsOpen: t.boolean,
      questionIsRegrade: t.boolean,
      questionText: t.union([t.string, t.null]),
      questionResponse: t.union([t.string, t.null]),
      questionResponder: t.union([t.string, t.null]),
      questionDate: t.union([t.string, t.null]),
      responseDate: t.union([t.string, t.null]),
      tests: t.array(t.number),
      testRunsCompleted: t.number,
      lateDayCreditsUsed: t.number,
    }),
  ],
  'Submission',
);

export const SubmissionInfoV = t.intersection(
  [
    GenericObject,
    t.type({
      isFinalized: t.boolean,
      students: t.array(t.string),
      assignment: t.number,
      dateEdited: t.string,
      dateUploaded: t.union([t.string, t.null]),
      grade: t.union([t.number, t.null]),
      grader: t.union([t.string, t.null]),
      questionIsOpen: t.boolean,
      questionIsRegrade: t.boolean,
      questionText: t.union([t.string, t.null]),
      questionResponse: t.union([t.string, t.null]),
      questionResponder: t.union([t.string, t.null]),
      questionDate: t.union([t.string, t.null]),
      responseDate: t.union([t.string, t.null]),
      tests: t.array(t.number),
      testRunsCompleted: t.number,
      lateDayCreditsUsed: t.number,
    }),
  ],
  'Submission',
);

export const AnonymousSubmissionInfoV = t.intersection(
  [
    GenericObject,
    t.type({
      isFinalized: t.boolean,
      assignment: t.number,
      dateEdited: t.string,
      dateUploaded: t.union([t.string, t.null]),
      grade: t.union([t.number, t.null]),
      grader: t.union([t.string, t.null]),
      questionIsOpen: t.boolean,
      questionIsRegrade: t.boolean,
      questionText: t.union([t.string, t.null]),
      questionResponse: t.union([t.string, t.null]),
      questionResponder: t.union([t.string, t.null]),
      questionDate: t.union([t.string, t.null]),
      responseDate: t.union([t.string, t.null]),
      tests: t.array(t.number),
      testRunsCompleted: t.number,
      lateDayCreditsUsed: t.number,
    }),
    t.partial({
      students: t.array(t.string),
    }),
  ],
  'Submission',
);

export const AnonymousSubmissionInfoVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      isFinalized: t.boolean,
      assignment: t.number,
      dateEdited: t.string,
      dateUploaded: t.union([t.string, t.null]),
      grade: t.union([t.number, t.null]),
      grader: t.union([t.string, t.null]),
      questionIsOpen: t.boolean,
      questionIsRegrade: t.boolean,
      questionText: t.union([t.string, t.null]),
      questionResponse: t.union([t.string, t.null]),
      questionResponder: t.union([t.string, t.null]),
      questionDate: t.union([t.string, t.null]),
      responseDate: t.union([t.string, t.null]),
      tests: t.array(t.number),
      testRunsCompleted: t.number,
      lateDayCreditsUsed: t.number,
      students: t.array(t.string),
    }),
  ],
  'Submission',
);

export const StudentSubmissionV = t.intersection(
  [
    GenericObject,
    t.type({
      isFinalized: t.boolean,
      assignment: t.number,
      testRunsCompleted: t.number,
    }),
    t.partial({
      students: t.array(t.string),
      files: t.union([t.array(t.number), t.array(SubmissionFileV)]),
      grade: t.union([t.number, t.null]),
      questionIsOpen: t.boolean,
      questionIsRegrade: t.boolean,
      questionText: t.union([t.string, t.null]),
      questionResponse: t.union([t.string, t.null]),
      questionResponder: t.union([t.string, t.null]),
      questionDate: t.union([t.string, t.null]),
      responseDate: t.union([t.string, t.null]),
      dateUploaded: t.union([t.string, t.null]),
      hasGrader: t.boolean,
      tests: t.array(t.number),
      lateDayCreditsUsed: t.number,
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
      files: t.union([t.array(t.number), t.array(SubmissionFileV)]),
      students: t.array(t.string),
      assignment: t.number,
      grader: t.union([t.string, t.null]),
      questionIsOpen: t.boolean,
      questionIsRegrade: t.boolean,
      questionText: t.union([t.string, t.null]),
      questionResponse: t.union([t.string, t.null]),
      questionResponder: t.union([t.string, t.null]),
      lateDayCreditsUsed: t.number,
    }),
  ],
  'SubmissionPatch',
);

export const AnonymousSubmissionV = t.intersection(
  [
    GenericObject,
    t.type({
      isFinalized: t.boolean,
      files: t.union([t.array(t.number), t.array(SubmissionFileV)]),
      assignment: t.number,
      dateEdited: t.string,
      dateUploaded: t.union([t.string, t.null]),
      grade: t.union([t.number, t.null]),
      grader: t.union([t.string, t.null]),
      questionIsOpen: t.boolean,
      questionIsRegrade: t.boolean,
      questionText: t.union([t.string, t.null]),
      questionResponse: t.union([t.string, t.null]),
      questionResponder: t.union([t.string, t.null]),
      questionDate: t.union([t.string, t.null]),
      responseDate: t.union([t.string, t.null]),
      tests: t.array(t.number),
      lateDayCreditsUsed: t.number,
      testRunsCompleted: t.number,
    }),
    t.partial({
      students: t.array(t.string),
    }),
  ],
  'Submission',
);

// This is a simplified submission data object to make loading of test results faster
export const SubmissionWithTestsV = t.intersection(
  [
    GenericObject,
    t.type({
      tests: t.array(SubmissionTestV),
    }),
  ],
  'SubmissionTests',
);

export type SubmissionType = t.TypeOf<typeof SubmissionV>;
export type SubmissionInfoType = t.TypeOf<typeof SubmissionInfoV>;
export type AnonymousSubmissionInfoType = t.TypeOf<typeof AnonymousSubmissionInfoV>;
export type StudentSubmissionType = t.TypeOf<typeof StudentSubmissionV>;
export type AnonymousSubmissionType = t.TypeOf<typeof AnonymousSubmissionV>;

// This is a simplified submission data object to make loading of test results faster
export type SubmissionWithTestsType = t.TypeOf<typeof SubmissionWithTestsV>;

const TestResultsV = t.intersection(
  [
    t.type({
      submissionTests: t.array(SubmissionTestV),
      logs: t.string,
    }),
    t.partial({}),
  ],
  'TestResults',
);

const PartnerLinkV = t.intersection(
  [
    t.type({
      token: t.string,
    }),
    t.partial({}),
  ],
  'InviteToken',
);

export type PartnerLinkType = t.TypeOf<typeof PartnerLinkV>;

/*****************************************************************************/
/* Methods exposed
/*****************************************************************************/

export class Submission {
  public static create = createObject(SubmissionV, SubmissionVPost, 'submissions');
  public static read = readObject(SubmissionV, 'submissions');
  public static update = updateObject(SubmissionV, SubmissionVPatch, 'submissions');
  public static delete = deleteObject(SubmissionV, 'submissions');
  public static readAnonymous = readObject(AnonymousSubmissionV, 'submissions');
  public static updateAnonymous = updateObject(AnonymousSubmissionV, SubmissionVPatch, 'submissions');
  public static updateAnonymousInfo = updateObject(
    AnonymousSubmissionInfoV,
    AnonymousSubmissionInfoVPatch,
    'submissions',
  );
  public static readReadOnly = readObject(StudentSubmissionV, 'submissions');
  public static readHistory = readObjectDetail(t.array(SubmissionHistoryV), 'submissions', 'history');
  public static readTestResults = readObjectDetail(TestResultsV, 'submissions', 'testResults');
  public static readPartnerLink = readObjectDetail(PartnerLinkV, 'submissions', 'generatePartnerLink');
  public static validatePartnerLinkAndReturn = readObjectDetail(
    StudentSubmissionV,
    'submissions',
    'validatePartnerLinkAndReturn',
  );
  public static validatePartnerLink = readObjectDetail(t.string, 'submissions', 'validatePartnerLink');
  public static removePartner = readObjectDetail(t.string, 'submissions', 'removePartner');

  public static updateHistory = updateObjectDetail(
    SubmissionHistoryV,
    SubmissionHistoryVPatch,
    'submissions',
    'history',
  );

  public static updateQuestion = updateObjectDetail(
    StudentSubmissionV,
    SubmissionVPatch,
    'submissions',
    'submitRegrade',
  );
  public static deleteQuestion = updateObjectDetail(
    StudentSubmissionV,
    SubmissionVPatch,
    'submissions',
    'deleteRegrade',
  );

  // FIXME, duplicate
  public static loadData = async (
    submission: SubmissionType | StudentSubmissionType | AnonymousSubmissionType,
  ): Promise<[FileType[], IFileToCommentsMap, ICommentToRubricCommentMap]> => {
    if (!submission.files) {
      return [[], {}, {}];
    }

    try {
      // Check if files are already full objects (new API) or just IDs (old API)
      const files: FileType[] =
        typeof submission.files[0] === 'number'
          ? await loadIDList<FileType>(submission.files as number[], File)
          : (submission.files as FileType[]);

      const comments: IFileToCommentsMap = {};
      await Promise.all(
        files.map(async (file: FileType) => {
          comments[file.id] = (await loadIDList<CommentType>(file.comments, CommentIO)).sort(CommentIO.compare);
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

  // Go through the list of files and separate the latest files from the old files
  public static filesByVersion = (files: FileType[]) => {
    const olderFiles: { [pathName: string]: FileType[] } = {};
    const latestFiles: { [pathName: string]: FileType } = {};
    files.forEach((file) => {
      const path = `${file.path ? file.path.replace(/^\/+|\/+$/g, '') : ''}/${file.name}`;
      if (!latestFiles[path]) latestFiles[path] = file;
      else {
        if (Date.parse(latestFiles[path].created) <= Date.parse(file.created)) {
          const oldLatest = latestFiles[path];
          olderFiles[path] ? olderFiles[path].push(oldLatest) : (olderFiles[path] = [oldLatest]);
          latestFiles[path] = file;
        } else olderFiles[path] ? olderFiles[path].push(file) : (olderFiles[path] = [file]);
      }
    });

    const latestFilesArr: FileType[] = [];
    Object.keys(latestFiles).forEach((path) => {
      const file = latestFiles[path];
      latestFilesArr.push(file);
    });

    return { new: latestFilesArr, old: olderFiles };
  };
}

/*****************************************************************************/
/* Exports
/*****************************************************************************/

// export {
//   SubmissionType,
//   Submission,
//   SubmissionV,
//   StudentSubmissionV,
//   StudentSubmissionType,
//   AnonymousSubmissionType,
//   AnonymousSubmissionV,
// };
