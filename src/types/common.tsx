/**
 * Common Types
 */

import { AssignmentType } from '../infrastructure/assignment';
import { CommentType } from '../infrastructure/comment';
import { CourseType } from '../infrastructure/course';
import { RubricCategoryType } from '../infrastructure/rubricCategory';
import { RubricCommentType } from '../infrastructure/rubricComment';
import { SubmissionType } from '../infrastructure/submission';

export enum USER_APP {
  Student,
  Grader,
  CourseAdmin,
}

export enum BUTTON_STATE {
  Active,
  Loading,
  Inactive,
}

export interface IUser {
  id: number;
  email: string;
  studentCourses: CourseType[];
  graderCourses: CourseType[];
  courseadminCourses: CourseType[];
  superGraderCourses: CourseType[];
  canCreateCourses: boolean;
  canModifyRosters: boolean;
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

export interface ISectionNoStudents {
  name: string;
  id: number;
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
    [assignmentID: number]: SubmissionType;
  };
}

export interface IGraderSubmissionsDataTable {
  [userEmail: string]: IAssignmentToSubmissionsMap;
}

export interface IAssignmentToSubmissionsMap {
  [assignmentID: number]: SubmissionType[];
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

export interface ICommentToRubricCommentMap {
  [commentID: number]: RubricCommentType;
}

export interface ICSSStyleObject {
  [key: string]: string;
}
