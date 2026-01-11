/**
 * Common Types
 */

import { AssignmentType, AssignmentStudentType } from '../infrastructure/assignment';
import { CommentType } from '../infrastructure/comment';
import { RubricCategoryType } from '../infrastructure/rubricCategory';
import { RubricCommentType } from '../infrastructure/rubricComment';
import { StudentSubmissionType, SubmissionType, SubmissionInfoType } from '../infrastructure/submission';

export type IdMapType = {
  [id: number]: boolean;
};

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
  [assignmentID: number]: RubricCategoryType[];
}

export interface IFileToCommentsMap {
  [fileID: number]: CommentType[];
}

export interface IRubricCategoryToRubricCommentsMap {
  [rubricCategoryID: number]: RubricCommentType[];
}

export interface ICourseToAssignmentMap {
  [courseID: number]: AssignmentType[];
}

export interface ICourseToAssignmentStudentMap {
  [courseID: number]: AssignmentStudentType[];
}

export interface ICommentToRubricCommentMap {
  [commentID: number]: RubricCommentType;
}

export interface ICSSStyleObject {
  [key: string]: string;
}
