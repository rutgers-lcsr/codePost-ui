/**
 * Common Types
 */

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

export interface IAssignment {
  id: number;
  name: string;
  points: number;
  isReleased: boolean;
  rubricCategories: number[];
}

export interface ICourse {
  id: number;
  name: string;
  period: string;
  assignments: number[];
  sections: number[];
}

export interface ISubmission {
  id: number;
  isFinalized: any;
  dateFinalized?: any;
  files: number[];
  grade: number;
  grader?: string;
  students: string[];
  assignment: number;
}

export interface IFile {
  id: number;
  code: string;
  comments: number[];
  extension: string;
  name: string;
}

export interface IComment {
  id: number;
  author: any;
  startChar: number;
  endChar: number;
  startLine: number;
  endLine: number;
  pointDelta: number;
  text: string;
  rubricComment: number;
  file: number;
}

export interface ISection {
  name: string;
  id: number;
  students: string[];
  leaders: string[];
}

export interface ISectionNoStudents {
  name: string;
  id: number;
}

export interface IRubricCategory {
  id: number;
  name: string;
  pointLimit: number | undefined;
  // reminder - need to fix this, it's disgusting
  rubricComments: number[];
  assignment: number;
}

export interface IRubricComment {
  id: number;
  text: string;
  pointDelta: number;
  category: number;
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
    [assignmentID: number]: ISubmission;
  };
}

export interface IGraderSubmissionsDataTable {
  [userEmail: string]: IAssignmentToSubmissionsMap;
}

export interface IAssignmentToSubmissionsMap {
  [assignmentID: number]: ISubmission[];
}

export interface IAssignmentToRubricCategories {
  [assignmentID: number]: IRubricCategory[];
}

export interface IFileToCommentsMap {
  [fileID: number]: IComment[];
}

export interface IRubricCategoryToRubricCommentsMap {
  [rubricCategoryID: number]: IRubricComment[];
}

export interface ICourseToAssignmentMap {
  [courseID: number]: IAssignment[];
}

export interface ICommentToRubricCommentMap {
  [commentID: number]: IRubricComment;
}

export interface ICSSStyleObject {
  [key: string]: string;
}
