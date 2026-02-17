/**
 * Common Types
 */

import {
  Assignment as AssignmentGenerated,
  Comment,
  RubricCategory,
  RubricComment,
  StudentSubmission,
  Submission,
} from '../api-client';
import type { CreateRequest as SubmissionFileCreateRequest } from '../api-client/apis/SubmissionFilesApi';

export type AssignmentStudentType = AssignmentGenerated;
export type CommentType = Comment;
export type SubmissionType = Submission;
export type SubmissionInfoType = Submission;
export type StudentSubmissionType = StudentSubmission;
export type UploadFile = Omit<SubmissionFileCreateRequest['submissionFile'], 'submission'>;

// Extended Assignment Type to bridge legacy and generated types
export type Assignment = Omit<AssignmentGenerated, 'environment' | 'files' | 'fileTemplates'> & {
  environment?: number | null;
  files?: any[];
  fileTemplates?: number[];
  submissions_inprogress_count?: number;
  submissions_finalized_count?: number;
  submissions_unclaimed_count?: number;
  submissions_missing_count?: number;
  submissions_count?: number;
  stats_mean?: number;
  stats_max?: number;
  stats_min?: number;
  mean?: number | null;
  median?: number | null;
  created?: string;
  modified?: string;
  names?: string[]; // Sometimes attached?
  test_analysis?: any; // Sometimes attached?
  runTestsOnSubmit?: boolean;
  testsAffectGrade?: boolean;
};

export type IdMapType = {
  [id: number]: boolean;
};

export enum PERMISSION_LEVEL {
  NOT_FOUND,
  NONE,
  READ,
  READ_FILES_ONLY,
  WRITE,
}

export enum USER_TYPE {
  STUDENT = 'Student',
  GRADER = 'Grader',
  ADMIN = 'Admin',
}

export enum USER_APP {
  Student,
  Grader,
  CourseAdmin,
  SuperGrader,
  RubricEditor,
}

export enum BUTTON_STATE {
  Active,
  Loading,
  Inactive,
}

export enum POSITION {
  Start,
  End,
}

export enum DIRECTION {
  Up,
  Down,
}

export interface IProfile {
  id: number;
  user: string;
  organization: number;
}

export interface IOption {
  label: string;
  value: string | number;
}

export interface IOptionNumber {
  label: string;
  value: number;
}

export interface IToast {
  text: string;
  action: string | undefined;
}

// New interfaces for Admin panel -- to merge

// Making a separate data table to ensure that each
// student has only one submission for an assignment

export interface IStudentSubmissionsDataTable {
  [userEmail: string]: {
    [assignmentID: number]: SubmissionInfoType;
  };
}

export interface IGraderSubmissionsDataTable {
  [userEmail: string]: IAssignmentToSubmissionsMap;
}

export interface IAssignmentToSubmissionsMap {
  [assignmentID: number]: SubmissionInfoType[];
}

export interface IAssignmentToSubmissionStudentMap {
  [assignmentID: number]: Array<SubmissionType | StudentSubmissionType>;
}

export interface IAssignmentToRubricCategories {
  [assignmentID: number]: RubricCategory[];
}

export interface IFileToCommentsMap {
  [fileID: number]: CommentType[];
}

export interface IRubricCategoryToRubricCommentsMap {
  [rubricCategoryID: number]: RubricComment[];
}

export interface ICourseToAssignmentMap {
  [courseID: number]: Assignment[];
}

export interface ICourseToAssignmentStudentMap {
  [courseID: number]: AssignmentStudentType[];
}

export interface ICommentToRubricCommentMap {
  [commentID: number]: RubricComment;
}

export interface ICSSStyleObject {
  [key: string]: string;
}
